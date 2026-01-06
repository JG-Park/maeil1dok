# Bible 페이지 리뉴얼 QA 테스트 리포트

> **테스트 일시**: 2026-01-06
> **테스트 환경**: maeil1dok.app (Production)
> **테스트 방법**: Playwright MCP (실사용자 관점)
> **평가자**: Claude Code

---

## 요약

| 항목 | 평가 | 비고 |
|------|------|------|
| **프로덕션 레디** | **NO** | 치명적 버그 존재 |
| 핵심 기능 | FAIL | 성경 본문 표시 안됨 |
| UI/UX | PARTIAL | 레이아웃은 양호하나 콘텐츠 없음 |
| 안정성 | FAIL | 콘솔 에러 다수, URL 버그 |

---

## 발견된 이슈 (총 5건)

### CRITICAL (즉시 수정 필요) - 2건

#### BUG-001: 성경 본문 미표시 (CRITICAL)
- **심각도**: CRITICAL
- **발견 위치**: /bible (전체 성경 뷰어)
- **현상**: 성경 본문이 전혀 표시되지 않음
  - **개역개정(GAE)**: 주석(각주)만 표시됨
    - "또는 형체가 없는"
    - "히, 또는 발광체"
    - "시리아어 역본에는 온 땅의 짐승과"
  - **새한글(KNT)**: "내용을 찾을 수 없습니다." 표시
- **예상 동작**: "태초에 하나님이 천지를 창조하시니라..." 등 성경 본문 표시
- **실제 동작**: 본문 없이 주석만 표시되거나 에러 메시지
- **API 상태**: bible-proxy API는 200 OK 반환 → **프론트엔드 파싱 문제로 추정**
- **영향**: 앱의 핵심 기능 완전 불능. 사용자는 성경을 읽을 수 없음
- **참고**: 설정 페이지 미리보기에서는 본문 정상 표시됨

#### BUG-004: 책/장 선택 시 URL 파라미터 손실 (CRITICAL)
- **심각도**: CRITICAL
- **발견 위치**: /bible 책/장 선택 모달
- **현상**: 책 선택 후 장을 클릭하면 URL이 깨짐
  - 결과 URL: `/bible?chapter=undefined&version=GAE`
  - book 파라미터 완전 누락
  - chapter가 undefined로 설정
- **예상 동작**: `/bible?book=jhn&chapter=3&version=GAE`
- **실제 동작**: book 누락, chapter=undefined
- **영향**: 사용자가 성경을 탐색할 수 없음

---

### HIGH (빠른 수정 필요) - 2건

#### BUG-002: 깨진 이미지 아이콘
- **심각도**: HIGH
- **발견 위치**: /bible 본문 영역
- **현상**: 이미지 로드 실패 (btn_listen.png)
- **콘솔 에러**: `404 - /images/sub/bible/btn_listen.png`
- **원인**: 듣기 버튼 이미지 파일 누락

#### BUG-003: 콘솔 에러 다수
- **심각도**: HIGH
- **발견 위치**: 전체 페이지
- **현상**:
  - 401 Unauthorized: `/api/v1/auth/user/` (비로그인 - 예상됨)
  - 400 Bad Request: `/api/v1/auth/token/refresh/` (비로그인 - 예상됨)
  - 404 Not Found: `/images/sub/bible/btn_listen.png` (버그)
  - 404 Not Found: `/api/v1/bible/personal-records/stats/` (API 미구현?)
- **영향**: 일부 기능 동작 불가

---

### MEDIUM (개선 필요) - 1건

#### BUG-005: 개발 플레이스홀더 프로덕션 노출
- **심각도**: MEDIUM
- **발견 위치**: /bible/highlights
- **현상**: "Task 3-3에서 구현 예정" 텍스트가 프로덕션에 노출
- **예상 동작**: 빈 상태 메시지 또는 기능 구현
- **영향**: 사용자 신뢰도 저하, 미완성 제품 인상

