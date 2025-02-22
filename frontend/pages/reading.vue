<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useTaskStore } from '~/stores/tasks'
import { useRoute, useRouter } from 'vue-router'
import { useBibleProgressApi } from '~/composables/useApi'

const taskStore = useTaskStore()
const route = useRoute()
const router = useRouter()
const bibleContent = ref('')
const isLoading = ref(true)
const chapterTitle = ref('')
const sectionTitle = ref('')
const currentBook = ref('')
const currentChapter = ref(1)
const showModal = ref(false)
const selectedBook = ref('gen')
const isHeaderFloating = ref(false)
const isTodayReadingFloating = ref(false)
const showScheduleModal = ref(false)
const schedules = ref([])
const selectedMonth = ref(new Date().getMonth() + 1)
const months = Array.from({ length: 12 }, (_, i) => i + 1)

// 월 선택기 드래그 스크롤 기능
const monthScroll = ref(null)
let isMouseDown = false
let startX
let scrollLeft

const onMouseDown = (e) => {
  isMouseDown = true
  startX = e.pageX - monthScroll.value.offsetLeft
  scrollLeft = monthScroll.value.scrollLeft
  monthScroll.value.style.cursor = 'grabbing'
}

const onMouseLeave = () => {
  isMouseDown = false
  monthScroll.value.style.cursor = 'grab'
}

const onMouseUp = () => {
  isMouseDown = false
  monthScroll.value.style.cursor = 'grab'
}

const onMouseMove = (e) => {
  if (!isMouseDown) return
  e.preventDefault()
  const x = e.pageX - monthScroll.value.offsetLeft
  const walk = (x - startX) * 2
  monthScroll.value.scrollLeft = scrollLeft - walk
}

// 성경 책 목록을 구약/신약으로 구분
const bibleBooks = {
  old: [
    { id: 'gen', name: '창세기', chapters: 50 },
    { id: 'exo', name: '출애굽기', chapters: 40 },
    { id: 'lev', name: '레위기', chapters: 27 },
    { id: 'num', name: '민수기', chapters: 36 },
    { id: 'deu', name: '신명기', chapters: 34 },
    { id: 'jos', name: '여호수아', chapters: 24 },
    { id: 'jdg', name: '사사기', chapters: 21 },
    { id: 'rut', name: '룻기', chapters: 4 },
    { id: '1sa', name: '사무엘상', chapters: 31 },
    { id: '2sa', name: '사무엘하', chapters: 24 },
    { id: '1ki', name: '열왕기상', chapters: 22 },
    { id: '2ki', name: '열왕기하', chapters: 25 },
    { id: '1ch', name: '역대상', chapters: 29 },
    { id: '2ch', name: '역대하', chapters: 36 },
    { id: 'ezr', name: '에스라', chapters: 10 },
    { id: 'neh', name: '느헤미야', chapters: 13 },
    { id: 'est', name: '에스더', chapters: 10 },
    { id: 'job', name: '욥기', chapters: 42 },
    { id: 'psa', name: '시편', chapters: 150 },
    { id: 'pro', name: '잠언', chapters: 31 },
    { id: 'ecc', name: '전도서', chapters: 12 },
    { id: 'sng', name: '아가', chapters: 8 },
    { id: 'isa', name: '이사야', chapters: 66 },
    { id: 'jer', name: '예레미야', chapters: 52 },
    { id: 'lam', name: '예레미야애가', chapters: 5 },
    { id: 'ezk', name: '에스겔', chapters: 48 },
    { id: 'dan', name: '다니엘', chapters: 12 },
    { id: 'hos', name: '호세아', chapters: 14 },
    { id: 'jol', name: '요엘', chapters: 3 },
    { id: 'amo', name: '아모스', chapters: 9 },
    { id: 'oba', name: '오바댜', chapters: 1 },
    { id: 'jon', name: '요나', chapters: 4 },
    { id: 'mic', name: '미가', chapters: 7 },
    { id: 'nam', name: '나훔', chapters: 3 },
    { id: 'hab', name: '하박국', chapters: 3 },
    { id: 'zep', name: '스바냐', chapters: 3 },
    { id: 'hag', name: '학개', chapters: 2 },
    { id: 'zec', name: '스가랴', chapters: 14 },
    { id: 'mal', name: '말라기', chapters: 4 }
  ],
  new: [
    { id: 'mat', name: '마태복음', chapters: 28 },
    { id: 'mrk', name: '마가복음', chapters: 16 },
    { id: 'luk', name: '누가복음', chapters: 24 },
    { id: 'jhn', name: '요한복음', chapters: 21 },
    { id: 'act', name: '사도행전', chapters: 28 },
    { id: 'rom', name: '로마서', chapters: 16 },
    { id: '1co', name: '고린도전서', chapters: 16 },
    { id: '2co', name: '고린도후서', chapters: 13 },
    { id: 'gal', name: '갈라디아서', chapters: 6 },
    { id: 'eph', name: '에베소서', chapters: 6 },
    { id: 'php', name: '빌립보서', chapters: 4 },
    { id: 'col', name: '골로새서', chapters: 4 },
    { id: '1th', name: '데살로니가전서', chapters: 5 },
    { id: '2th', name: '데살로니가후서', chapters: 3 },
    { id: '1ti', name: '디모데전서', chapters: 6 },
    { id: '2ti', name: '디모데후서', chapters: 4 },
    { id: 'tit', name: '디도서', chapters: 3 },
    { id: 'phm', name: '빌레몬서', chapters: 1 },
    { id: 'heb', name: '히브리서', chapters: 13 },
    { id: 'jas', name: '야고보서', chapters: 5 },
    { id: '1pe', name: '베드로전서', chapters: 5 },
    { id: '2pe', name: '베드로후서', chapters: 3 },
    { id: '1jn', name: '요한일서', chapters: 5 },
    { id: '2jn', name: '요한이서', chapters: 1 },
    { id: '3jn', name: '요한삼서', chapters: 1 },
    { id: 'jud', name: '유다서', chapters: 1 },
    { id: 'rev', name: '요한계시록', chapters: 22 }
  ]
}

