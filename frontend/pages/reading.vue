<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useTaskStore } from '~/stores/tasks'
import { useRoute, useRouter } from 'vue-router'
import { useBibleProgressApi, useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import Toast from '~/components/Toast.vue'
import BibleScheduleContent from '~/components/BibleScheduleContent.vue'

const taskStore = useTaskStore()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const api = useApi()

// Toast 컴포넌트 ref
const toast = ref(null)

// 상태 변수들을 상단으로 이동
const showLoginModal = ref(false)
const showModal = ref(false)
const showScheduleModal = ref(false)
const bibleContent = ref('')
const isLoading = ref(true)
const chapterTitle = ref('')
const sectionTitle = ref('')
const currentBook = ref('')
const currentChapter = ref(1)
const selectedBook = ref('gen')
const isHeaderFloating = ref(false)
const isTodayReadingFloating = ref(false)
const schedules = ref([])
const selectedMonth = ref(new Date().getMonth() + 1)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const readingStatus = ref('not_started')
const currentSection = ref(null)

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
    console.log('Fetching schedule for:', { book, chapter })
    const scheduleData = await taskStore.fetchReadingSchedule(book, chapter)
    console.log('Schedule data:', scheduleData)
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
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = `-${scrollY}px`
    document.body.style.touchAction = 'none'
  } else {
    const scrollY = document.body.style.top
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
    document.body.style.top = ''
    document.body.style.touchAction = ''
    window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)
  }
}

// 모든 모달 상태를 감시하는 watch
watch(
  [showLoginModal, showModal, showScheduleModal],
  ([newLoginModal, newShowModal, newScheduleModal]) => {
    toggleBodyScroll(newLoginModal || newShowModal || newScheduleModal)
  }
)

// 로그인 페이지로 이동
const goToLogin = () => {
  const queryString = route.query ? new URLSearchParams(Object.entries(route.query)).toString() : ''
  const currentPath = `${route.path}${queryString ? '?' + queryString : ''}`
  navigateTo({
    path: '/login',
    query: {
      redirect: currentPath
    }
  })
  showLoginModal.value = false
}

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
  console.log('Before initializeTodayReading')
  await initializeTodayReading()
  console.log('After initializeTodayReading:', {
    todayReading: taskStore.todayReading,
    currentBook: currentBook.value,
    currentChapter: currentChapter.value
  })
  
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
  handleScroll() // 초기 상태 체크
})

// 컴포넌트가 언마운트될 때 이벤트 리스너 제거
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 스크롤 핸들러 함수 수정
const handleScroll = () => {
  const scrollY = window.scrollY
  const headerHeight = 48
  const todayReadingElement = document.querySelector('.today-reading')
  const contentSection = document.querySelector('.content-section')
  const floatingSpacer = document.querySelector('.floating-spacer')
  
  if (!todayReadingElement || !contentSection) return
  
  const todayReadingHeight = todayReadingElement.offsetHeight
  const todayReadingTop = todayReadingElement.offsetTop
  const scrollProgress = Math.min(Math.max((scrollY - todayReadingTop + headerHeight) / todayReadingHeight, 0), 1)

  isHeaderFloating.value = scrollY > 0
  isTodayReadingFloating.value = scrollProgress > 0.5 // 50% 스크롤 되었을 때 floating 상태로 전환

  // 플로팅 상태일 때 spacer 높이 설정
  if (floatingSpacer) {
    floatingSpacer.style.setProperty('--floating-height', `${todayReadingHeight}px`)
    if (isTodayReadingFloating.value) {
      floatingSpacer.classList.add('active')
    } else {
      floatingSpacer.classList.remove('active')
    }
  }
}

// 스케줄 모달 관련 함수들
const openScheduleModal = () => {
  showScheduleModal.value = true
}

const closeScheduleModal = () => {
  showScheduleModal.value = false
}

// 한글 성경 이름을 코드로 변환하는 함수
const findBookCode = (koreanName) => {
  const allBooks = [...bibleBooks.old, ...bibleBooks.new]
  const book = allBooks.find(b => b.name === koreanName)
  return book?.id
}

// 일정 선택 처리
const handleScheduleSelect = (schedule) => {
  const bookCode = findBookCode(schedule.book)
  if (!bookCode) {
    console.error('Invalid book name:', schedule.book)
    return
  }
  
  router.push(`/reading?book=${bookCode}&chapter=${schedule.start_chapter}&from=reading-plan`)
  showScheduleModal.value = false
}

// 선택된 월의 스케줄만 필터링
const filteredSchedules = computed(() => {
  return schedules.value.filter(schedule => {
    const scheduleDate = new Date(schedule.date)
    return scheduleDate.getMonth() + 1 === selectedMonth.value
  })
})

