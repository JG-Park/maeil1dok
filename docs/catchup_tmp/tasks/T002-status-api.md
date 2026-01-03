# T002: 밀린 현황 조회 API

> 상태: `pending`
> 의존: T001
> 커밋: -

## 목표

사용자의 특정 구독에서 밀린 현황을 조회하는 API를 구현합니다.

## API 스펙

### 엔드포인트

```
GET /api/v1/todos/subscriptions/{subscription_id}/catchup-status/
```

### 응답

```json
{
  "has_overdue": true,
  "overdue_count": 14,
  "overdue_chapters": 45,
  "overdue_range": {
    "start": "2025-01-01",
    "end": "2025-01-14"
  },
  "overdue_schedules": [
    {
      "id": 1,
      "date": "2025-01-01",
      "book": "창세기",
      "start_chapter": 1,
      "end_chapter": 2
    }
  ],
  "active_catchup_session": null,
  "suggested_settings": {
    "max_daily_readings": 3,
    "estimated_days": 7,
    "estimated_rejoin_date": "2025-01-21"
  }
}
```

## 작업 내용

### 1. Serializer 생성

`backend/todos/serializers.py`에 추가:
- `CatchupStatusSerializer`

### 2. View 생성

`backend/todos/views.py`에 추가:
- `CatchupStatusView` - 밀린 현황 조회

### 3. URL 등록

`backend/todos/urls.py`에 추가

## 비즈니스 로직

```python
def get_overdue_schedules(subscription):
    """
    구독의 시작일부터 오늘까지 중 미완료된 스케줄 조회
    """
    today = timezone.now().date()

    # 해당 구독의 플랜 스케줄 중 미완료된 것
    completed_schedule_ids = UserBibleProgress.objects.filter(
        subscription=subscription,
        is_completed=True
    ).values_list('schedule_id', flat=True)

    return DailyBibleSchedule.objects.filter(
        plan=subscription.plan,
        date__gte=subscription.start_date,
        date__lt=today
    ).exclude(id__in=completed_schedule_ids)
```

## 파일 변경

- `backend/todos/serializers.py`
- `backend/todos/views.py`
- `backend/todos/urls.py`

## 검증 방법

```bash
# API 호출 테스트
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/todos/subscriptions/1/catchup-status/
```

## 완료 조건

- [ ] API 엔드포인트 접근 가능
- [ ] 밀린 스케줄 정확히 계산
- [ ] 활성 따라잡기 세션 정보 포함
- [ ] 추천 설정값 제공
