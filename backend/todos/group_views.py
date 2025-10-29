from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone
from accounts.models import User
from accounts.serializers import UserSearchSerializer
from .models import ReadingGroup, GroupMembership, GroupInvitation, BibleReadingPlan
from .serializers import BibleReadingPlanSerializer
import logging

logger = logging.getLogger(__name__)


class ReadingGroupSerializer:
    """그룹 시리얼라이저 (간단 구현)"""
    @staticmethod
    def to_dict(group, request=None):
        data = {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'creator': {
                'id': group.creator.id,
                'nickname': group.creator.nickname,
                'profile_image': group.creator.profile_image
            },
            'plan': BibleReadingPlanSerializer(group.plan).data,
            'is_public': group.is_public,
            'max_members': group.max_members,
            'member_count': group.member_count,
            'is_full': group.is_full,
            'created_at': group.created_at,
            'updated_at': group.updated_at
        }
        
        # 로그인한 사용자의 멤버십 상태
        if request and request.user.is_authenticated:
            membership = GroupMembership.objects.filter(
                group=group,
                user=request.user,
                is_active=True
            ).first()
            data['is_member'] = membership is not None
            data['my_role'] = membership.get_role_display() if membership else None
        else:
            data['is_member'] = False
            data['my_role'] = None
        
        return data


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    """그룹 생성"""
    try:
        name = request.data.get('name')
        description = request.data.get('description', '')
        plan_id = request.data.get('plan_id')
        is_public = request.data.get('is_public', False)
        max_members = request.data.get('max_members', 50)
        
        # 필수 필드 검증
        if not name or not plan_id:
            return Response({
                'success': False,
                'error': '그룹 이름과 플랜 ID는 필수입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 플랜 확인
        plan = get_object_or_404(BibleReadingPlan, id=plan_id)
        
        # 그룹 생성
        group = ReadingGroup.objects.create(
            name=name,
            description=description,
            creator=request.user,
            plan=plan,
            is_public=is_public,
            max_members=max_members
        )
        
        # 생성자를 관리자로 추가
        GroupMembership.objects.create(
            group=group,
            user=request.user,
            role='admin',
            is_active=True
        )
        
        return Response({
            'success': True,
            'group': ReadingGroupSerializer.to_dict(group, request)
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error creating group: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_groups(request):
    """그룹 목록 조회"""
    try:
        # 쿼리 파라미터
        search = request.query_params.get('search', '')
        plan_id = request.query_params.get('plan_id')
        only_public = request.query_params.get('only_public', 'false').lower() == 'true'
        only_mine = request.query_params.get('only_mine', 'false').lower() == 'true'
        
        # 기본 쿼리셋
        groups = ReadingGroup.objects.all()
        
        # 검색
        if search:
            groups = groups.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # 플랜 필터
        if plan_id:
            groups = groups.filter(plan_id=plan_id)
        
        # 공개 그룹만
        if only_public or not request.user.is_authenticated:
            groups = groups.filter(is_public=True)
        
        # 내 그룹만
        if only_mine and request.user.is_authenticated:
            groups = groups.filter(
                memberships__user=request.user,
                memberships__is_active=True
            ).distinct()
        
        # 정렬
        groups = groups.order_by('-created_at')[:50]
        
        # 시리얼라이즈
        groups_data = [ReadingGroupSerializer.to_dict(group, request) for group in groups]
        
        return Response({
            'success': True,
            'groups': groups_data,
            'total': len(groups_data)
        })
    except Exception as e:
        logger.error(f"Error getting groups: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_group_detail(request, group_id):
    """그룹 상세 조회"""
    try:
        group = get_object_or_404(ReadingGroup, id=group_id)
        
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
        
        return Response({
            'success': True,
            'group': ReadingGroupSerializer.to_dict(group, request)
        })
    except Exception as e:
        logger.error(f"Error getting group detail: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_group(request, group_id):
    """그룹 가입"""
    try:
        group = get_object_or_404(ReadingGroup, id=group_id)
        
        # 이미 멤버인지 확인
        existing_membership = GroupMembership.objects.filter(
            group=group,
            user=request.user
        ).first()
        
        if existing_membership:
            if existing_membership.is_active:
                return Response({
                    'success': False,
                    'error': '이미 그룹 멤버입니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # 비활성 멤버십 재활성화
                existing_membership.is_active = True
                existing_membership.save()
                return Response({
                    'success': True,
                    'message': '그룹에 다시 가입했습니다.'
                })
        
        # 그룹이 가득 찼는지 확인
        if group.is_full:
            return Response({
                'success': False,
                'error': '그룹이 가득 찼습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 비공개 그룹은 초대가 필요
        if not group.is_public:
            invitation = GroupInvitation.objects.filter(
                group=group,
                invitee=request.user,
                status='pending'
            ).first()
            
            if not invitation:
                return Response({
                    'success': False,
                    'error': '비공개 그룹은 초대가 필요합니다.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 초대 수락 처리
            invitation.status = 'accepted'
            invitation.responded_at = timezone.now()
            invitation.save()
        
        # 멤버십 생성
        membership = GroupMembership.objects.create(
            group=group,
            user=request.user,
            role='member',
            is_active=True
        )
        
        return Response({
            'success': True,
            'message': '그룹에 가입했습니다.',
            'group': ReadingGroupSerializer.to_dict(group, request)
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error joining group: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_group(request, group_id):
    """그룹 탈퇴"""
    try:
        group = get_object_or_404(ReadingGroup, id=group_id)
        
        membership = GroupMembership.objects.filter(
            group=group,
            user=request.user,
            is_active=True
        ).first()
        
        if not membership:
            return Response({
                'success': False,
                'error': '그룹 멤버가 아닙니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 그룹 생성자는 탈퇴 불가
        if group.creator == request.user:
            return Response({
                'success': False,
                'error': '그룹 생성자는 탈퇴할 수 없습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 멤버십 비활성화
        membership.is_active = False
        membership.save()
        
        return Response({
            'success': True,
            'message': '그룹을 탈퇴했습니다.'
        })
    except Exception as e:
        logger.error(f"Error leaving group: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_group_members(request, group_id):
    """그룹 멤버 목록 조회"""
    try:
        group = get_object_or_404(ReadingGroup, id=group_id)
        
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
        
        # 멤버 목록 조회
        memberships = GroupMembership.objects.filter(
            group=group,
            is_active=True
        ).select_related('user').order_by('-joined_at')
        
        members = []
        for membership in memberships:
            members.append({
                'user': UserSearchSerializer(membership.user, context={'request': request}).data,
                'role': membership.get_role_display(),
                'joined_at': membership.joined_at
            })
        
        return Response({
            'success': True,
            'members': members,
            'total': len(members)
        })
    except Exception as e:
        logger.error(f"Error getting group members: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_to_group(request, group_id):
    """그룹 초대"""
    try:
        group = get_object_or_404(ReadingGroup, id=group_id)
        invitee_id = request.data.get('user_id')
        message = request.data.get('message', '')
        
        if not invitee_id:
            return Response({
                'success': False,
                'error': '초대할 사용자 ID가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 권한 확인 (관리자만 초대 가능)
        membership = GroupMembership.objects.filter(
            group=group,
            user=request.user,
            is_active=True
        ).first()
        
        if not membership or membership.role != 'admin':
            return Response({
                'success': False,
                'error': '관리자만 초대할 수 있습니다.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        invitee = get_object_or_404(User, id=invitee_id)
        
        # 이미 멤버인지 확인
        if GroupMembership.objects.filter(group=group, user=invitee, is_active=True).exists():
            return Response({
                'success': False,
                'error': '이미 그룹 멤버입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 이미 초대했는지 확인
        existing_invitation = GroupInvitation.objects.filter(
            group=group,
            invitee=invitee,
            status='pending'
        ).first()
        
        if existing_invitation:
            return Response({
                'success': False,
                'error': '이미 초대를 보냈습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 초대 생성
        invitation = GroupInvitation.objects.create(
            group=group,
            inviter=request.user,
            invitee=invitee,
            message=message,
            status='pending'
        )
        
        return Response({
            'success': True,
            'message': '초대를 보냈습니다.'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error inviting to group: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_invitations(request):
    """내 초대 목록 조회"""
    try:
        invitations = GroupInvitation.objects.filter(
            invitee=request.user,
            status='pending'
        ).select_related('group', 'inviter').order_by('-created_at')
        
        invitations_data = []
        for invitation in invitations:
            invitations_data.append({
                'id': invitation.id,
                'group': ReadingGroupSerializer.to_dict(invitation.group, request),
                'inviter': UserSearchSerializer(invitation.inviter, context={'request': request}).data,
                'message': invitation.message,
                'created_at': invitation.created_at
            })
        
        return Response({
            'success': True,
            'invitations': invitations_data
        })
    except Exception as e:
        logger.error(f"Error getting invitations: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_invitation(request, invitation_id):
    """초대 응답"""
    try:
        invitation = get_object_or_404(
            GroupInvitation,
            id=invitation_id,
            invitee=request.user,
            status='pending'
        )
        
        action = request.data.get('action')  # accept or decline
        
        if action not in ['accept', 'decline']:
            return Response({
                'success': False,
                'error': '유효한 액션이 아닙니다. (accept/decline)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.responded_at = timezone.now()
        
        if action == 'accept':
            # 그룹이 가득 찼는지 확인
            if invitation.group.is_full:
                return Response({
                    'success': False,
                    'error': '그룹이 가득 찼습니다.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 멤버십 생성
            GroupMembership.objects.create(
                group=invitation.group,
                user=request.user,
                role='member',
                is_active=True
            )
            
            invitation.status = 'accepted'
            invitation.save()
            
            return Response({
                'success': True,
                'message': '초대를 수락했습니다.',
                'group': ReadingGroupSerializer.to_dict(invitation.group, request)
            })
        else:
            invitation.status = 'declined'
            invitation.save()
            
            return Response({
                'success': True,
                'message': '초대를 거절했습니다.'
            })
    except Exception as e:
        logger.error(f"Error responding to invitation: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)