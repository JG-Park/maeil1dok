<template>
  <div class="container">
    <div class="header fade-in" style="animation-delay: 0s">
      <button class="back-button" @click="$router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>성경 일정 관리</h1>
    </div>

    <div class="content-section fade-in" style="animation-delay: 0.2s">
      <div class="excel-upload-section">
        <h2>엑셀 파일로 일정 등록</h2>
        <div class="upload-box">
          <input 
            type="file" 
            ref="fileInput"
            @change="handleFileUpload" 
            accept=".xlsx,.xls"
            class="file-input"
          >
          <div class="upload-info">
            <p>엑셀 파일을 드래그하거나 클릭하여 업로드하세요</p>
            <p class="upload-format">형식: 날짜, 성경, 시작장, 끝장, 오디오</p>
          </div>
        </div>
        <button 
          class="upload-button" 
          @click="uploadExcel"
          :disabled="!selectedFile"
        >
          {{ uploading ? '업로드 중...' : '일정 등록하기' }}
        </button>
      </div>

      <div class="divider">또는</div>

      <form @submit.prevent="handleSubmit" class="schedule-form">
        <div class="form-group">
          <label>날짜</label>
          <input 
            type="date" 
            v-model="formData.date"
            required
          >
        </div>

        <div class="form-group">
          <label>성경</label>
          <select v-model="formData.book" required>
            <optgroup label="구약">
              <option v-for="book in oldTestament" :key="book.id" :value="book.name">
                {{ book.name }}
              </option>
            </optgroup>
            <optgroup label="신약">
              <option v-for="book in newTestament" :key="book.id" :value="book.name">
                {{ book.name }}
              </option>
            </optgroup>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>시작 장</label>
            <input 
              type="number" 
              v-model.number="formData.start_chapter"
              min="1"
              required
            >
          </div>

          <div class="form-group">
            <label>끝 장</label>
            <input 
              type="number" 
              v-model.number="formData.end_chapter"
              min="1"
              required
            >
          </div>
        </div>

        <button type="submit" class="submit-button">일정 추가</button>
      </form>

      <div class="schedules-list">
        <h2>등록된 일정</h2>
        <div v-for="schedule in schedules" :key="schedule.date" class="schedule-item">
          <div class="schedule-info">
            <div class="schedule-date">{{ formatDate(schedule.date) }}</div>
            <div class="schedule-content">
              {{ schedule.book }} {{ schedule.start_chapter }}-{{ schedule.end_chapter }}장
            </div>
          </div>
          <button class="delete-button" @click="deleteSchedule(schedule.id)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()

const formData = ref({
  date: '',
  book: '',
  start_chapter: 1,
  end_chapter: 1
})

const schedules = ref([])

// 성경 책 목록
const oldTestament = [
  { id: 'gen', name: '창세기' },
  { id: 'exo', name: '출애굽기' },
  // ... 나머지 구약 성경
]

const newTestament = [
  { id: 'mat', name: '마태복음' },
  { id: 'mrk', name: '마가복음' },
  // ... 나머지 신약 성경
]

const selectedFile = ref(null)
const uploading = ref(false)

const handleSubmit = async () => {
  try {
    const result = await api.post('/api/v1/bible-schedules/', formData.value)
    await loadSchedules()
    formData.value = { date: '', book: '', start_chapter: 1, end_chapter: 1 }
    alert('일정이 등록되었습니다.')
  } catch (error) {
    console.error('Failed to create schedule:', error)
    alert(error.message || '일정 등록에 실패했습니다.')
  }
}

const deleteSchedule = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  try {
    await api.delete(`/api/v1/bible-schedules/${id}/`)
    await loadSchedules()
    alert('일정이 삭제되었습니다.')
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    alert(error.message || '일정 삭제에 실패했습니다.')
  }
}

const loadSchedules = async () => {
  try {
    const data = await api.get('/api/v1/bible-schedules/')
    schedules.value = data
  } catch (error) {
    console.error('Failed to load schedules:', error)
    alert(error.message || '일정 목록을 불러오는데 실패했습니다.')
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0]
}

const uploadExcel = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const result = await api.upload('/api/v1/bible-schedules/upload/', formData)
    console.log('Upload result:', result)  // 응답 확인을 위한 로그
    await loadSchedules()
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    alert(result.message || '일정이 등록되었습니다.')
  } catch (error) {
    console.error('Failed to upload excel:', error)
    alert(error.message || '엑셀 파일 업로드에 실패했습니다.')
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  loadSchedules()
})
</script>

<style scoped>
.container {
  max-width: 768px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 1.5rem;
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.back-button {
  background: none;
  border: none;
  padding: 0.5rem;
  margin: -0.5rem;
  margin-right: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
}

.content-section {
  background: white;
  margin: 1rem;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.schedule-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.schedules-list {
  margin-top: 2rem;
}

.schedules-list h2 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.schedule-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.schedule-content {
  font-weight: 500;
  color: var(--text-primary);
}

.delete-button {
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-button:hover {
  color: #dc2626;
}

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

@media (max-width: 640px) {
  .content-section {
    margin: 0.75rem;
    padding: 1rem;
  }

  .form-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}

.excel-upload-section {
  margin-bottom: 2rem;
}

.upload-box {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  position: relative;
  margin: 1rem 0;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-info {
  color: var(--text-secondary);
}

.upload-format {
  font-size: 0.9rem;
  margin-top: 0.5rem;
  color: var(--text-secondary);
}

.upload-button {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.divider {
  text-align: center;
  margin: 2rem 0;
  color: var(--text-secondary);
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #ddd;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}
</style> 