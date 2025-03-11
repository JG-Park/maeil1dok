<template>
  <div class="container">
    <div class="header fade-in" style="animation-delay: 0s">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
      <h1>하세나하시조</h1>
    </div>

    <!-- 비디오 섹션 -->
    <div class="content-section video-section fade-in" style="animation-delay: 0.1s">
      <div class="video-wrapper">
        <div class="video-container">
          <iframe width="100%" height="100%" :src="videoUrl" title="YouTube video player" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>

        <a v-if="isMobile" :href="youtubeAppUrl" target="_blank" class="youtube-button">
          <img src="/youtube-icon.svg" alt="YouTube" class="youtube-icon">
          YouTube 앱으로 보기
        </a>
      </div>
    </div>

    <!-- 본문 섹션 -->
    <div class="content-section bible-section fade-in" style="animation-delay: 0.2s">
      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>하세나 본문을 불러오는 중...</p>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="error-state">
        <div class="error-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <h3>본문을 불러올 수 없습니다</h3>
          <p>{{ error }}</p>
        </div>
      </div>

      <!-- 본문 내용 -->
      <div v-else class="bible-content">
        <div class="bible-header">
          <h2>{{ bibleTitle }}</h2>
          <div class="date-info">{{ formattedDate }}</div>
        </div>

        <div class="verse-container" v-html="parsedContent"></div>
      </div>
    </div>

    <div class="bottom-controls fade-in" style="animation-delay: 0.3s">
      <button class="complete-button" :class="{ 'completed': isButtonCompleted }" :disabled="hasenaStore.isLoading"
        @click="handleComplete">
        <span v-if="hasenaStore.isLoading" class="loading-spinner small"></span>
        <span v-else>{{ buttonText }}</span>
      </button>
    </div>

    <!-- Toast 컴포넌트 -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import { useHasenaStore } from '~/stores/hasena'
import { useRouter } from 'vue-router'
import Toast from '~/components/Toast.vue'

const api = useApi()
const auth = useAuthStore()
const hasenaStore = useHasenaStore()
const router = useRouter()
const toast = ref(null)

// 비디오 관련 상수
const videoUrl = ref('https://www.youtube.com/embed/videoseries?list=PLMT1AJszhYtXkV936HNuExxjAmtFhp2tL')
const latestVideoId = ref('vs4Bcv4sJRY') // 최신 영상 ID 저장
const youtubeAppUrl = computed(() => {
  // 최신 영상 ID를 사용하여 YouTube 앱 URL 생성
  return `vnd.youtube://${latestVideoId.value}`
})
const videoTitle = "하세나하시조"
const videoDescription = "오늘의 하시조, 함께하시조!"
const isMobile = ref(false)

// 상태 변수들
const isLoading = ref(true)
const error = ref(null)
const bibleTitle = ref('')
const parsedContent = ref('')
const isCompleted = ref(false)
const isUpdating = ref(false)
const todayRecord = ref(null)

// 날짜 관련
const today = new Date()
const formattedDate = ref(new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(today))

// API 날짜 포맷
const formatApiDate = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 하세나 본문 파싱
const parseHasenaContent = (html) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // 성경 제목 추출
  const titleElement = doc.querySelector('.bible_tit')
  if (titleElement) {
    bibleTitle.value = titleElement.textContent
  }

  // 본문 내용 추출 및 변환
  const verses = []
  const contentElements = doc.querySelectorAll('.bible_contents p')

  contentElements.forEach(verse => {
    const number = verse.querySelector('.bullet_number')?.textContent.trim()
    const text = verse.querySelector('.bullet_txt')?.textContent.trim()

    if (number && text) {
      verses.push(`
        <div class="verse">
          <span class="verse-number">${number}</span>
          <span class="verse-text">${text}</span>
        </div>
      `)
    }
  })

  return verses.join('')
}

// 하세나 본문 가져오기
const fetchHasenaContent = async () => {
  try {
    isLoading.value = true
    error.value = null

    const targetDate = formatApiDate(today)
    const response = await fetch(`/hasena-proxy/write.php?bo_table=hasena_record&targetDate=${targetDate}&forceView=true`)

    if (!response.ok) {
      throw new Error('본문을 불러오는데 실패했습니다')
    }

    const html = await response.text()
    parsedContent.value = parseHasenaContent(html)

    // 로그인한 경우에만 완료 상태 조회
    if (auth.isAuthenticated) {
      await fetchHasenaStatus()
    }
  } catch (err) {
    console.error('하세나 본문 조회 실패:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// 하세나 완료 상태 조회
const fetchHasenaStatus = async () => {
  // 로그인하지 않은 경우 조회하지 않음
  if (!auth.isAuthenticated) return
  
  try {
    await hasenaStore.fetchStatus()
  } catch (error) {
    // Toast 컴포넌트 메서드 호출
    if (toast.value) {
      toast.value.show('완료 상태를 불러오는데 실패했습니다', 'error')
    }
  }
}

// 반응형 상태 관리를 위한 computed 속성
const isButtonCompleted = computed(() => hasenaStore.isCompleted)
const buttonText = computed(() => isButtonCompleted.value ? '하세나 취소' : '오늘의 하세나 완료')

// handleComplete 함수 강화
const handleComplete = async () => {
  // 로그인하지 않은 경우 로그인 페이지로 이동
  if (!auth.isAuthenticated) {
    router.push(`/login?next=${router.currentRoute.value.fullPath}`)
    return
  }

  if (hasenaStore.isLoading) return

  try {
    await hasenaStore.updateStatus(today)
    await nextTick()
    
    // 토스트 메시지 표시
    if (hasenaStore.isCompleted) {
      toast.value?.show('오늘의 하세나를 완료로 기록했어요.', 'success')
    } else {
      toast.value?.show('오늘의 하세나를 미완료로 기록했어요.', 'success')
    }
  } catch (error) {
    toast.value?.show('완료 처리에 실패했습니다', 'error')
  }
}

onMounted(() => {
  // 모바일 기기 확인
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // 하세나 본문 가져오기
  fetchHasenaContent()
})
</script>

<style>
.bible-section {
  margin-bottom: 2.5rem !important;
}

.verse {
  display: flex;
  align-items: flex-start;
  font-weight: normal;
  letter-spacing: -0.04em;
}

.verse-number {
  color: var(--primary-color);
  font-weight: 500;
  margin-right: 0.3rem;
  min-width: 0.8em;
  flex-shrink: 0;
  text-align: right;
  font-size: 0.75em;
  font-family: 'Pretendard', sans-serif;
  position: relative;
}

.verse-text {
  flex: 1;
}

/* 모바일 대응 스타일도 전역으로 이동 */
@media (max-width: 640px) {
  .verse {
    margin-bottom: 1.75rem;
  }

  .verse-number {
    font-size: 0.8125rem;
    padding-top: 0.3rem;
  }
}
</style>

<style scoped>
@font-face {
  font-family: 'RIDIBatang';
  src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}

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
  padding: 0.85rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}


.bible-content {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 0vw;
  /* iOS에서 폰트 크기 자동 조정 방지 */
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
}

.bible-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.bible-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0.35rem 0 0 0;
}

.date-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.verse-container {
  font-family: 'RIDIBatang', serif;
  margin-bottom: 0.5rem;
  font-weight: normal;
  letter-spacing: -0.04em;
}

/* iOS Safari에서 폰트 렌더링 최적화 */
@supports (-webkit-touch-callout: none) {
  .verse-container {
    letter-spacing: -0.015em;
  }
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

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--primary-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

/* 비디오 섹션 스타일 */
.video-section {
  margin-bottom: 1rem;
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

.video-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
</style>