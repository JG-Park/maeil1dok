from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
import pandas as pd
from datetime import datetime
from .models import DailyBibleSchedule, UserBibleProgress
from .serializers import DailyBibleScheduleSerializer, UserBibleProgressSerializer, BibleProgressResponse
import logging
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

# 최상단에 book_to_code 딕셔너리 정의
book_to_code = {
    '창세기': 'gen', '출애굽기': 'exo', '레위기': 'lev',
    '민수기': 'num', '신명기': 'deu', '여호수아': 'jos',
    '사사기': 'jdg', '룻기': 'rut', '사무엘상': '1sa',
    '사무엘하': '2sa', '열왕기상': '1ki', '열왕기하': '2ki',
    '역대상': '1ch', '역대하': '2ch', '에스라': 'ezr',
    '느헤미야': 'neh', '에스더': 'est', '욥기': 'job',
    '시편': 'psa', '잠언': 'pro', '전도서': 'ecc',
    '아가': 'sng', '이사야': 'isa', '예레미야': 'jer',
    '예레미야애가': 'lam', '에스겔': 'ezk', '다니엘': 'dan',
    '호세아': 'hos', '요엘': 'jol', '아모스': 'amo',
    '오바댜': 'oba', '요나': 'jon', '미가': 'mic',
    '나훔': 'nam', '하박국': 'hab', '스바냐': 'zep',
    '학개': 'hag', '스가랴': 'zec', '말라기': 'mal',
    '마태복음': 'mat', '마가복음': 'mrk', '누가복음': 'luk',
    '요한복음': 'jhn', '사도행전': 'act', '로마서': 'rom',
    '고린도전서': '1co', '고린도후서': '2co', '갈라디아서': 'gal',
    '에베소서': 'eph', '빌립보서': 'php', '골로새서': 'col',
    '데살로니가전서': '1th', '데살로니가후서': '2th',
    '디모데전서': '1ti', '디모데후서': '2ti', '디도서': 'tit',
    '빌레몬서': 'phm', '히브리서': 'heb', '야고보서': 'jas',
    '베드로전서': '1pe', '베드로후서': '2pe', '요한일서': '1jn',
    '요한이서': '2jn', '요한삼서': '3jn', '유다서': 'jud',
    '요한계시록': 'rev'
}

@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_schedule(request):
    if 'file' not in request.FILES:
        return Response({'error': '파일이 없습니다.'}, status=400)
    
    try:
        file = request.FILES['file']
        df = pd.read_excel(file)
        
        # 필수 컬럼 확인
        required_columns = ['날짜', '성경', '시작장', '끝장']
        for col in required_columns:
            if col not in df.columns:
                return Response({
                    'error': f'필수 컬럼이 없습니다: {col}'
                }, status=400)
        
        # 결과 카운터 초기화
        created_count = 0
        updated_count = 0
        
        # 데이터 처리 및 저장
        for _, row in df.iterrows():
            date = row['날짜'].date() if hasattr(row['날짜'], 'date') else row['날짜']
            book = row['성경']
            
            # 기존 레코드 찾기
            schedule, created = DailyBibleSchedule.objects.get_or_create(
                date=date,
                book=book,
                defaults={
                    'start_chapter': int(row['시작장']),
                    'end_chapter': int(row['끝장']),
                    'audio_link': row['오디오'] if '오디오' in df.columns and not pd.isna(row['오디오']) else None,
                    'guide_link': row['가이드'] if '가이드' in df.columns and not pd.isna(row['가이드']) else None
                }
            )
            
            if created:
                created_count += 1
            else:
                # 변경사항 확인
                updated = False
                if schedule.start_chapter != int(row['시작장']):
                    schedule.start_chapter = int(row['시작장'])
                    updated = True
                if schedule.end_chapter != int(row['끝장']):
                    schedule.end_chapter = int(row['끝장'])
                    updated = True
                
                # 오디오 링크 업데이트
                if '오디오' in df.columns:
                    new_audio = row['오디오'] if not pd.isna(row['오디오']) else None
                    if schedule.audio_link != new_audio:
                        schedule.audio_link = new_audio
                        updated = True
                
                # 가이드 링크 업데이트
                if '가이드' in df.columns:
                    new_guide = row['가이드'] if not pd.isna(row['가이드']) else None
                    if schedule.guide_link != new_guide:
                        schedule.guide_link = new_guide
                        updated = True
                
                if updated:
                    schedule.save()
                    updated_count += 1
        
        return Response({
            'message': f'일정이 업데이트되었습니다. (신규: {created_count}개, 수정: {updated_count}개)',
            'created_count': created_count,
            'updated_count': updated_count
        })
        
    except Exception as e:
        return Response({
            'error': f'파일 처리 중 오류 발생: {str(e)}'
        }, status=400)

