# Bible Index.vue - Behavioral Contract & Sections Map

> 작성일: 2026-01-06
> 대상 파일: `frontend/app/pages/bible/index.vue` (1,683줄)
> 목적: God Component 리팩토링 전 현재 동작 계약 정의

---

## 1. 파일 구조 지도 (Sections Map)

### 1.1 Template 구조 (Lines 1-220)

```
index.vue Template
├── .bible-page (wrapper)
│   ├── BibleHome (viewMode === 'home')          [4-9]
│   │   └── events: @continue-reading, @select-book, @show-toc
│   │
│   ├── BibleTOC (viewMode === 'toc')            [12-16]
│   │   └── events: @select-book, @back
│   │
│   └── Reader View (viewMode === 'reader')      [19-218]
│       ├── Header                                [21-54]
│       │   ├── back-button → goBack()
│       │   ├── book-selector-button → showBookSelector
│       │   └── header-actions
│       │       ├── NoteButton → handleNoteClick()
│       │       ├── BookmarkButton → handleBookmarkToggle()
│       │       ├── settings-button → showSettingsModal
│       │       └── version-button → showVersionSelector
│       │
│       ├── Tongdok Indicator (v-if)             [57-65]
│       │   └── tongdok-close → handleExitTongdok()
│       │
│       ├── BibleViewer                          [68-112]
│       │   ├── props: content, book, chapter, isLoading, initialScrollPosition
│       │   ├── events: @scroll, @bookmark, @highlight, @copy, @share
│       │   └── #bottom slot (읽음 표시 버튼)
│       │
│       ├── Bottom Navigation                    [115-158]
│       │   ├── tongdok-action (v-if isTongdokMode)
│       │   │   └── tongdok-complete-btn → showTongdokCompleteModal
│       │   └── bible-navigation
│       │       ├── prev-button → goToPrevChapter()
│       │       └── next-button → goToNextChapter()
│       │
│       └── Modals                               [160-217]
│           ├── BookSelector (v-model: showBookSelector)
│           ├── VersionSelector (v-model: showVersionSelector)
│           ├── TongdokCompleteModal (v-model: showTongdokCompleteModal)
│           ├── NoteQuickModal (v-model: showNoteModal)
│           ├── HighlightModal (v-model: showHighlightModal)
│           ├── ReadingSettingsModal (:is-open: showSettingsModal)
│           └── Toast
```

### 1.2 Script Setup 구조 (Lines 222-1247)

