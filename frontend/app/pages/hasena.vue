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

            <button 
              v-if="isMobile && latestVideoId" 
              class="youtube-deep-link"
              @click="openYouTubeApp"
            >
              <span class="youtube-icon">▶</span>
              YouTube 앱으로 시청하기
            </button>
          </div>
        </div>

        <!-- AI 요약 섹션 -->
        <div class="card summary-card fade-in" style="animation-delay: 0.15s">
          <div class="summary-header">
            <span class="ai-badge">✨ AI 요약</span>
            <!-- 관리자만 요약 생성/재생성 버튼 표시 -->
            <button 
              v-if="auth.isStaff?.value && latestVideoId && !summaryLoading"
              class="summary-btn"
              @click="generateAISummary"
            >
              {{ summaryContent ? '재생성' : '요약 생성' }}
            </button>
          </div>
          
          <div v-if="summaryLoading" class="summary-loading">
            <div class="loading-spinner small"></div>
            <span>AI가 영상을 분석하고 있습니다...</span>
          </div>
          
          <div v-else-if="summaryError && !summaryContent" class="summary-error">
            <p>{{ summaryError }}</p>
            <!-- 관리자만 다시 시도 버튼 표시 -->
            <button v-if="auth.isStaff?.value" class="retry-btn" @click="generateAISummary">다시 시도</button>
          </div>
          
          <div v-else-if="summaryContent" class="summary-content" v-html="formattedSummary"></div>
          
          <div v-else class="summary-placeholder">
            <p>오늘의 요약이 곧 준비됩니다</p>
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

        <!-- 스트릭 & 달력 섹션 (로그인 시에만) -->
        <div v-if="auth.isAuthenticated.value" class="card streak-card fade-in" style="animation-delay: 0.25s">
          <!-- 스트릭 통계 -->
          <div class="streak-stats">
            <div class="streak-item current">
              <span class="streak-icon">🔥</span>
              <div class="streak-info">
                <span class="streak-value">{{ hasenaStore.stats.current_streak }}</span>
                <span class="streak-label">현재 연속</span>
              </div>
            </div>
            <div class="streak-item longest">
              <span class="streak-icon">🏆</span>
              <div class="streak-info">
                <span class="streak-value">{{ hasenaStore.stats.longest_streak }}</span>
                <span class="streak-label">최장 연속</span>
              </div>
            </div>
            <div class="streak-item total">
              <span class="streak-icon">📅</span>
              <div class="streak-info">
                <span class="streak-value">{{ hasenaStore.stats.total_completed }}</span>
                <span class="streak-label">총 완료</span>
              </div>
            </div>
          </div>

          <!-- 미니 달력 -->
          <div class="mini-calendar">
            <div class="calendar-header">
              <button class="nav-btn" @click="prevMonth">&lt;</button>
              <span class="calendar-title">{{ calendarTitle }}</span>
              <button class="nav-btn" @click="nextMonth">&gt;</button>
            </div>
            <div class="calendar-weekdays">
              <span v-for="day in ['일', '월', '화', '수', '목', '금', '토']" :key="day">{{ day }}</span>
            </div>
            <div class="calendar-grid">
              <div 
                v-for="(date, index) in calendarDates" 
                :key="index"
                class="calendar-day"
                :class="{
                  'other-month': date.otherMonth,
                  'today': date.isToday,
                  'completed': date.completed,
                  'sunday': date.isSunday
                }"
              >
                <span class="day-number">{{ date.day }}</span>
                <span v-if="date.completed && !date.otherMonth" class="check-mark">✓</span>
              </div>
            </div>
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
import { useAuthService } from '~/composables/useAuthService'
import { useHasenaStore } from '~/stores/hasena'
import { useRouter } from 'vue-router'
import { useSanitize } from '~/composables/useSanitize'
import Toast from '~/components/Toast.vue'
import ChevronLeftIcon from '~/components/icons/ChevronLeftIcon.vue'
import CheckCircleIcon from '~/components/icons/CheckCircleIcon.vue'

const api = useApi()
const auth = useAuthService()
const hasenaStore = useHasenaStore()
const router = useRouter()
const toast = ref(null)
const { sanitize } = useSanitize()

// 비디오 관련 상수
const PLAYLIST_ID = 'PLMT1AJszhYtXkV936HNuExxjAmtFhp2tL'
const videoUrl = ref(`https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}`)
const latestVideoId = ref('') // 빈 값으로 초기화
const isMobile = ref(false)
const isIOS = ref(false)
const isAndroid = ref(false)

