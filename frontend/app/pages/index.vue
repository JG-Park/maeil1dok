<template>
  <div class="sanctuary-theme">
    <div class="bg-pattern"></div>
    
    <div class="container">
      <header class="home-header">
        <div class="logo-wrapper">
          <img src="~/assets/images/로고_투명.png" alt="Maeil1dok" class="logo-img" />
        </div>
        <button class="menu-btn" @click="showMenu = true" aria-label="메뉴 열기">
          <MenuIcon size="24" />
        </button>
      </header>

      <main class="home-main">
        <HomeHero />
        <ReadingCardStack />
        <QuickAccessGrid />
      </main>

      <FloatingNav />
      
      <Menu :is-open="showMenu" @close="showMenu = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HomeHero from '~/components/home-v2/HomeHero.vue';
import ReadingCardStack from '~/components/home-v2/ReadingCardStack.vue';
import QuickAccessGrid from '~/components/home-v2/QuickAccessGrid.vue';
import FloatingNav from '~/components/home-v2/FloatingNav.vue';
import Menu from '~/components/Menu.vue';
import MenuIcon from '~/components/icons/MenuIcon.vue';

// 페이지 메타 설정
definePageMeta({
  layout: false // 전체 화면 제어를 위해 레이아웃 미사용
});

const showMenu = ref(false);
</script>

<style scoped>
/* Sanctuary Theme Variables */
.sanctuary-theme {
  /* Colors - Light (Default) */
  --bg-color: var(--color-bg-primary, #F9F8F6);
  --card-bg: var(--color-bg-card, #FFFFFF);
  --text-main: var(--color-text-primary, #2C3333);
  --text-sub: var(--color-text-secondary, #6B7280);
  --accent: var(--color-accent-primary, #4A5D53);
  --accent-light: var(--color-accent-primary-light, #E8ECE9);
  --paper-shadow: var(--shadow-sm, 0 4px 20px rgba(44, 51, 51, 0.04));
  
  --font-serif: 'Noto Serif KR', serif;
  --font-sans: 'Pretendard', sans-serif;

  font-family: var(--font-sans);
  background-color: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  line-height: 1.6;
}

.container {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 1.5rem 6rem;
  min-height: 100vh;
  position: relative;
}

/* Header */
.home-header {
  padding: 2rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-wrapper {
  height: 24px;
}

.logo-img {
  height: 100%;
  width: auto;
  object-fit: contain;
}

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-main);
  padding: 0.5rem;
  margin: -0.5rem;
  transition: opacity 0.2s;
}

.menu-btn:hover {
  opacity: 0.7;
}

.home-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Decoration */
.bg-pattern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, var(--bg-color) 0%, #EFEFEA 100%);
  z-index: 0;
  pointer-events: none;
}
</style>