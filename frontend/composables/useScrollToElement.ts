import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useScrollToElement() {
  const scrollContainer = ref<HTMLElement | null>(null)

  const scrollToElement = (element: HTMLElement | null, options?: ScrollIntoViewOptions) => {
    if (!element) {
      return
    }

    if (scrollContainer.value) {
      // 스크롤 컨테이너 내에서 상대적인 위치 계산
      const targetTop = element.offsetTop
      const containerHeight = scrollContainer.value.clientHeight
      const targetHeight = element.clientHeight

      scrollContainer.value.scrollTo({
        top: targetTop - containerHeight / 2 + targetHeight / 2,
        behavior: options?.behavior || 'smooth',
      })
    } else {
      // 스크롤 컨테이너가 없으면 기본 scrollIntoView 사용
      element.scrollIntoView({
        behavior: options?.behavior || 'smooth',
        block: options?.block || 'center',
      })
    }
  }

  const setScrollContainer = (element: HTMLElement | null) => {
    scrollContainer.value = element
  }

    // 스크롤 이벤트 핸들러
  const handleScroll = (event: Event) => {
    // 필요한 경우 여기에 스크롤 이벤트 처리 로직 추가 (e.g., 스크롤 위치에 따른 버튼 표시/숨김)
  }

    // 컴포넌트 마운트/언마운트 시 스크롤 이벤트 리스너 등록/해제
  onMounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.addEventListener('scroll', handleScroll)
    }
  })

  onBeforeUnmount(() => {
    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener('scroll', handleScroll)
    }
  })

  return { scrollToElement, setScrollContainer, scrollContainer }
} 