<template>
  <!-- 최상위 요소를 Teleport로 감싸서 body에 직접 렌더링하도록 변경 -->
  <Teleport to="body">
    <div>
      <!-- 메뉴 오버레이 -->
      <Transition name="fade">
        <div v-if="isOpen" class="menu-overlay" @click="$emit('close')">
          <div class="menu-container" @click.stop>
            <!-- 메뉴 패널 -->
            <Transition name="slide">
              <div v-if="isOpen" class="menu-panel">
                <div class="menu-header">
                  <h2>메뉴</h2>
                  <div class="header-actions">
                    <!-- 다크모드 토글 버튼 -->
                    <button 
                      class="theme-toggle-button" 
                      @click="toggleTheme"
                      :title="currentTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
                      aria-label="테마 전환"
                    >
                      <!-- Sun icon (다크모드일 때 표시) -->
                      <svg v-if="currentTheme === 'dark'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                      <!-- Moon icon (라이트모드일 때 표시) -->
                      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                      </svg>
                    </button>
                    <button class="close-button" @click="$emit('close')" aria-label="메뉴 닫기">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <nav class="menu-items">
                  <!-- 공지사항 메뉴 아이템 추가 (가장 위에 배치) -->
                  <NuxtLink to="/notice" class="menu-item" @click="$emit('close')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path
                        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z">
                      </path>
                    </svg>
                    <span>공지사항</span>
                  </NuxtLink>

                  <NuxtLink to="/reading" class="menu-item" @click="$emit('close')">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span>오늘일독</span>
                  </NuxtLink>

                  <NuxtLink to="/plan" class="menu-item" @click="$emit('close')">
                    <svg class="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15M9 5C9 5.53043 9.21071 6.03914 9.58579 6.41421C9.96086 6.78929 10.4696 7 11 7H13C13.5304 7 14.0391 6.78929 14.4142 6.41421C14.7893 6.03914 15 5.53043 15 5M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M9 12H15M9 16H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                    <span>성경통독표</span>
                  </NuxtLink>

                  <NuxtLink to="/plans" class="menu-item" @click="$emit('close')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>플랜 관리</span>
                  </NuxtLink>

                  <!-- 구분선 -->
                  <div class="menu-divider"></div>

                  <!-- 소셜 기능 메뉴들 -->
                  <NuxtLink 
                    v-if="user"
                    :to="`/profile/${user.id}`" 
                    class="menu-item" 
                    @click="$emit('close')"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>내 프로필</span>
                  </NuxtLink>

                  <NuxtLink to="/scoreboard" class="menu-item" @click="$emit('close')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3" y2="6"></line>
                      <line x1="3" y1="12" x2="3" y2="12"></line>
                      <line x1="3" y1="18" x2="3" y2="18"></line>
                    </svg>
                    <span>리더보드</span>
                  </NuxtLink>

                  <NuxtLink to="/groups" class="menu-item" @click="$emit('close')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>그룹</span>
                  </NuxtLink>

                  <NuxtLink to="/friends" class="menu-item" @click="$emit('close')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    <span>친구</span>
                  </NuxtLink>
                </nav>

                <!-- 하단 정보 영역 추가 -->
                <div class="menu-footer">
                  <div class="app-version">
                    <img src="@/assets/images/maeil1dok_footer.png" alt="매일일독" class="footer-logo"><span> v2.6.4</span>
                  </div>
                  <div class="github-link-container">
                    <a href="https://github.com/JG-Park/maeil1dok/" target="_blank" rel="noopener noreferrer"
                      class="github-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg" class="github-icon">
                        <path
                          d="M12 2C6.477 2 2 6.477 2 12C2 16.418 4.865 20.166 8.84 21.489C9.34 21.581 9.52 21.276 9.52 21.012C9.52 20.775 9.512 20.143 9.508 19.308C6.726 19.91 6.139 17.96 6.139 17.96C5.685 16.811 5.028 16.508 5.028 16.508C4.128 15.927 5.095 15.939 5.095 15.939C6.092 16.01 6.626 16.929 6.626 16.929C7.521 18.452 8.969 18.007 9.54 17.752C9.631 17.09 9.889 16.646 10.175 16.419C7.955 16.189 5.62 15.367 5.62 11.613C5.62 10.546 6.01 9.678 6.646 9.003C6.545 8.75 6.197 7.797 6.746 6.602C6.746 6.602 7.586 6.335 9.497 7.78C10.3 7.559 11.15 7.449 12 7.444C12.85 7.449 13.7 7.559 14.504 7.78C16.414 6.335 17.253 6.602 17.253 6.602C17.803 7.797 17.455 8.75 17.354 9.003C17.991 9.678 18.379 10.546 18.379 11.613C18.379 15.376 16.04 16.185 13.813 16.411C14.172 16.692 14.492 17.253 14.492 18.105C14.492 19.308 14.479 20.683 14.479 21.012C14.479 21.278 14.657 21.586 15.165 21.487C19.137 20.161 22 16.416 22 12C22 6.477 17.523 2 12 2Z" />
                      </svg>
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useReadingSettingsStore } from '@/stores/readingSettings'
import { computed } from 'vue'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])
const authStore = useAuthStore()
const readingSettingsStore = useReadingSettingsStore()
const user = computed(() => authStore.user)

