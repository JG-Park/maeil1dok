<template>
  <header class="header">
    <h1 class="title">
      <img src="~/assets/images/로고_투명.png" alt="매일일독" class="logo">
    </h1>
    <div class="header-controls">
      <template v-if="!isAuthPage">
        <button 
          v-if="auth.user" 
          @click="handleLogout" 
          class="auth-button"
          title="로그아웃"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <NuxtLink 
          v-else 
          to="/login"
          class="auth-button"
          title="로그인"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 17L15 12L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </NuxtLink>
      </template>
      <button class="menu-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const isAuthPage = computed(() => {
  return ['/login', '/register'].includes(route.path)
})

const handleLogout = () => {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  letter-spacing: -0.05em;
  height: 56px;
}

.title {
  display: flex;
  align-items: center;
  margin-left: 0.5rem; /* 로고 왼쪽 여백 추가 */
}

.logo {
  height: 20px;
  width: auto;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-button {
  background: none; /* 배경 제거 */
  border: none;
  padding: 0.375rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border-radius: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.auth-button:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.auth-button:active {
  transform: translateY(0);
}

.auth-button svg {
  width: 20px;
  height: 20px;
}

.menu-button {
  background: none;
  border: none;
  padding: 0.375rem;
  margin: -0.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-button:hover {
  opacity: 0.7;
}

.menu-button:active {
  transform: scale(0.95);
}

.menu-button svg {
  width: 20px;
  height: 20px;
}
</style> 