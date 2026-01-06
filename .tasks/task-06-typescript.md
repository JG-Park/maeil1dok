# Task 06: TypeScript 타입 개선

## Goal
- `any` 타입 제거
- 적절한 인터페이스 정의
- 사용하지 않는 파라미터 정리

## Issues

### 1. plan/index.vue:74-80
```typescript
interface RangeSelectParams {
  action: 'complete' | 'cancel';
  startSchedule: any;  // 사용 안 함
  endSchedule: any;    // 사용 안 함
  scheduleIds: number[];
  planId: number;
}
```

### 2. plans/index.vue
- TypeScript 미사용 (JavaScript)
- 타입 정의 없음

## Changes Required

### 1. RangeSelectParams 수정
- 사용하지 않는 필드 제거 또는 적절한 타입 정의

### 2. plans/index.vue TypeScript 전환
- `<script setup lang="ts">` 추가
- 인터페이스 정의:
  - `Subscription`
  - `Plan`

## Type Definitions
```typescript
interface Subscription {
  id: number;
  plan_id: number;
  plan_name: string;
  start_date: string;
  is_active: boolean;
  is_default: boolean;
}

interface Plan {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  subscriber_count: number;
}
```

## Status
- [ ] plan/index.vue 타입 정리
- [ ] plans/index.vue TypeScript 전환
- [ ] 인터페이스 정의

## Commit Message
```
refactor(types): improve TypeScript types and remove any
```