// 읽기 상태 확인 함수 수정
const getReadingStatus = (schedule) => {
  const today = new Date()
  const scheduleDate = new Date(schedule.date)
  
  // 날짜 비교를 위해 시간 부분을 제거
  today.setHours(0, 0, 0, 0)
  scheduleDate.setHours(0, 0, 0, 0)
  
  // 1. 읽은 구간 확인 (날짜와 상관없이)
  if (authStore.isAuthenticated) {
    const isRead = readingHistory.value.some(history => 
      history.book === schedule.book && 
      history.last_chapter_read === schedule.end_chapter
    )
    if (isRead) return 'completed'
  }
  
  // 2. 오늘 구간 확인
  if (scheduleDate.getTime() === today.getTime()) {
    return 'current'
  }
  
  // 3. 과거 구간은 읽지 않음으로 표시
  if (scheduleDate < today) {
    return 'not_completed'
  }
  
  // 4. 미래 구간
  return 'upcoming'
}

// 현재 장이 읽기 구간의 마지막 장인지 확인하는 computed 속성
const isLastChapterInSchedule = computed(() => {
  if (!taskStore.todayReading) return false
  
  return currentBook.value === taskStore.todayReading.book && 
         currentChapter.value === taskStore.todayReading.end_chapter
})

// isToday computed 속성 수정
const isToday = computed(() => {
  if (!taskStore.todayReading?.date) return false
  
  const today = new Date()
  const scheduleDate = new Date(taskStore.todayReading.date)
  
  return today.getFullYear() === scheduleDate.getFullYear() &&
         today.getMonth() === scheduleDate.getMonth() &&
         today.getDate() === scheduleDate.getDate()
})

// isPastDate computed 속성 추가
const isPastDate = computed(() => {
  if (!taskStore.todayReading?.date) return false
  
  const today = new Date()
  const scheduleDate = new Date(taskStore.todayReading.date)
  today.setHours(0, 0, 0, 0)
  scheduleDate.setHours(0, 0, 0, 0)
  
  return scheduleDate < today
})

// isFutureDate computed 속성 추가
const isFutureDate = computed(() => {
  if (!taskStore.todayReading?.date) return false
  
  const today = new Date()
  const scheduleDate = new Date(taskStore.todayReading.date)
  today.setHours(0, 0, 0, 0)
  scheduleDate.setHours(0, 0, 0, 0)
  
  return scheduleDate > today
})

const { getBibleProgress, completeBibleReading, cancelBibleReading } = useBibleProgressApi()

// 읽기 상태 조회
const checkReadingStatus = async () => {
  if (!currentBook.value || !currentChapter.value) {
    console.log('[Reading Status] Missing book or chapter:', {
      book: currentBook.value,
      chapter: currentChapter.value
    })
    return
  }
  
  console.log('[Reading Status] Checking status for:', {
    book: currentBook.value,
    chapter: currentChapter.value
  })
  
  try {
    const response = await getBibleProgress(currentBook.value, currentChapter.value)
    console.log('[Reading Status] API Response:', response)
    
    readingStatus.value = response.status
    currentSection.value = {
      ...response.section,
      is_completed: response.status === 'completed'
    }
    
    console.log('[Reading Status] Updated state:', {
      readingStatus: readingStatus.value,
      currentSection: currentSection.value
    })
  } catch (error) {
    console.error('[Reading Status] Failed to check status:', error)
  }
}

// 읽기 완료 처리
const handleCompleteReading = () => {
  if (!authStore.isAuthenticated) {
    showLoginModal.value = true
    return
  }

  if (!taskStore.todayReading?.date) return
  showCompleteConfirmModal.value = true
}

