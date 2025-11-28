from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q, F, Sum, Case, When, IntegerField
from django.utils import timezone
from datetime import datetime, timedelta
from accounts.models import User, UserProfile, Follow
from accounts.serializers import UserSearchSerializer
from .models import UserBibleProgress, PlanSubscription, DailyBibleSchedule, ReadingGroup, GroupMembership
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_scoreboard(request):
    """전체 리더보드 조회"""
    try:
        # 쿼리 파라미터
        plan_id = request.query_params.get('plan_id')
        period = request.query_params.get('period', 'all')  # all, week, month
        limit = int(request.query_params.get('limit', 100))
        
        # 기본 쿼리셋 - select_related로 성능 최적화
        users_query = User.objects.filter(is_active=True).select_related('profile')
        
        # 플랜 필터링
        if plan_id:
            users_query = users_query.filter(
                plansubscription__plan_id=plan_id,
                plansubscription__is_active=True
            ).distinct()
        
        # 기간 설정
        date_filter = {}
        if period == 'week':
            start_date = timezone.now().date() - timedelta(days=7)
            date_filter = {'userbibleprogress__completed_at__gte': start_date}
        elif period == 'month':
            start_date = timezone.now().date() - timedelta(days=30)
            date_filter = {'userbibleprogress__completed_at__gte': start_date}
        
        # 진행률 계산 및 정렬
        leaderboard = []
        for user in users_query:
            # 사용자 프로필 가져오기 (select_related로 이미 로드됨)
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(user=user)
            
            # 공개 프로필만 표시
            if not profile.is_public and request.user != user:
                continue
            
            # 완료한 일수 계산
            if period == 'all':
                completed_days = profile.total_completed_days
            else:
                completed_filter = {
                    'subscription__user': user,
                    'is_completed': True
                }
                if period == 'week':
                    completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=7)
                elif period == 'month':
                    completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=30)
                
                if plan_id:
                    completed_filter['subscription__plan_id'] = plan_id
                
                completed_days = UserBibleProgress.objects.filter(**completed_filter).count()
            
            # 진행률 계산
            if plan_id:
                total_schedules = DailyBibleSchedule.objects.filter(
                    plan_id=plan_id,
                    date__lte=timezone.now().date()
                ).count()
                progress_rate = (completed_days / total_schedules * 100) if total_schedules > 0 else 0
            else:
                # 전체 플랜 기준
                subscriptions = PlanSubscription.objects.filter(user=user, is_active=True)
                if subscriptions.exists():
                    subscription = subscriptions.first()
                    total_schedules = DailyBibleSchedule.objects.filter(
                        plan=subscription.plan,
                        date__lte=timezone.now().date()
                    ).count()
                    progress_rate = (completed_days / total_schedules * 100) if total_schedules > 0 else 0
                else:
                    progress_rate = 0
            
            leaderboard.append({
                'user': {
                    'id': user.id,
                    'nickname': user.nickname,
                    'profile_image': user.profile_image
                },
                'completed_days': completed_days,
                'progress_rate': round(progress_rate, 2),
                'current_streak': profile.current_streak,
                'longest_streak': profile.longest_streak
            })
        
        # 정렬 (완료 일수 기준)
        leaderboard.sort(key=lambda x: x['completed_days'], reverse=True)
        
        # 순위 추가
        for i, item in enumerate(leaderboard[:limit]):
            item['rank'] = i + 1
        
        return Response({
            'success': True,
            'leaderboard': leaderboard[:limit],
            'period': period,
            'plan_id': plan_id
        })
    except Exception as e:
        logger.error(f"Error getting scoreboard: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends_scoreboard(request):
    """친구 리더보드 조회"""
    try:
        # 쿼리 파라미터
        plan_id = request.query_params.get('plan_id')
        period = request.query_params.get('period', 'all')
        
        # 상호 팔로우 친구 목록 - select_related 추가
        friends = User.objects.filter(
            followers__follower=request.user,
            following__following=request.user
        ).distinct().select_related('profile')
        
        # 본인 포함
        users = list(friends) + [request.user]
        
        leaderboard = []
        for user in users:
            # 프로필 가져오기 (select_related로 최적화)
            try:
                profile = user.profile if hasattr(user, 'profile') else UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(user=user)
            
            # 완료한 일수 계산
            if period == 'all':
                completed_days = profile.total_completed_days
            else:
                completed_filter = {
                    'subscription__user': user,
                    'is_completed': True
                }
                if period == 'week':
                    completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=7)
                elif period == 'month':
                    completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=30)
                
                if plan_id:
                    completed_filter['subscription__plan_id'] = plan_id
                
                completed_days = UserBibleProgress.objects.filter(**completed_filter).count()
            
            # 진행률 계산
            if plan_id:
                subscription = PlanSubscription.objects.filter(
                    user=user,
                    plan_id=plan_id,
                    is_active=True
                ).first()
                
                if subscription:
                    total_schedules = DailyBibleSchedule.objects.filter(
                        plan_id=plan_id,
                        date__lte=timezone.now().date()
                    ).count()
                    completed_schedules = UserBibleProgress.objects.filter(
                        subscription=subscription,
                        is_completed=True
                    ).count()
                    progress_rate = (completed_schedules / total_schedules * 100) if total_schedules > 0 else 0
                else:
                    progress_rate = 0
            else:
                # 전체 플랜 기준
                subscriptions = PlanSubscription.objects.filter(user=user, is_active=True)
                if subscriptions.exists():
                    subscription = subscriptions.first()
                    total_schedules = DailyBibleSchedule.objects.filter(
                        plan=subscription.plan,
                        date__lte=timezone.now().date()
                    ).count()
                    progress_rate = (completed_days / total_schedules * 100) if total_schedules > 0 else 0
                else:
                    progress_rate = 0
            
            leaderboard.append({
                'user': {
                    'id': user.id,
                    'nickname': user.nickname,
                    'profile_image': user.profile_image,
                    'is_me': user == request.user
                },
                'completed_days': completed_days,
                'progress_rate': round(progress_rate, 2),
                'current_streak': profile.current_streak,
                'longest_streak': profile.longest_streak
            })
        
        # 정렬
        leaderboard.sort(key=lambda x: x['completed_days'], reverse=True)
        
        # 순위 추가
        for i, item in enumerate(leaderboard):
            item['rank'] = i + 1
        
        return Response({
            'success': True,
            'leaderboard': leaderboard,
            'period': period,
            'plan_id': plan_id,
            'total_friends': len(friends)
        })
    except Exception as e:
        logger.error(f"Error getting friends scoreboard: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_group_scoreboard(request, group_id):
    """그룹 리더보드 조회"""
    try:
        # 그룹 확인
        try:
            group = ReadingGroup.objects.get(id=group_id)
        except ReadingGroup.DoesNotExist:
            return Response({
                'success': False,
                'error': '그룹을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 비공개 그룹이고 멤버가 아닌 경우
        if not group.is_public:
            if not request.user.is_authenticated:
                return Response({
                    'success': False,
                    'error': '비공개 그룹입니다.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            is_member = GroupMembership.objects.filter(
                group=group,
                user=request.user,
                is_active=True
            ).exists()
            
            if not is_member:
                return Response({
                    'success': False,
                    'error': '그룹 멤버만 조회할 수 있습니다.'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # 쿼리 파라미터
        period = request.query_params.get('period', 'all')
        plan_id = request.query_params.get('plan_id')

        # 플랜 선택 (plan_id가 주어지면 해당 플랜, 없으면 그룹의 첫 번째 플랜)
        if plan_id:
            try:
                plan = group.plans.get(id=plan_id)
            except BibleReadingPlan.DoesNotExist:
                return Response({
                    'success': False,
                    'error': '해당 플랜을 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            plan = group.plans.first()
            if not plan:
                return Response({
                    'success': False,
                    'error': '그룹에 플랜이 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)

        # 그룹 멤버 목록 - select_related로 최적화
        members = User.objects.filter(
            group_memberships__group=group,
            group_memberships__is_active=True
        ).distinct().select_related('profile').prefetch_related('group_memberships')

        leaderboard = []
        for user in members:
            # 프로필 가져오기
            profile, created = UserProfile.objects.get_or_create(user=user)

            # 선택된 플랜에 대한 구독 확인
            subscription = PlanSubscription.objects.filter(
                user=user,
                plan=plan,
                is_active=True
            ).first()
            
            if not subscription:
                continue
            
            # 완료한 일수 계산
            completed_filter = {
                'subscription': subscription,
                'is_completed': True
            }
            
            if period == 'week':
                completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=7)
            elif period == 'month':
                completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=30)
            
            completed_days = UserBibleProgress.objects.filter(**completed_filter).count()

            # 진행률 계산
            total_schedules = DailyBibleSchedule.objects.filter(
                plan=plan,
                date__lte=timezone.now().date()
            ).count()
            
            completed_schedules = UserBibleProgress.objects.filter(
                subscription=subscription,
                is_completed=True
            ).count()
            
            progress_rate = (completed_schedules / total_schedules * 100) if total_schedules > 0 else 0
            
            # 멤버 역할 확인
            membership = GroupMembership.objects.get(group=group, user=user)
            
            leaderboard.append({
                'user': {
                    'id': user.id,
                    'nickname': user.nickname,
                    'profile_image': user.profile_image,
                    'is_me': user == request.user if request.user.is_authenticated else False,
                    'role': membership.get_role_display()
                },
                'completed_days': completed_days,
                'progress_rate': round(progress_rate, 2),
                'current_streak': profile.current_streak,
                'longest_streak': profile.longest_streak,
                'joined_at': membership.joined_at
            })
        
        # 정렬
        leaderboard.sort(key=lambda x: x['completed_days'], reverse=True)
        
        # 순위 추가
        for i, item in enumerate(leaderboard):
            item['rank'] = i + 1
        
        return Response({
            'success': True,
            'group': {
                'id': group.id,
                'name': group.name,
                'description': group.description,
                'member_count': group.member_count
            },
            'plan': {
                'id': plan.id,
                'name': plan.name,
                'description': plan.description
            },
            'leaderboard': leaderboard,
            'period': period
        })
    except Exception as e:
        logger.error(f"Error getting group scoreboard: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_ranking(request):
    """내 순위 조회"""
    try:
        plan_id = request.query_params.get('plan_id')
        period = request.query_params.get('period', 'all')
        
        # 내 프로필
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        # 내 완료 일수
        if period == 'all':
            my_completed_days = profile.total_completed_days
        else:
            completed_filter = {
                'subscription__user': request.user,
                'is_completed': True
            }
            if period == 'week':
                completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=7)
            elif period == 'month':
                completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=30)
            
            if plan_id:
                completed_filter['subscription__plan_id'] = plan_id
            
            my_completed_days = UserBibleProgress.objects.filter(**completed_filter).count()
        
        # 나보다 많이 완료한 사용자 수 계산
        if period == 'all':
            users_ahead = UserProfile.objects.filter(
                total_completed_days__gt=my_completed_days,
                is_public=True
            ).count()
        else:
            # 기간별 계산 (복잡한 쿼리)
            users_ahead = 0
            for other_profile in UserProfile.objects.filter(is_public=True).exclude(user=request.user):
                completed_filter = {
                    'subscription__user': other_profile.user,
                    'is_completed': True
                }
                if period == 'week':
                    completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=7)
                elif period == 'month':
                    completed_filter['completed_at__gte'] = timezone.now() - timedelta(days=30)
                
                if plan_id:
                    completed_filter['subscription__plan_id'] = plan_id
                
                other_completed = UserBibleProgress.objects.filter(**completed_filter).count()
                if other_completed > my_completed_days:
                    users_ahead += 1
        
        my_rank = users_ahead + 1
        
        # 전체 활성 사용자 수
        if plan_id:
            total_users = PlanSubscription.objects.filter(
                plan_id=plan_id,
                is_active=True
            ).values('user').distinct().count()
        else:
            total_users = User.objects.filter(is_active=True).count()
        
        return Response({
            'success': True,
            'ranking': {
                'rank': my_rank,
                'total_users': total_users,
                'completed_days': my_completed_days,
                'current_streak': profile.current_streak,
                'longest_streak': profile.longest_streak,
                'percentile': round((1 - (my_rank / total_users)) * 100, 2) if total_users > 0 else 0
            },
            'period': period,
            'plan_id': plan_id
        })
    except Exception as e:
        logger.error(f"Error getting my ranking: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)