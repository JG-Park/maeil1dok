<template>
  <div class="settings-container">
    <div class="settings-box">
      <!-- Header -->
      <div class="settings-header">
        <button @click="handleBack" class="back-btn">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="page-title">계정 설정</h1>
        <div class="spacer"></div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>불러오는 중...</p>
      </div>

      <template v-else>
        <!-- 프로필 섹션 -->
        <section class="settings-section">
          <h2 class="section-title">프로필</h2>
          <div class="profile-card">
            <div class="profile-avatar">
              <img v-if="user?.profile_image" :src="user.profile_image" :alt="user.nickname">
              <div v-else class="avatar-placeholder">
                {{ user?.nickname?.charAt(0) || '?' }}
              </div>
            </div>
            <div class="profile-info">
              <p class="profile-nickname">{{ user?.nickname }}</p>
              <p class="profile-email">{{ linkedAccounts?.email || '이메일 없음' }}</p>
            </div>
          </div>
        </section>

        <!-- 비밀번호 섹션 -->
        <section class="settings-section">
          <h2 class="section-title">비밀번호</h2>
          <div class="section-content">
            <div class="setting-item">
              <div class="setting-info">
                <p class="setting-label">비밀번호 설정</p>
                <p class="setting-description">
                  {{ linkedAccounts?.has_password ? '비밀번호가 설정되어 있습니다' : '이메일 로그인을 위해 비밀번호를 설정하세요' }}
                </p>
              </div>
              <button 
                @click="showPasswordModal = true" 
                class="action-button"
              >
                {{ linkedAccounts?.has_password ? '변경' : '설정' }}
              </button>
            </div>
          </div>
        </section>

        <!-- 연결된 계정 섹션 -->
        <section class="settings-section">
          <h2 class="section-title">연결된 계정</h2>
          <div class="section-content">
            <!-- 카카오 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="provider-badge kakao">
                  <img src="@/assets/images/kakao.png" width="16" height="16" alt="카카오">
                  <span>카카오</span>
                </div>
                <p class="setting-description">
                  {{ getLinkedAccount('kakao')?.email || (isKakaoLinked ? '연결됨' : '연결되지 않음') }}
                </p>
              </div>
              <button 
                v-if="isKakaoLinked"
                @click="handleUnlink('kakao')" 
                class="action-button danger"
                :disabled="!canUnlink('kakao')"
              >
                연결 해제
              </button>
              <button 
                v-else
                @click="handleLinkKakao" 
                class="action-button primary"
              >
                연결
              </button>
            </div>

            <!-- 구글 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="provider-badge google">
                  <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>구글</span>
                </div>
                <p class="setting-description">
                  {{ getLinkedAccount('google')?.email || (isGoogleLinked ? '연결됨' : '연결되지 않음') }}
                </p>
              </div>
              <button 
                v-if="isGoogleLinked"
                @click="handleUnlink('google')" 
                class="action-button danger"
                :disabled="!canUnlink('google')"
              >
                연결 해제
              </button>
              <button 
                v-else
                @click="handleLinkGoogle" 
                class="action-button primary"
              >
                연결
              </button>
            </div>
          </div>
          <p class="section-note">
            * 최소 하나의 로그인 방법(비밀번호 또는 소셜 계정)이 있어야 합니다
          </p>
        </section>

        <!-- 로그아웃 -->
        <section class="settings-section">
          <button @click="handleLogout" class="logout-button">
            로그아웃
          </button>
        </section>
      </template>
    </div>

    <!-- 비밀번호 설정 모달 -->
    <Teleport to="body">
      <div v-if="showPasswordModal" class="modal-overlay" @click="showPasswordModal = false">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">{{ linkedAccounts?.has_password ? '비밀번호 변경' : '비밀번호 설정' }}</h3>
          <form @submit.prevent="handleSetPassword" class="password-form">
            <div v-if="linkedAccounts?.has_password" class="input-wrapper">
              <label>현재 비밀번호</label>
              <input 
                type="password" 
                v-model="currentPassword" 
                placeholder="현재 비밀번호"
                autocomplete="current-password"
              >
            </div>
            <div class="input-wrapper">
              <label>새 비밀번호</label>
              <input 
                type="password" 
                v-model="newPassword" 
                placeholder="8자 이상 (문자+숫자)"
                autocomplete="new-password"
              >
            </div>
            <div class="input-wrapper">
              <label>비밀번호 확인</label>
              <input 
                type="password" 
                v-model="newPasswordConfirm" 
                placeholder="비밀번호 재입력"
                autocomplete="new-password"
              >
            </div>
            <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
            <div class="modal-actions">
              <button type="button" @click="showPasswordModal = false" class="btn-cancel">취소</button>
              <button type="submit" class="btn-confirm" :disabled="passwordLoading">
                {{ passwordLoading ? '처리 중...' : '저장' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useHead } from '#imports'
import { useModal } from '~/composables/useModal'
import { useNavigation } from '~/composables/useNavigation'
import { useApi } from '~/composables/useApi'
import { useRuntimeConfig } from 'nuxt/app'

useHead({
  title: '계정 설정 - 매일일독',
})

const auth = useAuthStore()
const modal = useModal()
const api = useApi()
const config = useRuntimeConfig()
const { goBack } = useNavigation()

const loading = ref(true)
const linkedAccounts = ref<any>(null)
const user = computed(() => auth.user)

// Password modal
const showPasswordModal = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const passwordError = ref('')
const passwordLoading = ref(false)

// Computed
const isKakaoLinked = computed(() => 
  linkedAccounts.value?.linked_accounts?.some((a: any) => a.provider === 'kakao')
)
const isGoogleLinked = computed(() => 
  linkedAccounts.value?.linked_accounts?.some((a: any) => a.provider === 'google')
)

const getLinkedAccount = (provider: string) => 
  linkedAccounts.value?.linked_accounts?.find((a: any) => a.provider === provider)

const canUnlink = (provider: string) => {
  const account = getLinkedAccount(provider)
  return account?.can_unlink ?? false
}

// Methods
const fetchLinkedAccounts = async () => {
  try {
    const response = await api.get('/api/v1/auth/linked-accounts/')
    linkedAccounts.value = response.data || response
  } catch (error) {
    console.error('Failed to fetch linked accounts:', error)
  } finally {
    loading.value = false
  }
}

const handleLinkKakao = () => {
  const redirectUri = encodeURIComponent(config.public.KAKAO_REDIRECT_URI + '?action=link')
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${config.public.KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`
  window.location.href = kakaoAuthUrl
}

const handleLinkGoogle = () => {
  const redirectUri = encodeURIComponent(config.public.GOOGLE_REDIRECT_URI + '?action=link')
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.public.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`
  window.location.href = googleAuthUrl
}

const handleUnlink = async (provider: string) => {
  const confirmed = await modal.confirm({
    title: '계정 연결 해제',
    description: `${provider === 'kakao' ? '카카오' : '구글'} 계정 연결을 해제하시겠습니까?`,
    confirmText: '해제',
    confirmVariant: 'danger'
  })

  if (!confirmed) return

  try {
    await api.post('/api/v1/auth/unlink-social/', { provider })
    await modal.alert({
      title: '연결 해제 완료',
      description: '소셜 계정 연결이 해제되었습니다.',
      icon: 'success'
    })
    await fetchLinkedAccounts()
  } catch (error: any) {
    await modal.alert({
      title: '연결 해제 실패',
      description: error?.data?.error || '연결 해제에 실패했습니다.',
      icon: 'error'
    })
  }
}

const handleSetPassword = async () => {
  passwordError.value = ''

  if (newPassword.value.length < 8) {
    passwordError.value = '비밀번호는 8자 이상이어야 합니다'
    return
  }
  if (!/\d/.test(newPassword.value)) {
    passwordError.value = '비밀번호는 최소 1개의 숫자를 포함해야 합니다'
    return
  }
  if (!/[a-zA-Z]/.test(newPassword.value)) {
    passwordError.value = '비밀번호는 최소 1개의 문자를 포함해야 합니다'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    passwordError.value = '비밀번호가 일치하지 않습니다'
    return
  }

  passwordLoading.value = true
  try {
    await api.post('/api/v1/auth/set-password/', {
      current_password: currentPassword.value || undefined,
      new_password: newPassword.value,
      new_password_confirm: newPasswordConfirm.value
    })
    
    await modal.alert({
      title: '비밀번호 설정 완료',
      description: '비밀번호가 성공적으로 설정되었습니다.',
      icon: 'success'
    })
    
    showPasswordModal.value = false
    currentPassword.value = ''
    newPassword.value = ''
    newPasswordConfirm.value = ''
    await fetchLinkedAccounts()
  } catch (error: any) {
    passwordError.value = error?.data?.error || '비밀번호 설정에 실패했습니다.'
  } finally {
    passwordLoading.value = false
  }
}

const handleLogout = async () => {
  const confirmed = await modal.confirm({
    title: '로그아웃',
    description: '정말 로그아웃하시겠습니까?',
    confirmText: '로그아웃',
    confirmVariant: 'danger'
  })

  if (confirmed) {
    await auth.logout()
    navigateTo('/')
  }
}

const handleBack = () => {
  goBack('/')
}

onMounted(() => {
  if (!auth.isAuthenticated) {
    navigateTo('/login')
    return
  }
  fetchLinkedAccounts()
})
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background-color: var(--color-bg-base);
  padding-bottom: env(safe-area-inset-bottom);
}

.settings-box {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-slate-600);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--color-slate-100);
  color: var(--color-slate-800);
}

