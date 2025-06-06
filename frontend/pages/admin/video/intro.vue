<template>
  <div class="container">
    <!-- 고정 헤더 -->
    <div class="header fade-in">
      <button class="back-button" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
      <h1>성경 영상 개론 관리</h1>
      <button v-if="isStaff" @click="openUploadModal" class="btn btn-primary btn-sm">
        엑셀 업로드
      </button>
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll-area">
      <div v-if="!authStore.isAuthenticated" class="unauthorized-prompt fade-in" style="animation-delay: 0.2s">
        <p class="text-lg text-gray-600 mb-4">
          로그인이 필요한 페이지입니다.
        </p>
        <button @click="$router.push('/login')" class="login-button">로그인하기</button>
      </div>

      <div v-else-if="!isStaff" class="unauthorized-prompt fade-in" style="animation-delay: 0.2s">
        <p>관리자 권한이 필요한 페이지입니다.</p>
      </div>

      <div v-else class="content-section fade-in" style="animation-delay: 0.2s">
        <!-- 플랜 선택 필터 -->
        <div class="filter-section">
          <label class="filter-label">플랜 선택:</label>
          <select v-model="selectedPlanId" class="plan-select" @change="fetchVideoIntros">
            <option value="">모든 플랜</option>
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
          </select>
        </div>

        <!-- 영상 개론 목록 -->
        <div v-if="loading" class="loading-indicator">
          <p>데이터를 불러오는 중...</p>
        </div>

        <div v-else-if="videoIntros.length === 0" class="empty-state">
          <p>등록된 영상 개론이 없습니다.</p>
          <p class="text-sm text-gray-500 mt-2">엑셀 업로드 버튼을 눌러 영상 개론을 추가해보세요.</p>
        </div>

        <div v-else class="video-intro-grid">
          <div v-for="intro in videoIntros" :key="intro.id" class="video-intro-card">
            <div class="video-intro-card-content">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="video-intro-title">{{ intro.book }}</h3>
                  <p class="video-intro-period">
                    {{ formatDate(intro.start_date) }} ~ {{ formatDate(intro.end_date) }}
                  </p>
                  <p class="video-intro-plan">
                    플랜: {{ intro.plan_name }}
                  </p>
                  <div class="video-intro-link">
                    <a :href="intro.url_link" target="_blank" class="link-button">
                      영상 보기
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M15 3H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round" />
                        <path d="M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                          stroke-linejoin="round" />
                      </svg>
                    </a>
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <button @click="deleteVideoIntro(intro.id)" class="action-button delete">삭제</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 수정된 업로드 모달 -->
    <div v-if="showUploadModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">영상 개론 엑셀 업로드</h3>
          <button class="close-button" @click="showUploadModal = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="uploadExcel" class="space-y-4">
            <div>
              <label class="label">플랜 선택</label>
              <select v-model="uploadForm.planId" class="select select-bordered w-full" required>
                <option value="" disabled>플랜을 선택하세요</option>
                <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
              </select>
            </div>

            <div>
              <label class="label">엑셀 파일</label>
              <input type="file" ref="fileInput" accept=".xlsx, .xls" class="file-input w-full" required
                @change="handleFileChange" />
              <div class="text-xs text-gray-500 mt-1">최대 5MB 크기의 .xlsx 또는 .xls 파일</div>
            </div>

            <div class="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
              <p class="text-sm font-medium text-blue-800 mb-2">엑셀 파일 작성 방법:</p>
              <ul class="text-xs text-blue-700 space-y-1 pl-4 list-disc">
                <li>필수 컬럼: <strong>시작일, 종료일, 성경, URL</strong> (정확히 이 이름으로 작성)</li>
                <li>날짜 형식: 다음 형식 모두 지원
                  <ul class="pl-4 mt-1 list-disc">
                    <li><strong>YYYY년 MM월 DD일</strong> (예: 2025년 2월 2일)</li>
                    <li><strong>YYYY-MM-DD</strong> (예: 2025-02-02)</li>
                    <li>일반 엑셀 날짜 셀 형식</li>
                  </ul>
                </li>
                <li>URL은 반드시 <strong>http://</strong> 또는 <strong>https://</strong>로 시작해야 함</li>
                <li>성경 이름은 정확히 작성 (예: 창세기, 요한복음 등)</li>
              </ul>
              <div class="mt-3">
                <a href="/sample-video-intro.xlsx" class="text-xs text-blue-600 flex items-center hover:underline"
                  target="_blank">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                      clip-rule="evenodd"></path>
                  </svg>
                  샘플 엑셀 파일 다운로드
                </a>
              </div>
            </div>

            <!-- 업로드 오류 메시지 표시 영역 -->
            <div v-if="uploadErrors.length > 0" class="mt-3 p-3 bg-red-50 rounded-md border border-red-100">
              <p class="text-sm font-medium text-red-800 mb-2">
                다음 오류를 확인해주세요 ({{ uploadErrors.length }}건):
              </p>
              <ul class="text-xs text-red-700 space-y-1 pl-4 list-disc max-h-40 overflow-y-auto">
                <li v-for="(error, i) in uploadErrors" :key="i">{{ error }}</li>
              </ul>
            </div>

            <div class="flex justify-end gap-2 mt-4">
              <button type="button" @click="showUploadModal = false" class="btn btn-outline"
                :disabled="uploading">취소</button>
              <button type="submit" class="btn btn-primary" :disabled="uploading || !isUploadFormValid">
                <span v-if="uploading">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  업로드 중...
                </span>
                <span v-else>업로드</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 토스트 -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useToast } from '~/composables/useToast'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import Toast from '~/components/Toast.vue'

