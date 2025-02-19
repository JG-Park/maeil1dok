<template>
  <div class="container">
    <div class="header fade-in" style="animation-delay: 0s">
      <button class="back-button" @click="$router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>오늘의 하세나하시조</h1>
    </div>

    <div class="content-section fade-in" style="animation-delay: 0.2s">
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

      <div class="video-info">
        <h2>{{ videoTitle }}</h2>
        <p class="description">{{ videoDescription }}</p>
      </div>
    </div>

    <div class="bottom-controls fade-in" style="animation-delay: 0.3s">
      <button class="complete-button" @click="handleComplete">
        하세나 완료
      </button>
    </div>
  </div>
</template>

<script setup>
const videoUrl = "https://www.youtube.com/embed/videoseries?list=PLMT1AJszhYtXkV936HNuExxjAmtFhp2tL"

const handleComplete = () => {
  // TODO: 완료 처리 로직 구현
  navigateTo('/')
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
  padding: 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.back-button {
  background: none;
  border: none;
  padding: 0.5rem;
  margin: -0.5rem;
  margin-right: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
}

.header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.content-section {
  background: white;
  margin: 1rem;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 비율 */
  height: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #000;
  margin-bottom: 1.5rem;
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

.complete-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.complete-button:active {
  transform: translateY(0);
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