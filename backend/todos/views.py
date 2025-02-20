from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
import pandas as pd
from datetime import datetime
from .models import DailyBibleSchedule
from .serializers import DailyBibleScheduleSerializer
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

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