// bookNames 객체 업데이트
const bookNames = {}
bibleBooks.old.concat(bibleBooks.new).forEach(book => {
  bookNames[book.id] = book.name
})

// bookChapters 객체 업데이트
const bookChapters = {}
bibleBooks.old.concat(bibleBooks.new).forEach(book => {
  bookChapters[book.id] = book.chapters
})

// 선택된 책의 장 수 계산
const chaptersArray = computed(() => {
  const book = bibleBooks.old.concat(bibleBooks.new).find(b => b.id === selectedBook.value)
  return book ? Array.from({ length: book.chapters }, (_, i) => i + 1) : []
})

// 성경 본문 로드 함수
const loadBibleContent = async (book, chapter) => {
  isLoading.value = true
  try {
    // 성경 본문 로드
    const response = await fetch(`/bible-proxy/korbibReadpage.php?version=GAE&book=${book}&chap=${chapter}&sec=1&cVersion=&fontSize=15px&fontWeight=normal`)
    const text = await response.text()
    
    currentBook.value = book
    currentChapter.value = chapter
    
    // 해당 구절의 일정 정보 가져오기
    const scheduleData = await taskStore.fetchReadingSchedule(book, chapter)
    if (scheduleData) {
      taskStore.todayReading = scheduleData
    }
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    const bibleElement = doc.getElementById('tdBible1')
    
    if (bibleElement) {
      // 불필요한 요소 제거
      const elementsToRemove = bibleElement.querySelectorAll('input, select, form, .fontcontrol, a, [style*="display:none"], [style*="display: none"]')
      elementsToRemove.forEach(el => el.remove())

      // 장 제목 설정 (책 이름 + 장 번호)
      const chapNum = bibleElement.querySelector('.chapNum')
      if (chapNum) {
        const chapter = chapNum.textContent.replace('제', '').replace('장', '').trim()
        chapterTitle.value = `${bookNames[book] || ''} ${chapter}장`
      }

      // 모든 내용을 순서대로 처리
      const verses = []
      let currentSection = ''
      
      // 모든 자식 노드를 순회하면서 처리
      Array.from(bibleElement.childNodes).forEach(node => {
        // smallTitle 클래스를 가진 요소를 만나면 섹션 제목 업데이트
        if (node.classList?.contains('smallTitle')) {
          currentSection = node.textContent.trim()
            .replace(/\(\s*\)/g, '')  // 빈 괄호 제거
            .replace(/\s+/g, ' ')     // 연속된 공백 하나로 통일
            .trim()                   // 앞뒤 공백 제거
          
          if (currentSection) {  // 내용이 있는 경우에만 추가
            verses.push(`<h3 class="section-title">${currentSection}</h3>`)
          }
        }
        // span 요소이고 number 클래스를 가진 자식이 있으면 구절로 처리
        else if (node.tagName === 'SPAN' && node.querySelector('.number')) {
          const numberSpan = node.querySelector('.number')
          const number = numberSpan.textContent.trim().replace(/\s+/g, '')
          let text = node.textContent.replace(numberSpan.textContent, '').trim()
          
          verses.push(`<div class="verse"><span class="verse-number">${number}</span><span class="verse-text">${text}</span></div>`)
        }
      })

      // 첫 번째 섹션 제목 설정 (있는 경우에만)
      const firstTitle = bibleElement.querySelector('.smallTitle')
      if (firstTitle) {
        sectionTitle.value = firstTitle.textContent.trim()
      } else {
        sectionTitle.value = ''  // 섹션 제목이 없는 경우
      }

      bibleContent.value = verses.join('')
    }
  } catch (error) {
    console.error('Failed to load bible content:', error)
  } finally {
    isLoading.value = false
  }
}