```
Script Setup
├── Imports                                      [223-247]
│   ├── Vue: ref, computed, watch, onMounted, onBeforeUnmount, nextTick
│   ├── Router: useRoute, useRouter
│   ├── Composables (8개)
│   │   ├── useBibleData
│   │   ├── useBibleFetch
│   │   ├── useTongdokMode
│   │   ├── usePersonalRecord
│   │   ├── useReadingPosition
│   │   ├── useBookmark
│   │   ├── useNote
│   │   └── useHighlight
│   ├── Stores (2개): auth, readingSettings
│   └── Components (12개)
│
├── Page Meta                                    [249-251]
│
├── Composables Initialization                   [253-313]
│   ├── route, router, authStore, readingSettingsStore, toast
│   ├── useBibleData → bookNames, bookChapters, versionNames
│   ├── usePersonalRecord → fetchReadChapters, markAsRead, isChapterRead, getBookProgress, isMarkingRead
│   ├── useBibleFetch → fetchKntContent, fetchStandardContent, getFallbackUrl
│   ├── useTongdokMode → tongdokMode, tongdokScheduleId, tongdokPlanId, isCompleting, initTongdokMode, ...
│   ├── useReadingPosition → lastReadingPosition, loadReadingPosition, saveReadingPosition, cleanup
│   ├── useBookmark → currentBookmarks, isBookmarkLoading, loadBookmarks, isChapterBookmarked, toggleChapterBookmark
│   ├── useNote → currentChapterNotes, isNoteLoading, showNoteModal, editingNote, fetchChapterNotes, saveQuickNote, getChapterNoteCount
│   └── useHighlight → chapterHighlights, isHighlightLoading, customColors, addCustomColor, fetchChapterHighlights, getVerseHighlight, createHighlight, updateHighlight, deleteHighlight
│
├── State Declarations                           [315-336]
│   ├── viewMode: ref<'reader' | 'home' | 'toc'>('reader')
│   ├── currentBook: ref('gen')
│   ├── currentChapter: ref(1)
│   ├── currentVersion: ref('GAE')
│   ├── bibleContent: ref('')
│   ├── chapterTitle: ref('')
│   ├── isLoading: ref(true)
│   ├── Modal States (5개):
│   │   ├── showBookSelector
│   │   ├── showVersionSelector
│   │   ├── showTongdokCompleteModal
│   │   ├── showHighlightModal
│   │   └── showSettingsModal
│   ├── highlightSelection: ref<{start, end} | null>(null)
│   ├── bibleViewerRef: ref<BibleViewer | null>(null)
│   └── scrollPosition: ref(0)
│
├── Computed Properties                          [339-402]
│   ├── Display:
│   │   ├── currentBookName
│   │   ├── currentVersionName
│   │   ├── maxChapters
│   │   └── chapterSuffix
│   ├── Navigation:
│   │   ├── hasPrevChapter
│   │   └── hasNextChapter
│   ├── Tongdok:
│   │   ├── isTongdokMode
│   │   ├── tongdokScheduleRange
│   │   ├── fullTongdokRange
│   │   ├── isAtLastTongdokChapter
│   │   └── tongdokAutoComplete
│   ├── Reading:
│   │   ├── isReadingMode
│   │   ├── isCurrentChapterRead
│   │   └── currentBookProgress
│   ├── Bookmark: isCurrentChapterBookmarked
│   ├── Note:
│   │   ├── currentChapterNoteCount
│   │   └── currentChapterNote
│   └── Highlight: currentSelectionHighlight
│
├── Functions                                    [405-1123]
│   ├── Query/URL:
│   │   ├── initFromQuery()                      [405-438]
│   │   └── generateShareUrl()                   [441-454]
│   ├── Content Loading:
│   │   ├── loadBibleContent(book, chapter)      [457-472]
│   │   ├── loadKntContent(book, chapter)        [475-493]
│   │   └── loadStandardContent(book, chapter)   [496-505]
│   ├── Content Parsing:
│   │   ├── parseKntContent(jsonData, book, chapter)        [508-534]
│   │   ├── preprocessFontTags(html)             [537-571]
│   │   ├── cleanupBibleElement(element)         [574-595]
│   │   ├── cleanVerseText(html)                 [598-618]
│   │   ├── parseStandardContent(html, book, chapter)       [621-735]
│   │   └── showErrorContent(book, chapter)      [738-752]
│   ├── Navigation:
│   │   ├── goBack()                             [755-761]
│   │   ├── handleBookSelect(book, chapter)      [764-768]
│   │   ├── handleVersionSelect(version)         [770-773]
│   │   ├── goToPrevChapter()                    [775-791]
│   │   ├── goToNextChapter()                    [794-823]
│   │   └── scrollToTop()                        [825-830]
│   ├── BibleViewer Events:
│   │   ├── handleScrollPosition(position)       [833-835]
│   │   ├── handleBookmarkAction(verses)         [843-845]
│   │   ├── handleHighlightAction(verses)        [847-855]
│   │   ├── handleHighlightSave(data)            [858-887]
│   │   ├── handleHighlightDelete(id)            [890-901]
│   │   ├── handleAddCustomColor(color)          [904-906]
│   │   ├── handleCopyAction(text)               [908-910]
│   │   ├── handleShareAction(text)              [912-935]
│   │   └── copyToClipboard(text)                [938-945]
│   ├── Reading Mode:
│   │   └── handleMarkAsRead()                   [948-967]
│   ├── Tongdok Mode:
│   │   └── handleExitTongdok()                  [970-973]
│   ├── Bookmark:
│   │   └── handleBookmarkToggle()               [976-1000]
│   ├── Note:
│   │   ├── handleNoteClick()                    [1003-1010]
│   │   ├── handleNoteSave(content)              [1013-1026]
│   │   └── handleNoteGoDetail(noteId, content)  [1029-1036]
│   ├── Tongdok Complete:
│   │   └── handleTongdokComplete(payload)       [1039-1057]
│   └── Entry Point Handlers:
│       ├── handleContinueReading()              [1060-1078]
│       ├── handleHomeBookSelect(bookId, chapter)[1081-1093]
│       ├── handleTocBookSelect(bookId, chapter) [1096-1108]
│       └── handleTocBack()                      [1111-1123]
│
├── Lifecycle Hooks                              [1126-1201]
│   ├── onMounted()                              [1126-1182]
│   │   ├── initTongdokMode()
│   │   ├── Check hasQueryParams → set viewMode
│   │   ├── Check entryPoint setting (home/toc/last-position)
│   │   ├── loadBibleContent if reader mode
│   │   ├── fetch user data (readChapters, notes, highlights, bookmarks)
│   │   └── Add beforeunload event listener
│   ├── onBeforeUnmount()                        [1184-1194]
│   │   ├── cleanupReadingPosition()
│   │   ├── Remove beforeunload listener
│   │   └── saveReadingPosition (if not tongdok)
│   └── handleBeforeUnload()                     [1197-1201]
│
└── Watchers                                     [1204-1246]
    ├── route.query                              [1204-1213]
    │   └── initFromQuery + loadBibleContent
    ├── currentBook                              [1216-1223]
    │   └── fetchReadChapters (if auth && !tongdok)
    ├── [currentBook, currentChapter]            [1226-1235]
    │   └── fetchChapterNotes, fetchChapterHighlights, loadBookmarks
    └── [currentBook, currentChapter, currentVersion] [1238-1246]
        └── saveReadingPosition (if !tongdok)
```

