# Task 1: Backend 모델 추가

> **상태**: ✅ 완료
> **예상 파일**: `backend/todos/models.py`
> **의존성**: 없음

---

## 목표

성경읽기 서비스에 필요한 4개의 새 모델을 추가한다.

---

## 수정 파일

| 파일 | 작업 |
|------|------|
| `backend/todos/models.py` | 모델 4개 추가 |

---

## 구현 상세

### 1. UserReadingPosition (마지막 읽은 위치)

```python
class UserReadingPosition(models.Model):
    """사용자의 마지막 읽은 위치"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reading_position'
    )
    book = models.CharField(max_length=10, help_text="성경책 코드 (gen, exo...)")
    chapter = models.IntegerField(help_text="장 번호")
    verse = models.IntegerField(null=True, blank=True, help_text="절 번호 (선택)")
    scroll_position = models.FloatField(default=0, help_text="스크롤 위치 (0-1)")
    version = models.CharField(max_length=10, default='GAE', help_text="역본")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "읽기 위치"
        verbose_name_plural = "읽기 위치"

    def __str__(self):
        return f"{self.user.nickname} - {self.book} {self.chapter}"
```

### 2. BibleBookmark (북마크)

```python
class BibleBookmark(models.Model):
    """성경 북마크"""
    BOOKMARK_TYPE_CHOICES = [
        ('chapter', '장'),
        ('verse', '절'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bible_bookmarks'
    )
    bookmark_type = models.CharField(max_length=10, choices=BOOKMARK_TYPE_CHOICES)
    book = models.CharField(max_length=10, help_text="성경책 코드")
    chapter = models.IntegerField()
    start_verse = models.IntegerField(null=True, blank=True, help_text="시작 절")
    end_verse = models.IntegerField(null=True, blank=True, help_text="끝 절")
    title = models.CharField(max_length=100, blank=True, help_text="북마크 제목")
    color = models.CharField(max_length=7, default='#3B82F6', help_text="표시 색상")
    memo = models.TextField(blank=True, help_text="간단한 메모")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'book', 'chapter']),
            models.Index(fields=['user', 'bookmark_type']),
        ]
        verbose_name = "북마크"
        verbose_name_plural = "북마크"

    def __str__(self):
        if self.bookmark_type == 'verse':
            return f"{self.book} {self.chapter}:{self.start_verse}"
        return f"{self.book} {self.chapter}"
```

### 3. ReflectionNote (묵상노트)

```python
class ReflectionNote(models.Model):
    """성경 묵상노트"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reflection_notes'
    )
    book = models.CharField(max_length=10, help_text="성경책 코드")
    chapter = models.IntegerField()
    start_verse = models.IntegerField(null=True, blank=True)
    end_verse = models.IntegerField(null=True, blank=True)
    content = models.TextField(help_text="묵상 내용")
    is_private = models.BooleanField(default=True, help_text="비공개 여부")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'book', 'chapter']),
            models.Index(fields=['user', '-created_at']),
        ]
        verbose_name = "묵상노트"
        verbose_name_plural = "묵상노트"

    def __str__(self):
        return f"{self.user.nickname} - {self.book} {self.chapter}"
```

### 4. PersonalReadingRecord (개인 읽기 기록)

```python
class PersonalReadingRecord(models.Model):
    """개인 성경 읽기 기록 (Plan 무관)"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='personal_reading_records'
    )
    book = models.CharField(max_length=10, help_text="성경책 코드")
    chapter = models.IntegerField()
    read_date = models.DateField(help_text="읽은 날짜")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'book', 'chapter']
        indexes = [
            models.Index(fields=['user', 'book']),
            models.Index(fields=['user', 'read_date']),
        ]
        verbose_name = "개인 읽기 기록"
        verbose_name_plural = "개인 읽기 기록"

    def __str__(self):
        return f"{self.user.nickname} - {self.book} {self.chapter}"
```

---

## 마이그레이션 명령

```bash
cd backend
python manage.py makemigrations todos
python manage.py migrate
```

---

## 테스트 체크리스트

- [ ] 마이그레이션 파일 생성 확인
- [ ] 마이그레이션 적용 성공
- [ ] Django Admin에서 모델 확인 가능
- [ ] 각 모델의 CRUD 동작 확인 (Django shell)

---

## 완료 조건

1. 4개 모델이 `models.py`에 추가됨
2. 마이그레이션이 정상 적용됨
3. 데이터베이스에 테이블이 생성됨

---

## 완료 기록

- **완료일**: -
- **커밋**: -
- **비고**: -
