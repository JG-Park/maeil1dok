"""
기존 유저들에게 기본 플랜을 일괄 구독하는 management command

Usage:
    python manage.py subscribe_default_plan_to_all_users

    # 드라이런 모드 (실제 변경 없이 미리보기)
    python manage.py subscribe_default_plan_to_all_users --dry-run
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

from todos.models import BibleReadingPlan, PlanSubscription

User = get_user_model()


class Command(BaseCommand):
    help = '기존 유저들에게 기본 플랜(is_default=True)을 일괄 구독합니다.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 변경 없이 미리보기만 실행',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        # 기본 플랜 조회
        default_plan = BibleReadingPlan.objects.filter(is_default=True).first()
        if not default_plan:
            self.stdout.write(
                self.style.ERROR('기본 플랜(is_default=True)이 설정되어 있지 않습니다.')
            )
            return

        self.stdout.write(f'기본 플랜: {default_plan.name} (ID: {default_plan.id})')
        self.stdout.write('')

        # 전체 유저 조회
        all_users = User.objects.all()
        total_users = all_users.count()

        # 이미 구독 중인 유저 ID 목록
        already_subscribed_user_ids = set(
            PlanSubscription.objects.filter(plan=default_plan)
            .values_list('user_id', flat=True)
        )

        # 구독이 필요한 유저들
        users_to_subscribe = all_users.exclude(id__in=already_subscribed_user_ids)
        to_subscribe_count = users_to_subscribe.count()

        self.stdout.write(f'전체 유저 수: {total_users}명')
        self.stdout.write(f'이미 구독 중인 유저: {len(already_subscribed_user_ids)}명')
        self.stdout.write(f'신규 구독 대상: {to_subscribe_count}명')
        self.stdout.write('')

        if to_subscribe_count == 0:
            self.stdout.write(
                self.style.SUCCESS('모든 유저가 이미 기본 플랜을 구독 중입니다.')
            )
            return

        if dry_run:
            self.stdout.write(self.style.WARNING('[드라이런 모드] 실제 변경 없이 종료합니다.'))
            self.stdout.write('')
            self.stdout.write('구독 대상 유저 목록 (최대 20명):')
            for user in users_to_subscribe[:20]:
                nickname = getattr(user, 'nickname', None) or user.username
                self.stdout.write(f'  - {nickname} (ID: {user.id})')
            if to_subscribe_count > 20:
                self.stdout.write(f'  ... 외 {to_subscribe_count - 20}명')
            return

        # 실제 구독 생성
        created_count = 0
        today = timezone.now().date()

        for user in users_to_subscribe:
            PlanSubscription.objects.create(
                user=user,
                plan=default_plan,
                start_date=today,
                is_active=True
            )
            created_count += 1
            nickname = getattr(user, 'nickname', None) or user.username
            self.stdout.write(f'  구독 생성: {nickname}')

        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                f'{created_count}명의 유저에게 "{default_plan.name}" 플랜 구독이 추가되었습니다.'
            )
        )