// 다음 장으로 이동
const goToNextChapter = () => {
  const maxChapter = bookChapters[currentBook.value]
  if (currentChapter.value < maxChapter) {
    // 같은 책의 다음 장
    const nextChapter = currentChapter.value + 1
    router.push(`/reading?book=${currentBook.value}&chapter=${nextChapter}`)
    loadBibleContent(currentBook.value, nextChapter)
  } else {
    // 다음 책의 첫 장으로
    const books = Object.keys(bookNames)
    const currentBookIndex = books.indexOf(currentBook.value)
    if (currentBookIndex < books.length - 1) {
      const nextBook = books[currentBookIndex + 1]
      router.push(`/reading?book=${nextBook}&chapter=1`)
      loadBibleContent(nextBook, 1)
    }
  }
}

// 이전 장으로 이동
const goToPrevChapter = () => {
  if (currentChapter.value > 1) {
    // 같은 책의 이전 장
    const prevChapter = currentChapter.value - 1
    router.push(`/reading?book=${currentBook.value}&chapter=${prevChapter}`)
    loadBibleContent(currentBook.value, prevChapter)
  } else {
    // 이전 책의 마지막 장으로
    const books = Object.keys(bookNames)
    const currentBookIndex = books.indexOf(currentBook.value)
    if (currentBookIndex > 0) {
      const prevBook = books[currentBookIndex - 1]
      const lastChapter = bookChapters[prevBook]
      router.push(`/reading?book=${prevBook}&chapter=${lastChapter}`)
      loadBibleContent(prevBook, lastChapter)
    }
  }
}

// 책 선택 시 처리
const selectBook = (bookId) => {
  selectedBook.value = bookId
}

// 장 선택 시 처리
const selectChapter = (chapter) => {
  loadBibleContent(selectedBook.value, chapter)
  showModal.value = false
}

