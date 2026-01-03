# 성경읽기 서비스 개선 계획

> **작성일**: 2026-01-03
> **버전**: 1.0
> **상태**: 계획 승인됨

---

## 1. 개요

### 1.1 목표
- **성경통독** → **통합 성경읽기 플랫폼**으로 서비스 확장
- Plan 필수 구조에서 **Plan 옵션 구조**로 전환
- 자유로운 성경 읽기를 기본으로, 통독 플래닝은 부가 기능으로 제공

### 1.2 주요 변경사항
| 구분 | 기존 | 변경 |
|------|------|------|
| 서비스명 | 성경통독 | 성경읽기 (성경) |
| URL | `/reading`, `/reading-plan` | `/bible`, `/bible/plan` |
| Plan 의존성 | 필수 | 선택 (옵션) |
| 기본 기능 | 플랜 기반 읽기 | 자유 성경 읽기 |

---

## 2. 새로운 기능

### 2.1 마지막 읽은 위치 저장
- 서버에 사용자의 마지막 읽기 위치 저장
- 다른 기기에서도 이어서 읽기 가능
- 저장 정보: 책, 장, 절(선택), 스크롤 위치, 역본

### 2.2 북마크 (즐겨찾기)
- **장 단위** 북마크: "창세기 1장"
- **절 단위** 북마크: "요한복음 3:16-17"
- 제목, 색상, 간단한 메모 지원

### 2.3 묵상노트
- 장/절 단위로 묵상 기록
- 기본 텍스트 에디터
- 비공개 설정 가능

### 2.4 개인 읽기 기록
- Plan 없이도 읽은 장 기록
- 전체 성경 읽기 통계 제공
- 연속 읽기 기록 (streak) 추적

### 2.5 통독모드
- 통독플랜 탭에서 일정 클릭 시 자동 활성화
- 확인 모달 없이 자동으로 읽음 처리
- 일정의 마지막 장을 넘어가면 자동 완료

---

## 3. 기술 명세

### 3.1 Backend 모델 (Django)

#### UserReadingPosition (마지막 읽은 위치)
```python
class UserReadingPosition(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    book = models.CharField(max_length=10)        # 성경책 코드 (gen, exo...)
    chapter = models.IntegerField()               # 장 번호
    verse = models.IntegerField(null=True)        # 절 번호 (선택)
    scroll_position = models.FloatField(default=0) # 스크롤 위치 (0-1)
    version = models.CharField(max_length=10)     # 역본 (GAE, KNT...)
    updated_at = models.DateTimeField(auto_now=True)
```

#### BibleBookmark (북마크)
```python
class BibleBookmark(models.Model):
    BOOKMARK_TYPE = [('chapter', '장'), ('verse', '절')]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    bookmark_type = models.CharField(max_length=10, choices=BOOKMARK_TYPE)
    book = models.CharField(max_length=10)
    chapter = models.IntegerField()
    start_verse = models.IntegerField(null=True)  # 절 북마크시
    end_verse = models.IntegerField(null=True)    # 절 북마크시
    title = models.CharField(max_length=100, blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    memo = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### ReflectionNote (묵상노트)
```python
class ReflectionNote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.CharField(max_length=10)
    chapter = models.IntegerField()
    start_verse = models.IntegerField(null=True)
    end_verse = models.IntegerField(null=True)
    content = models.TextField()
    is_private = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### PersonalReadingRecord (개인 읽기 기록)
```python
class PersonalReadingRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.CharField(max_length=10)
    chapter = models.IntegerField()
    read_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'book', 'chapter']
```

### 3.2 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/v1/bible/reading-position/` | GET, POST | 마지막 읽기 위치 |
| `/api/v1/bible/bookmarks/` | CRUD | 북마크 관리 |
| `/api/v1/bible/bookmarks/by-chapter/` | GET | 장별 북마크 조회 |
| `/api/v1/bible/notes/` | CRUD | 묵상노트 관리 |
| `/api/v1/bible/notes/by-chapter/` | GET | 장별 노트 조회 |
| `/api/v1/bible/personal-records/` | GET, POST | 읽기 기록 |
| `/api/v1/bible/personal-records/stats/` | GET | 읽기 통계 |

### 3.3 Frontend 구조

