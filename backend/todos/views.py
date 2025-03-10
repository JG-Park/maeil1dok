from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
import pandas as pd
from datetime import datetime
from .models import DailyBibleSchedule, UserBibleProgress, BibleReadingPlan, PlanSubscription, VideoBibleIntro, HasenaRecord, UserVideoIntroProgress, VisitorCount
from .serializers import DailyBibleScheduleSerializer, UserBibleProgressSerializer, BibleProgressResponse, BibleReadingPlanSerializer, PlanSubscriptionSerializer, VideoBibleIntroSerializer
import logging
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.db import transaction
from django.utils.dateparse import parse_date
import re
from io import BytesIO

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
    '오바댜': 'oba', '요나': 'jnh', '미가': 'mic',
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

# 성경별 총 장 수를 반환하는 함수 필요
def get_last_chapter(book_name):
    print(f"Debug: Looking up last chapter for book: '{book_name}'")
    book_chapters = {
        '창세기': 50, '출애굽기': 40, '레위기': 27,
        '민수기': 36, '신명기': 34, '여호수아': 24,
        '사사기': 21, '룻기': 4, '사무엘상': 31,
        '사무엘하': 24, '열왕기상': 22, '열왕기하': 25,
        '역대상': 29, '역대하': 36, '에스라': 10,
        '느헤미야': 13, '에스더': 10, '욥기': 42,
        '시편': 150, '잠언': 31, '전도서': 12,
        '아가': 8, '이사야': 66, '예레미야': 52,
        '예레미야애가': 5, '에스겔': 48, '다니엘': 12,
        '호세아': 14, '요엘': 3, '아모스': 9,
        '오바댜': 1, '요나': 4, '미가': 7,
        '나훔': 3, '하박국': 3, '스바냐': 3,
        '학개': 2, '스가랴': 14, '말라기': 4,
        '마태복음': 28, '마가복음': 16, '누가복음': 24,
        '요한복음': 21, '사도행전': 28, '로마서': 16,
        '고린도전서': 16, '고린도후서': 13, '갈라디아서': 6,
        '에베소서': 6, '빌립보서': 4, '골로새서': 4,
        '데살로니가전서': 5, '데살로니가후서': 3,
        '디모데전서': 6, '디모데후서': 4, '디도서': 3,
        '빌레몬서': 1, '히브리서': 13, '야고보서': 5,
        '베드로전서': 5, '베드로후서': 3, '요한일서': 5,
        '요한이서': 1, '요한삼서': 1, '유다서': 1,
        '요한계시록': 22
    }
    result = book_chapters.get(book_name, 1)  # 기본값 1
    print(f"Debug: Last chapter for '{book_name}' is {result}")
    return result

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_bible_progress(request):
    """
    성경 진도 업데이트 API
    
    [필수 파라미터]
    - plan_id: 플랜 ID (문자열)
    - schedule_ids: 스케줄 ID 리스트 (배열)
    - action: 'complete' 또는 'cancel' (문자열)
    
    [요청 예시]
    {
        "plan_id": "1",
        "schedule_ids": ["42", "43", "44"],
        "action": "complete"
    }
    
    [응답 예시 - 성공]
    {
        "success": true,
        "plan_id": "1",
        "schedule_ids": ["42", "43", "44"],
        "is_completed": true
    }
    
    [응답 예시 - 실패]
    {
        "success": false,
        "error": "스케줄 ID와 플랜 ID가 일치하지 않습니다."
    }
    """
    try:
        plan_id = request.data.get('plan_id')
        schedule_ids = request.data.get('schedule_ids', [])
        action = request.data.get('action')

        # 필수 파라미터 검증
        if not all([plan_id, schedule_ids, action]):
            return Response({
                'success': False,
                'error': '필수 파라미터(plan_id, schedule_ids, action)가 누락되었습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if action not in ['complete', 'cancel']:
            return Response({
                'success': False,
                'error': 'action은 complete 또는 cancel이어야 합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. 스케줄 조회 및 검증
        try:
            daily_schedules = DailyBibleSchedule.objects.filter(id__in=schedule_ids)
            if not daily_schedules.exists():
                return Response({
                    'success': False,
                    'error': '존재하지 않는 스케줄입니다.'
                }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': f'스케줄 조회 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # 2. 스케줄의 plan_id와 요청의 plan_id 일치 여부 검증
        if daily_schedules.filter(plan_id=plan_id).count() != len(schedule_ids):
            return Response({
                'success': False,
                'error': '스케줄 ID와 플랜 ID가 일치하지 않습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 3. 사용자의 플랜 구독 확인
        try:
            subscription = PlanSubscription.objects.get(
                user=request.user,
                plan_id=plan_id,
                is_active=True
            )
        except PlanSubscription.DoesNotExist:
            return Response({
                'success': False,
                'error': '구독 중인 플랜이 아닙니다.'
            }, status=status.HTTP_404_NOT_FOUND)

        # 4. 진도 업데이트 또는 생성
        is_completed = action == 'complete'
        with transaction.atomic():
            for schedule in daily_schedules:
                UserBibleProgress.objects.update_or_create(
                    subscription=subscription,
                    schedule=schedule,
                    defaults={
                        'is_completed': is_completed,
                    }
                )

        return Response({
            'success': True,
            'plan_id': str(plan_id),
            'schedule_ids': [str(id) for id in schedule_ids],
            'is_completed': is_completed
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in update_bible_progress: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reading_history(request):
    plan_id = request.query_params.get('plan_id')
    month = request.query_params.get('month')
    
    logger.info(f'Fetching reading history for user: {request.user.id}, plan: {plan_id}, month: {month}')
    
    if not plan_id:
        logger.warning("Plan ID is missing from request")
        return Response({'error': 'Plan ID is required'}, status=400)
        
    try:
        plan_id = int(plan_id)
        
        if month:
            month = int(month)
            logger.info(f"Filtering progress for plan_id={plan_id}, month={month}")
            # schedule을 통해 해당 월의 progress 조회
            schedules = DailyBibleSchedule.objects.filter(
                plan_id=plan_id,
                date__month=month
            )
            progress = UserBibleProgress.objects.filter(
                subscription__plan_id=plan_id,
                subscription__user=request.user,
                schedule__in=schedules
            ).select_related('schedule').order_by('schedule__date')
        else:
            logger.info(f"Filtering progress for plan_id={plan_id}")
            progress = UserBibleProgress.objects.filter(
                subscription__plan_id=plan_id,
                subscription__user=request.user
            ).select_related('schedule').order_by('schedule__date')
            
        serializer = UserBibleProgressSerializer(progress, many=True)
        logger.info(f"Found {len(progress)} progress records")
        return Response(serializer.data)
    except ValueError as ve:
        logger.error(f"Invalid parameter format: {str(ve)}")
        return Response({'error': 'Invalid plan ID or month format'}, status=400)
    except Exception as e:
        logger.error(f"Error in get_reading_history: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_schedules_for_month(request):
    month = request.query_params.get('month')
    plan_id = request.query_params.get('plan_id')
    user = request.user
    
    if not month or not plan_id:
        return Response({
            'error': 'Month and plan ID are required'
        }, status=400)
    
    try:
        month = int(month)
        plan_id = int(plan_id)
        
        plan = BibleReadingPlan.objects.get(id=plan_id)
        schedules = DailyBibleSchedule.objects.filter(
            plan=plan,
            date__month=month
        ).order_by('date')
        
        # 비로그인 사용자인 경우 기본 일정 정보만 반환
        if not user.is_authenticated:
            schedule_data = [DailyBibleScheduleSerializer(schedule).data for schedule in schedules]
            return Response(schedule_data)
        
        # 로그인 사용자인 경우 읽기 상태 정보 포함
        subscription = PlanSubscription.objects.filter(
            user=user,
            plan=plan,
            is_active=True
        ).first()
        
        if subscription:
            # schedule을 기준으로 progress 조회
            progress_records = UserBibleProgress.objects.filter(
                subscription=subscription,
                schedule__in=schedules
            ).select_related('schedule')
            
            # schedule_id를 키로 하는 progress 딕셔너리 생성
            progress_dict = {
                record.schedule_id: record.is_completed 
                for record in progress_records
            }
            
            schedule_data = []
            for schedule in schedules:
                schedule_dict = DailyBibleScheduleSerializer(schedule).data
                schedule_dict['is_completed'] = progress_dict.get(schedule.id, False)
                schedule_data.append(schedule_dict)
            
            return Response(schedule_data)
        
        # 구독이 없는 경우 기본 일정 정보만 반환
        return Response([DailyBibleScheduleSerializer(schedule).data for schedule in schedules])
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

class IsStaffOrReadOnly(permissions.BasePermission):
    """
    관리자만 생성/수정/삭제 가능, 일반 사용자는 조회만 가능
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff

class DailyBibleScheduleViewSet(viewsets.ModelViewSet):
    queryset = DailyBibleSchedule.objects.all()
    serializer_class = DailyBibleScheduleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        # 플랜 ID로 필터링
        plan_id = self.request.query_params.get('plan_id')
        if plan_id:
            # 디버깅 로그 추가
            logger.info(f"Fetching schedules for plan_id: {plan_id}")
            queryset = DailyBibleSchedule.objects.filter(plan_id=plan_id)
            logger.info(f"Found {queryset.count()} schedules")
            return queryset
        return super().get_queryset()
    
    @action(detail=False, methods=['post'])
    def upload_excel(self, request):
        """엑셀 파일로 세부 일정 대량 업로드"""
        plan_id = request.data.get('plan_id')
        file = request.FILES.get('file')
        update_mode = request.data.get('update_mode', 'add')  # 'add', 'update', 'replace'
        
        if not plan_id or not file:
            return Response(
                {"detail": "플랜 ID와 파일은 필수 항목입니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 플랜 존재 여부 확인
            plan = BibleReadingPlan.objects.get(id=plan_id)
            
            # 엑셀 파일 읽기
            df = pd.read_excel(file)
            
            # 필수 열 확인
            required_columns = ['날짜', '성경', '시작장', '끝장']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return Response(
                    {"detail": f"필수 컬럼이 누락되었습니다: {', '.join(missing_columns)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 기존 일정 관리
            if update_mode == 'replace':
                # 기존 일정 모두 삭제
                DailyBibleSchedule.objects.filter(plan=plan).delete()
            
            # 데이터 변환 및 저장
            success_count = 0
            error_count = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # 날짜 변환
                    date_str = row['날짜']
                    if isinstance(date_str, str):
                        # YYYY-MM-DD 형식이 아닌 경우 변환
                        if re.match(r'\d{4}\.\d{1,2}\.\d{1,2}', date_str):
                            date_str = date_str.replace('.', '-')
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                    else:
                        # pandas가 자동으로 datetime으로 변환한 경우
                        date_obj = date_str.date() if hasattr(date_str, 'date') else date_str
                    
                    # 필드 값 추출
                    book = row['성경']
                    start_chapter = int(row['시작장'])
                    end_chapter = int(row['끝장'])
                    
                    # URL 필드 처리 개선
                    audio_link = row.get('오디오', '')
                    guide_link = row.get('가이드', '')

                    # 데이터 타입 확인 및 변환 
                    # float 타입이 들어온 경우 처리
                    if isinstance(audio_link, float) or isinstance(guide_link, float):
                        logger.info(f"행 {index+2}: float 타입 URL 필드 발견, 변환 시도")

                    # 유효한 URL로 변환
                    audio_link = self._validate_url(audio_link)
                    guide_link = self._validate_url(guide_link)
                    
                    # 업데이트 모드 처리
                    if update_mode in ['add', 'replace']:
                        # 신규 추가
                        DailyBibleSchedule.objects.create(
                            plan=plan,
                            date=date_obj,
                            book=book,
                            start_chapter=start_chapter,
                            end_chapter=end_chapter,
                            audio_link=audio_link,
                            guide_link=guide_link
                        )
                    else:  # update 모드
                        # 기존 레코드 업데이트 또는 생성
                        obj, created = DailyBibleSchedule.objects.update_or_create(
                            plan=plan,
                            date=date_obj,
                            defaults={
                                'book': book,
                                'start_chapter': start_chapter,
                                'end_chapter': end_chapter,
                                'audio_link': audio_link,
                                'guide_link': guide_link
                            }
                        )
                    
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"행 {index + 2}: {str(e)}")
            
            return Response({
                "detail": f"{success_count}개의 일정이 처리되었습니다. 오류: {error_count}개",
                "errors": errors if errors else None
            })
            
        except BibleReadingPlan.DoesNotExist:
            return Response(
                {"detail": "해당 ID의 플랜을 찾을 수 없습니다."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": f"파일 처리 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def _validate_url(self, url):
        """URL을 검증하고 필요하면 수정합니다"""
        # None 값 처리
        if url is None:
            return ''
        
        # float 타입이면 문자열로 변환
        if isinstance(url, float):
            # NaN 체크
            if pd.isna(url):
                return ''
            # 소수점 없는 정수형 숫자로 보이면 정수로 변환 (예: 12.0 -> '12')
            if url.is_integer():
                url = str(int(url))
            else:
                url = str(url)
        
        # 문자열 타입이 아니면 문자열로 변환
        if not isinstance(url, str):
            url = str(url)
        
        # 공백 제거
        url = url.strip()
        
        # 빈 문자열 처리
        if url == '':
            return ''
        
        # URL에 스키마가 없으면 https:// 추가
        if not url.startswith(('http://', 'https://')):
            return 'https://' + url
        
        return url

    # 추가 디버깅 액션
    @action(detail=False, methods=['get'])
    def debug_plan_schedules(self, request):
        """특정 플랜의 스케줄 데이터 디버깅"""
        plan_id = request.query_params.get('plan_id')
        if not plan_id:
            return Response({"error": "plan_id is required"}, status=400)
            
        try:
            plan = BibleReadingPlan.objects.get(id=plan_id)
            schedules = DailyBibleSchedule.objects.filter(plan=plan)
            
            return Response({
                "plan_name": plan.name,
                "plan_id": plan.id,
                "schedule_count": schedules.count(),
                "schedules": DailyBibleScheduleSerializer(schedules, many=True).data[:5]  # 최대 5개 표시
            })
        except BibleReadingPlan.DoesNotExist:
            return Response({"error": f"Plan with id {plan_id} not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=['post'])
    def generate_test_schedules(self, request, pk=None):
        """테스트용 일정 생성"""
        if not request.user.is_staff:
            return Response({"detail": "권한이 없습니다"}, status=403)
        
        plan = self.get_object()
        count = int(request.data.get('count', 5))  # 기본 5개
        
        # 테스트 데이터 생성
        import random
        from datetime import timedelta, date
        
        bible_books = ["창세기", "출애굽기", "레위기", "민수기", "신명기"]
        start_date = date.today()
        
        created_schedules = []
        for i in range(count):
            schedule_date = start_date + timedelta(days=i)
            book = random.choice(bible_books)
            start_chapter = random.randint(1, 10)
            end_chapter = start_chapter + random.randint(0, 5)
            
            schedule = DailyBibleSchedule.objects.create(
                plan=plan,
                date=schedule_date,
                book=book,
                start_chapter=start_chapter,
                end_chapter=end_chapter,
                audio_link=f"https://example.com/audio/{book}/{start_chapter}-{end_chapter}",
                guide_link=f"https://example.com/guide/{book}/{start_chapter}-{end_chapter}"
            )
            created_schedules.append(DailyBibleScheduleSerializer(schedule).data)
        
        return Response({
            "detail": f"{count}개의 테스트 일정이 생성되었습니다",
            "schedules": created_schedules
        })

class BibleReadingPlanViewSet(viewsets.ModelViewSet):
    """성경 읽기 플랜 관리를 위한 ViewSet"""
    queryset = BibleReadingPlan.objects.all()
    serializer_class = BibleReadingPlanSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        """사용자 권한에 따라 쿼리셋 필터링"""
        if self.request.user.is_staff:
            # 관리자는 모든 플랜 조회 가능
            return BibleReadingPlan.objects.all()
        else:
            # 일반 사용자는 활성화된 플랜만 조회 가능
            return BibleReadingPlan.objects.filter(is_active=True)

    def perform_create(self, serializer):
        """플랜 생성 시 생성자 정보 추가"""
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """기존 생성자 정보를 유지하면서 업데이트"""
        instance = self.get_object()
        serializer.save(created_by=instance.created_by)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """플랜 활성화/비활성화 토글"""
        plan = self.get_object()
        # 활성화 상태만 토글
        plan.is_active = not plan.is_active
        
        # update_fields 파라미터를 사용하여 특정 필드만 업데이트
        plan.save(update_fields=['is_active'])
        
        return Response({'detail': f'플랜이 {"활성화" if plan.is_active else "비활성화"}되었습니다.'})

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """특정 플랜을 기본 플랜으로 설정"""
        # 기존의 기본 플랜을 모두 해제
        BibleReadingPlan.objects.filter(is_default=True).update(is_default=False)
        
        # 현재 플랜을 기본으로 설정
        plan = self.get_object()
        plan.is_default = True
        
        # update_fields 파라미터를 사용하여 특정 필드만 업데이트
        plan.save(update_fields=['is_default'])
        
        return Response({'detail': '기본 플랜으로 설정되었습니다.'})

    @action(detail=True, methods=['get'])
    def schedules(self, request, pk=None):
        """특정 플랜의 스케줄 목록 조회"""
        plan = self.get_object()
        schedules = plan.schedules.all()
        serializer = DailyBibleScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def plan_subscription_list(request):
    """플랜 구독 목록 조회 및 생성"""
    # 비로그인 사용자인 경우 기본 플랜 반환
    if not request.user.is_authenticated:
        default_plan = BibleReadingPlan.objects.filter(is_default=True).first()
        if not default_plan:
            return Response({
                'error': '기본 플랜이 설정되지 않았습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'plan_id': default_plan.id,
            'plan_name': default_plan.name,
            'is_default': True
        })

    # GET 요청 처리 (구독 목록 조회)
    if request.method == 'GET':
        # 로그인 사용자인 경우 중복 없는 구독 목록 반환
        queryset = PlanSubscription.objects.filter(
            user=request.user,
            is_active=True
        ).distinct()  # 중복 제거
        serializer = PlanSubscriptionSerializer(queryset, many=True)
        return Response(serializer.data)
    
    # POST 요청 처리 (구독 생성)
    elif request.method == 'POST':
        # 이미 구독 중인 플랜인지 확인
        plan_id = request.data.get('plan')
        if PlanSubscription.objects.filter(user=request.user, plan_id=plan_id).exists():
            return Response(
                {"detail": "이미 구독 중인 플랜입니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 플랜 정보 가져오기
        try:
            plan = BibleReadingPlan.objects.get(id=plan_id)
        except BibleReadingPlan.DoesNotExist:
            return Response(
                {"detail": "존재하지 않는 플랜입니다."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 구독 생성
        subscription = PlanSubscription.objects.create(
            user=request.user, 
            plan=plan,
            start_date=timezone.now().date()
        )
        
        serializer = PlanSubscriptionSerializer(subscription)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def plan_subscription_detail(request, pk):
    """플랜 구독 상세 조회, 수정, 삭제"""
    try:
        subscription = PlanSubscription.objects.get(pk=pk, user=request.user)
    except PlanSubscription.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    # GET 요청 처리 (상세 조회)
    if request.method == 'GET':
        serializer = PlanSubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    # PUT 요청 처리 (수정)
    elif request.method == 'PUT':
        serializer = PlanSubscriptionSerializer(subscription, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # DELETE 요청 처리 (삭제)
    elif request.method == 'DELETE':
        # 기본 플랜 구독은 삭제할 수 없음
        if subscription.plan.is_default:
            return Response(
                {"detail": "기본 플랜 구독은 삭제할 수 없습니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        subscription.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def plan_subscription_toggle_active(request, pk):
    """구독 활성화/비활성화 토글"""
    try:
        subscription = PlanSubscription.objects.get(pk=pk, user=request.user)
    except PlanSubscription.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    # 기본 플랜 구독은 비활성화할 수 없음
    if subscription.plan.is_default and subscription.is_active:
        return Response(
            {"detail": "기본 플랜 구독은 취소할 수 없습니다."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    subscription.is_active = not subscription.is_active
    subscription.save()
    
    return Response({"is_active": subscription.is_active})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def plan_subscription_progress(request, pk):
    """특정 구독의 진도 목록 조회"""
    try:
        subscription = PlanSubscription.objects.get(pk=pk, user=request.user)
    except PlanSubscription.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    progress = subscription.progress.all()
    serializer = UserBibleProgressSerializer(progress, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_chapter_detail(request):
    """
    1. 특정 장의 상세 데이터 조회
    """
    try:
        # 요청 파라미터
        plan_id = request.GET.get('plan_id')
        book = request.GET.get('book')
        chapter = request.GET.get('chapter')
        user = request.user if request.user.is_authenticated else None

        # book과 chapter는 필수 파라미터
        if not all([book, chapter]):
            return Response({'error': '필수 파라미터(book, chapter)가 누락되었습니다.'}, status=400)

        # 책 코드 -> 한글 이름 변환
        code_to_book = {v: k for k, v in book_to_code.items()}
        book_name = code_to_book.get(book)
        if not book_name:
            return Response({'error': '잘못된 성경 코드입니다.'}, status=400)

        # 기본 응답 데이터 (plan_id가 없을 때 반환할 기본 정보)
        response_data = {
            'book': book,
            'book_kor': book_name,
            'book_unit_kor': '편' if book == 'psa' else '장',
            'chapter': chapter,
            'is_logined': user is not None
        }

        # plan_id가 없으면 기본 정보만 반환
        if not plan_id:
            return Response(response_data)

        # plan_id가 있는 경우 추가 정보 조회
        plan = get_object_or_404(BibleReadingPlan, id=plan_id)

        # 해당 장이 속한 일정 조회
        target_schedule = DailyBibleSchedule.objects.filter(
            plan=plan,
            book=book_name,
            start_chapter__lte=int(chapter),
            end_chapter__gte=int(chapter)
        ).first()

        if not target_schedule:
            # 에러 코드 대신 정상 응답으로 메시지 전달
            response_data.update({
                'plan_id': plan_id,
                'plan_name': plan.name,
                'message': f"이 플랜에는 현재 위치에 대한 일정이 없어요.",
                'plan_detail': []
            })
            return Response(response_data)

        # 같은 날짜의 모든 일정 조회
        schedules = DailyBibleSchedule.objects.filter(
            plan=plan,
            date=target_schedule.date
        ).order_by('id')

        progress_dict = {}

        # 읽기 상태 확인 (로그인 상태일 경우)
        if user:
            subscription = PlanSubscription.objects.filter(
                user=user,
                plan=plan,
                is_active=True
            ).first()

            if subscription:
                progress_records = UserBibleProgress.objects.filter(
                    subscription=subscription,
                    schedule__in=schedules,
                    is_completed=True
                ).values_list('schedule_id', flat=True)
                
                progress_dict = {str(schedule_id): True for schedule_id in progress_records}

        # 추가 응답 데이터
        response_data.update({
            'audio_link': target_schedule.audio_link,
            'guide_link': target_schedule.guide_link,
            'plan_id': plan_id,
            'plan_name': plan.name,
            'plan_date': target_schedule.date.isoformat(),
            'is_complete': False,
            'plan_detail': []
        })

        # 플랜 상세 정보 구성
        for schedule in schedules:
            schedule_id = str(schedule.id)
            response_data['plan_detail'].append({
                'book': book_to_code.get(schedule.book, 'gen'),
                'book_kor': schedule.book,
                'book_unit_kor': '편' if schedule.book == '시편' else '장',
                'start_chapter': schedule.start_chapter,
                'end_chapter': schedule.end_chapter,
                'schedule_id': schedule_id,
                'date': schedule.date.isoformat(),
                'is_complete': progress_dict.get(schedule_id, False)
            })

        # 전체 완료 상태 업데이트
        response_data['is_complete'] = all(
            progress_dict.get(item['schedule_id'], False) 
            for item in response_data['plan_detail']
        )

        return Response(response_data)

    except Exception as e:
        logger.error(f"Error in get_chapter_detail: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_today_schedules(request):
    """
    오늘 날짜의 성경 일정을 반환하는 API
    
    [필수 파라미터]
    - plan_id: 플랜 ID
    
    [응답 예시]
    {
        "success": true,
        "schedules": [
            {
                "id": 123,
                "book": "창세기",
                "start_chapter": 1,
                "end_chapter": 3,
                "audio_link": "https://example.com/audio",
                "guide_link": "https://example.com/guide",
                "is_completed": false
            },
            ...
        ]
    }
    """
    try:
        plan_id = request.query_params.get('plan_id')
        
        if not plan_id:
            return Response({
                'success': False,
                'error': '플랜 ID가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # 플랜 존재 여부 확인
        try:
            plan = BibleReadingPlan.objects.get(id=plan_id)
        except BibleReadingPlan.DoesNotExist:
            return Response({
                'success': False,
                'error': '존재하지 않는 플랜입니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 오늘 날짜 가져오기
        today = timezone.now().date()
        
        # 오늘 날짜의 일정 조회
        schedules = DailyBibleSchedule.objects.filter(
            plan_id=plan_id,
            date=today
        ).order_by('id')
        
        if not schedules.exists():
            return Response({
                'success': True,
                'schedules': []
            })
        
        # 사용자 인증 여부 확인
        user = request.user
        progress_dict = {}
        
        if user.is_authenticated:
            # 사용자의 구독 확인
            subscription = PlanSubscription.objects.filter(
                user=user,
                plan_id=plan_id,
                is_active=True
            ).first()
            
            if subscription:
                # 오늘 일정에 대한 진행 상태 조회
                progress_records = UserBibleProgress.objects.filter(
                    subscription=subscription,
                    schedule__in=schedules
                )
                
                # schedule_id를 키로 하는 progress 딕셔너리 생성
                progress_dict = {
                    record.schedule_id: record.is_completed 
                    for record in progress_records
                }
        
        # 응답 데이터 구성
        schedule_data = []
        for schedule in schedules:
            data = {
                'id': schedule.id,
                'book': schedule.book,
                'book_code': book_to_code.get(schedule.book, 'gen'),
                'start_chapter': schedule.start_chapter,
                'end_chapter': schedule.end_chapter,
                'audio_link': schedule.audio_link,
                'guide_link': schedule.guide_link,
                'is_completed': progress_dict.get(schedule.id, False)
            }
            schedule_data.append(data)
        
        return Response({
            'success': True,
            'schedules': schedule_data
        })
        
    except Exception as e:
        logger.error(f"Error in get_today_schedules: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_plans(request):
    """사용자의 구독 중인 플랜과 구독 가능한 플랜 목록 반환"""
    try:
        # 1. 사용자가 구독 중인 모든 플랜 목록 조회 (비활성 포함)
        all_subscriptions = PlanSubscription.objects.filter(
            user=request.user
        )
        
        # 1-1. 구독 중인 활성화 플랜만 필터링
        active_subscriptions = all_subscriptions.filter(
            is_active=True
        ).select_related('plan')
        
        # 2. 구독 가능한 플랜 목록 조회 (모든 구독 중인 플랜 제외, 활성 여부 상관없이)
        subscribed_plan_ids = all_subscriptions.values_list('plan_id', flat=True)
        
        available_plans = BibleReadingPlan.objects.filter(
            is_active=True
        ).exclude(
            id__in=subscribed_plan_ids
        )
        
        # 3. 시리얼라이징
        subscription_serializer = PlanSubscriptionSerializer(active_subscriptions, many=True)
        available_plan_serializer = BibleReadingPlanSerializer(available_plans, many=True)
        
        return Response({
            'subscriptions': subscription_serializer.data,
            'available_plans': available_plan_serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error in get_user_plans: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_next_reading_position(request):
    """
    사용자의 특정 플랜에서 이어서 읽어야 할 위치를 반환하는 API
    
    [필수 파라미터]
    - plan_id: 플랜 ID
    
    [응답 예시]
    {
        "success": true,
        "month": 3,  // 해당 스케줄이 있는 월
        "schedule_id": "123",  // 읽어야 할 스케줄 ID
        "date": "2024-03-15"  // 해당 스케줄의 날짜
    }
    """
    try:
        plan_id = request.query_params.get('plan_id')
        
        if not plan_id:
            return Response({
                'success': False,
                'error': '플랜 ID가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # 1. 사용자의 구독 확인
        subscription = get_object_or_404(
            PlanSubscription,
            user=request.user,
            plan_id=plan_id,
            is_active=True
        )
        
        # 2. 해당 플랜의 모든 스케줄을 날짜순으로 조회
        schedules = DailyBibleSchedule.objects.filter(
            plan_id=plan_id
        ).order_by('date')
        
        # 3. 사용자의 완료한 스케줄 ID 목록 조회
        completed_schedule_ids = UserBibleProgress.objects.filter(
            subscription=subscription,
            is_completed=True
        ).values_list('schedule_id', flat=True)
        
        # 4. 완료하지 않은 가장 첫 번째 스케줄 찾기
        next_schedule = schedules.exclude(
            id__in=completed_schedule_ids
        ).first()
        
        if not next_schedule:
            return Response({
                'success': False,
                'error': '모든 스케줄을 완료했습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        return Response({
            'success': True,
            'month': next_schedule.date.month,
            'schedule_id': next_schedule.id,
            'date': next_schedule.date.isoformat()
        })
        
    except PlanSubscription.DoesNotExist:
        return Response({
            'success': False,
            'error': '구독 중인 플랜이 아닙니다.'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"Error in get_next_reading_position: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def video_intro_list(request):
    """영상 개론 목록 조회 및 생성"""
    if request.method == 'GET':
        plan_id = request.query_params.get('plan_id')
        
        if plan_id:
            video_intros = VideoBibleIntro.objects.filter(plan_id=plan_id)
        else:
            video_intros = VideoBibleIntro.objects.all()
            
        serializer = VideoBibleIntroSerializer(video_intros, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # 관리자 권한 확인
        if not request.user.is_staff:
            return Response(
                {"detail": "관리자 권한이 필요합니다."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = VideoBibleIntroSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def video_intro_detail(request, pk):
    """영상 개론 상세 조회 및 삭제"""
    try:
        video_intro = VideoBibleIntro.objects.get(pk=pk)
    except VideoBibleIntro.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    # GET 요청은 일반 사용자도 접근 가능
    if request.method == 'GET':
        serializer = VideoBibleIntroSerializer(video_intro)
        return Response(serializer.data)
    
    # DELETE 요청은 관리자만 가능
    elif request.method == 'DELETE':
        # 관리자 권한 확인
        if not request.user.is_staff:
            return Response(
                {"detail": "관리자 권한이 필요합니다."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        video_intro.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_video_intros(request):
    """엑셀 파일로 영상 개론 일괄 업로드"""
    try:
        plan_id = request.data.get('plan_id')
        file = request.FILES.get('file')
        
        # 기본 유효성 검사
        if not plan_id or not file:
            return Response(
                {'detail': '플랜 ID와 엑셀 파일이 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 파일 확장자 확인
        file_name = file.name.lower()
        if not (file_name.endswith('.xlsx') or file_name.endswith('.xls')):
            return Response(
                {'detail': 'Excel 파일(.xlsx, .xls)만 업로드 가능합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 파일 크기 제한 (5MB)
        if file.size > 5 * 1024 * 1024:
            return Response(
                {'detail': '파일 크기는 5MB를 초과할 수 없습니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 플랜 존재 여부 확인
        try:
            plan = BibleReadingPlan.objects.get(id=plan_id)
        except BibleReadingPlan.DoesNotExist:
            return Response(
                {'detail': '존재하지 않는 플랜입니다.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 엑셀 파일 읽기
        try:
            # 날짜 컬럼을 자동으로 datetime 객체로 변환
            df = pd.read_excel(file, parse_dates=['시작일', '종료일'])
            logger.info(f"엑셀 파일 로드 성공: {len(df)} 행")

            # 첫 5행 데이터 샘플 로깅
            if not df.empty:
                logger.debug(f"샘플 데이터 (첫 5행):\n{df.head().to_dict('records')}")

            # 각 열의 데이터 유형 로깅
            dtypes = df.dtypes.to_dict()
            logger.debug(f"컬럼 데이터 유형: {dtypes}")
        except Exception as e:
            logger.error(f"엑셀 파일 읽기 오류: {str(e)}")
            return Response(
                {'detail': f'엑셀 파일을 읽는 중 오류가 발생했습니다: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 필수 컬럼 확인
        required_columns = ['시작일', '종료일', '성경', 'URL']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return Response(
                {'detail': f'다음 필수 컬럼이 없습니다: {", ".join(missing_columns)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 데이터 처리 및 저장
        created_count = 0
        updated_count = 0
        errors = []
        
        # 한국어 날짜 패턴 정규식
        date_pattern = r'(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일'
        
        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    row_number = index + 2  # 엑셀 행 번호 (헤더 제외)
                    
                    # 값이 비어있는지 확인
                    if pd.isna(row['시작일']) or pd.isna(row['종료일']) or pd.isna(row['성경']) or pd.isna(row['URL']):
                        errors.append(f"{row_number}행: 빈 값이 있습니다.")
                        continue
                    
                    # 날짜 문자열 가져오기
                    start_date_str = str(row['시작일']).strip()
                    end_date_str = str(row['종료일']).strip()
                    
                    # 날짜 파싱 함수
                    def parse_korean_date(date_str):
                        # pandas datetime 객체인 경우 (엑셀 날짜 셀)
                        if isinstance(date_str, pd.Timestamp):
                            return date_str.date()
                        
                        # 날짜형으로 직접 변환 시도 (pd.to_datetime은 다양한 형식 지원)
                        try:
                            return pd.to_datetime(date_str).date()
                        except:
                            pass
                        
                        # YYYY-MM-DD HH:MM:SS 형식인 경우
                        if re.match(r'\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}', date_str):
                            try:
                                return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S').date()
                            except ValueError:
                                pass
                            
                        # YYYY-MM-DD 형식인 경우
                        if re.match(r'\d{4}-\d{1,2}-\d{1,2}', date_str):
                            return parse_date(date_str)
                            
                        # YYYY년 MM월 DD일 형식인 경우
                        matches = re.search(date_pattern, date_str)
                        if matches:
                            year = int(matches.group(1))
                            month = int(matches.group(2))
                            day = int(matches.group(3))
                            return datetime(year, month, day).date()
                        
                        # 다른 형식 시도
                        try:
                            # 다양한 날짜 형식 파싱 시도
                            for fmt in ['%Y년 %m월 %d일', '%Y년%m월%d일', '%Y-%m-%d', '%Y/%m/%d']:
                                try:
                                    return datetime.strptime(date_str, fmt).date()
                                except ValueError:
                                    continue
                        except Exception:
                            pass
                            
                        # 모든 시도 실패
                        return None
                    
                    # 날짜 파싱
                    start_date = parse_korean_date(start_date_str)
                    end_date = parse_korean_date(end_date_str)
                    
                    # 파싱 실패 시 오류
                    if not start_date:
                        errors.append(f"{row_number}행: 시작일 형식이 올바르지 않습니다. ({start_date_str})")
                        continue
                        
                    if not end_date:
                        errors.append(f"{row_number}행: 종료일 형식이 올바르지 않습니다. ({end_date_str})")
                        continue
                    
                    # 날짜 유효성 검사
                    if end_date < start_date:
                        errors.append(f"{row_number}행: 종료일({end_date})이 시작일({start_date})보다 이전입니다.")
                        continue
                    
                    # 성경 이름 가져오기
                    book_name = str(row['성경']).strip()
                    if not book_name:
                        errors.append(f"{row_number}행: 성경 이름이 비어있습니다.")
                        continue
                        
                    # URL 유효성 검사
                    url = str(row['URL']).strip()
                    if not (url.startswith('http://') or url.startswith('https://')):
                        errors.append(f"{row_number}행: URL 형식이 올바르지 않습니다. ({url})")
                        continue
                    
                    # 중복 확인 (성경 이름과 플랜으로)
                    existing = VideoBibleIntro.objects.filter(
                        plan=plan,
                        book=book_name
                    ).first()
                    
                    logger.debug(f"처리 중: {book_name}, 시작일: {start_date}, 종료일: {end_date}, URL: {url}")
                    
                    if existing:
                        # 기존 데이터 업데이트
                        existing.start_date = start_date
                        existing.end_date = end_date
                        existing.url_link = url
                        existing.save()
                        updated_count += 1
                        logger.info(f"업데이트: {book_name}")
                    else:
                        # 새 데이터 생성
                        VideoBibleIntro.objects.create(
                            plan=plan,
                            book=book_name,
                            start_date=start_date,
                            end_date=end_date,
                            url_link=url
                        )
                        created_count += 1
                        logger.info(f"생성: {book_name}")
                        
                except Exception as e:
                    logger.error(f"{index+2}행 처리 중 오류: {str(e)}")
                    errors.append(f"{index+2}행: {str(e)}")
        
        # 결과 반환
        result = {
            'detail': f'{created_count}개 생성, {updated_count}개 업데이트 완료'
        }
        
        if errors:
            result['errors'] = errors
            
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"업로드 처리 중 예외 발생: {str(e)}", exc_info=True)
        return Response(
            {'detail': f'업로드 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_video_intros(request):
    """사용자가 구독 중인 플랜의 영상 개론 목록 조회"""
    try:
        # 사용자가 구독 중인 플랜 ID 목록
        plan_ids = PlanSubscription.objects.filter(
            user=request.user,
            is_active=True
        ).values_list('plan_id', flat=True)
        
        # 해당 플랜의 영상 개론 목록 조회
        video_intros = VideoBibleIntro.objects.filter(
            plan_id__in=plan_ids
        ).order_by('start_date')
        
        # 추가: 사용자의 진행 상태 조회
        progress_records = UserVideoIntroProgress.objects.filter(
            user=request.user,
            video_intro__in=video_intros
        ).select_related('video_intro')
        
        # video_intro_id를 키로 하는 progress 딕셔너리 생성
        progress_dict = {
            record.video_intro_id: {
                'is_completed': record.is_completed,
                'completed_at': record.completed_at
            } 
            for record in progress_records
        }
        
        # 응답 데이터 구성
        result = []
        for intro in video_intros:
            intro_data = VideoBibleIntroSerializer(intro).data
            # 사용자 진행 상태 추가
            if intro.id in progress_dict:
                intro_data['is_completed'] = progress_dict[intro.id]['is_completed']
                intro_data['completed_at'] = progress_dict[intro.id]['completed_at']
            else:
                intro_data['is_completed'] = False
                intro_data['completed_at'] = None
            
            result.append(intro_data)
        
        return Response(result)
        
    except Exception as e:
        return Response(
            {'detail': f'영상 개론 목록을 조회하는 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def hasena_record_list(request):
    """하세나 기록 목록 조회 및 생성"""
    if request.method == 'GET':
        # 날짜 필터링 (선택적)
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        records = HasenaRecord.objects.filter(user=request.user)
        
        if year:
            records = records.filter(date__year=year)
        if month:
            records = records.filter(date__month=month)
            
        # 날짜 내림차순 정렬
        records = records.order_by('-date')
        
        # 간단한 직렬화 (모델이 단순하므로 별도 시리얼라이저 없이 처리)
        data = [{
            'id': record.id,
            'date': record.date.isoformat(),
            'is_completed': record.is_completed,
            'created_at': record.created_at.isoformat()
        } for record in records]
        
        return Response(data)
    
    elif request.method == 'POST':
        # 날짜 필수 확인
        date_str = request.data.get('date')
        if not date_str:
            return Response(
                {'detail': '날짜가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # 날짜 형식 변환
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 중복 확인
            existing = HasenaRecord.objects.filter(
                user=request.user,
                date=date
            ).first()
            
            if existing:
                # 기존 기록 업데이트
                existing.is_completed = request.data.get('is_completed', True)
                existing.save()
                
                return Response({
                    'id': existing.id,
                    'date': existing.date.isoformat(),
                    'is_completed': existing.is_completed,
                    'created_at': existing.created_at.isoformat(),
                    'updated_at': existing.updated_at.isoformat()
                })
            
            # 새 기록 생성
            record = HasenaRecord.objects.create(
                user=request.user,
                date=date,
                is_completed=request.data.get('is_completed', True)
            )
            
            return Response({
                'id': record.id,
                'date': record.date.isoformat(),
                'is_completed': record.is_completed,
                'created_at': record.created_at.isoformat(),
                'updated_at': record.updated_at.isoformat()
            }, status=status.HTTP_201_CREATED)
            
        except ValueError:
            return Response(
                {'detail': '날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식이어야 합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'detail': f'하세나 기록 생성 중 오류가 발생했습니다: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def hasena_record_detail(request, pk):
    """하세나 기록 상세 조회 및 삭제"""
    try:
        record = HasenaRecord.objects.get(pk=pk, user=request.user)
    except HasenaRecord.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        data = {
            'id': record.id,
            'date': record.date.isoformat(),
            'is_completed': record.is_completed,
            'created_at': record.created_at.isoformat(),
            'updated_at': record.updated_at.isoformat()
        }
        return Response(data)
    
    elif request.method == 'DELETE':
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_video_intro_progress(request):
    """영상 개론 진행 상황 업데이트"""
    try:
        video_intro_id = request.data.get('video_intro_id')
        is_completed = request.data.get('is_completed', True)
        
        if not video_intro_id:
            return Response(
                {'detail': '영상 개론 ID가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 영상 개론 존재 여부 확인
        try:
            video_intro = VideoBibleIntro.objects.get(id=video_intro_id)
        except VideoBibleIntro.DoesNotExist:
            return Response(
                {'detail': '존재하지 않는 영상 개론입니다.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # 진행 상황 업데이트 또는 생성
        progress, created = UserVideoIntroProgress.objects.update_or_create(
            user=request.user,
            video_intro=video_intro,
            defaults={
                'is_completed': is_completed,
                'completed_at': timezone.now() if is_completed else None
            }
        )
        
        return Response({
            'id': progress.id,
            'video_intro_id': video_intro.id,
            'is_completed': progress.is_completed,
            'completed_at': progress.completed_at.isoformat() if progress.completed_at else None
        })
        
    except Exception as e:
        return Response(
            {'detail': f'진행 상황 업데이트 중 오류가 발생했습니다: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def plan_subscription_unsubscribe(request, pk):
    """
    구독 취소 및 관련 진행도 데이터 삭제
    """
    try:
        subscription = PlanSubscription.objects.get(pk=pk, user=request.user)
    except PlanSubscription.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    # 기본 플랜 구독은 취소할 수 없음
    if subscription.plan.is_default:
        return Response(
            {"detail": "기본 플랜 구독은 취소할 수 없습니다."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 플랜 정보 저장 (응답에 사용)
    plan_name = subscription.plan.name
    
    with transaction.atomic():
        # 1. 해당 구독에 연결된 모든 진행도 데이터 삭제
        UserBibleProgress.objects.filter(subscription=subscription).delete()
        
        # 2. 해당 구독에 연결된 영상 개론 진행 데이터 삭제
        UserVideoIntroProgress.objects.filter(
            user=request.user,
            video_intro__plan=subscription.plan
        ).delete()
        
        # 3. 구독 레코드 완전 삭제 (비활성화 대신)
        subscription.delete()
    
    return Response({"detail": f"{plan_name} 플랜 구독이 취소되었습니다."})

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def schedule_list(request):
    """스케줄 목록 조회 및 생성"""
    if request.method == 'GET':
        plan_id = request.query_params.get('plan_id')
        if plan_id:
            schedules = DailyBibleSchedule.objects.filter(plan_id=plan_id)
        else:
            schedules = DailyBibleSchedule.objects.all()
        serializer = DailyBibleScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.is_staff:
            return Response({"detail": "권한이 없습니다."}, status=403)
            
        serializer = DailyBibleScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def schedule_detail(request, pk):
    """스케줄 상세 조회/수정/삭제"""
    try:
        schedule = DailyBibleSchedule.objects.get(pk=pk)
    except DailyBibleSchedule.DoesNotExist:
        return Response(status=404)
        
    if request.method == 'GET':
        serializer = DailyBibleScheduleSerializer(schedule)
        return Response(serializer.data)
        
    elif request.method in ['PUT', 'PATCH']:
        if not request.user.is_staff:
            return Response({"detail": "권한이 없습니다."}, status=403)
            
        serializer = DailyBibleScheduleSerializer(schedule, data=request.data, partial=request.method=='PATCH')
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
        
    elif request.method == 'DELETE':
        if not request.user.is_staff:
            return Response({"detail": "권한이 없습니다."}, status=403)
            
        schedule.delete()
        return Response(status=204)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_schedules_excel(request):
    """엑셀 파일로 세부 일정 대량 업로드"""
    try:
        plan_id = request.data.get('plan_id')
        file = request.FILES.get('file')
        update_mode = request.data.get('update_mode', 'add')  # 'add', 'update', 'replace'
        
        if not plan_id or not file:
            return Response(
                {"detail": "플랜 ID와 파일은 필수 항목입니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 파일 확장자 확인
        file_name = file.name.lower()
        if not (file_name.endswith('.xlsx') or file_name.endswith('.xls')):
            return Response(
                {"detail": "Excel 파일(.xlsx, .xls)만 업로드 가능합니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 파일 크기 제한 (5MB)
        if file.size > 5 * 1024 * 1024:
            return Response(
                {"detail": "파일 크기는 5MB를 초과할 수 없습니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 플랜 존재 여부 확인
            plan = BibleReadingPlan.objects.get(id=plan_id)
            
            # 엑셀 파일 읽기
            import pandas as pd
            import re
            from datetime import datetime
            
            # 날짜 컬럼을 자동으로 datetime 객체로 변환
            df = pd.read_excel(file)
            
            # 필수 열 확인
            required_columns = ['날짜', '성경', '시작장', '끝장']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return Response(
                    {"detail": f"필수 컬럼이 누락되었습니다: {', '.join(missing_columns)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 기존 일정 관리
            if update_mode == 'replace':
                # 기존 일정 모두 삭제
                DailyBibleSchedule.objects.filter(plan=plan).delete()
            
            # 데이터 변환 및 저장
            success_count = 0
            error_count = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # 날짜 변환
                    date_str = row['날짜']
                    if isinstance(date_str, str):
                        # YYYY-MM-DD 형식이 아닌 경우 변환
                        if re.match(r'\d{4}\.\d{1,2}\.\d{1,2}', date_str):
                            date_str = date_str.replace('.', '-')
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                    else:
                        # pandas가 자동으로 datetime으로 변환한 경우
                        date_obj = date_str.date() if hasattr(date_str, 'date') else date_str
                    
                    # 필드 값 추출
                    book = row['성경']
                    start_chapter = int(row['시작장'])
                    end_chapter = int(row['끝장'])
                    
                    # URL 필드 처리 개선
                    audio_link = row.get('오디오', '')
                    guide_link = row.get('가이드', '')

                    # 데이터 타입 확인 및 변환 
                    # float 타입이 들어온 경우 처리
                    if isinstance(audio_link, float) or isinstance(guide_link, float):
                        if pd.isna(audio_link):
                            audio_link = ''
                        if pd.isna(guide_link):
                            guide_link = ''
                    
                    # 업데이트 모드 처리
                    if update_mode in ['add', 'replace']:
                        # 신규 추가
                        DailyBibleSchedule.objects.create(
                            plan=plan,
                            date=date_obj,
                            book=book,
                            start_chapter=start_chapter,
                            end_chapter=end_chapter,
                            audio_link=audio_link,
                            guide_link=guide_link
                        )
                    else:  # update 모드
                        # 기존 레코드 업데이트 또는 생성
                        obj, created = DailyBibleSchedule.objects.update_or_create(
                            plan=plan,
                            date=date_obj,
                            defaults={
                                'book': book,
                                'start_chapter': start_chapter,
                                'end_chapter': end_chapter,
                                'audio_link': audio_link,
                                'guide_link': guide_link
                            }
                        )
                    
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"행 {index + 2}: {str(e)}")
            
            return Response({
                "detail": f"{success_count}개의 일정이 처리되었습니다. 오류: {error_count}개",
                "errors": errors if errors else None
            })
            
        except BibleReadingPlan.DoesNotExist:
            return Response(
                {"detail": "해당 ID의 플랜을 찾을 수 없습니다."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print(traceback.format_exc())  # 서버 로그에 상세 오류 출력
            return Response(
                {"detail": f"파일 처리 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        import traceback
        print(traceback.format_exc())  # 서버 로그에 상세 오류 출력
        return Response(
            {"detail": f"요청 처리 중 오류가 발생했습니다: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])  # IsAuthenticated에서 AllowAny로 변경
def get_total_users(request):
    """
    전체 사용자 수를 반환하는 API (공개)
    
    [응답 예시]
    {
        "success": true,
        "total_users": 132
    }
    """
    try:
        total_users = User.objects.count()
        
        return Response({
            'success': True,
            'total_users': total_users
        })
    except Exception as e:
        logger.error(f"Error in get_total_users: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])  # IsAuthenticated, IsAdminUser에서 AllowAny로 변경
def get_plan_stats(request):
    """
    특정 플랜의 통계 정보를 반환하는 API
    
    [필수 파라미터]
    - plan_id: 플랜 ID
    
    [응답 예시]
    {
        "success": true,
        "plan_name": "1년 성경 통독",
        "total_subscribers": 45,
        "today_completed_users": 12
    }
    """
    try:
        plan_id = request.query_params.get('plan_id')
        
        if not plan_id:
            # 기본 플랜 ID를 사용 (추가)
            default_plan = BibleReadingPlan.objects.filter(is_default=True).first()
            if default_plan:
                plan_id = default_plan.id
            else:
                return Response({
                    'success': False,
                    'error': '플랜 ID가 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        # 플랜 존재 여부 확인
        try:
            plan = BibleReadingPlan.objects.get(id=plan_id)
        except BibleReadingPlan.DoesNotExist:
            return Response({
                'success': False,
                'error': '존재하지 않는 플랜입니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 오늘 날짜 가져오기
        today = timezone.now().date()
        
        # 1. 총 구독자 수 계산
        total_subscribers = PlanSubscription.objects.filter(
            plan=plan,
            is_active=True
        ).count()
        
        # 2. 오늘 일정을 모두 완료한 사용자 수 계산
        
        # 오늘의 모든 일정 가져오기
        today_schedules = DailyBibleSchedule.objects.filter(
            plan=plan,
            date=today
        )
        
        # 오늘 일정이 없는 경우
        if not today_schedules.exists():
            return Response({
                'success': True,
                'plan_name': plan.name,
                'total_subscribers': total_subscribers,
                'today_completed_users': 0,
                'note': '오늘은 일정이 없습니다.'
            })
        
        # 활성 구독 ID 목록
        active_subscription_ids = PlanSubscription.objects.filter(
            plan=plan,
            is_active=True
        ).values_list('id', flat=True)
        
        # 모든 일정을 완료한 사용자의 구독 ID 집합
        completed_all_schedules = set()
        
        # 일정별로 완료한 구독 ID 집합들의 교집합 계산
        for i, schedule in enumerate(today_schedules):
            # 이 일정을 완료한 구독 ID 집합
            completed_subscriptions = set(UserBibleProgress.objects.filter(
                schedule=schedule,
                is_completed=True,
                subscription_id__in=active_subscription_ids
            ).values_list('subscription_id', flat=True))
            
            # 첫 번째 일정이면 초기화, 아니면 교집합 계산
            if i == 0:
                completed_all_schedules = completed_subscriptions
            else:
                completed_all_schedules &= completed_subscriptions
        
        # 교집합의 크기가 모든 일정을 완료한 사용자 수
        today_completed_users = len(completed_all_schedules)
        
        return Response({
            'success': True,
            'plan_name': plan.name,
            'total_subscribers': total_subscribers,
            'today_completed_users': today_completed_users
        })
        
    except Exception as e:
        logger.error(f"Error in get_plan_stats: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])  # IsAuthenticated에서 AllowAny로 변경
def get_progress_stats(request):
    """
    진행률 통계 정보를 반환하는 API
    
    [필수 파라미터]
    - plan_id: 플랜 ID
    
    [응답 예시]
    {
        "success": true,
        "plan_name": "1년 성경 통독",
        "theoretical_progress": 23.45,  // 오늘까지 완료했을 때의 이론적 진행률 (%)
        "user_progress": 18.32          // 사용자의 실제 진행률 (%)
    }
    """
    try:
        plan_id = request.query_params.get('plan_id')
        
        if not plan_id:
            # 기본 플랜 ID를 사용 (추가)
            default_plan = BibleReadingPlan.objects.filter(is_default=True).first()
            if default_plan:
                plan_id = default_plan.id
            else:
                return Response({
                    'success': False,
                    'error': '플랜 ID가 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        # 플랜 존재 여부 확인
        try:
            plan = BibleReadingPlan.objects.get(id=plan_id)
        except BibleReadingPlan.DoesNotExist:
            return Response({
                'success': False,
                'error': '존재하지 않는 플랜입니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 오늘 날짜 가져오기
        today = timezone.now().date()
        
        # 1. 전체 일정 개수 계산
        total_schedules = DailyBibleSchedule.objects.filter(plan=plan).count()
        
        if total_schedules == 0:
            return Response({
                'success': False,
                'error': '이 플랜에는 일정이 없습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. 오늘까지의 일정 개수 계산
        today_schedules = DailyBibleSchedule.objects.filter(
            plan=plan,
            date__lte=today
        ).count()
        
        # 3. 이론적 진행률 계산 (오늘까지 완료했을 때)
        theoretical_progress = (today_schedules / total_schedules) * 100
        
        # 4. 사용자가 로그인 상태인지 확인
        user_progress = 0
        if request.user.is_authenticated:
            # 사용자의 구독 확인
            subscription = PlanSubscription.objects.filter(
                user=request.user,
                plan=plan,
                is_active=True
            ).first()
            
            if subscription:
                # 사용자가 완료한 일정 개수 계산
                completed_schedules = UserBibleProgress.objects.filter(
                    subscription=subscription,
                    is_completed=True
                ).count()
                
                # 사용자 진행률 계산
                user_progress = (completed_schedules / total_schedules) * 100
        
        return Response({
            'success': True,
            'plan_name': plan.name,
            'theoretical_progress': round(theoretical_progress, 2),
            'user_progress': round(user_progress, 2)
        })
        
    except Exception as e:
        logger.error(f"Error in get_progress_stats: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def increment_visitor_count(request):
    """방문자 수 증가"""
    try:
        visitor_count = VisitorCount.increment_daily_count()
        return Response({
            'success': True,
            'daily_count': visitor_count.daily_count
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_visitor_stats(request):
    """방문자 통계 조회"""
    try:
        today = timezone.now().date()
        today_count = VisitorCount.objects.filter(date=today).first()
        daily_visitors = today_count.daily_count if today_count else 0
        total_visitors = VisitorCount.get_total_visitors()

        return Response({
            'success': True,
            'daily_visitors': daily_visitors,
            'total_visitors': total_visitors
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 