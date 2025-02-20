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

    <div class="content-section fade-in" style="animation-delay: 0.2s">
      <div class="video-info">
        <h2>출애굽기 개론</h2>
        <p class="description">출애굽기의 전체적인 흐름과 주제를 이해하고 깊이 있게 말씀을 묵상해보세요.</p>
      </div>

      <div class="video-wrapper">
        <div class="video-container">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/nuumvEm2D9M"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        
        <a 
          href="https://youtu.be/nuumvEm2D9M" 
          target="_blank" 
          class="youtube-button"
        >
          <img src="/youtube-icon.svg" alt="YouTube" class="youtube-icon">
          YouTube 앱으로 보기
        </a>
      </div>
    </div>

    <div class="bottom-controls fade-in" style="animation-delay: 0.3s">
      <button class="complete-button" @click="handleComplete">
        학습 완료
      </button>
    </div>
  </div>
</template>

<script setup>
import { useTaskStore } from '~/stores/tasks'
import { useRouter } from 'vue-router'

const taskStore = useTaskStore()
const router = useRouter()

const handleComplete = () => {
  taskStore.completeTask(3) // 출애굽기 개론 task의 ID
  router.push('/')
}
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

.complete-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.complete-button:active {
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