# T009: 완료 축하 화면

> 상태: `pending`
> 의존: T008
> 커밋: -

## 목표

따라잡기 완료 시 사용자를 축하하고 성취감을 주는 화면을 구현합니다.

## UI 설계

### 축하 모달

```
┌─────────────────────────────────────────┐
│                                         │
│              🎉🎊🎉                     │
│                                         │
│           축하합니다!                    │
│                                         │
│      "나의 1월 도전!" 완료!              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                  │   │
│  │  📚  14일치 읽기 완료!            │   │
│  │                                  │   │
│  │  ⏱️  6일 만에 달성!               │   │
│  │                                  │   │
│  │  📖  총 45장을 읽었어요!          │   │
│  │                                  │   │
│  │  🏆  대단해요!                    │   │
│  │                                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│      이제 원본 플랜으로 돌아갑니다.        │
│      "2025 성경통독"                     │
│                                         │
│           ┌─────────────┐              │
│           │     확인     │              │
│           └─────────────┘              │
│                                         │
└─────────────────────────────────────────┘
```

### 애니메이션 효과

- 모달 등장 시 scale 애니메이션
- 이모지 confetti 효과
- 숫자 카운트업 애니메이션

## 작업 내용

### 1. 축하 모달 컴포넌트

`frontend/app/components/catchup/CatchupCelebration.vue`:

```vue
<script setup lang="ts">
import { useConfetti } from '~/composables/useConfetti'

interface CelebrationData {
  title: string
  subtitle: string
  stats: {
    total_completed: number
    days_taken: number
    started_at: string
    completed_at: string
  }
}

interface Props {
  sessionName: string
  originalPlanName: string
  celebration: CelebrationData
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const { fireConfetti } = useConfetti()

// 모달 등장 시 confetti 효과
onMounted(() => {
  fireConfetti()
})

// 숫자 카운트업 애니메이션
const animatedTotal = ref(0)
const animatedDays = ref(0)

onMounted(() => {
  // 0에서 실제 값까지 카운트업
  const duration = 1000
  const steps = 30
  const interval = duration / steps

  let step = 0
  const timer = setInterval(() => {
    step++
    const progress = step / steps
    animatedTotal.value = Math.floor(props.celebration.stats.total_completed * progress)
    animatedDays.value = Math.floor(props.celebration.stats.days_taken * progress)

    if (step >= steps) {
      clearInterval(timer)
      animatedTotal.value = props.celebration.stats.total_completed
      animatedDays.value = props.celebration.stats.days_taken
    }
  }, interval)
})
</script>

<template>
  <div class="celebration-overlay" @click.self="emit('close')">
    <div class="celebration-modal">
      <div class="emoji-row">🎉🎊🎉</div>

      <h1 class="title">축하합니다!</h1>

      <h2 class="session-name">"{{ sessionName }}" 완료!</h2>

      <div class="stats-card">
        <div class="stat">
          <span class="icon">📚</span>
          <span class="value">{{ animatedTotal }}일치</span>
          <span class="label">읽기 완료!</span>
        </div>

        <div class="stat">
          <span class="icon">⏱️</span>
          <span class="value">{{ animatedDays }}일</span>
          <span class="label">만에 달성!</span>
        </div>

        <div class="stat">
          <span class="icon">🏆</span>
          <span class="value">{{ celebration.title }}</span>
        </div>
      </div>

      <div class="return-info">
        <p>이제 원본 플랜으로 돌아갑니다.</p>
        <p class="plan-name">"{{ originalPlanName }}"</p>
      </div>

      <button @click="emit('close')" class="btn-primary">
        확인
      </button>
    </div>
  </div>
</template>

<style scoped>
.celebration-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.celebration-modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: pop-in 0.3s ease-out;
}

@keyframes pop-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.emoji-row {
  font-size: 48px;
  margin-bottom: 16px;
  animation: bounce 0.5s ease infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.session-name {
  font-size: 20px;
  color: #666;
  margin-bottom: 24px;
}

.stats-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.stat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat:last-child {
  margin-bottom: 0;
}

.stat .icon {
  font-size: 24px;
}

.stat .value {
  font-size: 20px;
  font-weight: bold;
}

.return-info {
  color: #666;
  margin-bottom: 24px;
}

.plan-name {
  font-weight: bold;
  color: #333;
}
</style>
```

### 2. Confetti Composable

`frontend/app/composables/useConfetti.ts`:

```typescript
export const useConfetti = () => {
  const fireConfetti = () => {
    // canvas-confetti 라이브러리 사용 또는 CSS 애니메이션
    // 간단한 CSS 버전:
    const container = document.createElement('div')
    container.className = 'confetti-container'
    document.body.appendChild(container)

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'confetti'
      confetti.style.left = `${Math.random() * 100}%`
      confetti.style.animationDelay = `${Math.random() * 0.5}s`
      confetti.style.backgroundColor = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'][Math.floor(Math.random() * 4)]
      container.appendChild(confetti)
    }

    setTimeout(() => {
      container.remove()
    }, 3000)
  }

  return { fireConfetti }
}
```

### 3. 완료 처리 연동

`frontend/app/components/catchup/CatchupProgressCard.vue` 수정:

```typescript
const handleComplete = async () => {
  const result = await catchupApi.complete(props.session.id)

  if (result.success) {
    showCelebration.value = true
    celebrationData.value = result.celebration
  }
}
```

## 파일 변경

- `frontend/app/components/catchup/CatchupCelebration.vue` (신규)
- `frontend/app/composables/useConfetti.ts` (신규)
- `frontend/app/components/catchup/CatchupProgressCard.vue` (수정)
- `frontend/app/assets/css/confetti.css` (신규)

## 검증 방법

1. 따라잡기 진행 중인 상태에서 "따라잡기완료" 버튼 클릭
2. 축하 모달 표시 확인
3. Confetti 효과 확인
4. 숫자 카운트업 애니메이션 확인
5. 확인 버튼 클릭 시 모달 닫힘 및 원본 플랜 화면 복귀

## 완료 조건

- [ ] 축하 모달 표시
- [ ] 이모지 및 축하 메시지
- [ ] 통계 정보 표시 (완료 일수, 소요 기간)
- [ ] Confetti 효과
- [ ] 숫자 카운트업 애니메이션
- [ ] 원본 플랜 이름 표시
- [ ] 확인 버튼으로 닫기
- [ ] 세션 상태 'completed'로 변경 확인