### 1.3 Styles 구조 (Lines 1249-1683)

```
Styles (434 lines)
├── .bible-page (container)
├── Header styles (.bible-header, .back-button, .book-selector-button, etc.)
├── Tongdok indicator styles
├── Bottom area (floating glass-morphism)
├── Content bottom action (mark read button)
├── Navigation styles
├── iOS safe area support
└── Dark mode overrides
```

---

## 2. View Mode 전이 계약

### 2.1 View Mode 상태 다이어그램

```
                   ┌─────────────────────────────────────────┐
                   │                                         │
                   ▼                                         │
            ┌──────────┐                                     │
     ┌─────►│   home   │◄───────┐                           │
     │      └────┬─────┘        │                           │
     │           │              │                           │
     │   @show-toc    @continue-reading                     │
     │   @select-book  @select-book                         │
     │           │              │                           │
     │           ▼              │                           │
     │      ┌──────────┐        │                           │
     │      │   toc    │────────┤                           │
     │      └────┬─────┘        │                           │
     │           │              │                           │
     │     @back │    @select-book                          │
     │           │              │                           │
     │           │              ▼                           │
     │           │        ┌──────────┐                      │
     └───────────┴───────►│  reader  │◄─────────────────────┘
                          └──────────┘
                           ▲       │
                           │       │ (query params, tongdok mode)
                           │       │
                           └───────┘
```

### 2.2 전이 트리거 상세

| From | To | Trigger | Handler |
|------|-----|---------|---------|
| home | toc | @show-toc | `viewMode = 'toc'` |
| home | reader | @continue-reading | `handleContinueReading()` |
| home | reader | @select-book | `handleHomeBookSelect()` |
| toc | home | @back (entryPoint='home') | `handleTocBack()` |
| toc | (previous page) | @back (entryPoint!='home') | `router.back()` |
| toc | reader | @select-book | `handleTocBookSelect()` |
| (initial) | reader | URL has query params | `onMounted` logic |
| (initial) | reader | tongdokMode active | `onMounted` logic |
| (initial) | home | entryPoint='home' | `onMounted` logic |
| (initial) | toc | entryPoint='toc' | `onMounted` logic |
| (initial) | reader | entryPoint='last-position' | `onMounted` logic |

