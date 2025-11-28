<template>
  <div class="header-wrapper">
    <header class="header">
      <NuxtLink to="/" class="logo-link">
        <img src="~/assets/images/로고_투명.png" alt="매일일독" class="logo">
      </NuxtLink>
      <div class="header-controls">
        <div class="auth-buttons">
          <template v-if="!isAuthPage">
            <template v-if="user">
              <!-- 프로필 드롭다운 -->
              <div class="profile-dropdown" ref="profileDropdown">
                <button 
                  @click="toggleProfileMenu"
                  class="profile-button"
                  title="프로필 메뉴"
                >
                  <img 
                    v-if="user.profile_image" 
                    :src="user.profile_image" 
                    :alt="user.nickname"
                    class="profile-image"
                  >
                  <div v-else class="profile-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                </button>
                
                <!-- 드롭다운 메뉴 -->
                <transition name="dropdown">
                  <div v-if="isProfileMenuOpen" class="dropdown-menu">
                    <div class="dropdown-header">
                      <p class="dropdown-nickname">{{ user.nickname }}</p>
                      <p class="dropdown-email">{{ user.email }}</p>
                    </div>
                    <div class="dropdown-divider"></div>
                    <NuxtLink 
                      :to="`/profile/${user.id}`" 
                      class="dropdown-item"
                      @click="closeProfileMenu"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      내 프로필
                    </NuxtLink>
                    <NuxtLink 
                      to="/profile/edit" 
                      class="dropdown-item"
                      @click="closeProfileMenu"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      프로필 편집
                    </NuxtLink>
                    <div class="dropdown-divider"></div>
                    <button 
                      @click="handleLogout" 
                      class="dropdown-item text-red"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      로그아웃
                    </button>
                  </div>
                </transition>
              </div>
            </template>
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
              <span class="button-text">로그인</span>
            </NuxtLink>
          </template>
        </div>
        <button class="menu-button" @click="isMenuOpen = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  </div>
  <Menu :is-open="isMenuOpen" @close="isMenuOpen = false" />
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { computed, ref, inject, onMounted, onUnmounted } from 'vue'
import Menu from '~/components/Menu.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isMenuOpen = ref(false)
const isProfileMenuOpen = ref(false)
const profileDropdown = ref(null)
const toast = inject('toast')

const user = computed(() => authStore.user)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const isAuthPage = computed(() => {
  return ['/login', '/register'].includes(route.path)
})

const toggleProfileMenu = () => {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
}

const closeProfileMenu = () => {
  isProfileMenuOpen.value = false
}

const handleLogout = () => {
  closeProfileMenu()
  authStore.logout()
  toast.value?.show('로그아웃 되었어요.')
  router.push('/')
}

// 외부 클릭 감지
const handleClickOutside = (event) => {
  if (profileDropdown.value && !profileDropdown.value.contains(event.target)) {
    closeProfileMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.header-wrapper {
  width: 100%;
}

.header {
  max-width: 768px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  letter-spacing: -0.05em;
  height: 56px;
}

.logo-link {
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.logo {
  height: 20px;
  width: auto;
  margin-left: 5px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.auth-button:hover {
  background: var(--primary-light);
}

.button-text {
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 640px) {
  .auth-button {
    padding: 0.5rem 0.75rem; /* 패딩 약간 줄임 */
  }
  
  .button-text {
    font-size: 0.8125rem; /* 글자 크기 약간 줄임 */
  }
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

.profile-dropdown {
  position: relative;
}

.profile-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background: none;
  cursor: pointer;
}

.profile-button:hover {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #E5E7EB;
  z-index: 100;
  overflow: hidden;
}

.dropdown-header {
  padding: 12px 16px;
  background: #F9FAFB;
}

.dropdown-nickname {
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.dropdown-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
}

.dropdown-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.15s ease;
  font-size: 0.875rem;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #F3F4F6;
}

.dropdown-item.text-red {
  color: #DC2626;
}

.dropdown-item.text-red:hover {
  background: #FEF2F2;
}

/* 드롭다운 애니메이션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-light);
  color: var(--primary-color);
}

@media (max-width: 640px) {
  .profile-button {
    width: 32px;
    height: 32px;
  }
}
</style> 