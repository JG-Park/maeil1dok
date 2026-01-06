/**
 * Reading Position Composable
 *
 * 마지막 읽기 위치 저장/복원 기능 제공
 */
import { ref, type Ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

export interface ReadingPosition {
  book: string;
  chapter: number;
  scroll_position: number;
  version: string;
  updated_at?: string;
}

export const useReadingPosition = () => {
  const authStore = useAuthStore();
  const api = useApi();

  // 상태
  const lastReadingPosition: Ref<ReadingPosition | null> = ref(null);
  const showResumeModal = ref(false);
  const isSavingPosition = ref(false);
  const lastSavedScrollPosition = ref(0);

  // debounce용 타이머
  let savePositionTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * 마지막 읽기 위치 불러오기
   */
  const loadReadingPosition = async (): Promise<ReadingPosition | null> => {
    if (!authStore.isAuthenticated) return null;

    try {
      const response = await api.get('/api/v1/bible/reading-position/');
      const position = response.data?.position || null;
      lastReadingPosition.value = position;
      return position;
    } catch (error) {
      console.error('읽기 위치 불러오기 실패:', error);
      return null;
    }
  };

  /**
   * 마지막 읽기 위치 저장 (debounced)
   */
  const saveReadingPosition = async (
    book: string,
    chapter: number,
    version: string,
    immediate = false
  ): Promise<void> => {
    if (!authStore.isAuthenticated || isSavingPosition.value) return;

    // 현재 스크롤 위치 계산
    const scrollPosition = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) || 0;

    // 이전 저장 위치와 차이가 작으면 저장하지 않음 (5% 미만)
    if (!immediate && Math.abs(scrollPosition - lastSavedScrollPosition.value) < 0.05) return;

    // debounce 처리
    if (savePositionTimeout) {
      clearTimeout(savePositionTimeout);
    }

    const doSave = async () => {
      isSavingPosition.value = true;
      try {
        await api.post('/api/v1/bible/reading-position/', {
          book,
          chapter,
          scroll_position: scrollPosition,
          version
        });
        lastSavedScrollPosition.value = scrollPosition;
      } catch (error) {
        console.error('읽기 위치 저장 실패:', error);
      } finally {
        isSavingPosition.value = false;
      }
    };

    if (immediate) {
      await doSave();
    } else {
      savePositionTimeout = setTimeout(doSave, 2000); // 2초 debounce
    }
  };

  /**
   * 저장된 위치로 스크롤 복원
   */
  const restoreScrollPosition = (scrollPosition: number): void => {
    const scrollTarget = scrollPosition * (document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  };

  /**
   * 이어서 읽기 모달 표시 여부 결정
   */
  const checkAndShowResumeModal = (currentBook: string, currentChapter: number): boolean => {
    if (!lastReadingPosition.value) return false;

    const { book, chapter } = lastReadingPosition.value;

    // 현재 위치와 저장된 위치가 다르면 모달 표시
    if (book !== currentBook || chapter !== currentChapter) {
      showResumeModal.value = true;
      return true;
    }

    return false;
  };

  /**
   * 새로 시작 (모달 닫기)
   */
  const startFresh = (): void => {
    showResumeModal.value = false;
    lastReadingPosition.value = null;
  };

  /**
   * cleanup - 컴포넌트 unmount 시 호출
   */
  const cleanup = (): void => {
    if (savePositionTimeout) {
      clearTimeout(savePositionTimeout);
      savePositionTimeout = null;
    }
  };

  return {
    // 상태
    lastReadingPosition,
    showResumeModal,
    isSavingPosition,
    lastSavedScrollPosition,

    // 함수
    loadReadingPosition,
    saveReadingPosition,
    restoreScrollPosition,
    checkAndShowResumeModal,
    startFresh,
    cleanup,
  };
};
