<template>
  <div class="container">
    <div class="header fade-in" style="animation-delay: 0s">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
      <h1>개론</h1>
      <button v-if="videoIntroId" class="list-button-right" @click="goToIntroList">
        목록
      </button>
    </div>

    <!-- URL에 ID 파라미터가 있는 경우: 특정 영상 개론 표시 -->
    <template v-if="videoIntroId">
      <div v-if="isLoading" class="loading-state fade-in" style="animation-delay: 0.2s">
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
            <iframe width="100%" height="100%" :src="getEmbedUrl(videoIntro.url_link)" frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          </div>

          <a :href="videoIntro.url_link" target="_blank" class="youtube-button">
            <img src="/youtube-icon.svg" alt="YouTube" class="youtube-icon">
            YouTube 앱으로 보기
          </a>
        </div>
      </div>
      <div v-if="videoIntro" class="bottom-controls fade-in" style="animation-delay: 0.3s">
        <button class="complete-button" @click="toggleCompletion" :disabled="isLoading"
          :class="{ 'completed': videoIntro.is_completed }">
          {{ completionStatus }}
        </button>
      </div>
    </template>
    <!-- URL에 ID 파라미터가 없는 경우: IntroListContent (개론 목록) 표시 -->
    <template v-else>
      <IntroListContent />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import IntroListContent from '~/components/IntroListContent.vue'

const route = useRoute()
const router = useRouter()
const api = useApi()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const videoIntro = ref(null)
const isLoading = ref(true) // loading을 isLoading으로 변경
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
    isLoading.value = false
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await api.get(`/api/v1/todos/video/intro/${videoIntroId.value}/`)
    videoIntro.value = response.data

    // 현재 사용자의 이 영상에 대한 완료 상태 확인
    if (authStore.isAuthenticated) {
      await checkCompletionStatus()
    }
  } catch (err) {
    console.error('영상 개론 정보 조회 오류:', err)
    error.value = '영상 정보를 불러오는데 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

// 사용자의 완료 상태 확인
const checkCompletionStatus = async () => {
  if (!authStore.isAuthenticated || !videoIntroId.value) {
    return;
  }
  
  try {
    const userIntrosResponse = await api.get('/api/v1/todos/user/video/intro/')
    let userIntros = userIntrosResponse.data
    
    // API 응답 구조 확인 및 처리
    if (!userIntros) {
      console.warn('사용자 영상 진행 상태 데이터가 없습니다.')
      return
    }
    
    // results 프로퍼티가 있는 경우 (페이지네이션 응답)
    if (userIntros.results && Array.isArray(userIntros.results)) {
      userIntros = userIntros.results
    } else if (!Array.isArray(userIntros)) {
      console.warn('사용자 영상 진행 상태 데이터가 배열이 아닙니다:', userIntros)
      return
    }
    
    // 현재 영상에 대한 사용자 진행 상태 찾기
    const videoIntroIdNum = parseInt(videoIntroId.value)
    const currentProgress = userIntros.find(intro => {
      // 데이터 구조에 따라 ID 위치가 다를 수 있음
      if (intro.video_intro && intro.video_intro.id === videoIntroIdNum) {
        return true
      }
      // 또는 ID가 직접 객체에 있을 수 있음
      return intro.id === videoIntroIdNum
    })

    if (currentProgress) {
      // videoIntro 객체에 완료 상태 직접 설정
      if (videoIntro.value) {
        videoIntro.value.is_completed = currentProgress.is_completed
        isCompleted.value = currentProgress.is_completed // isCompleted 변수도 업데이트
      }
    } else {
      // 진행 상태가 없는 경우 기본값으로 설정
      isCompleted.value = false
    }
  } catch (err) {
    console.error('사용자 영상 진행 상태 조회 오류:', err)
  }
}

// 영상 시청 완료 표시
const toggleCompletion = async () => {
  if (!authStore.isAuthenticated) {
    // 로그인이 필요한 경우 로그인 페이지로 이동
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  
  // 완료 처리 중 상태
  isCompleting.value = true

  try {
    // 낙관적 업데이트 (UI 즉시 반영)
    const newCompletionStatus = !videoIntro.value.is_completed
    videoIntro.value.is_completed = newCompletionStatus
    isCompleted.value = newCompletionStatus // isCompleted 변수도 함께 업데이트

    // API 호출하여 서버에 상태 업데이트
    const response = await api.post('/api/v1/todos/video/intro/progress/', {
      video_intro_id: videoIntroId.value,
      is_completed: newCompletionStatus
    })

    // 응답 데이터에서 완료 상태 가져오기 (서버 상태와 일치시키기)
    if (response.data && response.data.is_completed !== undefined) {
      videoIntro.value.is_completed = response.data.is_completed
      isCompleted.value = response.data.is_completed
    }
    
    // 성공 메시지 표시
    if (videoIntro.value.is_completed) {
      success('완료 처리되었습니다.')
    } else {
      success('미완료 처리되었습니다.')
    }
    isCompleting.value = false // 완료 처리 완료 상태
  } catch (err) {
    console.error('완료 상태 변경 실패:', err)
    // 에러 발생 시 상태 롤백
    videoIntro.value.is_completed = !videoIntro.value.is_completed
    isCompleted.value = !isCompleted.value
    showError('완료 상태를 업데이트하는데 오류가 발생했습니다. 다시 시도해주세요.')
  }
}

const goToIntroList = () => {
  router.push('/intro');
}

// 페이지 로드 시 영상 정보 가져오기
onMounted(() => {
  if (videoIntroId.value) { // URL에 ID가 있을 경우에만 영상 정보를 가져옵니다.
    fetchVideoIntro()
    checkCompletionStatus() // onMounted에서 최초 완료 상태도 확인
  } else {
    // ID가 없는 경우 (목록 페이지)에는 videoIntro를 null로 초기화하거나 다른 처리를 할 수 있습니다.
    videoIntro.value = null
    isLoading.value = false // 목록 페이지에서는 이 컴포넌트의 로딩 상태를 false로 설정
  }
});

// videoIntroId가 변경될 때마다 데이터를 다시 가져오도록 watch 추가
watch(videoIntroId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchVideoIntro();
    checkCompletionStatus(); // ID 변경 시 완료 상태도 다시 확인
  } else if (!newId) {
    // ID가 없어진 경우 (예: 목록으로 돌아가는 경우)
    videoIntro.value = null;
    isLoading.value = false;
  }
});
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: calc(3.5rem + env(safe-area-inset-bottom));
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