// 모달 열릴 때 body 스크롤 제어
const toggleBodyScroll = (isModalOpen) => {
  if (isModalOpen) {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  } else {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
}

// showModal watch 추가
watch(showModal, (newValue) => {
  toggleBodyScroll(newValue)
})

// 페이지 로드 시 오늘의 읽기 정보를 가져오는 함수
const initializeTodayReading = async () => {
  if (!taskStore.todayReading) {
    await taskStore.fetchTodayReading()
  }
}

// 날짜 포맷팅 함수 수정
const formatScheduleDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  
  // 모바일 체크
  const isMobile = window.innerWidth <= 640
  
  if (isMobile) {
    return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`
  }
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]})`
}

// formatButtonDate 함수 추가
const formatButtonDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// formattedDate computed 속성 수정
const formattedDate = computed(() => {
  console.log('Today Reading:', taskStore.todayReading) // 디버깅용
  return formatScheduleDate(taskStore.todayReading?.date)
})

// URL 변경 감지
watch(
  () => route.query,
  (newQuery) => {
    const bookParam = String(newQuery.book || '')
    const chapterParam = Number(newQuery.chapter || 1)
    
    if (bookParam && chapterParam && 
        (bookParam !== currentBook.value || chapterParam !== currentChapter.value)) {
      loadBibleContent(bookParam, chapterParam)
    }
  }
)

onMounted(async () => {
  await initializeTodayReading()
  
  const bookParam = String(route.query.book || '')
  const chapterParam = Number(route.query.chapter || 1)
  
  if (bookParam && chapterParam) {
    selectedBook.value = bookParam
    currentChapter.value = chapterParam
    loadBibleContent(bookParam, chapterParam)
  } else if (taskStore.todayReading) {
    selectedBook.value = taskStore.todayReading.book
    currentChapter.value = taskStore.todayReading.chapter
    loadBibleContent(taskStore.todayReading.book, taskStore.todayReading.chapter)
  } else {
    loadBibleContent('gen', 1)
  }

  // 스크롤 이벤트 리스너 추가
  window.addEventListener('scroll', handleScroll, { passive: true })
})

// 컴포넌트가 언마운트될 때 이벤트 리스너 제거
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 스크롤 핸들러 함수
const handleScroll = () => {
  const scrollPosition = window.scrollY
  isHeaderFloating.value = scrollPosition > 10
  isTodayReadingFloating.value = scrollPosition > 20
}

// 스케줄 모달 열기
const openScheduleModal = async () => {
  if (schedules.value.length === 0) {
    const result = await taskStore.fetchBibleSchedules()
    schedules.value = result
  }
  showScheduleModal.value = true
  toggleBodyScroll(true)
  selectedMonth.value = new Date().getMonth() + 1
}

// 스케줄 모달 닫기
const closeScheduleModal = () => {
  showScheduleModal.value = false
  toggleBodyScroll(false)
}

// 특정 날짜의 성경 읽기로 이동
const goToSchedule = (schedule) => {
  // bibleBooks에서 한글 이름으로 코드 찾기
  const findBookCode = (koreanName) => {
    const allBooks = [...bibleBooks.old, ...bibleBooks.new]
    const book = allBooks.find(b => b.name === koreanName)
    return book?.id
  }

  // 한글 성경 이름을 코드로 변환
  const bookCode = findBookCode(schedule.book)
  if (!bookCode) {
    console.error('Invalid book name:', schedule.book)
    return
  }

  closeScheduleModal()
  router.push(`/reading?book=${bookCode}&chapter=${schedule.start_chapter}`)
  loadBibleContent(bookCode, schedule.start_chapter)
}

// watch 수정
watch([showModal, showScheduleModal], ([newShowModal, newShowScheduleModal]) => {
  toggleBodyScroll(newShowModal || newShowScheduleModal)
})

// 선택된 월의 스케줄만 필터링
const filteredSchedules = computed(() => {
  return schedules.value.filter(schedule => {
    const scheduleDate = new Date(schedule.date)
    return scheduleDate.getMonth() + 1 === selectedMonth.value
  })
})

// 읽기 상태 확인 함수
const getReadingStatus = (schedule) => {
  const today = new Date()
  const scheduleDate = new Date(schedule.date)
  
  if (scheduleDate > today) return 'upcoming'
  if (scheduleDate < today) return 'completed'
  return 'current'
}

// 현재 장이 읽기 구간의 마지막 장인지 확인하는 computed 속성
const isLastChapterInSchedule = computed(() => {
  if (!taskStore.todayReading) return false
  
  return currentBook.value === taskStore.todayReading.book && 
         currentChapter.value === taskStore.todayReading.end_chapter
})

// isToday computed 속성 추가
const isToday = computed(() => {
  if (!taskStore.todayReading?.date) return false
  
  const today = new Date()
  const scheduleDate = new Date(taskStore.todayReading.date)
  
  return today.getFullYear() === scheduleDate.getFullYear() &&
         today.getMonth() === scheduleDate.getMonth() &&
         today.getDate() === scheduleDate.getDate()
})

const { getBibleProgress, completeBibleReading, cancelBibleReading } = useBibleProgressApi()
const readingStatus = ref('not_started')

// 읽기 상태 조회
const checkReadingStatus = async () => {
  if (!taskStore.todayReading?.date) return
  
  try {
    const response = await getBibleProgress(taskStore.todayReading.date)
    readingStatus.value = response.status || 'not_started'
  } catch (error) {
    console.error('Failed to check reading status:', error)
  }
}

// 읽기 완료 처리
const handleCompleteReading = async () => {
  if (!taskStore.todayReading?.date) return
  
  try {
    isLoading.value = true
    await completeBibleReading(taskStore.todayReading.date)
    readingStatus.value = 'completed'
    // 완료 후 필요한 처리 (예: 메시지 표시)
  } catch (error) {
    console.error('Failed to complete reading:', error)
    // 에러 처리
  } finally {
    isLoading.value = false
  }
}

// 읽기 완료 취소
const handleCancelReading = async () => {
  if (!taskStore.todayReading?.date) return
  
  try {
    isLoading.value = true
    await cancelBibleReading(taskStore.todayReading.date)
    readingStatus.value = 'not_started'
    // 취소 후 필요한 처리
  } catch (error) {
    console.error('Failed to cancel reading:', error)
    // 에러 처리
  } finally {
    isLoading.value = false
  }
}

// 컴포넌트 마운트 시 상태 체크
onMounted(async () => {
  await checkReadingStatus()
})

// 날짜/책/장이 변경될 때 상태 다시 체크
watch(
  () => taskStore.todayReading?.date,
  async () => {
    await checkReadingStatus()
  }
)
</script>

<template>
  <div class="container">
    <div class="header fade-in" :class="{ floating: isHeaderFloating }" style="animation-delay: 0s">
      <button class="back-button" @click="$router.push('/')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>성경일독</h1>
    </div>

    <div 
      class="today-reading fade-in" 
      :class="{ floating: isTodayReadingFloating }" 
      style="animation-delay: 0.1s" 
      v-if="taskStore.todayReading"
    >
      <div class="today-info clickable" @click="openScheduleModal">
        <div class="reading-meta">
          <span class="date-badge">{{ formattedDate }}</span>
          <div class="divider"></div>
          <span class="reading-badge">
            {{ bookNames[taskStore.todayReading.book] }} 
            {{ taskStore.todayReading.chapter }}-{{ taskStore.todayReading.end_chapter }}장
          </span>
        </div>
      </div>
      <div class="today-links">
        <a 
          v-if="taskStore.todayReading.audio_link" 
          :href="taskStore.todayReading.audio_link" 
          target="_blank" 
          class="link-button audio"
          title="오디오"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6v12M8 9v6M16 9v6M4 12v0M20 12v0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </a>
        <a 
          v-if="taskStore.todayReading.guide_link" 
          :href="taskStore.todayReading.guide_link" 
          target="_blank" 
          class="link-button guide"
          title="가이드"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5V4.5C4 4.22386 4.22386 4 4.5 4H19.5C19.7761 4 20 4.22386 20 4.5V19.5C20 19.7761 19.7761 20 19.5 20H4.5C4.22386 20 4 19.7761 4 19.5Z" stroke="currentColor" stroke-width="2"/>
            <path d="M8 8H16M8 12H16M8 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </a>
      </div>
    </div>

    <div class="content-section fade-in" style="animation-delay: 0.2s">
      <button class="chapter-select-button" @click="showModal = true">
        <div class="button-content">
          <h2>{{ chapterTitle }}</h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </button>

      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>
          {{ bookNames[selectedBook] }} {{ currentChapter }}장을 불러오는 중입니다...
        </p>
      </div>

      <div v-else class="bible-content text-adjustable" v-html="bibleContent"></div>
    </div>

    <div class="navigation-controls fade-in" style="animation-delay: 0.3s">
      <button class="nav-button prev" @click="goToPrevChapter">
        &lt; 이전
      </button>
      <div class="center-content">
        <button 
          v-if="readingStatus !== 'completed'"
          class="complete-button"
          :disabled="isLoading"
          @click="handleCompleteReading"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ isToday ? '오늘 일독 완료하기' : `${formatButtonDate(taskStore.todayReading?.date)} 일독 완료하기` }}
        </button>
        <button 
          v-else
          class="cancel-button"
          :disabled="isLoading"
          @click="handleCancelReading"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          완료 취소하기
        </button>
      </div>
      <button class="nav-button next" @click="goToNextChapter">
        다음 &gt;
      </button>
    </div>

    <!-- 책/장 선택 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>성경 선택</h3>
            <button class="close-button" @click="showModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="books-section">
              <div class="testament">
                <h4>구약</h4>
                <div class="books-list">
                  <button 
                    v-for="book in bibleBooks.old" 
                    :key="book.id"
                    :class="['book-button', { active: selectedBook === book.id }]"
                    @click="selectBook(book.id)"
                  >
                    {{ book.name }}
                  </button>
                </div>
              </div>
              <div class="testament">
                <h4>신약</h4>
                <div class="books-list">
                  <button 
                    v-for="book in bibleBooks.new" 
                    :key="book.id"
                    :class="['book-button', { active: selectedBook === book.id }]"
                    @click="selectBook(book.id)"
                  >
                    {{ book.name }}
                  </button>
                </div>
              </div>
            </div>
            <div class="chapters-section">
              <h4>장</h4>
              <div class="chapters-grid">
                <button 
                  v-for="chapter in chaptersArray" 
                  :key="chapter"
                  :class="['chapter-button', { active: chapter === currentChapter }]"
                  @click="selectChapter(chapter)"
                >
                  {{ chapter }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 스케줄 모달 추가 -->
    <Teleport to="body">
      <div v-if="showScheduleModal" class="modal-overlay" @click="closeScheduleModal">
        <div class="modal-content schedule-modal" @click.stop>
          <div class="modal-header">
            <h3>성경 읽기 일정</h3>
            <button class="close-button" @click="closeScheduleModal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="month-selector">
            <div class="month-header">
              <button class="today-button" @click="selectedMonth = new Date().getMonth() + 1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2v3M16 2v3M3.5 8h17M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                오늘
              </button>
              <div class="divider"></div>
              <div class="month-scroll"
                ref="monthScroll"
                @mousedown="onMouseDown"
                @mouseleave="onMouseLeave"
                @mouseup="onMouseUp"
                @mousemove="onMouseMove"
              >
                <button
                  v-for="month in months"
                  :key="month"
                  :class="['month-button', { active: month === selectedMonth }]"
                  @click="selectedMonth = month"
                >
                  {{ month }}월
                </button>
              </div>
            </div>
          </div>
          <div class="modal-body schedule-body">
            <div v-if="filteredSchedules.length === 0" class="no-schedules">
              {{ selectedMonth }}월에 등록된 일정이 없습니다.
            </div>
            <div v-else class="schedule-list">
              <div 
                v-for="schedule in filteredSchedules"
                :key="schedule.date" 
                class="schedule-item"
                :class="getReadingStatus(schedule)"
                @click="goToSchedule(schedule)"
              >
                <div class="schedule-info">
                  <div class="schedule-date">
                    {{ formatScheduleDate(schedule.date) }}
                  </div>
                  <div class="schedule-reading">
                    {{ schedule.book }} {{ schedule.start_chapter }}-{{ schedule.end_chapter }}장
                  </div>
                </div>
                <div class="schedule-status">
                  <div v-if="getReadingStatus(schedule) === 'completed'" class="status-icon completed">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div v-else-if="getReadingStatus(schedule) === 'current'" class="status-icon current">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Google Fonts 대신 RIDI Batang 사용 */
@font-face {
  font-family: 'RIDIBatang';
  src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff') format('woff');
  font-weight: normal;
  font-style: normal;
}

.container {
  max-width: 768px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: calc(4.5rem + env(safe-area-inset-bottom));
}

.header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 48px;
  transition: all 0.15s ease;
  margin: 0;
}

