<template>
  <div class="container">
    <div class="header-wrapper">
      <Header class="fade-in" style="animation-delay: 0s"/>
    </div>
    <div class="content-wrapper">
      <DailyStatus class="fade-in" style="animation-delay: 0.2s"/>
      
      <!-- 공지사항 섹션 추가 -->
      <div class="section notice-section fade-in" style="animation-delay: 0.25s" @click="navigateToInstall">
        <div class="notice-header">
          <div class="notice-title-wrapper">
            <h2>공지사항</h2>
            <span class="new-badge">NEW</span>
          </div>
        </div>
        <div class="notice-content">
          <div class="notice-icon app-icon">
            APP
          </div>
          <div class="notice-text">
            <div class="notice-title">매일일독 앱 설치 방법</div>
            <div class="notice-description">매일일독을 앱으로 사용해보세요</div>
          </div>
          <div class="notice-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="horizontal-sections fade-in" style="animation-delay: 0.3s">
        <div class="section flex-1">
          <h2>오늘일독</h2>
          <div class="tasks">
            <template v-for="(task, index) in todayTasks">
              <template v-if="task.title === '성경일독'">
                <div class="task split-task reading-task" @click="toggleTask(task)">
                  <div class="task-content">
                    <template v-if="task.completed">
                      <span class="check-mark">✓</span>
                    </template>
                    <template v-else>
                      <svg class="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </template>
                    <span class="task-text" :class="{ 'completed': task.completed }">
                      <span class="task-title">오늘일독</span>
                      <span class="task-subtitle">오늘의 말씀을 읽어보세요</span>
                    </span>
                  </div>
                </div>
                
                <div class="task split-task plan-task" @click="navigateToReadingPlan">
                  <div class="task-content">
                    <svg class="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15M9 5C9 5.53043 9.21071 6.03914 9.58579 6.41421C9.96086 6.78929 10.4696 7 11 7H13C13.5304 7 14.0391 6.78929 14.4142 6.41421C14.7893 6.03914 15 5.53043 15 5M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M9 12H15M9 16H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="task-text">
                      <span class="task-title">성경통독표</span>
                      <span class="task-subtitle">전체 통독 계획을 확인하세요</span>
                    </span>
                  </div>
                </div>
              </template>
              <template v-else-if="task.title === '하세나하시조'">
                <div class="task video-task" @click="toggleTask(task)">
                  <div class="task-content">
                    <svg class="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 10L19.5528 7.72361C20.2177 7.39116 21 7.87465 21 8.61803V15.382C21 16.1253 20.2177 16.6088 19.5528 16.2764L15 14M5 18H13C14.1046 18 15 17.1046 15 16V8C15 6.89543 14.1046 6 13 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="task-text">
                      <span class="task-title">{{ task.title }}</span>
                      <span class="task-subtitle">함께 하시조!</span>
                    </span>
                  </div>
                </div>
              </template>
              <div v-else class="task" @click="toggleTask(task)">
                <div class="task-content">
                  <template v-if="task.completed">
                    <span class="check-mark">✓</span>
                  </template>
                  <span class="task-text" :class="{ 'completed': task.completed }">
                    <span class="task-title">{{ task.title }}</span>
                    <span class="task-subtitle">
                      {{ task.title === '하세나하시조' ? '함께 하시조!' : '오늘의 말씀을 읽어보세요' }}
                    </span>
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="section flex-1">
          <h2>개론</h2>
          <div class="tasks">
            <div class="task" v-for="(task, index) in introTasks" :key="index" @click="toggleTask(task)">
              <div class="task-content">
                <span class="check" :class="{ 'check-active': task.completed }">
                  <span class="check-mark" v-if="task.completed">✓</span>
                </span>
                <span class="task-text" :class="{ 'completed': task.completed }">
                  <span class="task-title">{{ task.title }}</span>
                  <span class="task-subtitle">개론 영상을 시청해보세요</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 
      <div class="section fade-in" style="animation-delay: 0.6s">
        <h2>이번 주 일독현황</h2>
        <div class="calendar-wrapper">
          <div class="calendar" :class="{ 'blur-content': !isAuthenticated }">
            <div v-for="day in ['일', '월', '화', '수', '목', '금', '토']" 
                 :key="day" 
                 class="calendar-header">
              {{ day }}
            </div>
            <div v-for="date in [16, 17, 18, 19, 20, 21, 22]" 
                 :key="date"
                 :class="['calendar-date', date === 17 ? 'active' : '', date < 17 ? 'completed' : '']">
              <span class="date-number">{{ date }}</span>
              <span class="date-indicator" v-if="date <= 17"></span>
            </div>
          </div>
          <div v-if="!isAuthenticated" class="login-required-message">
            해당 기능을 사용하시려면 로그인해주세요 😁
          </div>
        </div>
      </div> -->

      <div class="section fade-in" style="animation-delay: 0.7s">
        <h2>참여 현황</h2>
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalMembers }}명</div>
              <div class="stat-label">전체 참여자</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ todayReaders }}명</div>
              <div class="stat-label">오늘 일독 완료</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section fade-in" style="animation-delay: 0.8s">
        <h2>진행률</h2>
        <div class="progress-container">
          <div class="progress-item">
            <div class="progress-icon">
              <img src="@/assets/images/높은뜻 푸른교회 아이콘.png" alt="교회 아이콘" class="church-icon">
            </div>
            <div class="progress-bar">
              <div class="progress" :style="{ width: `${progressPercentage}%` }"></div>
            </div>
            <div class="progress-text">{{ progressPercentage }}% / 100%</div>
          </div>
          <div class="progress-item">
            <template v-if="isAuthenticated">
              <div class="progress-content">
                <div class="progress-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="progress-bar">
                  <div class="progress progress-green" :style="{ width: `${personalProgressPercentage}%` }"></div>
                </div>
                <div class="progress-text">{{ personalProgressPercentage }}% / 100%</div>
              </div>
            </template>
            <template v-else>
              <div class="progress-content blur-content">
                <div class="progress-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="progress-bar">
                  <div class="progress progress-green" style="width: 20.8%"></div>
                </div>
                <div class="progress-text">20.8% / 100%</div>
              </div>
              <div class="login-required-message">
                개인 진행률을 기록하시려면 로그인해주세요 😁
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 새로운 Coming Soon 섹션 추가 -->
      <div class="section fade-in coming-soon" style="animation-delay: 1s">
        <h2>Coming Soon 🎉</h2>
        <div class="coming-soon-features">
          <div class="feature">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7V17M8 7L4 8.5V18.5L8 17M8 7L12 8.5M8 17L12 18.5M12 8.5V18.5M12 8.5L16 7M12 18.5L16 17M16 7V17M16 7L20 8.5V18.5L16 17" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="feature-content">
              <h3>스코어보드</h3>
              <p>진행 현황을 공유하도록 설정하면, 매일일독에 참여 중인 사람들이 함께 볼 수 있도록 준비중이예요</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M13 14L14.586 12.414C14.9611 12.0391 15.4697 11.8284 16 11.8284C16.5303 11.8284 17.0389 12.0391 17.414 12.414L20 15M14 8C14 8.53043 13.7893 9.03914 13.4142 9.41421C13.0391 9.78929 12.5304 10 12 10C11.4696 10 10.9609 9.78929 10.5858 9.41421C10.2107 9.03914 10 8.53043 10 8C10 7.46957 10.2107 6.96086 10.5858 6.58579C10.9609 6.21071 11.4696 6 12 6C12.5304 6 13.0391 6.21071 13.4142 6.58579C13.7893 6.96086 14 7.46957 14 8ZM3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19Z" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="feature-content">
              <h3>SNS 공유하기</h3>
              <p>오늘 일독을 스토리로 공유하여 인증할 수 있는 기능을 준비중이예요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- GitHub 링크 추가 -->
    <div class="github-link-container">
      <a href="https://github.com/JG-Park/maeil1dok/" target="_blank" rel="noopener noreferrer" class="github-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="github-icon">
          <path d="M12 2C6.477 2 2 6.477 2 12C2 16.418 4.865 20.166 8.84 21.489C9.34 21.581 9.52 21.276 9.52 21.012C9.52 20.775 9.512 20.143 9.508 19.308C6.726 19.91 6.139 17.96 6.139 17.96C5.685 16.811 5.028 16.508 5.028 16.508C4.128 15.927 5.095 15.939 5.095 15.939C6.092 16.01 6.626 16.929 6.626 16.929C7.521 18.452 8.969 18.007 9.54 17.752C9.631 17.09 9.889 16.646 10.175 16.419C7.955 16.189 5.62 15.367 5.62 11.613C5.62 10.546 6.01 9.678 6.646 9.003C6.545 8.75 6.197 7.797 6.746 6.602C6.746 6.602 7.586 6.335 9.497 7.78C10.3 7.559 11.15 7.449 12 7.444C12.85 7.449 13.7 7.559 14.504 7.78C16.414 6.335 17.253 6.602 17.253 6.602C17.803 7.797 17.455 8.75 17.354 9.003C17.991 9.678 18.379 10.546 18.379 11.613C18.379 15.376 16.04 16.185 13.813 16.411C14.172 16.692 14.492 17.253 14.492 18.105C14.492 19.308 14.479 20.683 14.479 21.012C14.479 21.278 14.657 21.586 15.165 21.487C19.137 20.161 22 16.416 22 12C22 6.477 17.523 2 12 2Z" />
        </svg>
        GitHub
      </a>
    </div>

    <!-- 일요일 알림 모달 추가 -->
    <div v-if="showSundayModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>오늘은 일독이 없는 날이에요 🙏</h3>
        </div>
        <div class="modal-body">
          <div class="modal-buttons">
            <button @click="navigateToIntro" class="modal-button intro-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10L19.5528 7.72361C20.2177 7.39116 21 7.87465 21 8.61803V15.382C21 16.1253 20.2177 16.6088 19.5528 16.2764L15 14M5 18H13C14.1046 18 15 17.1046 15 16V8C15 6.89543 14.1046 6 13 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              이번 주 개론 시청
            </button>
            <button @click="navigateToReading" class="modal-button reading-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              내일 본문부터 읽기
            </button>
          </div>
        </div>
        <button @click="closeSundayModal" class="modal-close">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTaskStore } from '~/stores/tasks'
