# Task 2: Backend API 구현

> **상태**: ✅ 완료
> **의존성**: Task 1 완료 필요
> **예상 파일**: `serializers.py`, `views.py`, `urls.py`

---

## 목표

새 모델들에 대한 API 엔드포인트를 구현한다.

---

## 수정 파일

| 파일 | 작업 |
|------|------|
| `backend/todos/serializers.py` | Serializer 4개 추가 |
| `backend/todos/views.py` | ViewSet/View 추가 |
| `backend/todos/urls.py` | URL 라우팅 추가 |

---

## API 엔드포인트

### 마지막 위치
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/bible/reading-position/` | 마지막 위치 조회 |
| POST | `/api/v1/bible/reading-position/` | 위치 저장/업데이트 |

### 북마크
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/bible/bookmarks/` | 북마크 목록 |
| POST | `/api/v1/bible/bookmarks/` | 북마크 추가 |
| GET | `/api/v1/bible/bookmarks/{id}/` | 북마크 상세 |
| PUT | `/api/v1/bible/bookmarks/{id}/` | 북마크 수정 |
| DELETE | `/api/v1/bible/bookmarks/{id}/` | 북마크 삭제 |
| GET | `/api/v1/bible/bookmarks/by-chapter/` | 장별 북마크 |

### 묵상노트
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/bible/notes/` | 노트 목록 |
| POST | `/api/v1/bible/notes/` | 노트 추가 |
| GET | `/api/v1/bible/notes/{id}/` | 노트 상세 |
| PUT | `/api/v1/bible/notes/{id}/` | 노트 수정 |
| DELETE | `/api/v1/bible/notes/{id}/` | 노트 삭제 |
| GET | `/api/v1/bible/notes/by-chapter/` | 장별 노트 |

### 개인 읽기 기록
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/bible/personal-records/` | 기록 목록 |
| POST | `/api/v1/bible/personal-records/` | 기록 추가 |
| GET | `/api/v1/bible/personal-records/stats/` | 읽기 통계 |
| GET | `/api/v1/bible/personal-records/by-book/` | 책별 기록 |

---

## 구현 상세

### Serializers

```python
# backend/todos/serializers.py

class UserReadingPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserReadingPosition
        fields = ['book', 'chapter', 'verse', 'scroll_position', 'version', 'updated_at']
        read_only_fields = ['updated_at']


class BibleBookmarkSerializer(serializers.ModelSerializer):
    book_name = serializers.SerializerMethodField()

    class Meta:
        model = BibleBookmark
        fields = [
            'id', 'bookmark_type', 'book', 'book_name', 'chapter',
            'start_verse', 'end_verse', 'title', 'color', 'memo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_book_name(self, obj):
        # BIBLE_BOOKS 매핑 사용
        return BIBLE_BOOKS.get(obj.book, obj.book)


class ReflectionNoteSerializer(serializers.ModelSerializer):
    book_name = serializers.SerializerMethodField()

    class Meta:
        model = ReflectionNote
        fields = [
            'id', 'book', 'book_name', 'chapter',
            'start_verse', 'end_verse', 'content', 'is_private',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_book_name(self, obj):
        return BIBLE_BOOKS.get(obj.book, obj.book)


class PersonalReadingRecordSerializer(serializers.ModelSerializer):
    book_name = serializers.SerializerMethodField()

    class Meta:
        model = PersonalReadingRecord
        fields = ['id', 'book', 'book_name', 'chapter', 'read_date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_book_name(self, obj):
        return BIBLE_BOOKS.get(obj.book, obj.book)
```

### Views

```python
# backend/todos/views.py (추가)

class ReadingPositionView(APIView):
    """마지막 읽기 위치 API"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        position = UserReadingPosition.objects.filter(user=request.user).first()
        if position:
            serializer = UserReadingPositionSerializer(position)
            return Response({'success': True, 'position': serializer.data})
        return Response({'success': True, 'position': None})

    def post(self, request):
        position, created = UserReadingPosition.objects.get_or_create(user=request.user)
        serializer = UserReadingPositionSerializer(position, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': '위치가 저장되었습니다'})
        return Response({'success': False, 'errors': serializer.errors}, status=400)


class BibleBookmarkViewSet(viewsets.ModelViewSet):
    """북마크 CRUD API"""
    serializer_class = BibleBookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BibleBookmark.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='by-chapter')
    def by_chapter(self, request):
        book = request.query_params.get('book')
        chapter = request.query_params.get('chapter')
        if not book or not chapter:
            return Response({'error': 'book and chapter required'}, status=400)

        bookmarks = self.get_queryset().filter(book=book, chapter=chapter)
        serializer = self.get_serializer(bookmarks, many=True)
        return Response({'success': True, 'bookmarks': serializer.data})


class ReflectionNoteViewSet(viewsets.ModelViewSet):
    """묵상노트 CRUD API"""
    serializer_class = ReflectionNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReflectionNote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='by-chapter')
    def by_chapter(self, request):
        book = request.query_params.get('book')
        chapter = request.query_params.get('chapter')
        if not book or not chapter:
            return Response({'error': 'book and chapter required'}, status=400)

        notes = self.get_queryset().filter(book=book, chapter=chapter)
        serializer = self.get_serializer(notes, many=True)
        return Response({'success': True, 'notes': serializer.data})


class PersonalReadingRecordViewSet(viewsets.ModelViewSet):
    """개인 읽기 기록 API"""
    serializer_class = PersonalReadingRecordSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']  # 삭제/수정 불가

    def get_queryset(self):
        return PersonalReadingRecord.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        records = self.get_queryset()
        # 통계 계산 로직
        stats = {
            'total_chapters_read': records.count(),
            'books_read': records.values('book').distinct().count(),
            # 추가 통계...
        }
        return Response({'success': True, 'stats': stats})

    @action(detail=False, methods=['get'], url_path='by-book')
    def by_book(self, request):
        book = request.query_params.get('book')
        if not book:
            return Response({'error': 'book required'}, status=400)

        records = self.get_queryset().filter(book=book)
        serializer = self.get_serializer(records, many=True)
        return Response({'success': True, 'records': serializer.data})
```

### URLs

```python
# backend/todos/urls.py (추가)

from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'bible/bookmarks', BibleBookmarkViewSet, basename='bible-bookmark')
router.register(r'bible/notes', ReflectionNoteViewSet, basename='bible-note')
router.register(r'bible/personal-records', PersonalReadingRecordViewSet, basename='personal-record')

urlpatterns = [
    # ... 기존 패턴들 ...
    path('bible/reading-position/', ReadingPositionView.as_view(), name='reading-position'),
] + router.urls
```

---

## 테스트 체크리스트

- [ ] GET `/api/v1/bible/reading-position/` 동작 확인
- [ ] POST `/api/v1/bible/reading-position/` 동작 확인
- [ ] 북마크 CRUD 동작 확인
- [ ] 묵상노트 CRUD 동작 확인
- [ ] 개인 읽기 기록 동작 확인
- [ ] 인증 없는 요청 시 401 반환 확인

---

## 완료 조건

1. 모든 API 엔드포인트가 정상 동작
2. 인증된 사용자만 접근 가능
3. 에러 처리 적절함

---

## 완료 기록

- **완료일**: -
- **커밋**: -
- **비고**: -