.header.floating {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.12);
  margin: 0 -0.25rem;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.back-button {
  background: none;
  border: none;
  padding: 0.375rem;
  margin: -0.375rem;
  margin-right: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
}

.header h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.back-button svg {
  width: 20px;
  height: 20px;
}

.today-reading {
  background: white;
  margin: 0.75rem 1rem 0;
  padding: 0.875rem 1rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 56px;
  z-index: 9;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.15s ease;
}

.today-reading.floating {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  margin: 0.375rem 0.75rem 0;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.today-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reading-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0;
}

.date-badge {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.divider {
  width: 1px;
  height: 12px;
  background: #e5e5e5;
}

.reading-badge {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.today-links {
  display: flex;
  gap: 0.375rem;
  margin-left: 0.75rem;
}

.link-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0.5rem;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.link-button.audio {
  background: #FFF1F0;
  color: #CF4033;
}

.link-button.guide {
  background: #EFF8FF;
  color: #2E90FA;
}

.link-button:hover {
  opacity: 0.9;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .link-button {
    padding: 0.375rem;
  }

  .header.floating {
    margin: 0 -0.125rem;
    padding-left: 1.125rem;
    padding-right: 1.125rem;
  }

  .today-reading.floating {
    margin: 0.375rem 0.875rem 0;
    padding-left: 1.125rem;
    padding-right: 1.125rem;
  }
}

.content-section {
  background: white;
  margin: 1rem;
  margin-top: 0.75rem;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.reading-info {
  margin-bottom: 1.5rem;
  cursor: pointer;
}

.reading-info h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-secondary);
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.bible-content {
  font-size: 1rem;
  line-height: 1.8;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  font-family: 'RIDIBatang', serif;
  font-weight: normal;
}

.reading-info h2,
.reading-info .subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

:deep(.verse) {
  font-family: 'RIDIBatang', serif;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: flex-start;
  font-weight: normal;
  letter-spacing: -0.04em;
}

:deep(.verse-number) {
  color: var(--primary-color);
  font-weight: 500;
  margin-right: 0.3rem;
  min-width: 0.8em;
  flex-shrink: 0;
  text-align: right;
  font-size: 0.75em;
  font-family: 'Pretendard', sans-serif;
  position: relative;
}

:deep(.verse-text) {
  flex: 1;
}

/* 불필요한 스타일 제거 */
:deep(table),
:deep(td),
:deep(.num) {
  all: unset;
}

.navigation-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  gap: 1rem;
  background: white;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
  max-width: 768px;
  margin: 0 auto;
  z-index: 20;
}

.nav-button {
  padding: 0;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;  /* 글자 크기 약간 줄임 */
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 400;
}

.center-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 160px; /* 버튼과 텍스트가 같은 공간을 차지하도록 */
}

