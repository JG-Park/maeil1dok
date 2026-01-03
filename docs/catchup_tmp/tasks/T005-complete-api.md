# T005: 스케줄 완료 처리 API

> 상태: `pending`
> 의존: T001, T004
> 커밋: -

## 목표

따라잡기 스케줄 개별 완료, 세션 완료/수정 API를 구현합니다.

## API 스펙

### 1. 스케줄 완료 토글

```
POST /api/v1/todos/catchup-schedules/{schedule_id}/toggle/
```

**응답:**
```json
{
  "id": 1,
  "is_completed": true,
  "completed_at": "2025-01-15T10:00:00Z",
  "session_progress": {
    "percentage": 50,
    "completed": 7,
    "total": 14
  }
}
```

### 2. 세션 스케줄 목록 조회

```
GET /api/v1/todos/catchup-sessions/{session_id}/schedules/
```

**쿼리 파라미터:**
- `date`: 특정 날짜의 스케줄만 조회

**응답:**
```json
{
  "session": {
    "id": 1,
    "name": "나의 1월 도전!",
    "status": "active",
    "progress_percentage": 50
  },
  "schedules": [
    {
      "date": "2025-01-15",
      "is_weekend": false,
      "items": [
        {
          "id": 1,
          "original_date": "2025-01-01",
          "book": "창세기",
          "start_chapter": 1,
          "end_chapter": 2,
          "is_completed": true,
          "audio_link": "...",
          "guide_link": "..."
        }
      ]
    }
  ]
}
```

### 3. 세션 완료

```
POST /api/v1/todos/catchup-sessions/{session_id}/complete/
```

**응답:**
```json
{
  "success": true,
  "message": "축하합니다! '나의 1월 도전!'을 완료했습니다!",
  "celebration": {
    "title": "대단해요!",
    "subtitle": "14일치 읽기를 6일 만에 완료했어요!",
    "stats": {
      "total_completed": 14,
      "days_taken": 6,
      "started_at": "2025-01-15",
      "completed_at": "2025-01-20"
    }
  }
}
```

### 4. 세션 수정

```
PATCH /api/v1/todos/catchup-sessions/{session_id}/
```

**요청:**
```json
{
  "name": "수정된 이름",
  "max_daily_readings": 4,
  "target_rejoin_date": "2025-01-30",
  "recalculate": true
}
```

`recalculate: true`인 경우 미완료 스케줄 재분배.

### 5. 세션 포기

```
POST /api/v1/todos/catchup-sessions/{session_id}/abandon/
```

## 작업 내용

### 1. ViewSet 구현

```python
class CatchupScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = CatchupScheduleSerializer

    def get_queryset(self):
        return CatchupSchedule.objects.filter(
            session__subscription__user=self.request.user
        )

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        schedule = self.get_object()
        if schedule.is_completed:
            schedule.mark_as_incomplete()
        else:
            schedule.mark_as_completed()
        return Response(CatchupScheduleSerializer(schedule).data)


class CatchupSessionViewSet(viewsets.ModelViewSet):
    serializer_class = CatchupSessionSerializer

    def get_queryset(self):
        return CatchupSession.objects.filter(
            subscription__user=self.request.user
        )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        session = self.get_object()

        # 모든 스케줄이 완료되었는지 확인 (경고만, 강제는 아님)
        remaining = session.schedules.filter(is_completed=False).count()

        session.status = 'completed'
        session.completed_at = timezone.now()
        session.save()

        return Response({
            'success': True,
            'message': f"축하합니다! '{session.name}'을 완료했습니다!",
            'celebration': get_celebration_data(session),
            'warning': f'{remaining}개 미완료 스케줄이 있습니다' if remaining else None
        })

    @action(detail=True, methods=['post'])
    def abandon(self, request, pk=None):
        session = self.get_object()
        session.status = 'abandoned'
        session.save()
        return Response({'success': True})
```

### 2. 축하 데이터 생성

```python
def get_celebration_data(session):
    total = session.schedules.count()
    completed = session.schedules.filter(is_completed=True).count()
    days_taken = (session.completed_at.date() - session.created_at.date()).days + 1

    return {
        'title': '대단해요!',
        'subtitle': f'{total}일치 읽기를 {days_taken}일 만에 완료했어요!',
        'stats': {
            'total_completed': completed,
            'days_taken': days_taken,
            'started_at': session.created_at.date().isoformat(),
            'completed_at': session.completed_at.date().isoformat()
        }
    }
```

## 파일 변경

- `backend/todos/serializers.py`
- `backend/todos/views.py`
- `backend/todos/services.py`
- `backend/todos/urls.py`

## 검증 방법

```bash
# 스케줄 토글
curl -X POST -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/todos/catchup-schedules/1/toggle/

# 세션 완료
curl -X POST -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/todos/catchup-sessions/1/complete/
```

## 완료 조건

- [ ] 스케줄 토글 정상 동작
- [ ] 세션 스케줄 목록 조회 (날짜별 그룹핑)
- [ ] 세션 완료 시 축하 데이터 반환
- [ ] 세션 수정 및 재계산
- [ ] 세션 포기 처리