import { useApi } from '~/composables/useApi'
import Header from '~/components/Header.vue'
import DailyStatus from '~/components/DailyStatus.vue'

const auth = useAuthStore()
const taskStore = useTaskStore()
const api = useApi()

const todayTasks = computed(() => taskStore.todayTasks)
const introTasks = computed(() => taskStore.introTasks)

// 일요일 모달 상태 관리
const showSundayModal = ref(false)

// 일요일 체크 함수
const isSunday = () => {
  return new Date().getDay() === 0
}

// 모달 닫기
const closeSundayModal = () => {
  showSundayModal.value = false
}

// 기존 toggleTask 함수 수정
const toggleTask = async (task) => {
  if (!task.completed) {
    if (task.title === '성경일독') {
      if (isSunday()) {
        showSundayModal.value = true
        return
      }
      const todayReading = await taskStore.fetchTodayReading()
      if (todayReading) {
        navigateTo(`/reading?book=${todayReading.book}&chapter=${todayReading.chapter}`)
      } else {
        navigateTo('/reading')
      }
    } else if (task.title === '민수기 개론') {
      navigateTo('/intro')
    } else if (task.title === '하세나하시조') {
      navigateTo('/video')
    }
  }
}

// 다음 월요일의 날짜를 구하는 함수 추가
const getNextMonday = () => {
  const today = new Date()
  const day = today.getDay() // 0 = 일요일, 1 = 월요일, ...
  const daysUntilMonday = day === 0 ? 1 : (8 - day) // 일요일이면 1일 후, 아니면 다음 월요일까지 남은 일수
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  return nextMonday
}

