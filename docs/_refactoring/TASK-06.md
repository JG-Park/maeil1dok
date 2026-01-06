# TASK-06: BibleViewer 선택 시스템 통합

> **Priority**: P1 (Major)
> **Status**: `[x]` Completed
> **Tracker**: [TRACKER.md](./TRACKER.md)

---

## Problem

`BibleViewer.vue`에 두 가지 선택 시스템이 공존하며 혼란을 야기합니다.

### 시스템 1: 절 클릭 선택 (reading.vue 방식)

```typescript
const showCopyMenu = ref(false);
const clickSelectedStart = ref<number | null>(null);
const clickSelectedEnd = ref<number | null>(null);
const clickSelectedVerses = ref<Array<{ number: number; text: string }>>([]);
```

- 절을 클릭하면 선택
- 두 번째 클릭으로 범위 선택
- 하단 고정 복사 메뉴 표시

### 시스템 2: 텍스트 드래그 선택 (기존 방식)

```typescript
const showActionMenu = ref(false);
const selectedVerses = ref({ start: 0, end: 0 });
const selectedText = ref('');
const actionMenuPosition = ref({ top: '0px', left: '0px' });
```

- 텍스트 드래그로 선택
- 선택 영역 근처에 플로팅 메뉴 표시
- 북마크, 하이라이트, 복사, 공유 액션

### 문제점

1. **상태 중복**: 선택 상태가 두 벌 관리됨
2. **UX 혼란**: 어떤 상호작용이 어떤 메뉴를 트리거하는지 불명확
3. **충돌 가능성**: 두 메뉴가 동시에 표시될 수 있음
4. **유지보수 어려움**: 선택 로직이 두 곳에 분산

---

## Goal

선택 시스템을 하나로 통합하거나, 명확한 역할 분리

---

## Options

### Option A: 클릭 선택 시스템으로 통합

- 절 클릭 → 선택 → 통합 액션 메뉴 표시
- 드래그 선택 비활성화 또는 클릭 선택으로 변환
- **장점**: 모바일 친화적, 단순한 상호작용
- **단점**: 텍스트 일부만 선택 불가

### Option B: 드래그 선택 시스템으로 통합

- 텍스트 드래그 → 선택 → 플로팅 액션 메뉴
- 절 클릭은 해당 절 전체 선택으로 동작
- **장점**: 정밀한 텍스트 선택 가능
- **단점**: 모바일에서 드래그 불편

### Option C: 역할 명확화 (권장)

- **클릭**: 절 단위 빠른 복사 전용
- **드래그**: 정밀 선택 + 북마크/하이라이트 전용
- 두 시스템 충돌 방지 로직 추가
- **장점**: 각 시스템의 장점 유지
- **단점**: 약간의 복잡성 유지

---

## Tasks

### Option C 선택 시

#### 1. 충돌 방지 로직 추가

- [x] 클릭 메뉴 열릴 때 드래그 선택 해제
- [x] 드래그 선택 시 클릭 선택 해제
- [x] 동시 표시 방지

#### 2. 상태 관리 개선

- [-] 선택 상태를 하나의 객체로 통합 (기존 상태 유지, selectionMode로 조율)
- [x] `selectionMode: 'click' | 'drag' | null`

#### 3. UX 명확화

- [x] 클릭 메뉴: 하단 고정, 복사 기능만
- [x] 드래그 메뉴: 플로팅, 모든 액션

#### 4. 버그 수정

- [x] `handleTextSelection` 이벤트 리스너 누락 수정 (mouseup/touchend)

---

## Proposed Unified State

```typescript
interface SelectionState {
  mode: 'click' | 'drag' | null;
  startVerse: number | null;
  endVerse: number | null;
  text: string;
  verses: Array<{ number: number; text: string }>;
}

const selection = ref<SelectionState>({
  mode: null,
  startVerse: null,
  endVerse: null,
  text: '',
  verses: [],
});

const clearSelection = () => {
  selection.value = {
    mode: null,
    startVerse: null,
    endVerse: null,
    text: '',
    verses: [],
  };
  window.getSelection()?.removeAllRanges();
};
```

---

## Files Affected

| File | Action |
|------|--------|
| `components/bible/BibleViewer.vue` | Modify (major) |

---

## Acceptance Criteria

- [x] 두 선택 시스템 간 충돌 없음
- [x] 각 시스템의 역할 명확
- [x] 상태 관리 단순화 (selectionMode로 조율)
- [x] 기존 기능 모두 정상 동작
- [x] 모바일/데스크톱 모두 정상 동작

---

## Dependencies

- 없음

## Dependent Tasks

- 없음

---

## Completion

- [x] 코드 변경 완료
- [x] 테스트 통과 (빌드 성공)
- [x] 커밋 발행 (ab6a76f)
- [x] TRACKER.md 상태 업데이트
