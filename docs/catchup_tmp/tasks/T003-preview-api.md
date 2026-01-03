# T003: 따라잡기 미리보기 API

> 상태: `pending`
> 의존: T001, T002
> 커밋: -

## 목표

따라잡기 설정을 기반으로 스케줄 분배 결과를 미리보기하는 API를 구현합니다.

## API 스펙

### 엔드포인트

```
POST /api/v1/todos/subscriptions/{subscription_id}/catchup/preview/
```

### 요청

```json
{
  "range_start": "2025-01-01",
  "range_end": "2025-01-14",
  "strategy": "sequential",
  "max_daily_readings": 3,
  "max_daily_chapters": null,
  "weekend_multiplier": 1.5,
  "target_rejoin_date": "2025-01-28"
}
```

### 응답

```json
{
  "valid": true,
  "summary": {
    "total_schedules": 14,
    "total_chapters": 45,
    "daily_average_readings": 2.5,
    "daily_average_chapters": 7.5,
    "estimated_days": 6,
    "rejoin_date": "2025-01-28"
  },
  "preview_schedules": [
    {
      "date": "2025-01-15",
      "is_weekend": false,
      "items": [
        {
          "original_date": "2025-01-01",
          "book": "창세기",
          "start_chapter": 1,
          "end_chapter": 2
        },
        {
          "original_date": "2025-01-02",
          "book": "창세기",
          "start_chapter": 3,
          "end_chapter": 4
        }
      ],
      "total_chapters": 4
    }
  ],
  "warnings": [
    "주말 읽기량이 평일보다 많습니다"
  ]
}
```

## 작업 내용

### 1. 스케줄 분배 알고리즘

`backend/todos/services.py` 생성:

```python
def calculate_catchup_schedule(
    overdue_schedules,
    start_date,
    target_date,
    max_daily_readings=None,
    max_daily_chapters=None,
    weekend_multiplier=1.0
):
    """
    밀린 스케줄을 새 날짜에 분배
    """
    result = []
    remaining = list(overdue_schedules)
    current_date = start_date

    while remaining and current_date <= target_date:
        is_weekend = current_date.weekday() >= 5
        daily_limit = max_daily_readings

        if is_weekend and daily_limit:
            daily_limit = int(daily_limit * weekend_multiplier)

        today_items = []
        today_chapters = 0

        while remaining:
            schedule = remaining[0]
            chapters = schedule.end_chapter - schedule.start_chapter + 1

            if daily_limit and len(today_items) >= daily_limit:
                break
            if max_daily_chapters and today_chapters + chapters > max_daily_chapters:
                break

            today_items.append(schedule)
            today_chapters += chapters
            remaining.pop(0)

        if today_items:
            result.append({
                'date': current_date,
                'is_weekend': is_weekend,
                'items': today_items,
                'total_chapters': today_chapters
            })

        current_date += timedelta(days=1)

    return result, remaining  # remaining이 있으면 목표일까지 못 끝남
```

### 2. Serializer

- `CatchupPreviewRequestSerializer`
- `CatchupPreviewResponseSerializer`

### 3. View

- `CatchupPreviewView`

## 파일 변경

- `backend/todos/services.py` (신규)
- `backend/todos/serializers.py`
- `backend/todos/views.py`
- `backend/todos/urls.py`

## 검증 방법

```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"range_start":"2025-01-01","range_end":"2025-01-14","strategy":"sequential","max_daily_readings":3}' \
  http://localhost:8000/api/v1/todos/subscriptions/1/catchup/preview/
```

## 완료 조건

- [ ] 분배 알고리즘 정상 동작
- [ ] 주말 배수 적용 확인
- [ ] 목표일까지 못 끝나는 경우 경고 표시
- [ ] 요약 정보 정확히 계산