// Theme
const currentTheme = computed(() => readingSettingsStore.effectiveTheme)
const toggleTheme = () => {
  const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
  readingSettingsStore.updateSetting('theme', newTheme)
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 999;
  display: flex;
  justify-content: flex-end;
  width: 100vw;
  height: 100vh;
}

.menu-container {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 100%;
  z-index: 1000;
}

.menu-panel {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
  padding: 1rem;
  box-shadow: -4px 0 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.menu-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Theme Toggle Button */
.theme-toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-slate-100, #f1f5f9);
  color: var(--color-slate-700, #334155);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle-button:hover {
  background: var(--color-slate-200, #e2e8f0);
  transform: scale(1.05);
}

.theme-toggle-button:active {
  transform: scale(0.95);
}

.close-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
}

.close-button:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.95rem;
}

.menu-item:hover {
  background: var(--primary-light);
  color: var(--primary-color);
  transform: translateX(4px);
}

.menu-item:active {
  transform: translateX(2px);
}

.menu-item svg {
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.menu-item:hover svg {
  color: var(--primary-color);
  transform: scale(1.1);
}

.menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0.75rem 0;
}

.menu-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding: 1rem 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.app-version {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.8;
  gap: 0.25rem;
}

.app-version img {
  max-height: 0.75rem;;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .menu-container {
    max-width: 85%;
  }

  .menu-panel {
    padding: 1.25rem 0.75rem;
  }

  .menu-item {
    padding: 0.75rem 0.875rem;
  }

  .menu-item:active {
    background: var(--primary-light);
    transform: translateX(2px);
  }
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .menu-panel {
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
  }
}


/* GitHub 링크 스타일 */
.github-link-container {
  display: flex;
  justify-content: center;
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

/* Tablet: iPad Mini and similar */
@media (min-width: 768px) {
  .menu-content {
    width: 400px;
  }

  .menu-item {
    padding: 1rem 1.5rem;
    font-size: 1.0625rem;
  }

  .menu-item svg {
    width: 22px;
    height: 22px;
  }

  .github-link {
    padding: 1rem 1.5rem;
    font-size: 0.9375rem;
  }
}

/* Tablet Large: iPad Pro and larger tablets */
@media (min-width: 1024px) {
  .menu-content {
    width: 450px;
  }

  .menu-item {
    padding: 1.25rem 2rem;
    font-size: 1.125rem;
  }

  .menu-item svg {
    width: 24px;
    height: 24px;
  }

  .github-link {
    padding: 1.25rem 2rem;
    font-size: 1rem;
  }
}

/* ====== 다크모드 스타일 ====== */
:root.dark .menu-panel {
  background: var(--color-bg-primary, #1a1a1a);
  box-shadow: -4px 0 25px rgba(0, 0, 0, 0.4);
}

:root.dark .menu-header h2 {
  color: var(--text-primary, #f3f4f6);
}

:root.dark .close-button {
  color: var(--text-secondary, #9ca3af);
  background: var(--primary-color, #4f46e5);
}

:root.dark .close-button svg {
  color: white;
}

:root.dark .close-button:hover {
  background: var(--primary-dark, #4338ca);
  color: white;
}

:root.dark .menu-item {
  color: var(--text-primary, #f3f4f6);
}

:root.dark .menu-item svg {
  stroke: var(--text-secondary, #9ca3af);
}

:root.dark .menu-item:hover {
  background: var(--color-bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--primary-color, #818cf8);
}

:root.dark .menu-item:hover svg {
  stroke: var(--primary-color, #818cf8);
}

:root.dark .menu-divider {
  background: rgba(255, 255, 255, 0.1);
}

:root.dark .menu-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

:root.dark .app-version {
  color: var(--text-secondary, #9ca3af);
}

:root.dark .github-link {
  color: var(--text-secondary, #9ca3af);
}

:root.dark .github-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary, #f3f4f6);
}

:root.dark .theme-toggle-button {
  background: var(--color-slate-700, #334155);
  color: var(--color-slate-200, #e2e8f0);
}

:root.dark .theme-toggle-button:hover {
  background: var(--color-slate-600, #475569);
}

</style>