.chapter-indicator {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.complete-button {
  height: 28px;
  min-width: 160px; /* 버튼 최소 너비 설정 */
  border: 1.5px solid rgba(46, 144, 250, 0.5);
  background: rgba(46, 144, 250, 0.1);
  color: #2E90FA;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8125rem;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.complete-button:hover {
  background: rgba(46, 144, 250, 0.15);
  border-color: #2E90FA;  /* hover 시에는 진한 테두리 */
  color: #1570D1;
}

.complete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-button {
  height: 28px;
  min-width: 160px;
  border: 1.5px solid rgba(220, 38, 38, 0.5);
  background: rgba(220, 38, 38, 0.1);
  color: #DC2626;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8125rem;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.cancel-button:hover {
  background: rgba(220, 38, 38, 0.15);
  border-color: #DC2626;
}

.complete-button:disabled,
.cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-button:hover {
  color: var(--primary-color);
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .today-reading {
    margin: 0.625rem 1rem 0;
    padding: 0.75rem;
  }

  .navigation-controls {
    padding: 0.5rem 1rem;
  }

  .complete-button {
    height: 26px;
  }
}

/* iOS 안전영역 대응 */
@supports (-webkit-touch-callout: none) {
  .navigation-controls {
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  }
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
    margin-top: 0.625rem;
  }

  .navigation-controls {
    padding: 0.5rem 1rem;
  }

  .nav-button {
    padding: 0.625rem 0.875rem;
  }
}

