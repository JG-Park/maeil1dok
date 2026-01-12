<template>
  <nav class="floating-nav">
    <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' || route.path === '/temp-home' }">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="9 22 9 12 15 12 15 22" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="nav-label">홈</span>
    </NuxtLink>
    
    <NuxtLink to="/bible" class="nav-item" :class="{ active: route.path.startsWith('/bible') }">
      <BookIcon size="20" />
      <span class="nav-label">성경</span>
    </NuxtLink>
    
    <NuxtLink :to="profileLink" class="nav-item" :class="{ active: route.path.startsWith('/profile') }">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="nav-label">프로필</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import BookIcon from '~/components/icons/BookIcon.vue';

const route = useRoute();
const authStore = useAuthStore();

const profileLink = computed(() => {
  return authStore.user ? `/profile/${authStore.user.id}` : '/login';
});
</script>

<style scoped>
.floating-nav {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(44, 51, 51, 0.9);
  backdrop-filter: blur(10px);
  padding: 0.5rem 0.5rem;
  border-radius: 999px;
  display: flex;
  gap: 0.25rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  z-index: 100;
  max-width: 90%;
}

.nav-item {
  padding: 0.75rem 1.25rem;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 0.875rem;
  border-radius: 999px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-item:hover:not(.active) {
  color: white;
  background: rgba(255,255,255,0.1);
}

.nav-item.active {
  background: white;
  color: #2C3333; /* var(--text-main) */
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nav-label {
  display: inline-block;
}

@media (max-width: 400px) {
  .nav-item {
    padding: 0.75rem 1rem;
  }
  
  .nav-label {
    display: none;
  }
  
  .nav-item.active .nav-label {
    display: inline-block;
  }
}
</style>