// 실제 읽기 완료 처리 함수
const confirmCompleteReading = async () => {
  try {
    isLoading.value = true
    await completeBibleReading(taskStore.todayReading.date)
    readingStatus.value = 'completed'
    showCompleteConfirmModal.value = false
  } catch (error) {
    console.error('Failed to complete reading:', error)
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
  } catch (error) {
    console.error('Failed to cancel reading:', error)
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
  [
    () => currentBook.value,
    () => currentChapter.value,
    () => taskStore.todayReading?.date
  ],
  async ([newBook, newChapter, newDate], [oldBook, oldChapter, oldDate]) => {
    console.log('[Watch] Values changed:', {
      book: { old: oldBook, new: newBook },
      chapter: { old: oldChapter, new: newChapter },
      date: { old: oldDate, new: newDate }
    })
    await checkReadingStatus()
  }
)

// 글자 크기 상태 관리
const fontSize = ref(16) // 기본 글자 크기
const DEFAULT_FONT_SIZE = 16 // 기본 글자 크기 상수

// 글자 크기 조절 함수
const adjustFontSize = (delta) => {
  const newSize = fontSize.value + delta
  if (newSize >= 14 && newSize <= 24) { // 최소 14px, 최대 24px
    fontSize.value = newSize
  }
}

// 글자 크기 초기화 함수
const resetFontSize = () => {
  fontSize.value = DEFAULT_FONT_SIZE
}

// 상태 변수들을 상단으로 이동 섹션에 추가
const readingHistory = ref([])

// 읽기 이력 가져오기
const fetchReadingHistory = async () => {
  try {
    const response = await api.get('/api/v1/todos/reading-history/')
    console.log('[Reading History] Response:', response)  // 디버깅용
    readingHistory.value = response
  } catch (error) {
    console.error('Failed to fetch reading history:', error)
  }
}

// 현재 장이 속한 구간의 마지막 장이 읽음 상태인지 확인하는 computed 속성 추가
const isCurrentSectionCompleted = computed(() => {
  if (!taskStore.todayReading) return false
  
  // 현재 장이 속한 구간의 마지막 장이 읽음 상태인지 확인
  const currentSection = schedules.value.find(schedule => {
    return schedule.book === bookNames[currentBook.value] &&
           schedule.start_chapter <= currentChapter.value &&
           schedule.end_chapter >= currentChapter.value
  })

  if (!currentSection) return false

  // 해당 구간의 마지막 장이 읽음 상태인지 확인
  const isRead = readingHistory.value.some(history => 
    new Date(history.date).toDateString() === new Date(currentSection.date).toDateString()
  )

  return isRead
})

// 현재 장이 읽음 상태인지 확인하는 computed 속성
const isCurrentChapterCompleted = computed(() => {
  if (!currentSection.value) return false
  
  // section과 status 모두 확인
  return currentSection.value.is_completed || readingStatus.value === 'completed'
})

// 관리 모드 관련 상태
const isManageMode = ref(false)
const selectedSchedules = ref([])

// 개별 일정 선택/해제
const toggleSelect = (schedule) => {
  const index = selectedSchedules.value.findIndex(s => 
    s.date === schedule.date
  )
  
  if (index === -1) {
    selectedSchedules.value.push(schedule)
  } else {
    selectedSchedules.value.splice(index, 1)
  }
}

// 과거 미완료 전체 선택
const selectAllIncomplete = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const incompleteSchedules = filteredSchedules.value.filter(schedule => {
    const scheduleDate = new Date(schedule.date)
    scheduleDate.setHours(0, 0, 0, 0)
    return scheduleDate < today && getReadingStatus(schedule) === 'not_completed'
  })
  
  selectedSchedules.value = incompleteSchedules
}

// 선택된 일정 일괄 업데이트
const bulkUpdateProgress = async (action) => {
  try {
    await api.post('/api/v1/todos/bible-progress/bulk-update/', {
      schedules: selectedSchedules.value,
      action: action
    })
    
    // 상태 갱신
    await fetchReadingHistory()
    selectedSchedules.value = []
    
    // 토스트 메시지 표시
    toast.value?.show()
    
  } catch (error) {
    console.error('Failed to update schedules:', error)
  }
}