// 모달 버튼용 네비게이션 함수 수정
const navigateToReading = async () => {
  closeSundayModal()
  try {
    // 다음 월요일 날짜로 읽을 본문 가져오기
    const nextMonday = getNextMonday()
    const nextReading = await taskStore.fetchReadingForDate(nextMonday)
    if (nextReading) {
      navigateTo(`/reading?book=${nextReading.book}&chapter=${nextReading.chapter}`)
    } else {
      navigateTo('/reading')
    }
  } catch (error) {
    console.error('Failed to fetch next reading:', error)
    navigateTo('/reading')
  }
}

const navigateToIntro = () => {
  closeSundayModal()
  navigateTo('/intro')
}

// 진도율 계산 로직
const startDate = new Date('2025-02-03')
const endDate = new Date('2025-12-27')
const totalReadings = 270  // 45주 * 6회 = 270회로 고정

// 교회 전체 진행률 계산
const progressPercentage = computed(() => {
  const today = new Date()
  
  if (today < startDate) return 0
  if (today > endDate) return 100
  
  // 시작일부터 오늘까지의 일수 계산 (주말 제외, 당일 포함)
  const timeDiff = today.getTime() - startDate.getTime()
  const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000)) + 1  // +1로 당일 포함
  const weeksDiff = Math.floor(daysDiff / 7)
  const remainingDays = daysDiff % 7
  
  // 완료된 읽기 수 계산 (주말 제외)
  const completedReadings = (weeksDiff * 6) + Math.min(remainingDays, 6)
  
  const percentage = (completedReadings / totalReadings) * 100
  return Number(Math.min(percentage, 100).toFixed(2))
})

