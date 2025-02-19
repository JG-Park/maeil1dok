<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const bibleContent = ref('')
const isLoading = ref(true)
const chapterTitle = ref('')
const sectionTitle = ref('')
const currentBook = ref('')
const currentChapter = ref(1)
const showModal = ref(false)
const selectedBook = ref('gen')

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
    const response = await fetch(`/bible-proxy/korbibReadpage.php?version=GAE&book=${book}&chap=${chapter}&sec=1&cVersion=&fontSize=15px&fontWeight=normal`)
    const text = await response.text()
    
    currentBook.value = book
    currentChapter.value = chapter
    
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
          verses.push(`<h3 class="section-title">${currentSection}</h3>`)
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
    loadBibleContent(currentBook.value, currentChapter.value + 1)
  } else {
    // 다음 책의 첫 장으로
    const books = Object.keys(bookNames)
    const currentBookIndex = books.indexOf(currentBook.value)
    if (currentBookIndex < books.length - 1) {
      const nextBook = books[currentBookIndex + 1]
      loadBibleContent(nextBook, 1)
    }
  }
}

// 이전 장으로 이동
const goToPrevChapter = () => {
  if (currentChapter.value > 1) {
    // 같은 책의 이전 장
    loadBibleContent(currentBook.value, currentChapter.value - 1)
  } else {
    // 이전 책의 마지막 장으로
    const books = Object.keys(bookNames)
    const currentBookIndex = books.indexOf(currentBook.value)
    if (currentBookIndex > 0) {
      const prevBook = books[currentBookIndex - 1]
      const lastChapter = bookChapters[prevBook]
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

onMounted(() => {
  loadBibleContent('gen', 1)  // 초기 로드
})
</script>

<template>
  <div class="container">
    <div class="header fade-in" style="animation-delay: 0s">
      <button class="back-button" @click="$router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1>성경읽기</h1>
    </div>

    <div class="content-section fade-in" style="animation-delay: 0.2s">
      <div class="reading-info" @click="showModal = true">
        <h2>{{ chapterTitle }}</h2>
      </div>

      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>말씀을 불러오는 중입니다...</p>
      </div>

      <div v-else class="bible-content" v-html="bibleContent"></div>
    </div>

    <div class="navigation-controls fade-in" style="animation-delay: 0.3s">
      <button class="nav-button" @click="goToPrevChapter">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        이전
      </button>
      <button class="complete-button">읽기 완료</button>
      <button class="nav-button" @click="goToNextChapter">
        다음
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
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
                  class="chapter-button"
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
  </div>
</template>

<style scoped>
/* Google Fonts - 나눔명조 import */
@import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap');

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

.header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.content-section {
  background: white;
  margin: 1rem;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.reading-info {
  margin-bottom: 1.5rem;
  cursor: pointer;
}

.reading-info h2 {
  font-size: 1.5rem;
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
  letter-spacing: -0.025em;
  color: var(--text-primary);
  font-family: 'NotoSerifKR', serif;
  font-weight: 300;
}

.reading-info h2,
.reading-info .subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

:deep(.verse) {
  font-family: 'NotoSerifKR', serif;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: flex-start;
  font-weight: 300;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin-top: 2rem;
  gap: 1rem;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: white;
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.complete-button {
  flex: 1;
  padding: 0.75rem 2rem;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-button:hover, .complete-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-button:active, .complete-button:active {
  transform: translateY(0);
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

  .navigation-controls {
    padding: 0.75rem;
  }

  .nav-button {
    padding: 0.625rem 0.875rem;
  }
}

:deep(.section-title) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 2rem 0 1rem;
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
</style> 