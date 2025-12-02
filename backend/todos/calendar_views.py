"""
멀티 플랜 캘린더 관련 API 뷰
"""
from datetime import date, timedelta
from calendar import monthrange
from collections import defaultdict

from django.db import transaction
from django.db.models import Q

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    UserPlanDisplaySettings, PlanSubscription,
    DailyBibleSchedule, UserBibleProgress
)
from .serializers import UserPlanDisplaySettingsSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_calendar_settings(request):
    """
    사용자의 모든 플랜 표시 설정 조회
    GET /api/v1/todos/calendar/settings/
    """
    settings = UserPlanDisplaySettings.objects.filter(
        user=request.user,
        subscription__is_active=True
    ).select_related('subscription', 'subscription__plan').order_by('display_order')

    serializer = UserPlanDisplaySettingsSerializer(settings, many=True)

    return Response({
        'success': True,
        'settings': serializer.data
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_calendar_setting(request, pk):
    """
    개별 플랜 표시 설정 업데이트
    PATCH /api/v1/todos/calendar/settings/<id>/
    """
    try:
        setting = UserPlanDisplaySettings.objects.get(pk=pk, user=request.user)
    except UserPlanDisplaySettings.DoesNotExist:
        return Response({
            'success': False,
            'error': '설정을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)

    # 허용된 필드만 업데이트
    allowed_fields = ['color', 'is_visible']
    for field in allowed_fields:
        if field in request.data:
            setattr(setting, field, request.data[field])

    setting.save()
    serializer = UserPlanDisplaySettingsSerializer(setting)

    return Response({
        'success': True,
        'setting': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder_calendar_settings(request):
    """
    플랜 표시 순서 일괄 변경
    POST /api/v1/todos/calendar/settings/reorder/
    Body: { "orders": [{"id": 1, "display_order": 0}, ...] }
    """
    orders = request.data.get('orders', [])

    if not orders:
        return Response({
            'success': False,
            'error': '순서 정보가 필요합니다.'
        }, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        for item in orders:
            setting_id = item.get('id')
            display_order = item.get('display_order')

            if setting_id is None or display_order is None:
                continue

            UserPlanDisplaySettings.objects.filter(
                pk=setting_id,
                user=request.user
            ).update(display_order=display_order)

    # 업데이트된 설정 반환
    settings = UserPlanDisplaySettings.objects.filter(
        user=request.user,
        subscription__is_active=True
    ).select_related('subscription', 'subscription__plan').order_by('display_order')

    serializer = UserPlanDisplaySettingsSerializer(settings, many=True)

    return Response({
        'success': True,
        'settings': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_calendar_month_data(request):
    """
    멀티플랜 월별 캘린더 데이터 조회
    GET /api/v1/todos/calendar/month/?year=2025&month=12
    """
    year = request.query_params.get('year')
    month = request.query_params.get('month')

    # 기본값: 현재 월
    today = date.today()
    if not year or not month:
        year = today.year
        month = today.month
    else:
        year = int(year)
        month = int(month)

    # 해당 월의 시작일과 종료일
    _, last_day = monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    # 사용자의 활성 구독 및 표시 설정 조회
    display_settings = UserPlanDisplaySettings.objects.filter(
        user=request.user,
        subscription__is_active=True
    ).select_related('subscription', 'subscription__plan')

    # 설정을 subscription_id로 매핑
    settings_map = {ds.subscription_id: ds for ds in display_settings}

    # 결과 데이터 구조
    calendar_data = defaultdict(list)

    # 각 구독에 대해 스케줄 및 진행 상태 조회
    for display_setting in display_settings:
        subscription = display_setting.subscription
        plan = subscription.plan

        # 해당 플랜의 스케줄 조회
        schedules = DailyBibleSchedule.objects.filter(
            plan=plan,
            date__range=[start_date, end_date]
        ).order_by('date')

        # 진행 상태 조회 (해당 구독의)
        progress_map = {}
        progress_records = UserBibleProgress.objects.filter(
            subscription=subscription,
            schedule__date__range=[start_date, end_date]
        ).select_related('schedule')

        for progress in progress_records:
            progress_map[progress.schedule_id] = progress.is_completed

        # 날짜별 데이터 구성
        for schedule in schedules:
            date_str = schedule.date.isoformat()

            # 챕터 형식화
            if schedule.start_chapter == schedule.end_chapter:
                chapters = f"{schedule.start_chapter}장"
            else:
                chapters = f"{schedule.start_chapter}-{schedule.end_chapter}장"

            calendar_data[date_str].append({
                'plan_id': plan.id,
                'plan_name': plan.name,
                'subscription_id': subscription.id,
                'color': display_setting.color,
                'book': schedule.book,
                'chapters': chapters,
                'is_completed': progress_map.get(schedule.id, False),
                'schedule_id': schedule.id,
                'is_visible': display_setting.is_visible
            })

    # 표시 순서에 따라 각 날짜의 데이터 정렬
    for date_str in calendar_data:
        calendar_data[date_str].sort(
            key=lambda x: settings_map.get(x['subscription_id'], {}).display_order
            if hasattr(settings_map.get(x['subscription_id'], {}), 'display_order')
            else 999
        )

    # 설정 정보도 함께 반환
    settings_serializer = UserPlanDisplaySettingsSerializer(
        display_settings.order_by('display_order'), many=True
    )

    return Response({
        'success': True,
        'calendar': dict(calendar_data),
        'settings': settings_serializer.data,
        'meta': {
            'year': year,
            'month': month
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_last_incomplete_positions(request):
    """
    각 플랜별 마지막 미완료 위치 조회
    GET /api/v1/todos/calendar/last-incomplete/
    """
    today = date.today()
    positions = []

    # 사용자의 활성 구독 조회
    subscriptions = PlanSubscription.objects.filter(
        user=request.user,
        is_active=True
    ).select_related('plan')

    for subscription in subscriptions:
        plan = subscription.plan

        # 오늘 이전의 미완료 스케줄 찾기
        # 1. 해당 플랜의 모든 스케줄 중 오늘 이전 것
        # 2. UserBibleProgress가 없거나 is_completed=False인 것
        incomplete_schedules = DailyBibleSchedule.objects.filter(
            plan=plan,
            date__lte=today
        ).exclude(
            progress_records__subscription=subscription,
            progress_records__is_completed=True
        ).order_by('-date')

        if incomplete_schedules.exists():
            schedule = incomplete_schedules.first()

            # 챕터 형식화
            if schedule.start_chapter == schedule.end_chapter:
                chapters = f"{schedule.start_chapter}장"
            else:
                chapters = f"{schedule.start_chapter}-{schedule.end_chapter}장"

            # 표시 설정에서 색상 가져오기
            try:
                display_setting = UserPlanDisplaySettings.objects.get(
                    user=request.user,
                    subscription=subscription
                )
                color = display_setting.color
            except UserPlanDisplaySettings.DoesNotExist:
                color = '#3B82F6'

            positions.append({
                'plan_id': plan.id,
                'plan_name': plan.name,
                'subscription_id': subscription.id,
                'color': color,
                'date': schedule.date.isoformat(),
                'book': schedule.book,
                'chapters': chapters,
                'schedule_id': schedule.id
            })

    # 날짜 기준 정렬 (가장 최근 미완료가 먼저)
    positions.sort(key=lambda x: x['date'], reverse=True)

    return Response({
        'success': True,
        'positions': positions
    })