.page-title {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-slate-800);
  margin: 0;
}

.spacer {
  width: 40px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-slate-500);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-slate-200);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-slate-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding-left: 0.25rem;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 1px solid var(--color-slate-200);
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-light);
  color: var(--primary-color);
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-nickname {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate-800);
  margin: 0 0 0.25rem;
}

.profile-email {
  font-size: 0.875rem;
  color: var(--color-slate-500);
  margin: 0;
}

.section-content {
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 1px solid var(--color-slate-200);
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-slate-100);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-slate-800);
  margin: 0 0 0.25rem;
}

.setting-description {
  font-size: 0.8125rem;
  color: var(--color-slate-500);
  margin: 0;
}

.provider-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-slate-800);
  margin-bottom: 0.25rem;
}

.action-button {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--color-slate-300);
  background: var(--color-bg-card);
  color: var(--color-slate-700);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-button:hover:not(:disabled) {
  background: var(--color-slate-100);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.action-button.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.action-button.danger:hover:not(:disabled) {
  background: #fef2f2;
}

.section-note {
  font-size: 0.75rem;
  color: var(--color-slate-500);
  margin-top: 0.5rem;
  padding-left: 0.25rem;
}

.logout-button {
  width: 100%;
  padding: 0.875rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #dc2626;
  background: var(--color-bg-card);
  border: 1px solid var(--color-slate-200);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: #fef2f2;
  border-color: #fecaca;
}

/* Modal */
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
  background: var(--color-bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-slate-800);
  margin: 0 0 1.5rem;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.input-wrapper label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-slate-600);
}

