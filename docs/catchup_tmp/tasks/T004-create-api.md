# T004: 따라잡기 세션 생성 API

> 상태: `pending`
> 의존: T001, T003
> 커밋: -

## 목표

따라잡기 세션을 생성하고 스케줄을 실제로 배정하는 API를 구현합니다.

## API 스펙

### 엔드포인트

```
POST /api/v1/todos/subscriptions/{subscription_id}/catchup/
```

### 요청

```json
{
  "name": "나의 1월 도전!",
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
  "id": 1,
  "name": "나의 1월 도전!",
  "subscription": 1,
  "range_start": "2025-01-01",
  "range_end": "2025-01-14",
  "strategy": "sequential",
  "target_rejoin_date": "2025-01-28",
  "max_daily_readings": 3,
  "max_daily_chapters": null,
  "weekend_multiplier": "1.5",
  "status": "active",
  "progress_percentage": 0,
  "total_schedules": 14,
  "completed_schedules": 0,
  "created_at": "2025-01-15T10:00:00Z"
}
```

## 작업 내용

### 1. Serializer

```python
class CatchupSessionSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    total_schedules = serializers.SerializerMethodField()
    completed_schedules = serializers.SerializerMethodField()

    class Meta:
        model = CatchupSession
        fields = '__all__'
        read_only_fields = ['subscription', 'status', 'completed_at']
```

### 2. View

```python
class CatchupSessionCreateView(APIView):
    def post(self, request, subscription_id):
        subscription = get_object_or_404(
            PlanSubscription,
            id=subscription_id,
            user=request.user
        )

        # 이미 활성 세션이 있는지 확인
        if subscription.catchup_sessions.filter(status='active').exists():
            return Response(
                {'error': '이미 진행 중인 따라잡기가 있습니다'},
                status=400
            )

        # 세션 생성
        serializer = CatchupSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(subscription=subscription)

        # 스케줄 분배 및 생성
        overdue_schedules = get_overdue_schedules_in_range(
            subscription,
            session.range_start,
            session.range_end
        )

        distributed, remaining = calculate_catchup_schedule(
            overdue_schedules,
            start_date=timezone.now().date(),
            target_date=session.target_rejoin_date,
            max_daily_readings=session.max_daily_readings,
            max_daily_chapters=session.max_daily_chapters,
            weekend_multiplier=float(session.weekend_multiplier)
        )

        # CatchupSchedule 생성
        for day_data in distributed:
            for original_schedule in day_data['items']:
                CatchupSchedule.objects.create(
                    session=session,
                    original_schedule=original_schedule,
                    scheduled_date=day_data['date']
                )

        # 이미 완료된 진도가 있으면 복사
        copy_completed_progress(subscription, session)

        return Response(
            CatchupSessionSerializer(session).data,
            status=201
        )
```

### 3. 진도 복사 로직

```python
def copy_completed_progress(subscription, session):
    """
    원본 구독에서 이미 완료한 진도를
    따라잡기 세션의 스케줄에도 완료로 표시
    """
    completed_schedule_ids = UserBibleProgress.objects.filter(
        subscription=subscription,
        is_completed=True
    ).values_list('schedule_id', flat=True)

    CatchupSchedule.objects.filter(
        session=session,
        original_schedule_id__in=completed_schedule_ids
    ).update(is_completed=True, completed_at=timezone.now())
```

## 파일 변경

- `backend/todos/serializers.py`
- `backend/todos/views.py`
- `backend/todos/services.py`
- `backend/todos/urls.py`

## 검증 방법

```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트 따라잡기","range_start":"2025-01-01","range_end":"2025-01-14","strategy":"sequential","max_daily_readings":3}' \
  http://localhost:8000/api/v1/todos/subscriptions/1/catchup/
```

## 완료 조건

- [ ] 세션 생성 성공
- [ ] CatchupSchedule 레코드 정확히 생성
- [ ] 이미 완료된 진도 복사 확인
- [ ] 중복 세션 생성 방지