@api_view(['GET', 'POST'])
def bible_schedule_list(request):
    if request.method == 'GET':
        schedules = DailyBibleSchedule.objects.all().order_by('date')
        serializer = DailyBibleScheduleSerializer(schedules, many=True)
        response_data = {
            'data': serializer.data,
            'message': 'Successfully retrieved schedules'
        }
        print("Backend response:", response_data)  # 디버깅용 로그 추가
        return Response(response_data)
    
    elif request.method == 'POST':
        serializer = DailyBibleScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'data': serializer.data,
                'message': 'Schedule created successfully'
            }, status=201)
        return Response({
            'error': serializer.errors,
            'message': 'Failed to create schedule'
        }, status=400)

@api_view(['GET', 'DELETE'])
def bible_schedule_detail(request, pk):
    try:
        schedule = DailyBibleSchedule.objects.get(pk=pk)
    except DailyBibleSchedule.DoesNotExist:
        return Response({'error': '일정을 찾을 수 없습니다.'}, status=404)

    if request.method == 'GET':
        serializer = DailyBibleScheduleSerializer(schedule)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        schedule.delete()
        return Response({'message': '일정이 삭제되었습니다.'}, status=200)

@api_view(['GET'])
def get_today_reading(request):
    today = datetime.now().date()
    try:
        schedule = DailyBibleSchedule.objects.get(date=today)
        logger.info(f"Found schedule for today: {schedule.book} {schedule.start_chapter}-{schedule.end_chapter}")
        
        response_data = {
            'book': book_to_code.get(schedule.book, 'gen'),
            'chapter': schedule.start_chapter,
            'end_chapter': schedule.end_chapter,
            'date': schedule.date.isoformat(),
            'audio_link': schedule.audio_link,
            'guide_link': schedule.guide_link
        }
        logger.info(f"Returning data: {response_data}")
        return Response(response_data)
    except DailyBibleSchedule.DoesNotExist:
        logger.warning(f"No schedule found for date: {today}")
        return Response({'error': 'No reading scheduled for today'}, status=404)