const authStore = useAuthStore()
const api = useApi()
const toast = ref(null)

// Toast 컴포넌트 직접 사용
const showToastMessage = (message, type = 'info') => {
  if (toast.value) {
    toast.value.show(message, type);
  } else {
    console.error('Toast 컴포넌트를 찾을 수 없습니다:', message);
    alert(message);
  }
}

const plans = ref([])
const videoIntros = ref([])
const selectedPlanId = ref('')
const showUploadModal = ref(false)
const loading = ref(false)
const uploading = ref(false)

const uploadForm = ref({
  planId: '',
  file: null
})

// 새로운 상태 추가
const uploadErrors = ref([])
const fileValidationError = ref('')

// 파일 유효성 검사 계산된 속성 추가
const isUploadFormValid = computed(() => {
  return uploadForm.value.planId && uploadForm.value.file && !fileValidationError.value
})

// 관리자 권한 체크 - 수정
const isStaff = computed(() => {
  // 사용자 정보가 data 객체 내부에 있음
  const staffStatus = authStore.user?.data?.is_staff;

  return authStore.isAuthenticated && Boolean(staffStatus);
})

// 페이지 접근 권한 체크 - 수정
const checkAccess = () => {
  if (!isStaff.value) {
    try {
      showToastMessage('관리자 권한이 필요합니다.', 'error');
    } catch (e) {
      console.error('Toast error:', e);
      alert('관리자 권한이 필요합니다.');
    }
    return false;
  }

  return true;
}

