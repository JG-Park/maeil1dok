from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from utils.response import StandardResponse, handle_api_exception
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, F
from django.utils import timezone
from datetime import datetime, timedelta
from .models import User, UserProfile, Follow, UserAchievement
from .serializers import (
    UserProfileSerializer, FollowSerializer, 
    UserAchievementSerializer, UserCalendarDataSerializer,
    UserSearchSerializer
)
from todos.models import UserBibleProgress, PlanSubscription, DailyBibleSchedule
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
@handle_api_exception
def get_user_profile(request, user_id):
    """사용자 프로필 조회"""
    user = get_object_or_404(User, id=user_id)
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    # 프로필이 비공개이고 본인이 아닌 경우
    if not profile.is_public and request.user != user:
        return StandardResponse.error(
            error='비공개 프로필입니다.',
            message='이 프로필은 비공개로 설정되어 있습니다.',
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    serializer = UserProfileSerializer(profile, context={'request': request})
    return StandardResponse.success(
        data={'profile': serializer.data},
        message='프로필을 성공적으로 조회했습니다.'
    )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@handle_api_exception
def update_user_profile(request):
    """프로필 수정"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    # 수정 가능한 필드만 업데이트
    if 'bio' in request.data:
        profile.bio = request.data['bio']
    if 'is_public' in request.data:
        profile.is_public = request.data['is_public']

    profile.save()

    serializer = UserProfileSerializer(profile, context={'request': request})
    return StandardResponse.success(
        data={'profile': serializer.data},
        message='프로필이 업데이트되었습니다.'
    )


@api_view(['GET'])
@permission_classes([AllowAny])
@handle_api_exception
def get_user_calendar(request, user_id):
    """사용자 달력 데이터 조회"""
    user = get_object_or_404(User, id=user_id)

    # 프로필 공개 여부 확인
    profile, created = UserProfile.objects.get_or_create(user=user)
    if not profile.is_public and request.user != user:
        return StandardResponse.error(
            error='비공개 프로필입니다.',
            message='이 프로필은 비공개로 설정되어 있습니다.',
            status_code=status.HTTP_403_FORBIDDEN
        )

    # 쿼리 파라미터에서 년월 가져오기
    year = request.query_params.get('year', timezone.now().year)
    month = request.query_params.get('month', timezone.now().month)

    # 해당 월의 진행 데이터 조회
    start_date = datetime(int(year), int(month), 1).date()
    if int(month) == 12:
        end_date = datetime(int(year) + 1, 1, 1).date() - timedelta(days=1)
    else:
        end_date = datetime(int(year), int(month) + 1, 1).date() - timedelta(days=1)

    # 사용자의 활성 구독 가져오기
    subscriptions = PlanSubscription.objects.filter(
        user=user,
        is_active=True
    )

    calendar_data = []
    for subscription in subscriptions:
        # 해당 기간의 스케줄과 진행 상황 조회
        schedules = DailyBibleSchedule.objects.filter(
            plan=subscription.plan,
            date__range=[start_date, end_date]
        ).select_related('plan')

        for schedule in schedules:
            progress = UserBibleProgress.objects.filter(
                subscription=subscription,
                schedule=schedule
            ).first()

            calendar_data.append({
                'date': schedule.date,
                'is_completed': progress.is_completed if progress else False,
                'book': schedule.book,
                'chapters': f"{schedule.start_chapter}-{schedule.end_chapter}장"
            })

    serializer = UserCalendarDataSerializer(calendar_data, many=True)
    return StandardResponse.success(
        data={'calendar': serializer.data},
        message='달력 데이터를 조회했습니다.'
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@handle_api_exception
def follow_user(request):
    """사용자 팔로우"""
    following_id = request.data.get('user_id')
    if not following_id:
        return StandardResponse.error(
            error='팔로우할 사용자 ID가 필요합니다.',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    following_user = get_object_or_404(User, id=following_id)
    
    # 자기 자신은 팔로우 불가
    if following_user == request.user:
        return StandardResponse.error(
            error='자기 자신은 팔로우할 수 없습니다.',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # 이미 팔로우 중인지 확인
    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=following_user
    )
    
    if not created:
        return StandardResponse.error(
            error='이미 팔로우 중입니다.',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = FollowSerializer(follow)
    return StandardResponse.success(
        data={'follow': serializer.data},
        message='팔로우했습니다.',
        status_code=status.HTTP_201_CREATED
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@handle_api_exception
def unfollow_user(request, user_id):
    """사용자 언팔로우"""
    following_user = get_object_or_404(User, id=user_id)

    follow = Follow.objects.filter(
        follower=request.user,
        following=following_user
    ).first()

    if not follow:
        return StandardResponse.error(
            error='팔로우 관계가 존재하지 않습니다.',
            status_code=status.HTTP_404_NOT_FOUND
        )

    follow.delete()

    return StandardResponse.success(
        data={'unfollowed_user_id': user_id},
        message='언팔로우했습니다.'
    )


@api_view(['GET'])
@permission_classes([AllowAny])
@handle_api_exception
def get_followers(request, user_id):
    """팔로워 목록 조회"""
    user = get_object_or_404(User, id=user_id)

    # 프로필 공개 여부 확인
    profile, created = UserProfile.objects.get_or_create(user=user)
    if not profile.is_public and request.user != user:
        return StandardResponse.error(
            error='비공개 프로필입니다.',
            message='이 프로필은 비공개로 설정되어 있습니다.',
            status_code=status.HTTP_403_FORBIDDEN
        )

    followers = User.objects.filter(
        following__following=user
    ).select_related('profile').distinct()

    # N+1 방지: 현재 사용자의 팔로잉 목록 미리 조회
    following_ids = set()
    if request.user.is_authenticated:
        following_ids = set(
            Follow.objects.filter(follower=request.user)
            .values_list('following_id', flat=True)
        )

    serializer = UserSearchSerializer(
        followers, many=True,
        context={'request': request, 'following_ids': following_ids}
    )
    return StandardResponse.success(
        data={'followers': serializer.data},
        message='팔로워 목록을 조회했습니다.'
    )


@api_view(['GET'])
@permission_classes([AllowAny])
@handle_api_exception
def get_following(request, user_id):
    """팔로잉 목록 조회"""
    user = get_object_or_404(User, id=user_id)

    # 프로필 공개 여부 확인
    profile, created = UserProfile.objects.get_or_create(user=user)
    if not profile.is_public and request.user != user:
        return StandardResponse.error(
            error='비공개 프로필입니다.',
            message='이 프로필은 비공개로 설정되어 있습니다.',
            status_code=status.HTTP_403_FORBIDDEN
        )

    following = User.objects.filter(
        followers__follower=user
    ).select_related('profile').distinct()

    # N+1 방지: 현재 사용자의 팔로잉 목록 미리 조회
    following_ids = set()
    if request.user.is_authenticated:
        following_ids = set(
            Follow.objects.filter(follower=request.user)
            .values_list('following_id', flat=True)
        )

    serializer = UserSearchSerializer(
        following, many=True,
        context={'request': request, 'following_ids': following_ids}
    )
    return StandardResponse.success(
        data={'following': serializer.data},
        message='팔로잉 목록을 조회했습니다.'
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@handle_api_exception
def get_friends(request):
    """상호 팔로우(친구) 목록 조회"""
    # 내가 팔로우하고 있는 사용자들 중 나를 팔로우하는 사용자
    friends = User.objects.filter(
        followers__follower=request.user,
        following__following=request.user
    ).select_related('profile').distinct()

    # N+1 방지: 현재 사용자의 팔로잉 목록 미리 조회
    following_ids = set(
        Follow.objects.filter(follower=request.user)
        .values_list('following_id', flat=True)
    )

    serializer = UserSearchSerializer(
        friends, many=True,
        context={'request': request, 'following_ids': following_ids}
    )
    return StandardResponse.success(
        data={'friends': serializer.data},
        message='친구 목록을 성공적으로 조회했습니다.'
    )


@api_view(['GET'])
@permission_classes([AllowAny])
@handle_api_exception
def search_users(request):
    """사용자 검색"""
    query = request.query_params.get('q', '')
    if len(query) < 2:
        return StandardResponse.error(
            error='검색어는 2자 이상 입력해주세요.',
            status_code=status.HTTP_400_BAD_REQUEST
        )

    users = User.objects.filter(
        Q(nickname__icontains=query) | Q(username__icontains=query)
    ).select_related('profile').exclude(
        id=request.user.id if request.user.is_authenticated else None
    )[:20]

    # N+1 방지: 현재 사용자의 팔로잉 목록 미리 조회
    following_ids = set()
    if request.user.is_authenticated:
        following_ids = set(
            Follow.objects.filter(follower=request.user)
            .values_list('following_id', flat=True)
        )

    serializer = UserSearchSerializer(
        users, many=True,
        context={'request': request, 'following_ids': following_ids}
    )
    return StandardResponse.success(
        data={'users': serializer.data},
        message='검색 결과입니다.'
    )


@api_view(['GET'])
@permission_classes([AllowAny])
@handle_api_exception
def get_user_achievements(request, user_id):
    """사용자 업적 조회"""
    user = get_object_or_404(User, id=user_id)

    # 프로필 공개 여부 확인
    profile, created = UserProfile.objects.get_or_create(user=user)
    if not profile.is_public and request.user != user:
        return StandardResponse.error(
            error='비공개 프로필입니다.',
            message='이 프로필은 비공개로 설정되어 있습니다.',
            status_code=status.HTTP_403_FORBIDDEN
        )

    achievements = UserAchievement.objects.filter(user=user)
    serializer = UserAchievementSerializer(achievements, many=True)

    return StandardResponse.success(
        data={'achievements': serializer.data},
        message='업적을 조회했습니다.'
    )