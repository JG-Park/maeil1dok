"""
Signal handlers for accounts app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import User, UserProfile
from .services.achievement_service import AchievementService


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    사용자 생성 시 자동으로 UserProfile 생성
    """
    if created:
        UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                'total_completed_days': 0,
                'current_streak': 0,
                'longest_streak': 0,
                'is_public': True
            }
        )


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    사용자 저장 시 프로필도 함께 저장 (있는 경우)
    """
    if hasattr(instance, 'profile'):
        instance.profile.save()


# UserBibleProgress Signal은 todos 앱에서 정의
# 순환 참조를 피하기 위해 todos/signals.py에서 AchievementService 호출
