<template>
  <div class="container">
    <div class="header fade-in" style="animation-delay: 0s">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>하세나하시조</h1>
    </div>

    <div class="content-section fade-in" style="animation-delay: 0.2s">
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
        
        <a 
          v-if="isMobile"
          :href="youtubeAppUrl" 
          target="_blank" 
          class="youtube-button"
        >
          <img src="/youtube-icon.svg" alt="YouTube" class="youtube-icon">
          YouTube 앱으로 보기
        </a>
      </div>

      <div class="video-info">
        <h2>{{ videoTitle }}</h2>
        <p class="description">{{ videoDescription }}</p>
      </div>
    </div>

    <div class="bottom-controls fade-in" style="animation-delay: 0.3s">
      <button class="complete-button" 
             :class="{ 'completed': isCompleted }"
             :disabled="isLoading"
             @click="handleComplete">
        <span v-if="isLoading">처리 중...</span>
        <span v-else>{{ isCompleted ? '하세나 취소' : '오늘의 하세나 완료' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const videoUrl = "https://www.youtube.com/embed/videoseries?list=PLMT1AJszhYtXkV936HNuExxjAmtFhp2tL"
const youtubeAppUrl = "vnd.youtube://www.youtube.com/playlist?list=PLMT1AJszhYtXkV936HNuExxjAmtFhp2tL"
const videoTitle = "하세나하시조"
const videoDescription = "오늘의 하시조, 함께하시조!"

const isMobile = ref(false)
const isCompleted = ref(false)
const todayRecord = ref(null)
const isLoading = ref(false)

// API 컴포저블 가져오기
const api = useApi()
// Toast 컴포저블 가져오기
const toast = useToast()

// 날짜 포맷 함수
const formatDate = (date) => {
  const d = date || new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 오늘 날짜의 하세나 기록 조회
const fetchTodayRecord = async () => {
  try {
    isLoading.value = true
    const today = formatDate(new Date())
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    // useApi를 사용하여 API 호출
    const { data } = await api.get('/api/v1/todos/hasena/', {
      params: { year: currentYear, month: currentMonth }
    })
    
    if (data && Array.isArray(data)) {
      // 오늘 날짜 기록 찾기
      const todayData = data.find(record => record.date === today)
      if (todayData) {
        todayRecord.value = todayData
        isCompleted.value = todayData.is_completed
      }
    }
  } catch (error) {
    console.error('하세나 기록 조회 실패:', error)
    toast.error('하세나 기록을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 하세나 완료/취소 처리
const handleComplete = async () => {
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    const today = formatDate(new Date())
    
    // 완료 상태 토글
    const newStatus = !isCompleted.value
    
    // useApi를 사용하여 API 호출
    const data = await api.post('/api/v1/todos/hasena/', {
      date: today,
      is_completed: newStatus
    })
    
    if (data) {
      todayRecord.value = data
      isCompleted.value = data.is_completed
      
      // 성공 메시지 표시 (alert 대신 toast 사용)
      if (isCompleted.value) {
        toast.success('하세나가 완료되었습니다!')
      } else {
        toast.info('하세나 완료가 취소되었습니다.')
      }
    }
  } catch (error) {
    console.error('하세나 기록 저장 실패:', error)
    toast.error('처리 중 오류가 발생했습니다. 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // 모바일 기기 확인
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // 오늘 하세나 기록 조회
  await fetchTodayRecord()
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

.content-section {
  background: white;
  margin: 1rem;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.video-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
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
  padding-top: 1rem;
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
  background: #e74c3c;
}

.complete-button.completed:hover:not(:disabled) {
  background: #c0392b;
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

@media (max-width: 640px) {
  .content-section {
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
</style> 