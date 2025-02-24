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
            <p class="upload-format">형식: 날짜, 성경, 시작장, 끝장, 오디오, 가이드</p>
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

        <div class="form-group">
          <label>가이드 링크</label>
          <input 
            type="url" 
            v-model="formData.guide_link"
            placeholder="https://..."
          >
        </div>

        <button type="submit" class="submit-button">일정 추가</button>
      </form>

      <div class="schedules-list">
        <h2>등록된 일정</h2>
        
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>일정을 불러오는 중...</p>
        </div>

        <div v-else-if="schedules && schedules.length > 0" class="table-container">
          <table class="schedules-table">
            <thead>
              <tr>
                <th @click="sortBy('date')" class="sortable">
                  날짜
                  <span class="sort-icon" v-if="sortField === 'date'">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th @click="sortBy('book')" class="sortable">
                  성경
                  <span class="sort-icon" v-if="sortField === 'book'">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th>장</th>
                <th>오디오</th>
                <th>가이드</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="schedule in sortedSchedules" :key="schedule.id">
                <td>{{ formatDate(schedule?.date) }}</td>
                <td>{{ schedule?.book }}</td>
                <td>{{ schedule?.start_chapter }}-{{ schedule?.end_chapter }}장</td>
                <td>
                  <a 
                    v-if="schedule?.audio_link" 
                    :href="schedule.audio_link" 
                    target="_blank"
                    class="audio-link"
                    title="오디오 듣기"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6v12M8 10v4M16 10v4M3 12h2M19 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </a>
                  <span v-else class="no-link">-</span>
                </td>
                <td>
                  <a 
                    v-if="schedule?.guide_link" 
                    :href="schedule.guide_link" 
                    target="_blank"
                    class="guide-link"
                    title="가이드 보기"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6.25V19.25M12 6.25L7 10.75M12 6.25L17 10.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </a>
                  <span v-else class="no-link">-</span>
                </td>
                <td>
                  <button class="delete-button" @click="deleteSchedule(schedule.id)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="no-schedules">
          등록된 일정이 없습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()
const isLoading = ref(true)
const schedules = ref([])
const fileInput = ref(null)

const formData = ref({
  date: '',
  book: '',
  start_chapter: 1,
  end_chapter: 1,
  audio_link: '',
  guide_link: ''
})

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

// 정렬 관련 상태 추가
const sortField = ref('date')
const sortOrder = ref('asc')

const handleSubmit = async () => {
  try {
    const result = await api.post('/api/v1/todos/bible-schedules/', formData.value)
    await loadSchedules()
    formData.value = { date: '', book: '', start_chapter: 1, end_chapter: 1, audio_link: '', guide_link: '' }
    alert('일정이 등록되었습니다.')
  } catch (error) {
    console.error('Failed to create schedule:', error)
    alert(error.message || '일정 등록에 실패했습니다.')
  }
}

const deleteSchedule = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  try {
    await api.delete(`/api/v1/todos/bible-schedules/${id}/`)
    await loadSchedules()
    alert('일정이 삭제되었습니다.')
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    alert(error.message || '일정 삭제에 실패했습니다.')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

const loadSchedules = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/api/v1/todos/bible-schedules/')
    if (response?.data) {
      schedules.value = response.data
    } else {
      schedules.value = []
    }
  } catch (error) {
    console.error('Failed to load schedules:', error)
    schedules.value = []
  } finally {
    isLoading.value = false
  }
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
    const result = await api.upload('/api/v1/todos/bible-schedules/upload/', formData)
    console.log('Upload result:', result)
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

// 정렬 함수
const sortBy = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

// 정렬된 스케줄 계산
const sortedSchedules = computed(() => {
  return [...schedules.value].sort((a, b) => {
    let comparison = 0
    if (sortField.value === 'date') {
      comparison = new Date(a.date) - new Date(b.date)
    } else if (sortField.value === 'book') {
      comparison = a.book.localeCompare(b.book)
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

// 클라이언트 사이드에서만 초기 데이터 로드
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

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}

.schedules-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.schedules-table th,
.schedules-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.schedules-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: var(--text-primary);
}

.schedules-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.schedules-table th.sortable:hover {
  background: #edf2f7;
}

.sort-icon {
  margin-left: 0.5rem;
  color: var(--primary-color);
}

.schedules-table tr:hover {
  background: #f8f9fa;
}

.delete-button {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button:hover {
  color: #ff4444;
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

.no-schedules {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.audio-link,
.guide-link {
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  transition: color 0.2s;
}

.audio-link:hover,
.guide-link:hover {
  color: var(--primary-color-dark);
}

.no-link {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.schedules-table td:nth-child(1) { width: 25%; } /* 날짜 */
.schedules-table td:nth-child(2) { width: 20%; } /* 성경 */
.schedules-table td:nth-child(3) { width: 15%; } /* 장 */
.schedules-table td:nth-child(4) { width: 10%; } /* 오디오 */
.schedules-table td:nth-child(5) { width: 10%; } /* 가이드 */
.schedules-table td:nth-child(6) { width: 10%; } /* 관리 */
</style> 