.input-wrapper input {
  padding: 0.75rem;
  border: 1px solid var(--color-slate-300);
  border-radius: 8px;
  font-size: 0.9375rem;
  background: var(--color-bg-base);
  color: var(--color-slate-800);
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.error-text {
  font-size: 0.8125rem;
  color: #dc2626;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  color: var(--color-slate-700);
}

.btn-cancel:hover {
  background: var(--color-slate-200);
}

.btn-confirm {
  background: var(--primary-color);
  border: none;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Dark mode */
[data-theme="dark"] .back-btn:hover {
  background: var(--color-slate-700);
}

[data-theme="dark"] .page-title,
[data-theme="dark"] .profile-nickname,
[data-theme="dark"] .setting-label,
[data-theme="dark"] .provider-badge,
[data-theme="dark"] .modal-title {
  color: var(--color-slate-100);
}

[data-theme="dark"] .profile-card,
[data-theme="dark"] .section-content,
[data-theme="dark"] .logout-button,
[data-theme="dark"] .modal-content {
  background: var(--color-bg-secondary);
  border-color: var(--color-slate-700);
}

[data-theme="dark"] .setting-item {
  border-color: var(--color-slate-700);
}

[data-theme="dark"] .action-button {
  background: var(--color-bg-secondary);
  border-color: var(--color-slate-600);
  color: var(--color-slate-300);
}

[data-theme="dark"] .action-button:hover:not(:disabled) {
  background: var(--color-slate-700);
}

[data-theme="dark"] .input-wrapper input {
  background: var(--color-bg-primary);
  border-color: var(--color-slate-600);
  color: var(--color-slate-100);
}

@media (max-width: 640px) {
  .settings-box {
    padding: 0.75rem;
  }
}
</style>