// 개인 진행률 계산
const personalProgressPercentage = computed(() => {
  if (!auth.isAuthenticated) return 0
  
  const completedReadings = taskStore.completedReadingsCount || 0
  const percentage = (completedReadings / totalReadings) * 100
  return Number(percentage.toFixed(2))
})

// 로그인 상태를 computed로 관리
const isAuthenticated = computed(() => auth.isAuthenticated)

// 성경통독표로 이동하는 함수 추가
const navigateToReadingPlan = () => {
  navigateTo('/reading-plan')
}

// 설치 안내 페이지로 이동하는 함수 추가
const navigateToInstall = () => {
  navigateTo('/install')
}

// 통계 데이터를 위한 ref 추가
const totalMembers = ref(0)
const todayReaders = ref(0)

// 통계 데이터를 가져오는 함수 수정
const fetchStats = async () => {
  try {
    const response = await api.get('/api/v1/todos/stats/')
    totalMembers.value = response.totalMembers
    todayReaders.value = response.todayReaders
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    totalMembers.value = 0
    todayReaders.value = 0
  }
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(async () => {
  if (auth.isAuthenticated) {
    try {
      await Promise.all([
        taskStore.fetchCompletedSections(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  } else {
    await fetchStats()
  }
})
</script>

<style scoped>
:root {
  --primary-color: #617475;
  --primary-light: #E9ECEC;
  --primary-dark: #4A5A5B;
  --text-primary: #2C3E50;
  --text-secondary: #666666;
  --background-light: #FAFAFA;
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --background-color: #efece8;
}

.header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--background-color);
}

.content-wrapper {
  padding-top: 60px; /* Header의 높이만큼 상단 패딩 추가 */
}

.container {
  max-width: 768px;
  margin: 0 auto;
  background: var(--background-color);
  min-height: 100vh;
  padding-bottom: 1.5rem;
  position: relative; /* 추가 */
}

.section {
  background: white;
  margin: 0.875rem 1rem;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.02),
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.015);
  transition: all 0.3s ease;
}

.section:hover {
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.03),
    0 2px 4px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.02);
}