// 플랜 목록 조회 - 수정
const fetchPlans = async () => {
  if (!checkAccess()) return

  try {
    loading.value = true
    const response = await api.get('/api/v1/todos/bible-plans/')

    // 응답 구조 처리 - data 속성 확인
    if (response.data && Array.isArray(response.data)) {
      plans.value = response.data
    } else if (Array.isArray(response)) {
      plans.value = response
    } else if (response.results && Array.isArray(response.results)) {
      plans.value = response.results
    } else {
      console.error('예상치 못한 응답 형식:', response)
      showToastMessage('플랜 목록 형식이 올바르지 않습니다.', 'error')
    }
  } catch (error) {
    console.error('플랜 목록 조회 오류:', error)
    showToastMessage('플랜 목록을 불러오는데 실패했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// 영상 개론 목록 조회 - 수정
const fetchVideoIntros = async () => {
  if (!checkAccess()) return

  loading.value = true
  try {

    const url = selectedPlanId.value
      ? `/api/v1/todos/video/intro/?plan_id=${selectedPlanId.value}`
      : '/api/v1/todos/video/intro/'

    const response = await api.get(url)

    // 응답 구조 처리 - data 속성 확인
    if (response.data && Array.isArray(response.data)) {
      videoIntros.value = response.data
    } else if (Array.isArray(response)) {
      videoIntros.value = response
    } else if (response.results && Array.isArray(response.results)) {
      videoIntros.value = response.results
    } else {
      console.error('예상치 못한 응답 형식:', response)
      showToastMessage('영상 개론 목록 형식이 올바르지 않습니다.', 'error')
    }
  } catch (error) {
    console.error('영상 개론 목록 조회 오류:', error)
    showToastMessage('영상 개론 목록을 불러오는데 실패했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// 영상 개론 삭제
const deleteVideoIntro = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await api.delete(`/api/v1/todos/video/intro/${id}/`)
    showToastMessage('영상 개론이 삭제되었습니다.', 'success')
    fetchVideoIntros()
  } catch (error) {
    showToastMessage('영상 개론 삭제에 실패했습니다.', 'error')
  }
}

// 파일 선택 핸들러 개선
const handleFileChange = (event) => {
  fileValidationError.value = ''
  uploadErrors.value = []

  const file = event.target.files[0]
  if (!file) {
    uploadForm.value.file = null
    return
  }

  // 파일 확장자 검사
  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    fileValidationError.value = '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'
    showToastMessage(fileValidationError.value, 'error')
    event.target.value = '' // 입력 초기화
    uploadForm.value.file = null
    return
  }

  // 파일 크기 검사 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    fileValidationError.value = '파일 크기는 5MB를 초과할 수 없습니다.'
    showToastMessage(fileValidationError.value, 'error')
    event.target.value = '' // 입력 초기화
    uploadForm.value.file = null
    return
  }

  uploadForm.value.file = file
}

// 업로드 폼 초기화 함수 개선
const resetUploadForm = () => {
  uploadForm.value = {
    planId: '',
    file: null
  }
  fileValidationError.value = ''
  uploadErrors.value = []

  // 파일 입력 필드 초기화
  if (document.querySelector('input[type="file"]')) {
    document.querySelector('input[type="file"]').value = ''
  }
}

// 모달 표시 함수 개선
const openUploadModal = () => {
  resetUploadForm()
  showUploadModal.value = true
}

// 엑셀 업로드 함수 개선
const uploadExcel = async () => {

  // 폼 유효성 재검사
  if (!uploadForm.value.planId) {
    showToastMessage('플랜을 선택해주세요.', 'error')
    return
  }

  if (!uploadForm.value.file) {
    showToastMessage('엑셀 파일을 선택해주세요.', 'error')
    return
  }

  // 이전 오류 초기화
  uploadErrors.value = []

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('plan_id', uploadForm.value.planId)
    formData.append('file', uploadForm.value.file)

    // post 대신 upload 메서드 사용
    const response = await api.upload('/api/v1/todos/video/intro/upload/', formData)

    showToastMessage(response.detail, 'success')

    // 에러가 있는 경우 표시하되 모달은 닫지 않음
    if (response.errors && response.errors.length > 0) {
      console.warn('Upload errors:', response.errors)
      uploadErrors.value = response.errors
      showToastMessage(`일부 데이터에 오류가 있습니다. 오류 내용을 확인해주세요.`, 'warning')
      // 모달은 유지하고 오류만 표시
    } else {
      // 오류가 없으면 모달 닫고 목록 새로고침
      showUploadModal.value = false
      resetUploadForm()
      fetchVideoIntros()
    }

  } catch (error) {
    console.error('업로드 오류:', error)

    // API 오류 응답 처리
    let errorMessage = '업로드에 실패했습니다.';

    if (error.response) {
      // 서버 응답이 있는 경우
      errorMessage = error.response.data?.detail || errorMessage;

      // 오류 배열이 있는 경우
      if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
        uploadErrors.value = error.response.data.errors;
      }
    } else if (error.detail) {
      errorMessage = error.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    showToastMessage(errorMessage, 'error')
  } finally {
    uploading.value = false
  }
}

// 날짜 포맷팅
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 초기 데이터 로드 - 수정
onMounted(async () => {
  // 인증 상태가 이미 로드되었는지 확인
  if (authStore.isAuthenticated && authStore.user) {
    await nextTick();
    if (checkAccess()) {
      fetchPlans();
      fetchVideoIntros();
    }
  } else {
    // 인증 상태가 로드될 때까지 기다림
    const unwatch = watch(() => authStore.user, async (newUser) => {
      if (newUser) {
        await nextTick();
        if (checkAccess()) {
          fetchPlans();
          fetchVideoIntros();
        }
        unwatch(); // 감시 중단
      }
    }, { immediate: true });
  }
})

// 인증 상태 변경 감지 유지
watch(() => authStore.isAuthenticated, async (newValue) => {
  if (newValue && isStaff.value) {
    await fetchPlans();
    await fetchVideoIntros();
  } else {
    plans.value = [];
    videoIntros.value = [];
  }
})

// 추가: 사용자 정보 변경 감지
watch(() => authStore.user, async (newUser) => {
  if (authStore.isAuthenticated && newUser?.is_staff) {
    await fetchPlans();
    await fetchVideoIntros();
  }
}, { deep: true })
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 50px;
}