:deep(.section-title) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #4170CD;
  margin: 2rem 0 0.25rem;
  text-align: center;
}

/* 첫 번째 섹션 제목의 상단 여백 제거 */
:deep(.section-title:first-child) {
  margin-top: 0;
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
  z-index: 100;
  -webkit-overflow-scrolling: touch;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  height: 80vh;
  max-height: 600px;  /* 최대 높이 제한 */
  overflow: hidden;
  animation: modalEnter 0.3s ease-out;
  position: relative;  /* Safari에서 z-index 문제 해결 */
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1rem;
  display: flex;
  gap: 1rem;
  height: calc(100% - 60px);
  overflow: hidden;
  position: relative;
}

.books-section {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-right: 1rem;
  border-right: 1px solid #eee;
  min-width: 0;
}

.testament {
  display: flex;
  flex-direction: column;
}

.testament h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  position: sticky;
  top: 0;
  background: white;
  padding: 0.5rem 0;
  z-index: 1;
}

.books-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.chapters-section {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-left: 1rem;
  min-width: 0;
}

.chapters-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  position: sticky;
  top: 0;
  background: white;
  padding: 0.5rem 0;
  z-index: 1;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 0.5rem;
  min-width: 0;
  align-content: start;
  width: 100%;
}

.book-button {
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
}

.book-button.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 500;
}

