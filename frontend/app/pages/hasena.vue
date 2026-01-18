<template>
  <div class="sanctuary-theme">
    <div class="bg-pattern"></div>
    
    <div class="container">
      <!-- Header -->
      <PageHeader title="하세나하시조" fallback-path="/" />

      <main class="main-content">
        <!-- 비디오 섹션 -->
        <div class="card video-card fade-in" style="animation-delay: 0.1s">
          <div class="video-wrapper">
            <div class="video-container">
              <iframe 
                width="100%" 
                height="100%" 
                :src="videoUrl" 
                title="YouTube video player" 
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>

            <a v-if="isMobile" :href="youtubeAppUrl" target="_blank" class="youtube-deep-link">
              <span class="youtube-icon">▶</span>
              YouTube 앱으로 시청하기
            </a>
          </div>
        </div>

        <!-- 본문 섹션 -->
        <div class="card content-card fade-in" style="animation-delay: 0.2s">
          <!-- 로딩 상태 -->
          <div v-if="isLoading" class="state-container loading">
            <div class="loading-spinner"></div>
            <p>오늘의 말씀을 불러오고 있습니다...</p>
          </div>

          <!-- 에러 상태 -->
          <div v-else-if="error" class="state-container error">
            <div class="error-icon">!</div>
            <h3>말씀을 불러올 수 없습니다</h3>
            <p>{{ error }}</p>
          </div>

          <!-- 본문 내용 -->
          <div v-else class="bible-content-wrapper">
            <div class="bible-header">
              <span class="date-badge">{{ formattedDate }}</span>
              <h2>{{ bibleTitle }}</h2>
            </div>

            <div class="verse-container" v-html="sanitizedContent"></div>
          </div>
        </div>
      </main>

      <!-- 하단 플로팅 버튼 -->
      <div class="floating-footer fade-in" style="animation-delay: 0.3s">
        <div class="footer-inner">
          <button 
            class="action-button" 
            :class="{ 'completed': isButtonCompleted }" 
            :disabled="hasenaStore.isLoading"
            @click="handleComplete"
          >
            <span v-if="hasenaStore.isLoading" class="loading-spinner small"></span>
            <template v-else>
              <CheckCircleIcon class="btn-icon" />
              <span>{{ buttonText }}</span>
            </template>
          </button>
        </div>
      </div>

      <!-- Toast 컴포넌트 -->
      <Toast ref="toast" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import { useHasenaStore } from '~/stores/hasena'
import { useRouter } from 'vue-router'
import { useSanitize } from '~/composables/useSanitize'
import Toast from '~/components/Toast.vue'
import ChevronLeftIcon from '~/components/icons/ChevronLeftIcon.vue'
import CheckCircleIcon from '~/components/icons/CheckCircleIcon.vue'

const api = useApi()
const auth = useAuthStore()
const hasenaStore = useHasenaStore()
const router = useRouter()
const toast = ref(null)
const { sanitize } = useSanitize()

// 비디오 관련 상수
const videoUrl = ref('https://www.youtube.com/embed/videoseries?list=PLMT1AJszhYtXkV936HNuExxjAmtFhp2tL')
const latestVideoId = ref('') // 빈 값으로 초기화
const youtubeAppUrl = computed(() => {
  return latestVideoId.value ? `vnd.youtube://${latestVideoId.value}` : null
})
const isMobile = ref(false)

// 상태 변수들
const isLoading = ref(true)
const error = ref(null)
const bibleTitle = ref('')
const parsedContent = ref('')
const sanitizedContent = computed(() => sanitize(parsedContent.value))

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
        <div class="hasena-verse">
          <span class="hasena-verse-number">${number}</span>
          <span class="hasena-verse-text">${text}</span>
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
const buttonText = computed(() => isButtonCompleted.value ? '미완료로 변경' : '완료하기')

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
  } catch (error) {
    toast.value?.show('완료 처리에 실패했습니다', 'error')
  }
}

