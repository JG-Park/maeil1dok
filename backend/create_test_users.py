#!/usr/bin/env python
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User, UserProfile, Follow, UserAchievement
from todos.models import ReadingGroup, GroupMembership, BibleReadingPlan
from django.db import IntegrityError

def create_test_users():
    """테스트 사용자 생성"""
    
    # 테스트 사용자 데이터
    test_users = [
        {'username': 'jgp3620', 'nickname': 'JGP', 'email': 'jgp@test.com', 'password': 'mpjg1136!@'},
        {'username': 'test_user1', 'nickname': '테스트1', 'email': 'test1@test.com', 'password': 'test1234!'},
        {'username': 'test_user2', 'nickname': '테스트2', 'email': 'test2@test.com', 'password': 'test1234!'},
        {'username': 'test_user3', 'nickname': '테스트3', 'email': 'test3@test.com', 'password': 'test1234!'},
    ]
    
    created_users = []
    
    for user_data in test_users:
        try:
            # 사용자 생성 또는 가져오기
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'nickname': user_data['nickname'],
                    'email': user_data['email']
                }
            )
            
            if created:
                user.set_password(user_data['password'])
                user.save()
                print(f"✅ 사용자 생성: {user.username} (ID: {user.id})")
            else:
                print(f"ℹ️  기존 사용자: {user.username} (ID: {user.id})")
            
            # 프로필 생성
            profile, profile_created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'bio': f'{user.nickname}의 프로필입니다.',
                    'total_completed_days': 10 + user.id,
                    'current_streak': 5 + user.id,
                    'longest_streak': 10 + user.id,
                    'is_public': True
                }
            )
            
            if profile_created:
                print(f"  → 프로필 생성 완료")
            
            created_users.append(user)
            
        except IntegrityError as e:
            print(f"❌ 사용자 생성 실패 ({user_data['username']}): {e}")
    
    # 팔로우 관계 생성
    if len(created_users) >= 2:
        try:
            # 첫 번째 사용자가 다른 사용자들을 팔로우
            for followed_user in created_users[1:]:
                Follow.objects.get_or_create(
                    follower=created_users[0],
                    following=followed_user
                )
            
            # 두 번째 사용자가 첫 번째 사용자를 팔로우 (상호 팔로우)
            Follow.objects.get_or_create(
                follower=created_users[1],
                following=created_users[0]
            )
            
            print("\n✅ 팔로우 관계 생성 완료")
        except Exception as e:
            print(f"❌ 팔로우 관계 생성 실패: {e}")
    
    # 업적 생성
    if created_users:
        try:
            # 첫 번째 사용자에게 업적 부여
            achievements = [
                ('first_complete', 1, {}),
                ('streak_7', 7, {}),
                ('total_30', 30, {}),
            ]
            
            for achievement_type, milestone, details in achievements:
                UserAchievement.objects.get_or_create(
                    user=created_users[0],
                    achievement_type=achievement_type,
                    defaults={
                        'milestone_value': milestone,
                        'details': details
                    }
                )
            
            print("✅ 업적 생성 완료")
        except Exception as e:
            print(f"❌ 업적 생성 실패: {e}")
    
    # 그룹 생성
    try:
        # 기본 플랜 가져오기 또는 생성
        plan, _ = BibleReadingPlan.objects.get_or_create(
            name='기본 플랜',
            defaults={
                'description': '45주 성경 읽기 플랜',
                'duration_weeks': 45,
                'is_active': True
            }
        )
        
        # 테스트 그룹 생성
        group, group_created = ReadingGroup.objects.get_or_create(
            name='테스트 그룹',
            creator=created_users[0],
            defaults={
                'description': '테스트를 위한 그룹입니다.',
                'plan': plan,
                'is_public': True,
                'max_members': 50
            }
        )
        
        if group_created:
            # 그룹 멤버 추가
            for user in created_users:
                GroupMembership.objects.get_or_create(
                    group=group,
                    user=user,
                    defaults={
                        'role': 'admin' if user == created_users[0] else 'member'
                    }
                )
            
            print("✅ 테스트 그룹 생성 완료")
        else:
            print("ℹ️  기존 테스트 그룹 사용")
            
    except Exception as e:
        print(f"❌ 그룹 생성 실패: {e}")
    
    print("\n=== 생성된 사용자 목록 ===")
    for user in created_users:
        print(f"ID: {user.id}, Username: {user.username}, Nickname: {user.nickname}")

if __name__ == '__main__':
    create_test_users()