---

## 3. 모달 동작 계약

### 3.1 모달 상태 목록

| Modal | State Variable | Open Trigger | Close Trigger | Mutual Exclusivity |
|-------|---------------|--------------|---------------|-------------------|
| BookSelector | `showBookSelector` | book-selector-button click | v-model close, @select | No |
| VersionSelector | `showVersionSelector` | version-button click | v-model close, @select | No |
| TongdokCompleteModal | `showTongdokCompleteModal` | tongdok-complete-btn click, auto on last chapter | @confirm, v-model close | No |
| NoteQuickModal | `showNoteModal` | NoteButton click | @save, @go-detail, v-model close | No |
| HighlightModal | `showHighlightModal` | @highlight from BibleViewer | @save, @delete, v-model close | No |
| ReadingSettingsModal | `showSettingsModal` | settings-button click | @close | No |

### 3.2 모달 간 배타성

**현재 상태**: 모달 간 상호 배타성 정책이 **없음**. 이론적으로 여러 모달이 동시에 열릴 수 있음.

**실제 동작**: 사용자가 한 번에 하나의 모달만 열기 때문에 실제 충돌은 발생하지 않음.

**향후 고려사항**: 명시적 배타성 정책 도입 가능.

---

## 4. 데이터 로딩 계약

### 4.1 초기 로딩 시퀀스 (onMounted)

```
onMounted()
├── 1. initTongdokMode()
├── 2. Check URL query params
│   ├── hasQueryParams? → viewMode = 'reader'
│   │   ├── initFromQuery()
│   │   └── loadBibleContent()
│   └── !hasQueryParams && !tongdokMode?
│       ├── entryPoint = 'home' → viewMode = 'home' (no content load)
│       ├── entryPoint = 'toc' → viewMode = 'toc' (no content load)
│       └── entryPoint = 'last-position' → viewMode = 'reader'
│           ├── loadReadingPosition()
│           └── loadBibleContent()
└── 3. If auth && viewMode === 'reader'
    ├── fetchReadChapters() (if !tongdok)
    ├── fetchChapterNotes()
    ├── fetchChapterHighlights()
    └── loadBookmarks()
```

### 4.2 책/장 변경 시 데이터 fetch 순서

**Watcher: currentBook**
```
currentBook changed
└── If auth && !tongdokMode
    └── fetchReadChapters(newBook)
```

**Watcher: [currentBook, currentChapter]**
```
[currentBook, currentChapter] changed
└── If auth
    ├── fetchChapterNotes(book, chapter)
    ├── fetchChapterHighlights(book, chapter)
    └── loadBookmarks(book, chapter)
```

**Watcher: [currentBook, currentChapter, currentVersion]**
```
[currentBook, currentChapter, currentVersion] changed
└── If !tongdokMode
    └── saveReadingPosition(book, chapter, version)
```

### 4.3 콘텐츠 로딩 플로우

```
loadBibleContent(book, chapter)
├── isLoading = true
├── version === 'KNT'?
│   ├── loadKntContent()
│   │   ├── fetchKntContent()
│   │   ├── JSON.parse()
│   │   └── parseKntContent()
│   └── (error) → showErrorContent()
└── version !== 'KNT'?
    ├── loadStandardContent()
    │   ├── fetchStandardContent()
    │   └── parseStandardContent()
    │       ├── preprocessFontTags()
    │       ├── DOMParser.parseFromString()
    │       ├── cleanupBibleElement()
    │       ├── TreeWalker for verses
    │       └── cleanVerseText()
    └── (error) → showErrorContent()
└── isLoading = false
```

---

## 5. 선택(Selection) UX 계약

### 5.1 선택 시스템 위치

**중요**: 선택 시스템은 `BibleViewer.vue` 컴포넌트 내부에 구현됨.

### 5.2 클릭 선택 (BibleViewer)