h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.task {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.875rem;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFA;
  border: 1px solid rgba(0, 0, 0, 0.03);
  -webkit-tap-highlight-color: transparent;
}

.task-content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

@media (hover: hover) {
  .task:hover:not(.completed) {
    background: var(--primary-light);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  .task:hover:not(.completed) .arrow {
    opacity: 1;
    background: rgba(97, 163, 117, 0.1);
    transform: translateX(2px);
  }
}

.task.completed {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.check {
  display: none;
}

.check-icon {
  color: var(--text-secondary);
  opacity: 0.8;
  margin-right: 0.875rem;
}

.task:hover .check-icon {
  color: var(--primary-color);
  opacity: 1;
}

.check-mark {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.875rem;
  color: var(--primary-color);
  font-size: 1.2rem;
}

.task-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: all 0.3s ease;
  position: relative;
}

.task-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
  position: relative;
  width: fit-content;
}

.task-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.completed .task-title {
  color: #999;
}

.completed .task-subtitle {
  opacity: 0.7;
  color: #999;
}

.completed .task-title::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 0;
  height: 1.5px;
  background-color: #999;
  animation: strikethrough 0.3s ease-out forwards;
  transform-origin: left;
  pointer-events: none;
}

@keyframes strikethrough {
  0% {
    width: 0;
  }
  100% {
    width: 100%;
  }
}

.arrow {
  color: var(--text-secondary);
  opacity: 0.6;
  transition: all 0.2s ease;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: 50%;
}

.task:not(.completed) .arrow {
  color: var(--primary-color);
}

.task.completed .arrow {
  color: #999;
  opacity: 0.8;
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  padding: 0.25rem;
}

.calendar-header {
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.25rem 0;
  text-align: center;
  opacity: 0.8;
}

.calendar-date {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #FAFAFA;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  padding: 0.25rem 0;
}

.date-number {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
}

.date-indicator {
  position: absolute;
  bottom: 18%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: var(--primary-color);
  opacity: 0.8;
}

.calendar-date.completed {
  background: white;
  border-color: var(--primary-color);
  border-width: 1px;
}

.calendar-date.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(97, 163, 117, 0.1);
}

.calendar-date.active .date-number {
  color: white;
  font-weight: 600;
}

