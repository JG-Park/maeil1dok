# Bible Index.vue - Migration Log

> 리팩토링 시작일: 2026-01-06
> 현재 상태: Phase 1 완료

---

## 요약

| 항목 | Before | After | 변화 |
|------|--------|-------|------|
| index.vue 줄 수 | 1,683 | 1,398 | **-285줄 (17% 감소)** |
| 새 composables | 0 | 3 | useBibleModals, useBibleContent, useBiblePageState |
| 빌드 상태 | Pass | Pass | 유지 |

---

## Phase 1: 핵심 로직 분리 (완료)

### Step A: 동작 계약 문서 작성

- **파일**: `docs/refactor/bible-index-contract.md`
- **내용**:
  - Sections Map (파일 구조 상세 지도)
  - View mode 전이 계약
  - 모달 동작 계약
  - 데이터 로딩 계약
  - 선택(Selection) UX 계약
  - 스크롤 관련 계약
  - 핵심 시나리오 체크리스트

### Step B: 아키텍처 설계 문서 작성

- **파일**: `docs/refactor/bible-index-architecture.md`
- **내용**:
  - 현재 vs 목표 구조 비교
  - 새로운 composables 설계
  - 의존성 방향 규칙
  - 단계별 마이그레이션 계획
  - 위험 요소 및 완화 전략

### Step C-1: 모달 분리

- **새 파일**: `composables/bible/useBibleModals.ts` (196줄)
- **변경 내용**:
  - 5개 개별 모달 state를 composable로 통합
  - highlightSelection 상태 포함
  - open/close 함수 제공
  - closeAllModals 유틸리티 추가
- **index.vue 변경**:
  - import 추가
  - 모달 state 선언을 composable destructuring으로 교체
  - handleHighlightAction에서 openHighlightModal 사용
  - handleTongdokComplete에서 closeTongdokCompleteModal 사용
- **검증**: 빌드 성공

### Step C-3: 콘텐츠 로직 분리

- **새 파일**: `composables/bible/useBibleContent.ts` (392줄)
- **이관된 로직**:
  - `loadBibleContent()` - 메인 로딩 함수
  - `loadKntContent()` - KNT 역본 로딩
  - `loadStandardContent()` - 표준 역본 로딩
  - `parseKntContent()` - KNT 파싱
  - `preprocessFontTags()` - font 태그 전처리
  - `cleanupBibleElement()` - DOM 정리
  - `cleanVerseText()` - 구절 텍스트 정리
  - `parseStandardContent()` - 표준 역본 파싱 (TreeWalker 포함)
  - `showErrorContent()` - 에러 콘텐츠 생성
- **index.vue 변경**:
  - useBibleFetch import 제거
  - 파싱 함수 ~280줄 제거
  - 단순 wrapper 함수로 교체
- **검증**: 빌드 성공
- **줄 수 감소**: 285줄

### Step C-4: 페이지 상태 Composable 준비

- **새 파일**: `composables/bible/useBiblePageState.ts` (304줄)
- **제공 기능**:
  - viewMode 상태 및 전이 함수 (goHome, goToc, goReader, goBack)
  - currentBook, currentChapter, currentVersion 상태
  - computed properties (currentBookName, maxChapters, hasPrevChapter 등)
  - 네비게이션 함수 (goToPrevChapter, goToNextChapter)
  - 쿼리 초기화 (initFromQuery)
  - URL 생성 (generateShareUrl)
- **통합 상태**: **준비됨, 미통합**
- **미통합 이유**:
  - Watchers가 직접 상태에 의존
  - Tongdok mode와의 상호작용 복잡성
  - 안전한 점진적 마이그레이션을 위해 다음 Phase로 연기

---

## 현재 파일 구조

```
frontend/app/
├── pages/bible/
│   └── index.vue (1,398줄, -285줄)
│
└── composables/bible/
    ├── useBibleModals.ts (196줄) - 통합됨
    ├── useBibleContent.ts (392줄) - 통합됨
    └── useBiblePageState.ts (304줄) - 준비됨, 미통합
```

---

## 다음 단계 (Phase 2)

### 우선순위 높음

1. **useBiblePageState 통합**
   - Watchers를 composable 내부로 이동
   - 또는 computed properties만 먼저 사용

2. **BibleReaderView 컴포넌트 생성**
   - Reader 뷰 템플릿 분리
   - Header, Navigation, BibleViewer 조립

### 우선순위 낮음

3. **추가 최적화**
   - 중복 코드 제거
   - TypeScript 타입 강화
   - 테스트 추가

---

## 검증 결과

### 빌드 검증

```
npm run build
✨ Build complete!
```

### 타입 검증

- index.vue: 기존 TypeScript 에러 유지 (변경과 무관)
- 새 composables: 에러 없음

### 기능 검증 체크리스트

| 기능 | 상태 | 비고 |
|------|------|------|
| View mode 전환 | 미테스트 | 코드 변경 없음 |
| 책/장 이동 | 미테스트 | loadBibleContent wrapper로 동일 동작 |
| 모달 열기/닫기 | 미테스트 | Composable로 동일 동작 |
| 하이라이트 | 미테스트 | openHighlightModal 사용 |
| 통독 완료 | 미테스트 | closeTongdokCompleteModal 사용 |

---

## 위험 요소 및 대응

### 식별된 위험

1. **Watcher 타이밍 변경 가능성**
   - 대응: Composable 통합 시 신중하게 테스트

2. **Ref 반응성 손실**
   - 대응: Destructuring 시 Ref 유지 확인

3. **순환 의존성**
   - 대응: 의존성 방향 규칙 준수

### 완화 조치

- 작은 단위로 변경
- 각 단계별 빌드 검증
- 기존 동작 계약 문서와 비교

---

## 의사결정 기록

| 결정 | 이유 | 대안 |
|------|------|------|
| useBibleContent 먼저 분리 | 가장 큰 코드 블록 (280줄) | useBiblePageState 먼저 |
| useBiblePageState 미통합 | Watcher 복잡성, 안전성 | 강제 통합 |
| 파싱 로직 composable 내부 유지 | 단일 책임, 테스트 용이 | useBibleFetch에 통합 |

---

## 작성자 노트

이 리팩토링은 "스트랭글러 패턴"을 따릅니다. 기존 코드를 점진적으로 새 구조로 이관하면서, 각 단계에서 기능이 동일하게 유지되는지 확인합니다.

Phase 1에서는 가장 큰 영향을 미치는 콘텐츠 파싱 로직을 분리하여 285줄(17%)을 감소시켰습니다. 이는 index.vue를 더 읽기 쉽게 만들고, 파싱 로직을 독립적으로 테스트할 수 있게 합니다.

Phase 2에서는 useBiblePageState 통합과 BibleReaderView 컴포넌트 생성을 통해 추가적인 분리를 진행할 예정입니다.
