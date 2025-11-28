<template>
  <div class="container">
    <!-- 고정 영역 -->
    <div class="fixed-area">
      <PageHeader title="프로필 편집" />
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <div class="content-wrapper">
        <!-- 프로필 편집 폼 -->
      <Card class="fade-in" elevated>
        <form @submit.prevent="saveProfile" class="space-y-6">
          <!-- 프로필 이미지 -->
          <div>
            <label class="form-label">프로필 이미지</label>
            <div class="flex items-center space-x-4">
              <img
                :src="user?.profile_image || '/default-profile.png'"
                :alt="user?.nickname"
                class="profile-image"
                @error="(e) => e.target.src = '/default-profile.png'"
              >
              <p class="text-sm text-gray-500">
                프로필 이미지는 소셜 로그인 계정에서 가져옵니다.
              </p>
            </div>
          </div>

          <!-- 닉네임 (읽기 전용) -->
          <div>
            <label class="form-label">닉네임</label>
            <input
              type="text"
              :value="user?.nickname"
              disabled
              class="input-field disabled"
            >
          </div>

          <!-- 자기소개 -->
          <div>
            <label for="bio" class="form-label">자기소개</label>
            <textarea
              id="bio"
              v-model="bio"
              rows="4"
              maxlength="500"
              class="input-field"
              placeholder="자신을 소개해주세요 (최대 500자)"
            ></textarea>
            <p class="mt-1 text-sm text-gray-500">{{ bio.length }}/500</p>
          </div>

          <!-- 프로필 공개 설정 -->
          <div>
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="isPublic"
                class="checkbox-input"
              >
              <span>프로필 공개</span>
            </label>
            <p class="mt-1 text-sm text-gray-500 ml-7">
              비공개로 설정하면 팔로워만 프로필을 볼 수 있습니다.
            </p>
          </div>

          <!-- 버튼 -->
          <div class="button-group">
            <button
              type="button"
              @click="navigateTo(`/profile/${user?.id}`)"
              class="btn-secondary"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="btn-primary"
            >
              {{ isSaving ? '저장 중...' : '저장' }}
            </button>
          </div>
        </form>
      </Card>

      <!-- 통계 정보 -->
      <Card v-if="profile" class="mt-6 fade-in delay-100">
        <h2 class="stats-title">내 통계</h2>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value primary">{{ profile.total_completed_days }}</div>
            <div class="stat-label">완료한 일수</div>
          </div>
          <div class="stat-item">
            <div class="stat-value success">{{ profile.current_streak }}</div>
            <div class="stat-label">현재 연속</div>
          </div>
          <div class="stat-item">
            <div class="stat-value purple">{{ profile.longest_streak }}</div>
            <div class="stat-label">최장 연속</div>
          </div>
          <div class="stat-item">
            <div class="stat-value orange">{{ profile.followers_count }}</div>
            <div class="stat-label">팔로워</div>
          </div>
        </div>
      </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProfileStore } from '~/stores/profile'
import { useAuthStore } from '~/stores/auth'
import PageHeader from '~/components/common/PageHeader.vue'
import Card from '~/components/common/Card.vue'

const profileStore = useProfileStore()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const profile = computed(() => profileStore.currentProfile)

const bio = ref('')
const isPublic = ref(true)
const isSaving = ref(false)

// 프로필 로드
onMounted(async () => {
  // 인증 체크
  if (!authStore.isAuthenticated) {
    navigateTo('/login')
    return
  }

  if (user.value) {
    await profileStore.fetchProfile(user.value.id)
    if (profile.value) {
      bio.value = profile.value.bio || ''
      isPublic.value = profile.value.is_public
    }
  }
})

// 프로필 저장
const saveProfile = async () => {
  isSaving.value = true

  try {
    const result = await profileStore.updateProfile(bio.value, isPublic.value)

    if (result.success) {
      await navigateTo(`/profile/${user.value?.id}`)
    } else {
      alert(result.error || '프로필 저장에 실패했습니다.')
    }
  } catch (error) {
    alert('프로필 저장 중 오류가 발생했습니다.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  height: 100vh;
  height: 100dvh; /* 동적 뷰포트 높이 */
  display: flex;
  flex-direction: column;
  background: var(--background-color);
  position: relative;
  width: 100%;
}

.fixed-area {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

.scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* iOS 안전영역 대응 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .scroll-area {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

.content-wrapper {
  padding: 1rem;
}

.profile-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--gray-200);
}

.input-field.disabled {
  background: var(--gray-50);
  color: var(--gray-500);
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary,
.btn-primary {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
}

.btn-secondary {
  background: var(--gray-100);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--gray-200);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-value.primary { color: var(--primary-color); }
.stat-value.success { color: var(--success); }
.stat-value.purple { color: #8B5CF6; }
.stat-value.orange { color: #F97316; }

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>