.back-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: var(--primary-light);
}

.header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.create-button {
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.create-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.scroll-area {
  padding: 1rem;
}

.unauthorized-prompt {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.filter-section {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  background: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-label {
  font-weight: 500;
  margin-right: 0.5rem;
  color: var(--text-primary);
}

.plan-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  background: white;
}

.video-intro-grid {
  display: grid;
  gap: 1rem;
}

.video-intro-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.video-intro-card:hover {
  border-color: #D1D5DB;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.video-intro-card-content {
  padding: 1rem;
}

.video-intro-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.video-intro-period {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.video-intro-plan {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.video-intro-link {
  margin-top: 0.5rem;
}

.link-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: #F3F4F6;
  color: var(--text-primary);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.link-button:hover {
  background: #E5E7EB;
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
  text-align: center;
}

.action-button.delete {
  background: var(--error);
  color: white;
}

.action-button:hover {
  transform: translateY(-1px);
}

.loading-indicator,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.file-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  background: white;
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.4s ease-out forwards;
}

:root {
  --primary-color: #617475;
  --primary-light: #E9ECEC;
  --primary-dark: #4A5A5B;
  --text-primary: #2C3E50;
  --text-secondary: #666666;
}

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
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  width: 90%;
  max-width: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  padding: 0.5rem;
  margin: -0.5rem;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--primary-light);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.25rem;
}

.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(97, 116, 117, 0.1);
}

.btn {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-outline {
  background: white;
  border: 1px solid #E5E7EB;
  color: var(--text-primary);
}

.btn-outline:hover {
  background: #F9FAFB;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .header {
    padding: 0.75rem;
  }

  .scroll-area {
    padding: 0.75rem;
  }

  .video-intro-card-content {
    padding: 0.75rem;
  }

  .modal-header {
    padding: 0.8rem 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}

/* 애니메이션 스타일 추가 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 추가 스타일 */
.list-disc {
  list-style-type: disc;
}

.overflow-y-auto {
  overflow-y: auto;
}

.max-h-40 {
  max-height: 10rem;
}
</style>