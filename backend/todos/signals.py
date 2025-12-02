from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import PlanSubscription, UserPlanDisplaySettings
from .constants import PLAN_COLORS


@receiver(post_save, sender=PlanSubscription)
def create_display_settings(sender, instance, created, **kwargs):
    """구독 생성 시 자동으로 표시 설정 생성"""
    if created:
        # 기존 설정 개수로 색상 및 순서 결정
        existing_count = UserPlanDisplaySettings.objects.filter(
            user=instance.user
        ).count()

        UserPlanDisplaySettings.objects.create(
            user=instance.user,
            subscription=instance,
            color=PLAN_COLORS[existing_count % len(PLAN_COLORS)],
            display_order=existing_count
        )