@api_view(['GET'])
def get_reading_schedule(request):
    book = request.GET.get('book')
    chapter = request.GET.get('chapter')
    
    if not book or not chapter:
        return Response({'error': 'Book and chapter are required'}, status=400)
        
    try:
        code_to_book = {v: k for k, v in book_to_code.items()}
        book_name = code_to_book.get(book)
        
        if not book_name:
            return Response({'error': 'Invalid book code'}, status=400)
            
        schedule = DailyBibleSchedule.objects.filter(
            book=book_name,
            start_chapter__lte=int(chapter),
            end_chapter__gte=int(chapter)
        ).first()
        
        if schedule:
            return Response({
                'book': book,
                'chapter': schedule.start_chapter,
                'end_chapter': schedule.end_chapter,
                'date': schedule.date.isoformat(),
                'audio_link': schedule.audio_link,
                'guide_link': schedule.guide_link
            })
        else:
            return Response({'error': 'No schedule found for this reading'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
def get_bible_schedules(request):
    try:
        # 모든 일정을 가져오되 날짜순으로 정렬
        schedules = DailyBibleSchedule.objects.all().order_by('date')
        serializer = DailyBibleScheduleSerializer(schedules, many=True)
        response_data = serializer.data
        for schedule in response_data:
            schedule['book'] = schedule['book']
            schedule['start_chapter'] = schedule['start_chapter']
        return Response(response_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_bible_progress(request):
    """성경 읽기 진도 업데이트"""
    date = request.data.get('date')
    if not date:
        return Response({'error': '날짜가 필요합니다.'}, status=400)
    
    try:
        # 해당 날짜의 스케줄 확인
        schedule = get_object_or_404(DailyBibleSchedule, date=date)
        
        # 입력된 chapter가 유효한지 확인
        last_chapter_read = request.data.get('last_chapter_read', 0)
        if not isinstance(last_chapter_read, int) or last_chapter_read < 0:
            return Response({'error': '유효하지 않은 장 번호입니다.'}, status=400)
        
        if last_chapter_read > schedule.end_chapter:
            return Response({'error': '해당 날짜의 읽기 범위를 초과했습니다.'}, status=400)
        
        # 기존 진도가 있으면 업데이트, 없으면 생성
        progress, created = UserBibleProgress.objects.get_or_create(
            user=request.user,
            date=date,
            defaults={
                'book': schedule.book,
                'last_chapter_read': last_chapter_read
            }
        )
        
        if not created:
            progress.last_chapter_read = last_chapter_read
            progress.save()
        
        serializer = UserBibleProgressSerializer(progress)
        return Response(serializer.data)
        
    except DailyBibleSchedule.DoesNotExist:
        return Response({'error': '해당 날짜의 읽기 일정이 없습니다.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_bible_reading(request):
    """성경 읽기 완료 처리"""
    date = request.data.get('date')
    if not date:
        return Response({'error': '날짜가 필요합니다.'}, status=400)
    
    try:
        schedule = get_object_or_404(DailyBibleSchedule, date=date)
        
        # 이미 완료된 상태인지 확인
        existing_progress = UserBibleProgress.objects.filter(
            user=request.user,
            date=date,
            is_completed=True
        ).exists()
        
        if existing_progress:
            return Response({'error': '이미 완료된 읽기입니다.'}, status=400)
        
        progress, created = UserBibleProgress.objects.get_or_create(
            user=request.user,
            date=date,
            defaults={
                'book': schedule.book,
                'last_chapter_read': schedule.end_chapter
            }
        )
        
        progress.mark_as_completed()
        serializer = UserBibleProgressSerializer(progress)
        return Response(serializer.data)
        
    except DailyBibleSchedule.DoesNotExist:
        return Response({'error': '해당 날짜의 읽기 일정이 없습니다.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_bible_reading(request):
    """성경 읽기 완료 취소 처리"""
    date = request.data.get('date')
    if not date:
        return Response({'error': '날짜가 필요합니다.'}, status=400)
        
    try:
        progress = UserBibleProgress.objects.get(
            user=request.user,
            date=date
        )
        progress.mark_as_incomplete()
        return Response({'message': '읽기 완료가 취소되었습니다.'})
    except UserBibleProgress.DoesNotExist:
        return Response({'error': '해당 날짜의 읽기 기록이 없습니다.'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bible_progress(request):
    """성경 읽기 진도 조회 - 구간 정보 포함"""
    book = request.GET.get('book')
    chapter = request.GET.get('chapter')
    
    if not all([book, chapter]):
        return Response({'error': '필수 파라미터가 누락되었습니다.'}, status=400)
    
    try:
        # book 코드를 한글 이름으로 변환
        book_names = {v: k for k, v in book_to_code.items()}
        korean_book_name = book_names.get(book)
        
        if not korean_book_name:
            return Response({'error': '잘못된 성경 코드입니다.'}, status=400)
            
        # 1. 해당 장이 속한 구간 찾기
        section = DailyBibleSchedule.objects.filter(
            book=korean_book_name,
            start_chapter__lte=int(chapter),
            end_chapter__gte=int(chapter)
        ).first()
        
        if not section:
            return Response({
                'status': 'not_started',
                'section': None
            })
            
        # 2. 해당 구간의 마지막 장을 읽었는지 확인 (날짜 무관)
        is_completed = UserBibleProgress.objects.filter(
            user=request.user,
            book=korean_book_name,
            last_chapter_read=section.end_chapter,  # 구간의 마지막 장
            is_completed=True
        ).exists()
        
        logger.info(f"[Bible Progress] User: {request.user}")
        logger.info(f"[Bible Progress] Book: {korean_book_name}")
        logger.info(f"[Bible Progress] Last Chapter Read: {section.end_chapter}")
        logger.info(f"[Bible Progress] Is Completed: {is_completed}")
        
        response_data = {
            'status': 'completed' if is_completed else 'not_started',
            'section': section,
            'is_completed': is_completed
        }
        
        serializer = BibleProgressResponse(response_data)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reading_history(request):
    """사용자의 성경 읽기 이력 조회"""
    try:
        # 사용자의 모든 완료된 읽기 기록 조회
        completed_readings = UserBibleProgress.objects.filter(
            user=request.user,
            is_completed=True
        ).values('book', 'last_chapter_read')
        
        return Response(completed_readings)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_update_bible_progress(request):
    """성경 읽기 진도 일괄 업데이트"""
    schedules = request.data.get('schedules', [])
    action = request.data.get('action')  # 'complete' or 'cancel'
    
    if not schedules or action not in ['complete', 'cancel']:
        return Response({'error': '잘못된 요청입니다.'}, status=400)
        
    try:
        logger.info(f"[Bulk Update] Received data - schedules: {schedules}, action: {action}")
        
        for schedule in schedules:
            # 기존 progress 찾기
            progress = UserBibleProgress.objects.filter(
                user=request.user,
                book=schedule['book'],
                last_chapter_read=schedule['end_chapter']
            ).first()
            
            # progress가 없으면 새로 생성
            if not progress:
                progress = UserBibleProgress.objects.create(
                    user=request.user,
                    book=schedule['book'],
                    last_chapter_read=schedule['end_chapter'],
                    date=schedule['date']
                )
            
            # 상태 업데이트
            if action == 'complete':
                if not progress.is_completed:
                    progress.mark_as_completed()
            else:
                if progress.is_completed:
                    progress.mark_as_incomplete()
            
            logger.info(f"[Bulk Update] Updated progress - book: {schedule['book']}, chapter: {schedule['end_chapter']}, action: {action}")
                
        return Response({'message': '성공적으로 업데이트되었습니다.'})
        
    except Exception as e:
        logger.error(f"[Bulk Update] Error occurred: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_completed_sections_count(request):
    """완료된 성경 읽기 수를 반환"""
    logger.info(f"Received request for completed sections from user: {request.user.username}")
    
    try:
        # 사용자가 완료한 읽기 수만 계산
        completed_count = UserBibleProgress.objects.filter(
            user=request.user,
            is_completed=True
        ).count()
        
        logger.info(f"User {request.user.username} completed readings: {completed_count}")
        
        return Response({
            'completed_count': completed_count
        })
        
    except Exception as e:
        logger.error(f"Error in get_completed_sections_count: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_stats(request):
    try:
        # 전체 활성 회원 수 계산
        total_members = User.objects.filter(is_active=True).count()
        
        # 오늘 일독 완료자 수 계산 (UserBibleProgress 모델 활용)
        today = timezone.now().date()
        today_readers = UserBibleProgress.objects.filter(
            date=today,
            is_completed=True
        ).values('user').distinct().count()
        
        return Response({
            'totalMembers': total_members,
            'todayReaders': today_readers
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500) 