// 오늘 날짜의 일정으로 스크롤하는 함수
const scrollToToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todaySchedule = filteredSchedules.value.find(schedule => {
    const scheduleDate = new Date(schedule.date)
    scheduleDate.setHours(0, 0, 0, 0)
    return scheduleDate.getTime() === today.getTime()
  })
  
  if (todaySchedule) {
    const element = document.querySelector(`[data-date="${todaySchedule.date}"]`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 구간 선택 관련 상태
const isRangeSelectMode = ref(false)
const rangeStart = ref(null)

// 구간 선택 모드 토글
const toggleRangeSelect = () => {
  isRangeSelectMode.value = !isRangeSelectMode.value
  if (!isRangeSelectMode.value) {
    rangeStart.value = null
  }
  selectedSchedules.value = []  // 선택 초기화
}

// 일정이 선택되었는지 확인
const isScheduleSelected = (schedule) => {
  return selectedSchedules.value.some(s => 
    new Date(s.date).getTime() === new Date(schedule.date).getTime()
  )
}

// 특정 장이 읽음 상태인지 확인하는 함수
const isChapterCompleted = (chapter) => {
  if (!taskStore.todayReading) return false
  
  // 현재 장이 완료 상태인 경우
  if (chapter === currentChapter.value && readingStatus.value === 'completed') {
    return true
  }
  
  // 읽기 이력에서 해당 장이 완료되었는지 확인
  return readingHistory.value.some(history => 
    history.book === currentBook.value && 
    history.last_chapter_read >= chapter
  )
}

// 읽기 완료 확인 모달 상태
const showCompleteConfirmModal = ref(false)

// 뒤로가기 처리 함수 추가
const handleBackNavigation = () => {
  const { from, month } = route.query
  
  if (from === 'reading-plan' && month) {
    // reading-plan 페이지로 돌아가되, month 파라미터 유지
    router.push(`/reading-plan?month=${month}`)
  } else {
    // 기본적으로는 홈으로
    router.push('/')
  }
}

</script>

<template>
  <div class="container">
    <div class="header fade-in">
      <button class="back-button" @click="handleBackNavigation">
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
      <div class="today-info">
        <div class="reading-meta">
          <button 
            class="schedule-button"
            @click="openScheduleModal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round"
              />
            </svg>
            <span>성경통독표</span>
          </button>
          <button 
            v-if="readingStatus === 'completed'"
            class="complete-button complete-cancel-button" 
            @click="handleCancelReading"
            :disabled="isLoading"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round"
              />
            </svg>
            <span>완료 취소</span>
          </button>
          <button 
            v-else
            class="complete-button" 
            @click="handleCompleteReading"
            :disabled="isLoading"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
              />
            </svg>
            <span>{{ authStore.isAuthenticated ? '완료' : '완료로 기록' }}</span>
          </button>
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
            <path d="M12 2a3 3 0 0 1 3 3v14a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm7 4a2 2 0 0 1 2 2v8a2 2 0 0 1-4 0V8a2 2 0 0 1 2-2zM5 6a2 2 0 0 1 2 2v8a2 2 0 0 1-4 0V8a2 2 0 0 1 2-2z" fill="currentColor"/>
          </svg>
          <span class="link-text">오디오</span>
        </a>
        <a 
          v-if="taskStore.todayReading.guide_link" 
          :href="taskStore.todayReading.guide_link" 
          target="_blank" 
          class="link-button guide"
          title="가이드"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="link-text">해설</span>
        </a>
      </div>
    </div>

    <div class="content-section-wrapper">
      <div class="floating-spacer"></div>
      <div class="content-section fade-in" style="animation-delay: 0.2s">
        <div class="chapter-controls">
          <button class="chapter-select-button" @click="showModal = true">
            <div class="button-content">
              <h2>{{ chapterTitle }}</h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </button>
          <div class="font-size-controls">
            <button 
              class="font-button" 
              @click="adjustFontSize(-1)"
              :disabled="fontSize <= 14"
            >
              <span class="font-icon small">가</span>
            </button>
            <button 
              class="font-button" 
              @click="adjustFontSize(1)"
              :disabled="fontSize >= 24"
            >
              <span class="font-icon">가</span>
            </button>
            <button 
              class="font-button reset"
              @click="resetFontSize"
              :disabled="fontSize === DEFAULT_FONT_SIZE"
              title="기본 크기로 초기화"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M2 10C2 10 4.00498 7.26822 5.63384 5.63824C7.26269 4.00827 9.5136 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.89691 21 4.43511 18.2543 3.35177 14.5M2 10V4M2 10H8" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div v-if="isLoading" class="loading">
          <div class="loading-spinner"></div>
          <p>
            {{ bookNames[selectedBook] }} {{ currentChapter }}장을 불러오는 중입니다...
          </p>
        </div>

        <div v-else class="bible-content text-adjustable" 
             :style="{ fontSize: `${fontSize}px` }" 
             v-html="bibleContent">
        </div>
      </div>
    </div>

    <div class="navigation-controls fade-in" style="animation-delay: 0.3s">
      <button class="nav-button prev" @click="goToPrevChapter">
        &lt; 이전
      </button>
      <div class="center-content">
        <div class="current-page">
          <!-- 날짜 표시에 상태별 클래스 추가 -->
          <div 
            v-if="taskStore.todayReading" 
            class="schedule-date"
            :class="{
              'completed': authStore.isAuthenticated ? readingStatus === 'completed' : isPastDate,
              'not-completed': authStore.isAuthenticated ? (!isToday && readingStatus !== 'completed') : false,
              'current': isToday,
              'upcoming': !authStore.isAuthenticated && isFutureDate
            }"
          >
            <!-- 상태 아이콘 수정 -->
            <div v-if="authStore.isAuthenticated ? readingStatus === 'completed' : isPastDate" class="status-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            
            <!-- 읽지 않은 구간 아이콘 (로그인 사용자만) -->
            <div v-else-if="authStore.isAuthenticated && !isToday" class="status-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            
            <!-- 오늘 구간 표시 -->
            <div v-else-if="isToday" class="status-icon today">
              오늘
            </div>
            
            {{ formatScheduleDate(taskStore.todayReading.date) }}
          </div>
          <div class="chapter-range">
            {{ bookNames[currentBook] }}
            <template v-if="taskStore.todayReading">
              <!-- 시작 장 -->
              <span 
                class="chapter-number"
                :class="{ 
                  'current': taskStore.todayReading.chapter === currentChapter,
                  'completed': isChapterCompleted(taskStore.todayReading.chapter)
                }"
              >
                {{ taskStore.todayReading.chapter }}
              </span>

              <!-- 중간 구분선 -->
              <span class="chapter-separator">-</span>

              <!-- 현재 장이 시작/끝이 아닐 때만 표시 -->
              <template v-if="currentChapter !== taskStore.todayReading.chapter && 
                              currentChapter !== taskStore.todayReading.end_chapter">
                <span class="chapter-number current">
                  {{ currentChapter }}
                </span>
                <span class="chapter-separator">-</span>
              </template>

              <!-- 마지막 장 -->
              <span 
                class="chapter-number"
                :class="{ 
                  'current': taskStore.todayReading.end_chapter === currentChapter,
                  'completed': isChapterCompleted(taskStore.todayReading.end_chapter)
                }"
              >
                {{ taskStore.todayReading.end_chapter }}
              </span>
              <span>장</span>
            </template>
            <template v-else>
              {{ currentChapter }}장
            </template>
          </div>
        </div>
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

    <!-- 스케줄 모달 수정 -->
    <Teleport to="body">
      <div v-if="showScheduleModal" class="modal-overlay" @click="closeScheduleModal">
        <div class="modal-content schedule-modal" @click.stop>
          <div class="modal-header">
            <h3>성경통독표</h3>
            <div class="header-controls">
              <button class="close-button" @click="closeScheduleModal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          <BibleScheduleContent 
            v-if="showScheduleModal"
            :is-modal="true"
            :current-book="currentBook"
            :current-chapter="currentChapter"
            @schedule-select="handleScheduleSelect"
          />
        </div>
      </div>
    </Teleport>

    <!-- 로그인 모달 -->
    <Teleport to="body">
      <div v-if="showLoginModal" class="modal-overlay" @click="showLoginModal = false">
        <div class="modal-content login-modal" @click.stop>
          <div class="modal-body">
            <button class="close-button absolute-close" @click="showLoginModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="modal-content-wrapper">
              <div class="modal-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15V12M12 9h.01M5.07 19H19a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h.07z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="modal-text">
                <h3>로그인이 필요한 기능입니다</h3>
                <p>회원만 사용이 가능한 기능입니다.<br>로그인/회원가입 하시겠어요?</p>
              </div>
              <div class="modal-actions">
                <button class="login-button" @click="goToLogin">
                  로그인하기
                </button>
                <button class="cancel-button" @click="showLoginModal = false">
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 토스트 컴포넌트 추가 -->
    <Toast 
      ref="toast"
      message="저장되었습니다!"
      type="success"
    />

    <!-- 읽기 완료 확인 모달 -->
    <Teleport to="body">
      <div v-if="showCompleteConfirmModal" class="modal-overlay" @click="showCompleteConfirmModal = false">
        <div class="modal-content confirm-modal" @click.stop>
          <div class="modal-body">
            <button class="close-button absolute-close" @click="showCompleteConfirmModal = false">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="modal-content-wrapper">
              <div class="modal-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="modal-text">
                <h3>읽기 완료</h3>
                <p>
                  {{ bookNames[currentBook] }} {{ taskStore.todayReading?.chapter }}-{{ taskStore.todayReading?.end_chapter }}장까지<br>
                  구간을 읽음으로 표시하겠어요?
                </p>
              </div>
              <div class="modal-actions">
                <button class="confirm-button" @click="confirmCompleteReading">
                  네
                </button>
                <button class="cancel-button" @click="showCompleteConfirmModal = false">
                  아니요
                </button>
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
  padding-bottom: calc(3.5rem + env(safe-area-inset-bottom));
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
  height: 50px;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  margin: 0.5rem;
  padding: 0.5rem 0.85rem;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
  position: relative;
  top: 0;
  -webkit-tap-highlight-color: transparent;
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
  gap: 0.75rem;  /* 간격 약간 늘림 */
  margin-bottom: 0;
}