---

## 테스트 항목별 결과

### 1. 기본 진입점 (/bible)
| 테스트 | 결과 | 비고 |
|--------|------|------|
| 페이지 로드 | PASS | 페이지는 열림 |
| 창세기 1장 기본 표시 | **FAIL** | 본문 미표시 (BUG-001) |
| 헤더 표시 | PASS | 창세기 1장 표시됨 |
| 네비게이션 (다음/이전) | PASS | URL 정상 변경 |
| 읽음으로 표시 버튼 | ? | 로그인 필요 |

### 2. 성경 뷰어
| 테스트 | 결과 | 비고 |
|--------|------|------|
| 본문 렌더링 | **FAIL** | 치명적 (BUG-001) |
| 절 번호 표시 | **FAIL** | 본문 자체가 없음 |
| 역본 선택 | PASS | 모달 정상, 7개 역본 |
| 역본 변경 | **FAIL** | 개역개정/새한글 모두 실패 |

### 3. 책/장 선택 모달
| 테스트 | 결과 | 비고 |
|--------|------|------|
| 모달 열기 | PASS | |
| 구약/신약 66권 표시 | PASS | |
| 장 선택 | PASS | |
| 책 선택 후 장 이동 | **FAIL** | URL 깨짐 (BUG-004) |
| 검색 입력창 | PASS | UI 표시됨 |

### 4. 설정 페이지 (/bible/settings)
| 테스트 | 결과 | 비고 |
|--------|------|------|
| 페이지 로드 | PASS | |
| 폰트 크기 슬라이더 | PASS | UI 표시됨 |
| 글꼴 선택 (6가지) | PASS | UI 표시됨 |
| 줄 간격 옵션 | PASS | UI 표시됨 |
| 테마 선택 (라이트/다크/자동) | PASS | UI 표시됨 |
| 절 번호/인명지명 토글 | PASS | UI 표시됨 |
| 미리보기 | **PASS** | 창 1:1-2 본문 정상 표시! |
| 기본 진입점 설정 | PASS | 드롭다운 정상 |
| 데이터 관리 버튼들 | PASS | UI 표시됨 |

### 5. 읽기 기록/통계 (/bible/history)
| 테스트 | 결과 | 비고 |
|--------|------|------|
| 페이지 로드 | PASS | |
| 전체 진도 표시 | PASS | 0/1189 |
| 연속 읽기 표시 | PASS | 0일 |
| 완독 표시 | PASS | 0/66권 |
| 전체/구약/신약 탭 | PASS | |
| 66권 책별 진도 | PASS | 모든 책 표시됨 |
| 읽기 캘린더 | ? | 로그인 필요 |

### 6. 북마크 (/bible/bookmarks)
| 테스트 | 결과 | 비고 |
|--------|------|------|
| 비로그인 처리 | PASS | 로그인 유도 메시지 |

### 7. 묵상노트 (/bible/notes)
| 테스트 | 결과 | 비고 |
|--------|------|------|
| 비로그인 처리 | PASS | 로그인 유도 메시지 |
| 책 필터 드롭다운 | PASS | 66권 표시 |

### 8. 하이라이트 (/bible/highlights)
| 테스트 | 결과 | 비고 |
|--------|------|------|
| 페이지 로드 | **FAIL** | 개발 플레이스홀더 노출 (BUG-005) |

### 9. 통독모드
- [ ] 로그인 필요 - 테스트 미진행

---

## 성능 분석

| 항목 | 측정값 | 기준 | 결과 |
|------|--------|------|------|
| 페이지 로드 | ~1초 | < 1.5초 | PASS |
| 장 전환 | ~500ms | < 300ms | SLOW |

---

## 근본 원인 분석 (RCA)

### BUG-001: 성경 본문 미표시

**현상**:
- API (`/bible-proxy/bible/korbibReadpage.php`) 응답: 200 OK
- 프론트엔드 렌더링: 주석만 표시