// YouTube 앱으로 열기 (iOS/Android 분기 + 폴백)
const openYouTubeApp = () => {
  if (!latestVideoId.value) return
  
  const videoId = latestVideoId.value
  const webUrl = `https://www.youtube.com/watch?v=${videoId}`
  
  if (isIOS.value) {
    // iOS: youtube:// 스킴 사용 (Universal Links도 자동 동작)
    const appUrl = `youtube://watch?v=${videoId}`
    window.location.href = appUrl
    
    // 2초 후 웹으로 폴백 (앱이 없는 경우)
    setTimeout(() => {
      window.open(webUrl, '_blank')
    }, 2000)
  } else if (isAndroid.value) {
    // Android: Intent URL 사용 (앱 미설치 시 자동으로 웹 폴백)
    const intentUrl = `intent://watch?v=${videoId}#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
    window.location.href = intentUrl
  } else {
    // 기타 모바일: 웹으로 열기
    window.open(webUrl, '_blank')
  }
}

// 상태 변수들
const isLoading = ref(true)
const error = ref(null)
const bibleTitle = ref('')
const parsedContent = ref('')
const sanitizedContent = computed(() => sanitize(parsedContent.value))

// AI 요약 관련 상태
const summaryLoading = ref(false)
const summaryError = ref(null)
const summaryContent = ref('')

// Markdown을 HTML로 변환 (간단한 버전)
const formattedSummary = computed(() => {
  if (!summaryContent.value) return ''
  
  return summaryContent.value
    .replace(/## (.+)/g, '<h3 class="summary-heading">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n- /g, '</p><li>')
    .replace(/^- /gm, '<li>')
    .replace(/<li>(.+?)(?=<li>|<\/p>|<h3|$)/g, '<li>$1</li>')
    .replace(/(<li>.+<\/li>)+/g, '<ul>$&</ul>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match
      return `<p>${match}</p>`
    })
})

// AI 요약 조회 (생성 없이)
const loadAISummary = async () => {
  if (!latestVideoId.value) return
  
  summaryLoading.value = true
  summaryError.value = null
  
  try {
    const { data } = await api.get(`/api/v1/todos/hasena/summary/?video_id=${latestVideoId.value}`)
    console.log('[Hasena] Load summary response:', data)
    
    if (data.success) {
      summaryContent.value = data.summary
    }
  } catch (err) {
    console.log('[Hasena] Load summary error:', err)
  } finally {
    summaryLoading.value = false
  }
}

// AI 요약 생성/재생성 (관리자 전용)
const generateAISummary = async () => {
  console.log('[Hasena] generateAISummary called, videoId:', latestVideoId.value)
  
  if (!latestVideoId.value) {
    summaryError.value = '영상 ID를 가져올 수 없습니다.'
    return
  }
  
  summaryLoading.value = true
  summaryError.value = null
  
  try {
    const url = `/api/v1/todos/hasena/summary/?video_id=${latestVideoId.value}&generate=true`
    console.log('[Hasena] Calling API:', url)
    
    const { data } = await api.get(url)
    console.log('[Hasena] Generate summary response (RAW):', data)
    
    if (data.success) {
      summaryContent.value = data.summary
    } else {
      summaryError.value = data.error || '요약을 생성할 수 없습니다.'
    }
  } catch (err) {
    console.error('[Hasena] Generate summary error:', err)
    summaryError.value = err.response?.data?.error || '요약 생성 중 오류가 발생했습니다.'
  } finally {
    summaryLoading.value = false
  }
}

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
    if (auth.isAuthenticated.value) {
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
  if (!auth.isAuthenticated.value) return
  
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

// 달력 관련 상태
const calendarYear = ref(today.getFullYear())
const calendarMonth = ref(today.getMonth() + 1)

const calendarTitle = computed(() => `${calendarYear.value}년 ${calendarMonth.value}월`)

const calendarDates = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value - 1
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const completedDates = new Set(
    hasenaStore.calendarRecords
      .filter(r => r.is_completed)
      .map(r => r.date)
  )
  
  const dates = []
  
  for (let i = startOffset - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i)
    dates.push({
      day: prevDate.getDate(),
      otherMonth: true,
      isToday: false,
      completed: false,
      isSunday: prevDate.getDay() === 0
    })
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day)
    const dateStr = formatApiDate(currentDate)
    dates.push({
      day,
      otherMonth: false,
      isToday: dateStr === formatApiDate(today),
      completed: completedDates.has(dateStr),
      isSunday: currentDate.getDay() === 0
    })
  }
  
  const remaining = 42 - dates.length
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, month + 1, i)
    dates.push({
      day: i,
      otherMonth: true,
      isToday: false,
      completed: false,
      isSunday: nextDate.getDay() === 0
    })
  }
  
  return dates
})

const prevMonth = () => {
  if (calendarMonth.value === 1) {
    calendarMonth.value = 12
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
  loadCalendarData()
}

const nextMonth = () => {
  if (calendarMonth.value === 12) {
    calendarMonth.value = 1
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
  loadCalendarData()
}

const loadCalendarData = async () => {
  if (auth.isAuthenticated.value) {
    await hasenaStore.fetchCalendarRecords(calendarYear.value, calendarMonth.value)
  }
}

// handleComplete 함수 강화
const handleComplete = async () => {
  // 로그인하지 않은 경우 로그인 페이지로 이동
  if (!auth.isAuthenticated.value) {
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
              // 비디오 ID 확보 후 요약 조회
              loadAISummary()
            }
          }
        })
      }
    }
  }
}

onMounted(async () => {
  const ua = navigator.userAgent
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  isIOS.value = /iPhone|iPad|iPod/i.test(ua)
  isAndroid.value = /Android/i.test(ua)

  fetchHasenaContent()
  setupYouTubeListener()
  
  if (auth.isAuthenticated.value) {
    await Promise.all([
      hasenaStore.fetchStats(),
      hasenaStore.fetchCalendarRecords(calendarYear.value, calendarMonth.value)
    ])
  }
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
  width: 100%;
  padding: 0.75rem;
  background: #ff0000;
  color: white;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.youtube-deep-link:hover {
  background: #cc0000;
}

.youtube-deep-link:active {
  background: #aa0000;
}

.youtube-icon {
  font-size: 1.1rem;
}

/* AI Summary Section */
.summary-card {
  padding: 1.25rem;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.summary-btn {
  background: var(--color-accent-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.summary-btn:hover {
  background: var(--color-accent-primary-dark, #4f46e5);
  transform: translateY(-1px);
}

.summary-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  padding: 1rem 0;
}

.summary-error {
  background: #fef2f2;
  border-radius: 8px;
  padding: 1rem;
  color: #dc2626;
  font-size: 0.9rem;
}

.summary-error .retry-btn {
  margin-top: 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}

.summary-placeholder {
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem 0;
}

.summary-content {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--color-text-primary);
}

.summary-content :deep(h3.summary-heading) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-accent-primary);
  margin: 1.25rem 0 0.5rem 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--color-border-light);
}

.summary-content :deep(h3.summary-heading:first-child) {
  margin-top: 0;
}

.summary-content :deep(p) {
  margin: 0.5rem 0;
}

.summary-content :deep(ul) {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.summary-content :deep(li) {
  margin: 0.25rem 0;
}

.summary-content :deep(strong) {
  color: var(--color-text-primary);
  font-weight: 600;
}

[data-theme="dark"] .summary-error {
  background: #451a1a;
  color: #fca5a5;
}

[data-theme="dark"] .summary-error .retry-btn {
  background: #ef4444;
}

/* Streak & Calendar Section */
.streak-card {
  padding: 1.25rem;
}

.streak-stats {
  display: flex;
  justify-content: space-around;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 1.25rem;
}

.streak-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.streak-icon {
  font-size: 1.5rem;
}

.streak-info {
  display: flex;
  flex-direction: column;
}

.streak-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.streak-item.current .streak-value {
  color: #f97316;
}

.streak-item.longest .streak-value {
  color: #eab308;
}

.streak-item.total .streak-value {
  color: var(--color-accent-primary);
}

.streak-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

/* Mini Calendar */
.mini-calendar {
  font-size: 0.85rem;
}

.mini-calendar .calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.mini-calendar .calendar-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.mini-calendar .nav-btn {
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 1rem;
  border-radius: 4px;
}

.mini-calendar .nav-btn:hover {
  background: var(--color-bg-hover);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.calendar-weekdays span:first-child {
  color: #ef4444;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.8rem;
}

.calendar-day.other-month {
  color: var(--color-text-tertiary);
  opacity: 0.4;
}

.calendar-day.sunday .day-number {
  color: #ef4444;
}

.calendar-day.today {
  background: var(--color-accent-primary-light);
}

.calendar-day.today .day-number {
  font-weight: 700;
  color: var(--color-accent-primary);
}

.calendar-day.completed:not(.other-month) {
  background: #10b981;
}

.calendar-day.completed:not(.other-month) .day-number {
  color: white;
}

.calendar-day .check-mark {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 0.6rem;
  color: white;
  background: #10b981;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
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
