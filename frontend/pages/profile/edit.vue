<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">프로필 편집</h1>
        
        <form @submit.prevent="saveProfile" class="space-y-6">
          <!-- 프로필 이미지 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              프로필 이미지
            </label>
            <div class="flex items-center space-x-4">
              <img 
                :src="user?.profile_image || '/default-profile.png'" 
                :alt="user?.nickname"
                class="w-20 h-20 rounded-full object-cover"
              >
              <p class="text-sm text-gray-500">
                프로필 이미지는 소셜 로그인 계정에서 가져옵니다.
              </p>
            </div>
          </div>
          
          <!-- 닉네임 (읽기 전용) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input 
              type="text" 
              :value="user?.nickname"
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            >
          </div>
          
          <!-- 자기소개 -->
          <div>
            <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
              자기소개
            </label>
            <textarea 
              id="bio"
              v-model="bio"
              rows="4"
              maxlength="500"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="자신을 소개해주세요 (최대 500자)"
            ></textarea>
            <p class="mt-1 text-sm text-gray-500">{{ bio.length }}/500</p>
          </div>
          
          <!-- 프로필 공개 설정 -->
          <div>
            <label class="flex items-center space-x-3">
              <input 
                type="checkbox"
                v-model="isPublic"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              >
              <span class="text-sm font-medium text-gray-700">
                프로필 공개
              </span>
            </label>
            <p class="mt-1 text-sm text-gray-500 ml-7">
              비공개로 설정하면 팔로워만 프로필을 볼 수 있습니다.
            </p>
          </div>
          
          <!-- 버튼 -->
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="navigateTo(`/profile/${user?.id}`)"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ isSaving ? '저장 중...' : '저장' }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- 통계 정보 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">내 통계</h2>
        
        <div v-if="profile" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ profile.total_completed_days }}</div>
            <div class="text-sm text-gray-600">완료한 일수</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ profile.current_streak }}</div>
            <div class="text-sm text-gray-600">현재 연속</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ profile.longest_streak }}</div>
            <div class="text-sm text-gray-600">최장 연속</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ profile.followers_count }}</div>
            <div class="text-sm text-gray-600">팔로워</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProfileStore } from '~/stores/profile'
import { useAuthStore } from '~/stores/auth'

const profileStore = useProfileStore()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const profile = computed(() => profileStore.currentProfile)

const bio = ref('')
const isPublic = ref(true)
const isSaving = ref(false)

// 프로필 로드
onMounted(async () => {
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

// 인증 체크
onMounted(() => {
  if (!authStore.isAuthenticated) {
    navigateTo('/login')
  }
})
</script>