.content-section {
  background: white;
  margin: 1rem;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

@media (max-width: 640px) {
  .content-section, .loading-state, .error-state {
    margin: 0.75rem;
    padding: 1.25rem;
  }
}

.video-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%;
  /* 16:9 비율 */
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

.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem;
  background: white;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.15);
  max-width: 768px;
  min-height: 50px;
  margin: 0 auto;
  z-index: 20;
  flex-wrap: nowrap;
  border-radius: 16px 16px 0 0;
}

@supports (-webkit-touch-callout: none) {
  /* Safari 웹에서만 적용되도록 standalone 모드가 아닐 때만 패딩 추가 */
  @media not all and (display-mode: standalone) {
    .bottom-controls {
      padding: 0.5rem 0.15rem calc(0.5rem + env(safe-area-inset-bottom)) 0.15rem;
    }
  }

  /* PWA 홈 화면 앱(standalone 모드)에서는 safe-area-inset-bottom만 적용 */
  @media (display-mode: standalone) {
    .bottom-controls {
      padding: 0.75rem 0.75rem calc(env(safe-area-inset-bottom)) 0.75rem;
    }
  }
}

.complete-button {
  width: 100%;
  padding: 0.875rem;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.complete-button:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.complete-button:active:not(:disabled) {
  transform: translateY(0);
}

.complete-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.complete-button.completed {
  background: var(--red-dark);
}

.complete-button.completed:hover:not(:disabled) {
  background: var(--red-dark);
}

/* 로딩 스피너 스타일 추가 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  background-color: #FF0000;
}

.youtube-icon {
  width: 24px;
  height: 24px;
}

.list-button-right {
  margin-left: auto; /* Pushes the button to the far right */
  padding: 0.25rem 0.75rem;
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 0.875rem; /* Slightly larger for better readability */
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.list-button-right:hover {
  background: #E2E8F0;
  color: #475569;
}
</style>