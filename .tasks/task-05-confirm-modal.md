# Task 05: 모달 컴포넌트 추출

## Goal
- `plans/index.vue`의 인라인 모달을 재사용 가능한 컴포넌트로 추출

## Current Modals in plans/index.vue
1. 일반 정보 모달 (line 118-137)
2. 삭제 확인 모달 (line 139-160)

## Component Design

### ConfirmModal.vue

#### Props
- `show: boolean` - 모달 표시 여부
- `title: string` - 모달 제목
- `confirmText: string` - 확인 버튼 텍스트 (default: '확인')
- `cancelText: string` - 취소 버튼 텍스트 (default: '취소')
- `confirmVariant: 'primary' | 'danger'` - 확인 버튼 스타일
- `showCancel: boolean` - 취소 버튼 표시 여부 (default: true)

#### Slots
- `default` - 모달 내용

#### Events
- `confirm` - 확인 버튼 클릭
- `cancel` - 취소 버튼 클릭 또는 오버레이 클릭

### Usage
```vue
<ConfirmModal
  :show="showDeleteModal"
  title="완전 삭제 확인"
  confirmText="완전 삭제"
  confirmVariant="danger"
  @confirm="deletePlan"
  @cancel="closeModal"
>
  <p>정말 삭제하시겠어요?</p>
</ConfirmModal>
```

## Status
- [ ] ConfirmModal.vue 생성
- [ ] plans/index.vue 모달 교체

## Commit Message
```
refactor(components): extract ConfirmModal component
```