// YouTube 현재 재생 비디오 가져오기
const setupYouTubeListener = () => {
  if (!window.YT) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    
    window.onYouTubeIframeAPIReady = () => {
      const iframe = document.querySelector('.video-container iframe')
      if (iframe) {
        // iframe의 ID 설정
        iframe.id = 'hasena-youtube-player'
        
        // iframe src를 API 버전으로 변경
        const currentSrc = iframe.src
        iframe.src = currentSrc + '&enablejsapi=1'
        
        // YouTube Player 인스턴스 생성
        new window.YT.Player('hasena-youtube-player', {
          events: {
            'onReady': (event) => {
              // 플레이어가 준비되면 현재 비디오 ID 가져오기
              latestVideoId.value = event.target.getVideoData().video_id
            }
          }
        })
      }
    }
  }
}

onMounted(() => {
  // 모바일 기기 확인
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // 하세나 본문 가져오기
  fetchHasenaContent()
  
  // YouTube 현재 재생 비디오 ID 가져오기
  setupYouTubeListener()
})
</script>

<style>
/* Global Styles for injected HTML content (hasena-specific) */
.hasena-verse {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  line-height: 1.8;
}

.hasena-verse-number {
  color: var(--color-accent-primary);
  font-weight: 600;
  margin-right: 0.5rem;
  min-width: 1.2rem;
  font-size: 0.85em;
  padding-top: 0.2em;
  font-family: var(--font-sans);
}

.hasena-verse-text {
  color: var(--color-text-primary);
  flex: 1;
  word-break: keep-all;
  overflow-wrap: break-word;
}
</style>

<style scoped>
/* Sanctuary Theme Variables - Uses global theme tokens */
.sanctuary-theme {
  --font-serif: 'Noto Serif KR', 'RIDIBatang', serif;
  --font-sans: 'Pretendard', sans-serif;
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --color-success: #10b981;
  --color-success-dark: #059669;

  font-family: var(--font-sans);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  min-height: 100vh;
  position: relative;
  -webkit-font-smoothing: antialiased;
}

.bg-pattern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(var(--color-text-tertiary) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.1;
  z-index: 0;
  pointer-events: none;
}

.container {
  max-width: 768px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  padding-bottom: 3rem;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  background: var(--color-bg-primary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 50;
  border-bottom: 1px solid var(--color-border-light);
}

.header h1 {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.back-button {
  background: none;
  border: none;
  padding: 0.5rem;
  margin-left: -0.5rem;
  cursor: pointer;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.back-button:hover {
  background: var(--color-bg-hover);
}

.back-button .icon {
  width: 24px;
  height: 24px;
}

/* Main Content */
.main-content {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: var(--color-bg-card);
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}

/* Video Section */
.video-card {
  padding: 0;
}

.video-wrapper {
  position: relative;
  width: 100%;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  background: #000;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.youtube-deep-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-top: 1px solid var(--color-border-light);
  transition: background 0.2s;
}

.youtube-deep-link:hover {
  background: var(--color-bg-hover);
}

/* Content Section */
.content-card {
  padding: 1.5rem;
  min-height: 200px;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: var(--color-text-secondary);
  gap: 1rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-border-default);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
}

.bible-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px dashed var(--color-border-default);
}

.date-badge {
  display: inline-block;
  background: var(--color-accent-primary-light);
  color: var(--color-accent-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.bible-header h2 {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--color-text-primary);
  margin: 0;
  font-weight: 700;
}

.verse-container {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: var(--color-text-primary);
}

/* Floating Footer */
.floating-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
}

.footer-inner {
  width: 100%;
  max-width: 768px;
  display: flex;
  justify-content: flex-end;
  padding: 0 1.5rem 2rem 0;
}

@media (min-width: 768px) {
  .footer-inner {
    justify-content: center;
    padding-right: 0;
  }
}

.action-button {
  pointer-events: auto;
  width: auto;
  background: var(--color-success);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.action-button:hover {
  background: var(--color-success-dark);
}

.action-button:active {
  transform: scale(0.95);
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.action-button.completed {
  background: #ef4444;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
}

.action-button.completed:hover {
  background: #dc2626;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Mobile Responsive Tweaks */
@media (max-width: 640px) {
  .bible-header h2 {
    font-size: 1.25rem;
  }
  
  .verse-container {
    font-size: 1rem;
  }
}
</style>