.chapter-button {
  padding: 0.75rem;
  background: none;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  min-width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chapter-button.active {
  background: var(--primary-light);
  color: var(--primary-color);
  border-color: var(--primary-color);
  font-weight: 500;
}

.chapter-button:hover,
.book-button:hover {
  background: var(--primary-light);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 100%;
    height: 100vh;
    max-height: none;
    border-radius: 0;
    margin: 0;
  }

  .modal-body {
    height: calc(100vh - 60px);
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .books-section {
    flex: 0.7;
    padding-right: 0.75rem;
  }

  .chapters-section {
    flex: 1.3;
    padding-left: 0.75rem;
  }

  .chapters-grid {
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 0.4rem;
  }

  .chapter-button {
    padding: 0;
    font-size: 0.9rem;
    height: 40px;
    min-width: 40px;
  }

  .book-button {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
}

/* iOS Safari 대응 */
@supports (-webkit-touch-callout: none) {
  .modal-content {
    height: -webkit-fill-available;
  }

  .modal-body {
    height: calc(100vh - 60px - env(safe-area-inset-bottom));
  }

  .books-section,
  .chapters-section {
    -webkit-overflow-scrolling: touch;
    overflow-y: auto;
  }
}

/* 모바일 터치 관련 전역 스타일 */
.modal-content * {
  -webkit-tap-highlight-color: transparent;
}

/* 버튼 기본 스타일 재설정 */
button {
  color: inherit;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.chapter-select-button {
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 0.875rem 1rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chapter-select-button:hover {
  background: #f1f3f5;
  border-color: #dee2e6;
}

.chapter-select-button:active {
  transform: translateY(1px);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.button-content h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.button-content svg {
  color: var(--text-secondary);
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .chapter-select-button {
    padding: 0.75rem;
    border-radius: 10px;
  }

  .button-content h2 {
    font-size: 1rem;
  }
}

.schedule-modal {
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  background: #fff;
}

.month-selector {
  border-bottom: 1px solid #eee;
  padding: 0;
}

.month-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  gap: 1rem;
}

.today-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--primary-light);
  color: var(--primary-color);
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.divider {
  width: 1px;
  height: 24px;
  background: #eee;
  flex-shrink: 0;
}

.month-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;
  cursor: grab;
  user-select: none;
}

.month-scroll::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, Opera */
}

.month-button {
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 8px;
  background: none;
  white-space: nowrap;
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  font-weight: 500;
}

.month-button.active {
  background: var(--primary-color);
  color: white;
}

.month-button:hover:not(.active) {
  background: var(--primary-light);
  color: var(--primary-color);
}

.schedule-body {
  flex: 1;
  overflow-y: auto;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.5rem;
}

.schedule-item {
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  border-radius: 12px;
}

.schedule-item:hover {
  background: #fafafa;
}

.schedule-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  padding: 0 1rem;
}

.schedule-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 400;
  width: 140px;
  white-space: nowrap;
  flex-shrink: 0;
}

.schedule-reading {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9375rem;
  flex: 1;
}

.schedule-status {
  display: flex;
  align-items: center;
  width: 48px;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-icon.completed {
  background: var(--primary-light);
  color: var(--primary-color);
}

.status-icon.current {
  background: #FEF3C7;
  color: #D97706;
}

.schedule-item.completed {
  background: #FAFAFA;
}

.schedule-item.current {
  background: #FFFBEB;
  border-left: 4px solid #D97706;
}

.schedule-item.upcoming {
  background: white;
}

@media (max-width: 640px) {
  .month-header {
    padding: 0.625rem 0.75rem;
  }

  .schedule-item {
    padding: 0.875rem 1rem;
  }

  .schedule-date {
    width: 80px;  /* 모바일에서는 더 좁은 너비 */
    font-size: 0.8125rem;
  }

  .schedule-reading {
    font-size: 0.875rem;
  }

  .schedule-info {
    gap: 1rem;
    padding: 0 0.75rem;
  }
}

.clickable {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.clickable:hover {
  opacity: 0.8;
}

.clickable:active {
  opacity: 0.6;
}

/* 글자 크기 조절이 가능한 본문 영역 */
.text-adjustable {
  /* iOS/Android의 동적 텍스트 크기 조절 허용 */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* UI 요소들의 글자 크기는 고정 */
.header,
.nav-button,
.complete-button,
.cancel-button,
.modal-header,
.modal-content button {
  /* 시스템 글자 크기 설정 무시 */
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
  /* rem 대신 px 사용하여 고정 크기 설정 */
  font-size: 14px !important;
}

/* 본문 스타일 추가 */
:deep(.bible-content) {
  line-height: 1.8;
  word-break: keep-all;
  overflow-wrap: break-word;
  
  /* 기본 폰트 크기 설정 */
  font-size: 16px;
  
  /* 최소/최대 폰트 크기 제한 */
  min-height: 0vw; /* iOS에서 폰트 크기 제한 해제 */
  
  /* 모바일에서 더 나은 가독성을 위한 설정 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* 문단 간격 */
  p {
    margin: 1em 0;
  }
  
  /* 장 번호 스타일 */
  .chapter-num {
    font-weight: bold;
    color: #4170CD;
    /* 장 번호는 고정 크기 유지 */
    font-size: 1rem !important;
  }
  
  /* 절 번호 스타일 */
  .verse-num {
    font-size: 0.85em;
    color: #666;
    vertical-align: top;
    margin-right: 0.2em;
  }
}

/* 모바일 대응 */
@media (max-width: 640px) {
  :deep(.bible-content) {
    /* 모바일에서의 기본 폰트 크기 */
    font-size: 18px;
    
    /* 좌우 여백 조정 */
    padding: 0 1rem;
  }
}
</style> 