| State | Action | Next State | UI Result |
|-------|--------|------------|-----------|
| None | Click verse | SingleSelected | Verse highlighted, copy menu shows |
| SingleSelected | Click same verse | None | Selection cleared, menu hidden |
| SingleSelected | Click different verse | RangeSelected | Range highlighted, range copy menu |
| RangeSelected | Click any verse | SingleSelected | New single selection |

### 5.3 드래그 선택 (BibleViewer)

| Event | Behavior |
|-------|----------|
| Text selection | Extract verse numbers, show action menu |
| Action menu: Bookmark | emit('bookmark', {start, end, text}) |
| Action menu: Highlight | emit('highlight', {start, end, text}) |
| Action menu: Copy | Copy with reference, emit('copy') |
| Action menu: Share | Web Share API or clipboard fallback |

### 5.4 index.vue ↔ BibleViewer 이벤트 흐름

```
BibleViewer                          index.vue
-----------                          ---------
@highlight(verses) ───────────────►  handleHighlightAction(verses)
                                     ├── highlightSelection = {start, end}
                                     └── showHighlightModal = true

@bookmark(verses) ────────────────►  handleBookmarkAction(verses)
                                     └── (현재 미구현, 장 단위만 지원)

@copy(text) ──────────────────────►  handleCopyAction(text)
                                     └── toast.success('복사 완료')

@share(text) ─────────────────────►  handleShareAction(text)
                                     ├── generateShareUrl()
                                     └── navigator.share() or clipboard
```

---

## 6. 스크롤 관련 계약

### 6.1 스크롤 저장 타이밍

| Event | Condition | Action |
|-------|-----------|--------|
| beforeunload | !tongdokMode | saveReadingPosition(immediate=true) |
| onBeforeUnmount | !tongdokMode | saveReadingPosition(immediate=true) |
| [book, chapter, version] change | !tongdokMode | saveReadingPosition() (debounced) |

### 6.2 스크롤 복원 타이밍

| Event | Action |
|-------|--------|
| onMounted (last-position) | Load from useReadingPosition, pass to BibleViewer |
| handleContinueReading | Load position, set scrollPosition ref |
| BibleViewer mounted | restoreScrollPosition() via initialScrollPosition prop |
| Content change | BibleViewer watches content, calls restoreScrollPosition() |

### 6.3 현재 알려진 이슈

- 스크롤 복원이 항상 정확하지 않을 수 있음 (컨텐츠 높이 계산 타이밍 문제)
- scrollPosition은 비율(0-1)로 저장되며, 컨텐츠 길이 변경 시 부정확할 수 있음

---

## 7. 핵심 시나리오 체크리스트

### 7.1 시나리오 1: 책/장 이동 + 로딩 + 본문 표시

```
[ ] 이전 장 버튼 클릭 시:
    [ ] 현재 장 > 1: currentChapter--
    [ ] 현재 장 === 1: 이전 책의 마지막 장으로
    [ ] loadBibleContent() 호출
    [ ] scrollToTop() 호출
    [ ] isLoading 상태 true → false

[ ] 다음 장 버튼 클릭 시:
    [ ] 통독모드 + 마지막 장: 완료 모달 또는 자동 완료
    [ ] 현재 장 < maxChapters: currentChapter++
    [ ] 현재 장 === maxChapters: 다음 책의 1장으로
    [ ] loadBibleContent() 호출
    [ ] scrollToTop() 호출

[ ] BookSelector에서 선택 시:
    [ ] currentBook, currentChapter 업데이트
    [ ] loadBibleContent() 호출
```

### 7.2 시나리오 2: 하이라이트 생성/수정/삭제

```
[ ] 하이라이트 생성:
    [ ] BibleViewer에서 텍스트 드래그
    [ ] action menu에서 "하이라이트" 클릭
    [ ] handleHighlightAction 호출
    [ ] highlightSelection 설정
    [ ] showHighlightModal = true
    [ ] 색상/메모 입력 후 저장
    [ ] createHighlight API 호출
    [ ] toast.success 표시

[ ] 하이라이트 수정:
    [ ] 기존 하이라이트된 절 선택
    [ ] 동일 범위의 기존 하이라이트 감지
    [ ] updateHighlight API 호출

[ ] 하이라이트 삭제:
    [ ] HighlightModal에서 삭제 클릭
    [ ] deleteHighlight API 호출
    [ ] toast.success 표시
```

