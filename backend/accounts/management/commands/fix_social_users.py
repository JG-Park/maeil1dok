from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User, SocialAccount
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = '기존 소셜 로그인 사용자들의 email, email_verified 필드를 보정합니다.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 변경 없이 영향받을 사용자만 확인합니다.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('[DRY RUN] 실제 변경은 수행되지 않습니다.'))
        
        self.stdout.write(self.style.SUCCESS('소셜 사용자 데이터 보정을 시작합니다...'))
        
        stats = {
            'total_social_users': 0,
            'email_verified_updated': 0,
            'email_filled_from_social': 0,
            'already_correct': 0,
        }
        
        social_users = User.objects.filter(is_social=True)
        stats['total_social_users'] = social_users.count()
        
        self.stdout.write(f'총 소셜 사용자 수: {stats["total_social_users"]}')
        self.stdout.write('-' * 50)
        
        with transaction.atomic():
            for user in social_users:
                changes = []
                
                if not user.email_verified:
                    changes.append('email_verified: False → True')
                    if not dry_run:
                        user.email_verified = True
                    stats['email_verified_updated'] += 1
                
                if not user.email:
                    social_email = self._get_email_from_social_account(user)
                    if social_email:
                        changes.append(f'email: None → {social_email}')
                        if not dry_run:
                            user.email = social_email
                        stats['email_filled_from_social'] += 1
                
                if changes:
                    self.stdout.write(f'[{user.id}] {user.nickname} ({user.social_provider})')
                    for change in changes:
                        self.stdout.write(f'  - {change}')
                    if not dry_run:
                        user.save(update_fields=['email', 'email_verified'])
                else:
                    stats['already_correct'] += 1
            
            if dry_run:
                transaction.set_rollback(True)
        
        self.stdout.write('-' * 50)
        self.stdout.write(self.style.SUCCESS('보정 완료!'))
        self.stdout.write(f'  - 총 소셜 사용자: {stats["total_social_users"]}')
        self.stdout.write(f'  - email_verified 업데이트: {stats["email_verified_updated"]}')
        self.stdout.write(f'  - email 채움 (SocialAccount에서): {stats["email_filled_from_social"]}')
        self.stdout.write(f'  - 이미 정상: {stats["already_correct"]}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n[DRY RUN] 실제로 적용하려면 --dry-run 옵션을 제거하세요.'))

    def _get_email_from_social_account(self, user):
        social_account = SocialAccount.objects.filter(user=user, email__isnull=False).first()
        if social_account and social_account.email:
            return social_account.email
        return None