.date-badge {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
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
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.today-links {
  display: flex;
  margin-left: 0.75rem;
  flex-shrink: 0;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.today-reading.floating {
  position: fixed;
  max-width: 768px;
  width: 100%;
  top: 48px;
  margin: 0;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03)!important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 9;
  display: flex;
  justify-content: center;
}

.today-reading.floating::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  box-shadow: inherit;
  border-bottom: inherit;
  z-index: -1;
}

.today-reading.floating > * {
  max-width: 768px;
  margin: 0 1rem;
}

@media (max-width: 640px) {

  .today-reading.floating {
    margin: 0;
    padding: 0.5rem;
  }
  
  .today-reading.floating > * {
    margin: 0 0.5rem;
  }
}

.content-section-wrapper {
  position: relative;
}

.floating-spacer {
  height: 0;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-spacer.active {
  height: var(--floating-height);
}


.content-section {
  background: white;
  margin: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.85rem;
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
  touch-action: pan-x pan-y;
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
  padding: 0 1rem;
  gap: 1rem;
  background: white;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
  max-width: 768px;
  min-height: 50px;
  margin: 0 auto;
  z-index: 20;
}
/* iOS 안전영역 대응 */
@supports (-webkit-touch-callout: none) {
  .navigation-controls {
    padding: 0.5rem 2rem calc(env(safe-area-inset-bottom) - 8px) 2rem;
  }
}

.nav-button {
  padding: 0;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;  /* 글자 크기 약간 줄임 */
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
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
  border: 1px solid rgba(46, 144, 250, 0.5);
  background: rgba(46, 144, 250, 0.1);
  color: #2E90FA;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8125rem;  /* 글자 크기 약간 줄임 */
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.75rem;  /* 상단 버튼에 맞게 패딩 조정 */
  margin: 0 0 0.1rem 0;
  height: 32px;  /* 높이 고정 */
  gap: 0.375rem;  /* 아이콘과 텍스트 사이 간격 */
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

.complete-cancel-button {
  border: 1px solid rgba(220, 38, 38, 0.25);  /* 테두리 더 연하게 */
  background: rgba(220, 38, 38, 0.05);  /* 배경 더 연하게 */
  color: #DC2626;
}

.complete-cancel-button:hover {
  background: rgba(220, 38, 38, 0.1);  /* hover 배경 더 연하게 */
  border-color: rgba(220, 38, 38, 0.4);  /* hover 테두리 더 연하게 */
  color: #DC2626;  /* hover 시에도 빨간색 유지 */
}

.complete-button:disabled,
.complete-cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-button:hover {
  color: var(--primary-color);
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .today-reading {
    padding: 0.5rem 0.65rem;
  }


  .complete-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    height: 28px;
    gap: 0.25rem;
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
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  width: 90%;
  height: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow: hidden;
  background: white;
  border-radius: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 모달 헤더 */
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
  letter-spacing: -0.02em;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* 모바일에서 모달 헤더 조정 */
@media (max-width: 640px) {
  .modal-header {
    padding: 0.8rem 1rem;
  }

  .modal-header h3 {
    font-size: 1rem;
  }
}

.modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 400px; /* 최소 높이 설정 */
}

.books-section {
  flex: 1;
  border-right: 1px solid #eee;
  padding: 0 1rem 0.85rem 1rem;
  overflow-y: auto;
  height: 100%;
  -webkit-overflow-scrolling: touch;
  position: absolute; /* 절대 위치로 변경 */
  left: 0;
  top: 0;
  bottom: 0;
  width: 45%; /* 너비 설정 */
}

.chapters-section {
  flex: 1.3;
  padding: 0 1rem 0.85rem 1rem;
  overflow-y: auto;
  height: 100%;
  -webkit-overflow-scrolling: touch;
  position: absolute; /* 절대 위치로 변경 */
  right: 0;
  top: 0;
  bottom: 0;
  width: 55%; /* 너비 설정 */
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
    max-width: 95vw;
    max-height: 85vh;
    border-radius: 16px;
    margin: 0;
  }


  .books-section {
    flex: 0.7;
    padding-right: 0.75rem;
  }

  .chapters-section {
    flex: 1.3;
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
    height: 85vh;
  }

  .modal-body {
    height: calc(100% - 60px);
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
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 36px;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
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
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.button-content svg {
  color: var(--text-secondary);
}

.schedule-modal {
  width: 100%;
  display: flex;
  flex-direction: column;
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

.divider {
  width: 1px;
  height: 24px;
  background: #eee;
  flex-shrink: 0;
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
  font-size: 16px;
  min-height: 0vw;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:deep(.bible-content p) {
  margin: 1em 0;
}

:deep(.bible-content .chapter-num) {
  font-weight: bold;
  color: #4170CD;
  font-size: 1rem !important;
}

:deep(.bible-content .verse-num) {
  font-size: 0.85em;
  color: #666;
  vertical-align: top;
  margin-right: 0.2em;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  :deep(.bible-content) {
    font-size: 18px;
  }
}

.login-modal {
  max-width: 320px;
  max-height: 350px;
  width: 90%;
  text-align: center;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  margin: 1rem;
  padding: 1rem;
  animation: slideUp 0.3s ease-out;
}

.modal-content-wrapper {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
}

.modal-icon {
  width: 48px;
  height: 48px;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-text {
  margin-bottom: 1rem;
  width: 100%;
}

.modal-text h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  word-break: keep-all;
}

.modal-text p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.9375rem;
  word-break: keep-all;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.login-button,
.modal-actions .cancel-button {
  width: 100%;
  padding: 0.45rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-button {
  background: var(--primary-color);
  color: white;
  border: none;
}

.login-button:hover {
  background: var(--primary-dark);
}

.modal-actions .cancel-button {
  background: #f1f3f5;
  color: var(--text-secondary);
  border: none;
}

.modal-actions .cancel-button:hover {
  background: #e9ecef;
  color: var(--text-primary);
}

.absolute-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.absolute-close:hover {
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.05);
}

.current-page {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .current-page {
    font-size: 0.875rem;
  }
}

.link-text {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.link-button {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  flex-shrink: 0;
  text-decoration: none;
  white-space: nowrap;
}

/* 오디오 버튼 스타일 */
.link-button[href*="audio"] {
  background: var(--red-light);
  color: var(--red-primary);
}

.link-button[href*="audio"]:hover {
  background: var(--red-hover);
}

/* 해설 버튼 스타일 */
.link-button[href*="guide"] {
  background: var(--blue-light);
  color: var(--blue-primary);
}

.link-button[href*="guide"]:hover {
  background: var(--blue-hover);
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .link-button {
    padding: 0.375rem;
  }
  
  .link-text {
    font-size: 0.6875rem;
  }
}

/* 색상 변수 정의 */
:root {
  --red-primary: #DC2626;
  --red-light: rgba(220, 38, 38, 0.1);
  --red-hover: rgba(220, 38, 38, 0.15);
  
  --blue-primary: #2E90FA;
  --blue-light: rgba(46, 144, 250, 0.1);
  --blue-hover: rgba(46, 144, 250, 0.15);
}

.chapter-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.font-size-controls {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.font-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  /* iOS에서 터치 관련 속성 제거 */
  -webkit-tap-highlight-color: transparent;
}

/* iOS에서 버튼 터치 영역 최적화 */
@supports (-webkit-touch-callout: none) {
  .font-button {
    /* iOS에서 터치 이벤트 관련 속성 수정 */
    padding: 0;
    margin: 0;
    touch-action: manipulation;
  }
}

.font-button:hover:not(:disabled) {
  background: #f1f3f5;
  border-color: #dee2e6;
}

.font-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.font-icon {
  color: var(--text-primary);
  font-weight: 600;
}

.font-icon.small {
  font-size: 0.7rem;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .font-button {
    width: 32px;
    height: 32px;
  }
}

/* 초기화 버튼 스타일 */
.font-button.reset {
  color: var(--text-secondary);
}

.font-button.reset:hover:not(:disabled) {
  color: var(--text-primary);
}

/* iOS에서 버튼 터치 영역 최적화 */
@supports (-webkit-touch-callout: none) {
  .font-button {
    padding: 0;
    margin: 0;
  }
}

.current-chapter-info {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: center;
}

.current-chapter-info.completed {
  color: #4170CD;
}

.current-chapter-info svg {
  color: #4170CD;
}

.reading-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 읽은 구간 - 초록색 계열 */
.schedule-item.completed {
  background: #F0FDF4;  /* 연한 초록색 배경 */
  border-left: 4px solid #22C55E;  /* 진한 초록색 테두리 */
  color: #166534;  /* 진한 초록색 텍스트 */
}

/* 오늘 구간 - 파란색 계열 */
.schedule-item.current {
  background: #EFF6FF;  /* 연한 파란색 배경 */
  border-left: 4px solid #2563EB;  /* 진한 파란색 테두리 */
  color: #1E40AF;  /* 진한 파란색 텍스트 */
}

/* 읽지 않은 과거 구간 - 빨간색 계열 (유지) */
.schedule-item.not_completed {
  background: #FEF2F2;
  border-left: 4px solid #DC2626;
  color: #991B1B;
}

/* 미래 구간 - 기본 스타일 (유지) */
.schedule-item.upcoming {
  background: white;
  border-left: 4px solid transparent;
  color: var(--text-secondary);
}

/* 완료 아이콘 색상도 초록색으로 변경 */
.status-icon.completed {
  background: #DCF9E6;  /* 연한 초록색 배경 */
  color: #22C55E;  /* 진한 초록색 아이콘 */
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
}

.schedule-item.manage-mode {
  padding-left: 0.5rem;
}

/* 모달 기본 스타일 */
.modal-overlay {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.schedule-modal {
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 95vw;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  animation: modalSlideUp 0.4s ease-out;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 월 선택기 */
.month-selector {
  border-bottom: 1px solid #F1F5F9;
}

.month-scroll {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
}

.month-button {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.month-button.active {
  background: var(--primary-light);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.month-button:hover:not(.active) {
  background: #F8FAFC;
  color: #334155;
}


.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  padding: 1rem 1.25rem;
  border-radius: 16px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* 읽은 구간 */
.schedule-item.completed {
  background: #F0FDF4;
  border-color: #DCFCE7;
  color: #166534;
}

/* 오늘 구간 */
.schedule-item.current {
  background: #EFF6FF;
  border-color: #BFDBFE;
  color: #1E40AF;
}

/* 읽지 않은 과거 구간 */
.schedule-item.not_completed {
  background: #FEF2F2;
  border-color: #FEE2E2;
  color: #991B1B;
}

/* 미래 구간 */
.schedule-item.upcoming {
  background: #FFFFFF;
  border-color: #E2E8F0;
  color: #64748B;
}

.schedule-reading {
  font-size: 0.9375rem;
  font-weight: 600;
}

.bulk-actions {
  display: flex;
  gap: 0.75rem;
}

.bulk-actions button {
  flex: 1;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.bulk-actions .complete-button {
  background: #22C55E;
  color: white;
  border: none;
}

.bulk-actions .cancel-button {
  background: #EF4444;
  color: white;
  border: none;
}

.bulk-actions {
  display: flex;
  gap: 0.75rem;
  height: 40px;
  transform-origin: top;
  animation: expandDown 0.3s ease-out;
}

@keyframes expandDown {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* 버튼들의 개별 애니메이션 */
.action-button {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
}

.action-button:nth-child(1) { animation-delay: 0.1s; }
.action-button:nth-child(2) { animation-delay: 0.2s; }
.action-button:nth-child(3) { animation-delay: 0.3s; }

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

.schedule-reading {
  font-size: 0.9375rem;
  font-weight: 600;
}

.select-all-button {
  padding: 0.75rem 1rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.select-all-button:hover {
  background: #F1F5F9;
  color: #334155;
}

.bulk-actions {
  display: flex;
  gap: 0.75rem;
}

.bulk-actions button {
  flex: 1;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.bulk-actions .complete-button {
  background: #22C55E;
  color: white;
  border: none;
}

.bulk-actions .cancel-button {
  background: #EF4444;
  color: white;
  border: none;
}

/* 체크박스 커스텀 스타일 */
.checkbox {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
}

.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 2px solid #CBD5E1;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox input[type="checkbox"]:checked {
  background: #2563EB;
  border-color: #2563EB;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6L9 17L4 12'/%3E%3C/svg%3E");
  background-size: 12px;
  background-position: center;
  background-repeat: no-repeat;
}

.bulk-actions {
  display: flex;
  gap: 0.75rem;
  height: 40px; /* 버튼 높이 고정 */
}

/* 기본 버튼 스타일 */
.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: 100%;
}

/* 구간 선택 버튼 */
.action-button.range-select {
  flex: 0 0 120px; /* 너비 고정 */
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #475569;
}

.action-button.range-select.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.action-button.range-select:hover:not(.active) {
  background: #F1F5F9;
  color: #334155;
}

/* 읽음/읽지 않음 버튼 공통 스타일 */
.action-button.complete,
.action-button.cancel {
  flex: 1;
  border: 1px solid transparent;
}

/* 읽음 버튼 */
.action-button.complete {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.action-button.complete:hover {
  background: var(--primary-color);
  color: white;
}

/* 읽지 않음 버튼 */
.action-button.cancel {
  background: #FEF2F2;
  border-color: #FEE2E2;
  color: #991B1B;
}

.action-button.cancel:hover {
  background: #991B1B;
  color: white;
}

/* 아이콘 스타일 */
.action-button svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .bulk-actions {
    height: 36px; /* 모바일에서는 약간 작게 */
  }
  
  .action-button {
    font-size: 0.8125rem;
  }
  
  .action-button.range-select {
    flex: 0 0 100px; /* 모바일에서는 더 좁게 */
  }
}

/* 관리 모드 트랜지션 효과 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.chapter-range {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  justify-content: center;
  flex-wrap: wrap;
}

.chapter-dot {
  color: #CBD5E1;
  margin: 0 0.1rem;
  font-size: 0.75em;
}

/* 모바일에서 더 컴팩트하게 */
@media (max-width: 640px) {
  .chapter-range {
    font-size: 0.8125rem;
    gap: 0.1rem;
  }
  
  .chapter-dot {
    margin: 0 0.05rem;
    font-size: 0.7em;
  }
}

.schedule-date {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;  /* 간격 줄임 */
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}


/* 상태별 색상 */
.schedule-date.completed {
  color: var(--primary-color);
}

.schedule-date.not-completed {
  color: #DC2626;
}

.schedule-date.current {
  color: #2E90FA;
}

.schedule-date.upcoming {
  color: #94A3B8;  /* 미래 날짜는 회색으로 표시 */
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .schedule-date {
    font-size: 0.75rem;
    gap: 0.25rem;  /* 모바일에서 더 좁게 */
  }
  
  .status-icon {
    width: 18px;
    height: 18px;
  }
  
}

.schedule-button {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid var(--primary-color);  /* 테두리 추가 */
  cursor: pointer;
  transition: all 0.2s ease;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;  /* 약간 투명도 추가 */
  gap: 0.375rem;  /* 아이콘과 텍스트 사이 간격 */
}

.schedule-button:hover {
  background: var(--primary-hover);
  color: var(--primary-dark);
  opacity: 1;  /* 호버 시 투명도 제거 */
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .schedule-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    height: 28px;
    gap: 0.25rem;
  }
}

.confirm-modal {
  max-width: 320px;
  max-height: 350px;
  width: 90%;
  text-align: center;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  margin: 1rem;
  padding: 1rem;
  animation: slideUp 0.3s ease-out;
}

.confirm-button {
  width: 100%;
  padding: 0.45rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary-color);
  color: white;
  border: none;
}

.confirm-button:hover {
  background: var(--primary-dark);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chapter-ellipsis {
  color: #CBD5E1;
  letter-spacing: 1px;
  margin: 0 -0.1rem;
  font-size: 0.75em;
}

/* 모바일에서 더 컴팩트하게 */
@media (max-width: 640px) {
  .chapter-ellipsis {
    margin: 0 -0.2rem;
    font-size: 0.7em;
  }
}

.chapter-separator {
  color: #CBD5E1;
  margin: 0 0.25rem;
}

.chapter-number {
  font-weight: 400;
}

.chapter-number.current {
  font-weight: 700;
  color: var(--primary-color);
}

.chapter-number.completed {
  color: var(--primary-color);
}

/* 모바일에서 더 컴팩트하게 */
@media (max-width: 640px) {
  .chapter-separator {
    margin: 0 0.15rem;
  }
}

.status-icon.today {
  background: #EFF6FF;
  color: #2563EB;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
  width: auto;
  height: auto;
  border: 1px solid currentColor;
}

</style> 