### 7.3 시나리오 3: 뷰모드 전환 반복

```
[ ] home → toc:
    [ ] viewMode = 'toc' 즉시 변경
    [ ] UI가 BibleTOC 컴포넌트로 전환
    [ ] 상태(currentBook, currentChapter) 유지

[ ] toc → reader:
    [ ] handleTocBookSelect 호출
    [ ] viewMode = 'reader'
    [ ] loadBibleContent() 호출
    [ ] fetch user data (notes, highlights, bookmarks)

[ ] reader → home (goBack):
    [ ] router.back() 또는 router.push('/')
    [ ] (viewMode는 유지되지만 페이지 이탈)

[ ] 반복 전환 시 상태 꼬임 없음:
    [ ] currentBook/currentChapter 일관성
    [ ] bibleContent 정상 로드
    [ ] 모달 상태 초기화 불필요 (자동 관리)
```

---

## 8. v-html 사용 현황

### 8.1 사용 위치

| Component | Line | Variable | Content Source |
|-----------|------|----------|----------------|
| BibleViewer.vue | 27 | `renderedContent` | `props.content` (from index.vue `bibleContent`) |
| index.vue | 740-751 | `showErrorContent()` | 정적 에러 HTML |

### 8.2 보안 고려사항

- `bibleContent`는 외부 API(대한성서공회)에서 가져온 HTML을 파싱하여 생성
- `preprocessFontTags()`, `cleanupBibleElement()`, `cleanVerseText()` 함수로 정제
- 현재 DOMPurify 등의 sanitizer 미사용
- XSS 위험: 외부 소스이지만, 대한성서공회 API이므로 신뢰 가능한 소스
- 향후 고려: sanitize 적용 또는 AST 기반 렌더링으로 전환

---

## 9. 네트워크 요청 목록

### 9.1 콘텐츠 로딩

| Condition | API Call | Source |
|-----------|----------|--------|
| version === 'KNT' | `fetchKntContent(book, chapter)` | useBibleFetch |
| version !== 'KNT' | `fetchStandardContent(version, book, chapter)` | useBibleFetch |

### 9.2 사용자 데이터 (인증 시)

| Trigger | API Call | Source |
|---------|----------|--------|
| onMounted, currentBook change | `fetchReadChapters(book)` | usePersonalRecord |
| onMounted, [book, chapter] change | `fetchChapterNotes(book, chapter)` | useNote |
| onMounted, [book, chapter] change | `fetchChapterHighlights(book, chapter)` | useHighlight |
| onMounted, [book, chapter] change | `loadBookmarks(book, chapter)` | useBookmark |

### 9.3 사용자 액션

| Action | API Call | Source |
|--------|----------|--------|
| 읽음 표시 | `markAsRead(book, chapter)` | usePersonalRecord |
| 북마크 토글 | `toggleChapterBookmark(book, chapter, bookName)` | useBookmark |
| 노트 저장 | `saveQuickNote(book, chapter, content)` | useNote |
| 하이라이트 생성 | `createHighlight({...})` | useHighlight |
| 하이라이트 수정 | `updateHighlight(id, {...})` | useHighlight |
| 하이라이트 삭제 | `deleteHighlight(id)` | useHighlight |
| 통독 완료 | `completeReading()` | useTongdokMode |
| 위치 저장 | `saveReadingPosition(book, chapter, version)` | useReadingPosition |

---

## 10. 검증 증거 요구사항

리팩토링 완료 후 다음 항목을 증거로 제출해야 함:

- [ ] 네트워크 요청 수/순서 비교 스크린샷 (before/after)
- [ ] 콘솔 에러/워닝 0 확인 스크린샷
- [ ] 시나리오 1-3 각각의 동작 확인 기록
- [ ] View mode 전환 반복 테스트 결과
- [ ] 하이라이트 CRUD 동작 확인
