from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
import pytz
import datetime

class Command(BaseCommand):
    help = '기존 데이터의 시간을 UTC에서 KST로 변환합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제로 데이터를 변경하지 않고 변경될 데이터만 확인합니다',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN 모드: 실제 데이터는 변경되지 않습니다'))
        
        # 백업 권장 메시지
        self.stdout.write(self.style.WARNING('주의: 이 작업을 실행하기 전에 데이터베이스 백업을 수행하는 것을 강력히 권장합니다!'))
        
        if not dry_run:
            confirm = input('계속 진행하시겠습니까? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('작업이 취소되었습니다.'))
                return
        
        # models.py 파일에 맞게 테이블과 datetime 필드 목록 수정
        tables_fields = [
            # BibleReadingPlan 모델
            ('todos_biblereadingplan', ['created_at', 'updated_at']),
            
            # PlanSubscription 모델
            ('todos_plansubscription', ['created_at', 'updated_at']),
            
            # DailyBibleSchedule 모델 (datetime 필드 없음)
            
            # UserBibleProgress 모델
            ('todos_userbibleprogress', ['completed_at', 'created_at', 'updated_at']),
            
            # VideoBibleIntro 모델
            ('todos_videobibleintro', ['created_at', 'updated_at']),
            
            # UserVideoIntroProgress 모델
            ('todos_uservideointroprogress', ['completed_at', 'created_at', 'updated_at']),
            
            # HasenaRecord 모델
            ('todos_hasenarecord', ['created_at', 'updated_at']),
            
            # VisitorCount 모델
            ('todos_visitorcount', ['created_at', 'updated_at']),
            
            # User 모델
            ('accounts_user', ['date_joined', 'last_login']),
        ]
        
        with connection.cursor() as cursor:
            # 현재 데이터베이스 시간대 확인
            cursor.execute("SELECT @@session.time_zone")
            current_timezone = cursor.fetchone()[0]
            self.stdout.write(self.style.SUCCESS(f'현재 데이터베이스 시간대: {current_timezone}'))
            
            # 각 테이블의 datetime 필드 업데이트
            for table, fields in tables_fields:
                # 테이블 존재 여부 확인
                cursor.execute(f"SHOW TABLES LIKE '{table}'")
                if not cursor.fetchone():
                    self.stdout.write(self.style.WARNING(f'테이블 {table}이(가) 존재하지 않습니다. 건너뜁니다.'))
                    continue
                
                for field in fields:
                    # 필드 존재 여부 확인
                    cursor.execute(f"SHOW COLUMNS FROM {table} LIKE '{field}'")
                    if not cursor.fetchone():
                        self.stdout.write(self.style.WARNING(f'필드 {table}.{field}이(가) 존재하지 않습니다. 건너뜁니다.'))
                        continue
                    
                    # 변환 전 데이터 샘플 확인
                    cursor.execute(f"SELECT {field} FROM {table} WHERE {field} IS NOT NULL LIMIT 5")
                    samples_before = cursor.fetchall()
                    
                    if samples_before:
                        self.stdout.write(f'{table}.{field} 변환 전 샘플:')
                        for sample in samples_before:
                            self.stdout.write(f'  - {sample[0]}')
                    
                    # 실제 업데이트 수행
                    if not dry_run:
                        cursor.execute(f"""
                            UPDATE {table} 
                            SET {field} = DATE_ADD({field}, INTERVAL 9 HOUR)
                            WHERE {field} IS NOT NULL
                        """)
                        rows_affected = cursor.rowcount
                        self.stdout.write(
                            self.style.SUCCESS(f'{table}.{field} 필드 {rows_affected}개 업데이트 완료')
                        )
                        
                        # 변환 후 데이터 샘플 확인
                        cursor.execute(f"SELECT {field} FROM {table} WHERE {field} IS NOT NULL LIMIT 5")
                        samples_after = cursor.fetchall()
                        
                        if samples_after:
                            self.stdout.write(f'{table}.{field} 변환 후 샘플:')
                            for sample in samples_after:
                                self.stdout.write(f'  - {sample[0]}')
                    else:
                        # Dry run 모드에서는 영향을 받을 행 수만 계산
                        cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE {field} IS NOT NULL")
                        count = cursor.fetchone()[0]
                        self.stdout.write(
                            self.style.SUCCESS(f'{table}.{field} 필드: {count}개 행이 업데이트될 예정입니다')
                        )
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN 모드였습니다. 실제 데이터는 변경되지 않았습니다.'))
            self.stdout.write(self.style.SUCCESS('실제 변경을 적용하려면 --dry-run 옵션 없이 명령을 실행하세요.'))
        else:
            self.stdout.write(self.style.SUCCESS('모든 데이터의 시간대 변환이 완료되었습니다!')) 