**코드 분석**:
- `pages/bible/index.vue` → `parseStandardContent()` (line 515-543)
- `document.getElementById('tdBible1')` 로 본문 요소 탐색
- `bibleElement.querySelectorAll('p, div')` 로 본문 추출

**추정 원인**:
1. API 응답 HTML 구조가 변경되어 `#tdBible1` 내부에 본문이 아닌 주석만 포함
2. 본문과 주석(footnote)이 같은 요소 구조에 있어 분리 실패
3. 새한글(KNT): JSON 응답의 `.content` 또는 `p, .verse` 셀렉터 불일치

**조사 필요**:
- 실제 API 응답 HTML 구조 디버깅
- 개역개정 vs 새한글 응답 차이 비교
- 본문/주석 분리 로직 개선

### BUG-004: 책/장 선택 URL 깨짐 ✅ 근본 원인 확인

**현상**:
- 책 선택 후 장 클릭 시 book 파라미터 누락
- URL: `/bible?chapter=undefined&version=GAE`

**근본 원인**: **Vue emit 시그니처 불일치**

**BookSelector.vue** (line 218-221):
```typescript
const selectChapter = (chapter: number) => {
  emit('select', selectedBookId.value, chapter);  // 두 개의 개별 인수
  close();
};
```

**index.vue** (line 571-576):
```typescript
const handleBookSelect = (selection: { book: string; chapter: number }) => {
  currentBook.value = selection.book;      // undefined!
  currentChapter.value = selection.chapter; // undefined!
  // ...
};
```

**문제**:
- BookSelector는 `emit('select', 'gen', 3)` 형태로 두 개의 개별 인수 전달
- handleBookSelect는 `{ book, chapter }` 객체를 기대
- 결과: `selection = 'gen'` (문자열), `selection.book`과 `selection.chapter`는 모두 undefined

**수정 방안**:
```typescript
// 옵션 1: BookSelector.vue에서 객체로 emit
emit('select', { book: selectedBookId.value, chapter });

// 옵션 2: index.vue에서 개별 인수 받기
const handleBookSelect = (book: string, chapter: number) => {
  currentBook.value = book;
  currentChapter.value = chapter;
  // ...
};
```

---

## 권장 조치

### 즉시 필요 (배포 차단)
1. **BUG-001 수정**: 성경 본문 렌더링 복구
2. **BUG-004 수정**: 책/장 선택 URL 파라미터 전달

### 단기 (1-2일)
3. **BUG-002 수정**: btn_listen.png 이미지 추가 또는 제거
4. **BUG-005 수정**: 하이라이트 페이지 플레이스홀더 제거

### 중기
5. API 에러 핸들링 개선
6. 로딩 상태 표시 개선

---

## 결론

**프로덕션 레디: NO**

핵심 기능인 "성경 읽기"가 완전히 불가능한 상태입니다. UI/UX는 전반적으로 우수하나, 콘텐츠가 표시되지 않아 앱으로서의 가치가 없습니다.

**긍정적 측면**:
- 설정 페이지 UI 훌륭
- 읽기 기록 페이지 UI 훌륭
- 역본/책/장 선택 모달 UI 훌륭
- 반응형 레이아웃 양호

**개선 필요**:
- 성경 본문 렌더링 (CRITICAL)
- 네비게이션 URL 처리 (CRITICAL)
- 누락된 리소스 파일

---

## 스크린샷

- `01-bible-main.png`: 메인 화면 (본문 미표시)
- `02-bible-no-content.png`: "내용을 찾을 수 없습니다" 에러

---

## 추가 테스트 항목 (로그인 필요)

- [ ] 북마크 CRUD
- [ ] 묵상노트 CRUD
- [ ] 하이라이트 CRUD
- [ ] 읽음으로 표시 기능
- [ ] 통독모드 전체 플로우
- [ ] 마지막 읽기 위치 저장/복원