.calendar-date.active .date-indicator {
  background-color: white;
  opacity: 1;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-icon svg {
  width: 24px;
  height: 24px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #EEEEEE;
  border-radius: 999px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #366DAE;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-green {
  background: var(--primary-dark);
}

.progress-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  min-width: 100px;
  font-weight: 500;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
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

.horizontal-sections {
  display: flex;
  gap: 0.875rem;
  padding: 0 1rem;
  margin: 0.875rem 0;
}

.flex-1 {
  flex: 1;
  margin: 0;
}

/* 모바일 대응을 위한 미디어 쿼리 수정 */
@media (max-width: 640px) {
  .horizontal-sections {
    flex-direction: column;
    padding: 0;
    gap: 0; /* 간격 제거 */
  }
  
  .flex-1 {
    margin: 0.875rem 1rem;
    margin-bottom: 0; /* 하단 마진 제거 */
  }

  .flex-1 + .flex-1 {
    margin-top: 0.875rem; /* 두 번째 카드부터 상단 마진 적용 */
  }

  .section {
    margin: 0.875rem 1rem;
  }

  .calendar {
    gap: 0.375rem;
    padding: 0.125rem;
  }
  
  .calendar-date {
    border-radius: 8px;
  }
}

.church-icon {
  width: 24px;
}

.task.not-logged-in {
  opacity: 0.7;
  cursor: pointer;
}

.task.not-logged-in .task-subtitle {
  color: var(--primary-color);
}

.calendar-wrapper, .progress-wrapper {
  position: relative;
}

.blur-content {
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
}

.login-required-message {
  position: absolute;
  top: 80%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

/* 블러 처리된 요소의 자식 요소들도 같이 블러되도록 설정 */
.blur-content > * {
  filter: blur(4px);
}

.split-task {
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.reading-task {
  background: #f5f9ff;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  border-radius: 12px 12px 0 0;
}

.reading-task:hover {
  background: #edf4ff !important;
  border-color: #366DAE !important;
}
.reading-task:hover .check-icon {
  color: #366DAE !important;
}

.plan-task {
  background: var(--primary-light);
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  margin-bottom: 1rem;
  border-radius: 0 0 12px 12px;
}

.plan-task:hover {
  background: #e5efeb !important;
  border-color: var(--primary-color) !important;
}

.plan-task .check-icon {
  color: var(--primary-color);
}

.reading-task .check-icon,
.reading-task .check-mark {
  color: #366DAE;
}

.task:has(.task-title:contains('하세나하시조')) {
  background: #f5f9ff;
}

.task:has(.task-title:contains('하세나하시조')):hover {
  background: #edf4ff !important;
  border-color: #366DAE !important;
}

.task:has(.task-title:contains('하세나하시조')) .check-icon,
.task:has(.task-title:contains('하세나하시조')) .check-mark {
  color: #366DAE;
}
/* 
.video-task {
  background: #f5f9ff;
}

.video-task:hover {
  background: #edf4ff !important;
  border-color: #366DAE !important;
}

.video-task .check-icon,
.video-task .check-mark {
  color: #366DAE;
} */

.coming-soon {
  background: linear-gradient(to bottom right, #ffffff, #f8f9fa);
}

.coming-soon-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
}

.feature:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.03);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  border-radius: 10px;
}

.feature-content {
  flex: 1;
}

.feature-content h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.feature-content p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 640px) {
  .coming-soon {
    margin: 0.875rem 1rem;
  }
}

.stats-container {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #FAFAFA;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.03);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  border-radius: 10px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

@media (max-width: 640px) {
  .stats-container {
    flex-direction: column;
  }
}

/* 공지사항 섹션 스타일 */
.notice-section {
  cursor: pointer;
  transition: all 0.2s ease;
}

.notice-section:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.04),
    0 3px 6px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.03);
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.notice-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notice-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.new-badge {
  background: #EF4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notice-content {
  display: flex;
  align-items: center;
  background: #FAFAFA;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.notice-icon.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #EBF5FF;
  border-radius: 10px;
  color: #3B82F6;
  margin-right: 1rem;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.9rem;
}

.notice-text {
  flex: 1;
}

.notice-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.notice-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.notice-arrow {
  color: var(--text-secondary);
  opacity: 0.6;
  margin-left: 0.5rem;
}

.notice-section:hover .notice-arrow {
  color: var(--primary-color);
  opacity: 1;
  transform: translateX(2px);
}

/* GitHub 링크 스타일 */
.github-link-container {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
  margin-top: 1rem;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.github-link:hover {
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
}

.github-icon {
  opacity: 0.7;
}

.github-link:hover .github-icon {
  opacity: 1;
}

/* 모달 스타일 추가 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: modalFadeIn 0.3s ease;
}

.modal-header {
  text-align: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  font-size: 1.2rem;
  color: var(--text-primary);
  margin: 0;
}

.modal-body {
  text-align: center;
}

.modal-body p {
  color: var(--text-secondary);
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.modal-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.reading-button {
  background: #f5f9ff;
  color: #366DAE;
}

.reading-button:hover {
  background: #edf4ff;
  transform: translateY(-1px);
}

.intro-button {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.intro-button:hover {
  background: #e5efeb;
  transform: translateY(-1px);
}

.modal-close {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  border-radius: 12px;
  font-size: 0.95rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f5f5f5;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 