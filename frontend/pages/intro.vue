<template>
  <div class="container">
    <div class="header fade-in" style="animation-delay: 0s">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>개론</h1>
    </div>

    <div v-if="loading" class="loading-state fade-in" style="animation-delay: 0.2s">
      <p>영상 정보를 불러오는 중...</p>
    </div>

    <div v-else-if="error" class="error-state fade-in" style="animation-delay: 0.2s">
      <p>{{ error }}</p>
      <button class="retry-button" @click="fetchVideoIntro">다시 시도</button>
    </div>

    <div v-else-if="videoIntro" class="content-section fade-in" style="animation-delay: 0.2s">
      <div class="video-info">
        <h2>{{ videoIntro.book }} 개론</h2>
        <p class="description">{{ videoIntro.book }}의 전체적인 흐름과 주제를 이해하고 깊이 있게 말씀을 묵상해보세요.</p>
      </div>

      <div class="video-wrapper">
        <div class="video-container">
          <iframe
            width="100%"
            height="100%"
            :src="getEmbedUrl(videoIntro.url_link)"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        
        <a 
          :href="videoIntro.url_link" 
          target="_blank" 
          class="youtube-button"
        >
          <img src="/youtube-icon.svg" alt="YouTube" class="youtube-icon">
          YouTube 앱으로 보기
        </a>
      </div>
    </div>

    <div v-if="videoIntro" class="bottom-controls fade-in" style="animation-delay: 0.3s">
      <button 
        class="complete-button" 
        @click="markAsCompleted"
        :disabled="isCompleting"
        :class="{ 'completed': isCompleted }"
      >
        {{ completionStatus }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const router = useRouter()
const api = useApi()
const auth = useAuthStore()

const videoIntro = ref(null)
const loading = ref(true)
const error = ref(null)
const isCompleted = ref(false)
const isCompleting = ref(false)

// ID 파라미터 확인
const videoIntroId = computed(() => {
  // URL 쿼리 파라미터에서 id 값을 가져옴
  return route.query.id || route.params.id
})

// 완료 상태 텍스트
const completionStatus = computed(() => {
  if (isCompleting.value) return '처리 중...'
  if (isCompleted.value) return '완료 취소'
  return '완료'
})

// YouTube URL을 임베드 URL로 변환
const getEmbedUrl = (url) => {
  if (!url) return ''
  
  // YouTube URL 패턴 확인
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  
  if (match && match[2].length === 11) {
    // 영상 ID 추출 후 임베드 URL 생성
    return `https://www.youtube.com/embed/${match[2]}`
  }
  
  return url // 변환할 수 없는 경우 원래 URL 반환
}

// 영상 개론 정보 가져오기
const fetchVideoIntro = async () => {
  if (!videoIntroId.value) {
    error.value = '영상 정보가 없습니다.'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const response = await api.get(`/api/v1/todos/video/intro/${videoIntroId.value}/`)
    videoIntro.value = response.data
    
    // 현재 사용자의 이 영상에 대한 완료 상태 확인
    if (auth.isAuthenticated) {
      await checkCompletionStatus()
    }
  } catch (err) {
    console.error('영상 개론 정보 조회 오류:', err)
    error.value = '영상 정보를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 사용자의 완료 상태 확인
const checkCompletionStatus = async () => {
  try {
    const userIntrosResponse = await api.get('/api/v1/todos/user/video/intro/')
    const userIntros = userIntrosResponse.data
    
    // 현재 영상에 대한 사용자 진행 상태 찾기
    const currentProgress = userIntros.find(
      intro => intro.video_intro && intro.video_intro.id === parseInt(videoIntroId.value)
    )
    
    if (currentProgress) {
      isCompleted.value = currentProgress.is_completed
    } else {
      isCompleted.value = false
    }
  } catch (err) {
    console.error('사용자 영상 진행 상태 조회 오류:', err)
  }
}

// 영상 시청 완료 표시
const markAsCompleted = async () => {
  if (!auth.isAuthenticated) {
    // 로그인하지 않은 경우 처리
    router.push('/login?next=' + route.fullPath)
    return
  }
  
  isCompleting.value = true
  
  try {
    const newStatus = !isCompleted.value // 현재 상태의 반대 값 (토글)
    
    await api.post('/api/v1/todos/video/intro/progress/', {
      video_intro_id: videoIntroId.value,
      is_completed: newStatus
    })
    
    isCompleted.value = newStatus
  } catch (err) {
    console.error('영상 완료 상태 업데이트 오류:', err)
    alert('완료 상태를 업데이트하는데 실패했습니다.')
  } finally {
    isCompleting.value = false
  }
}

// 페이지 로드 시 영상 정보 가져오기
onMounted(() => {
  fetchVideoIntro()
})
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: calc(1.5rem + 80px);
}

.header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 48px;
}

.back-button {
  background: none;
  border: none;
  padding: 0.375rem;
  margin: -0.375rem;
  margin-right: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
}

.header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.back-button svg {
  width: 20px;
  height: 20px;
}

.content-section, .loading-state, .error-state {
  background: white;
  margin: 1rem;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.video-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 비율 */
  height: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #000;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-info {
  padding-bottom: 1.5rem;
  text-align: left;
}

.video-info h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.description {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: white;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
  max-width: 768px;
  margin: 0 auto;
}

.complete-button {
  width: 100%;
  padding: 1rem;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.complete-button:disabled {
  background: var(--primary-light);
  cursor: not-allowed;
}

.complete-button.completed {
  background: #28a745; /* 완료 상태일 때 초록색으로 변경 */
}

.complete-button:not(:disabled):hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.complete-button.completed:not(:disabled):hover {
  background: #218838; /* 완료 상태에서 호버했을 때 더 어두운 초록색 */
}

.complete-button:not(:disabled):active {
  transform: translateY(0);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.4s ease-out forwards;
}

@media (max-width: 640px) {
  .content-section, .loading-state, .error-state {
    margin: 0.75rem;
    padding: 1.25rem;
  }

  .bottom-controls {
    padding: 0.875rem;
  }

  .complete-button {
    padding: 0.875rem;
    border-radius: 10px;
  }
}

.youtube-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #FF0000;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.youtube-button:hover {
  background-color: #CC0000;
}

.youtube-icon {
  width: 24px;
  height: 24px;
}
</style> 