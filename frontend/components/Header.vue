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
        >
          로그아웃
        </button>
        <NuxtLink 
          v-else 
          to="/login"
          class="auth-button"
        >
          로그인
        </NuxtLink>
      </template>
      <button class="menu-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.title {
  display: flex;
  align-items: center;
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
  background: var(--primary-color);
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border-radius: 0.375rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.auth-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.auth-button:active {
  transform: translateY(0);
}

.menu-button {
  background: none;
  border: none;
  padding: 0.5rem;
  margin: -0.5rem;
  color: #333;
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
</style> 