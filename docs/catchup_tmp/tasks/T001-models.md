# T001: 백엔드 모델 생성

> 상태: `completed`
> 커밋: (커밋 후 업데이트)

## 목표

`CatchupSession`과 `CatchupSchedule` 모델을 생성합니다.

## 작업 내용

### 1. CatchupSession 모델

```python
class CatchupSession(models.Model):
    """따라잡기 세션"""

    STRATEGY_CHOICES = [
        ('parallel', '동시 진행'),
        ('sequential', '순차 복귀'),
    ]

    STATUS_CHOICES = [
        ('active', '진행 중'),
        ('completed', '완료'),
        ('abandoned', '포기'),
    ]

    subscription = models.ForeignKey(PlanSubscription, on_delete=models.CASCADE, related_name='catchup_sessions')
    name = models.CharField(max_length=100)

    range_start = models.DateField()
    range_end = models.DateField()

    strategy = models.CharField(max_length=20, choices=STRATEGY_CHOICES, default='parallel')
    target_rejoin_date = models.DateField(null=True, blank=True)

    max_daily_readings = models.IntegerField(null=True, blank=True)
    max_daily_chapters = models.IntegerField(null=True, blank=True)
    weekend_multiplier = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2. CatchupSchedule 모델

```python
class CatchupSchedule(models.Model):
    """따라잡기 스케줄"""

    session = models.ForeignKey(CatchupSession, on_delete=models.CASCADE, related_name='schedules')
    original_schedule = models.ForeignKey(DailyBibleSchedule, on_delete=models.CASCADE)
    scheduled_date = models.DateField()

    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## 파일 변경

- `backend/todos/models.py` - 모델 추가
- `backend/todos/admin.py` - Admin 등록

## 검증 방법

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py shell
# >>> from todos.models import CatchupSession, CatchupSchedule
# >>> # 모델 import 성공 확인
```

## 완료 조건

- [x] 마이그레이션 생성 성공
- [x] 마이그레이션 적용 성공
- [x] Admin에서 모델 확인 가능
