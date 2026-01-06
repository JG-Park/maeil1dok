<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">프로필 편집</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- 프로필 이미지 -->
        <div class="form-group">
          <label class="form-label">프로필 이미지</label>
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <img
                v-if="profile.user.profile_image && !imageError"
                :src="profile.user.profile_image"
                :alt="profile.user.nickname"
                class="avatar-image"
                @error="handleImageError"
              >
              <div v-else class="avatar-placeholder">
                <i class="fa-solid fa-user"></i>
              </div>
            </div>
            <p class="form-hint">소셜 로그인 계정에서 가져옵니다.</p>
          </div>
        </div>

        <!-- 닉네임 (읽기 전용) -->
        <div class="form-group">
          <label class="form-label">닉네임</label>
          <input
            type="text"
            :value="profile.user.nickname"
            disabled
            class="form-input disabled"
          >
        </div>

        <!-- 자기소개 -->
        <div class="form-group">
          <label for="bio" class="form-label">자기소개</label>
          <textarea
            id="bio"
            v-model="bio"
            rows="4"
            maxlength="500"
            class="form-textarea"
            placeholder="자신을 소개해주세요 (최대 500자)"
          ></textarea>
          <p class="form-hint char-count">{{ bio.length }}/500</p>
        </div>

        <!-- 프로필 공개 설정 -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="isPublic"
              class="checkbox-input"
            >
            <span>프로필 공개</span>
          </label>
          <p class="form-hint checkbox-hint">
            비공개로 설정하면 팔로워만 프로필을 볼 수 있습니다.
          </p>
        </div>

        <!-- 버튼 -->
        <div class="modal-footer">
          <button
            type="button"
            @click="$emit('close')"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProfileStore } from '~/stores/profile'
import { useModal } from '~/composables/useModal'

interface ProfileData {
  user: {
    id: number
    nickname: string
    profile_image?: string
  }
  bio: string
  is_public: boolean
}

const props = defineProps<{
  profile: ProfileData
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const profileStore = useProfileStore()
const modal = useModal()

const bio = ref('')
const isPublic = ref(true)
const isSaving = ref(false)
const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

onMounted(() => {
  bio.value = props.profile.bio || ''
  isPublic.value = props.profile.is_public
})

const handleSubmit = async () => {
  isSaving.value = true

  try {
    const result = await profileStore.updateProfile(bio.value, isPublic.value)

    if (result.success) {
      emit('saved')
      emit('close')
    } else {
      await modal.alert({
        title: '저장 실패',
        description: result.error || '프로필 저장에 실패했습니다.',
        icon: 'error'
      })
    }
  } catch (error) {
    await modal.alert({
      title: '오류 발생',
      description: '프로필 저장 중 오류가 발생했습니다.',
      icon: 'error'
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
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
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #E2E8F0;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748B;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #F1F5F9;
  color: #1E293B;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #E2E8F0;
  flex-shrink: 0;
}

.avatar-image {
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
  background: #EFF6FF;
  color: #3B82F6;
  font-size: 1.5rem;
}

.form-input {
  padding: 0.625rem 0.875rem;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #1E293B;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.disabled {
  background: #F8FAFC;
  color: #94A3B8;
  cursor: not-allowed;
}

.form-textarea {
  padding: 0.625rem 0.875rem;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #1E293B;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  font-size: 0.8125rem;
  color: #64748B;
  margin: 0;
}

.char-count {
  text-align: right;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  font-size: 0.9375rem;
  color: #1E293B;
}

.checkbox-input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: #3B82F6;
  cursor: pointer;
}

.checkbox-hint {
  margin-left: 1.75rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  margin-top: auto;
}

.btn-secondary,
.btn-primary {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-secondary {
  background: #F1F5F9;
  color: #475569;
}

.btn-secondary:hover {
  background: #E2E8F0;
}

.btn-primary {
  background: #1E293B;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #334155;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-content {
    max-width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }
}
</style>