```
frontend/app/
├── pages/
│   ├── bible/
│   │   ├── index.vue          # 메인 (탭 UI)
│   │   └── plan.vue           # 통독 플랜
│   ├── reading.vue            # 리다이렉트
│   └── reading-plan.vue       # 리다이렉트
│
├── components/bible/
│   ├── BibleReader.vue            # 성경 본문 뷰어
│   ├── BibleTabNavigation.vue     # 탭 네비게이션
│   ├── BookmarkButton.vue         # 북마크 버튼
│   ├── BookmarkList.vue           # 북마크 목록
│   ├── ReflectionNoteEditor.vue   # 묵상노트 에디터
│   ├── ReflectionNoteList.vue     # 묵상노트 목록
│   ├── ReadingRecordStats.vue     # 읽기 통계
│   └── ChapterReadingStatus.vue   # 읽기 상태
│
├── stores/
│   ├── bible.ts               # 성경 읽기 상태
│   ├── bookmark.ts            # 북마크 관리
│   └── reflection.ts          # 묵상노트 관리
│
└── composables/
    ├── useBibleReader.ts      # 읽기 공통 로직
    ├── useBookmark.ts         # 북마크 훅
    ├── useReflection.ts       # 묵상노트 훅
    └── useReadingRecord.ts    # 읽기 기록 훅
```

---

## 4. UI/UX 설계

### 4.1 탭 구조
```
┌──────────────────────────────────────┐
│  [성경읽기]  [통독플랜]              │
├──────────────────────────────────────┤
│                                      │
│  (탭 컨텐츠 영역)                    │
│                                      │
└──────────────────────────────────────┘
```

### 4.2 성경읽기 탭
- 책/장 선택 드롭다운
- 역본 선택
- 성경 본문 표시
- 북마크/묵상노트 버튼
- 읽기 완료 버튼 (통독모드 시)

### 4.3 통독플랜 탭
- 기존 성경통독표 UI 유지
- 월별 일정 표시
- 일정 클릭 → 성경읽기 탭으로 전환 (통독모드 ON)

### 4.4 통독모드 표시
```
┌──────────────────────────────────────┐
│  창세기 1장        [통독모드 ON] ⚡  │
├──────────────────────────────────────┤
│  오늘 일정: 창세기 1-3장             │
│  진행: 1/3장                         │
└──────────────────────────────────────┘
```

---

## 5. 구현 일정

### Phase 1: Backend 준비
- [ ] 모델 4개 추가 (`models.py`)
- [ ] 마이그레이션 실행
- [ ] Serializer 작성
- [ ] API 뷰 구현
- [ ] URL 라우팅 추가

### Phase 2: Frontend 기반
- [ ] `/bible` 폴더 구조 생성
- [ ] Store 3개 추가
- [ ] Composable 4개 추가
- [ ] BibleReader 컴포넌트 추출

### Phase 3: 기능 구현
- [ ] 탭 UI 구현
- [ ] 통독모드 구현
- [ ] 마지막 위치 저장/불러오기
- [ ] 개인 읽기 기록
- [ ] 북마크 기능
- [ ] 묵상노트 기능

### Phase 4: 마이그레이션
- [ ] URL 리다이렉트 미들웨어
- [ ] 기존 페이지 정리
- [ ] 테스트

---

## 6. URL 리다이렉트

```typescript
// middleware/redirect.global.ts
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/reading') {
    return navigateTo({ path: '/bible', query: to.query }, { redirectCode: 301 });
  }
  if (to.path === '/reading-plan') {
    return navigateTo({ path: '/bible/plan', query: to.query }, { redirectCode: 301 });
  }
});
```

---

## 7. 참고 사항

### 7.1 기존 데이터 처리
- 기존 `UserBibleProgress` 데이터 유지
- 플랜 기반 진도 추적은 계속 작동
- `PersonalReadingRecord`와 독립적으로 운영

### 7.2 하위 호환성
- 기존 URL (`/reading`, `/reading-plan`)은 301 리다이렉트
- 기존 API 엔드포인트 유지

### 7.3 핵심 수정 파일
| 파일 | 작업 |
|------|------|
| `backend/todos/models.py` | 모델 4개 추가 |
| `backend/todos/views.py` | API 뷰 추가 |
| `backend/todos/urls.py` | 엔드포인트 추가 |
| `backend/todos/serializers.py` | 시리얼라이저 추가 |
| `frontend/app/pages/reading.vue` | 로직 추출 |
| `frontend/app/pages/bible/index.vue` | 새 메인 페이지 |
| `frontend/app/pages/bible/plan.vue` | 통독플랜 페이지 |
