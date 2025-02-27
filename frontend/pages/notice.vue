<template>
  <div class="container">
    <div class="header fade-in">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>공지사항</h1>
    </div>

    <div class="content-section fade-in" style="animation-delay: 0.2s">
      <div class="notice-item">
        <div class="notice-date">2025년 02월 27일</div>
        <h2 class="notice-title">매일일독 앱 설치 방법</h2>
        <div class="notice-content">
          <p>매일일독을 앱으로 사용해보세요.</p>
          <div class="notice-action">
            <button class="action-button" @click="navigateToInstall">
              설치 방법 보기
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 추가 공지사항 아이템 -->
      <div class="notice-item">
        <div class="notice-date">2025년 02월 24일</div>
        <h2 class="notice-title">매일일독 서비스 시작</h2>
        <div class="notice-content">
          <p>매일일독 서비스가 출시되었습니다. 성경 통독을 더 편리하게 진행할 수 있도록 다양한 기능을 제공합니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToInstall = () => {
  router.push('/install')
}
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
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
  height: 50px;
  transition: all 0.15s ease;
  margin: 0;
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

.content-section {
  background: white;
  margin: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.notice-item {
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.notice-item:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.notice-date {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.notice-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2C3E50;
  margin-bottom: 1rem;
}

.notice-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #4B5563;
}

.notice-action {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #617475;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #4A5A5B;
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

:root {
  --text-primary: #2C3E50;
  --text-secondary: #666666;
}
</style> 