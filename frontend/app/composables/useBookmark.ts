/**
 * Bookmark Composable
 *
 * 북마크 CRUD 기능 제공
 */
import { ref, type Ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useApi } from './useApi';

export interface Bookmark {
  id: number;
  bookmark_type: 'chapter' | 'verse';
  book: string;
  book_name?: string;
  chapter: number;
  start_verse?: number;
  end_verse?: number;
  title: string;
  color?: string;
  memo?: string;
  created_at: string;
  updated_at?: string;
}

export const useBookmark = () => {
  const authStore = useAuthStore();
  const api = useApi();

  // 상태
  const currentBookmarks: Ref<Bookmark[]> = ref([]);
  const isBookmarkLoading = ref(false);

  /**
   * 현재 장의 북마크 목록 불러오기
   */
  const loadBookmarks = async (book: string, chapter: number): Promise<void> => {
    if (!authStore.isAuthenticated) return;

    try {
      isBookmarkLoading.value = true;
      const response = await api.get('/api/v1/todos/bible/bookmarks/by_chapter/', {
        params: { book, chapter }
      });
      currentBookmarks.value = response.data || [];
    } catch (error) {
      console.error('북마크 불러오기 실패:', error);
      currentBookmarks.value = [];
    } finally {
      isBookmarkLoading.value = false;
    }
  };

  /**
   * 특정 장이 북마크되어 있는지 확인
   */
  const isChapterBookmarked = (book: string, chapter: number): boolean => {
    return currentBookmarks.value.some(
      b => b.book === book &&
           b.chapter === chapter &&
           b.bookmark_type === 'chapter'
    );
  };

  /**
   * 북마크 추가
   */
  const addBookmark = async (
    book: string,
    chapter: number,
    title: string,
    bookmarkType: 'chapter' | 'verse' = 'chapter',
    verse?: number
  ): Promise<boolean> => {
    if (!authStore.isAuthenticated) return false;

    try {
      isBookmarkLoading.value = true;
      await api.post('/api/v1/todos/bible/bookmarks/', {
        bookmark_type: bookmarkType,
        book,
        chapter,
        verse,
        title
      });
      await loadBookmarks(book, chapter);
      return true;
    } catch (error) {
      console.error('북마크 추가 실패:', error);
      return false;
    } finally {
      isBookmarkLoading.value = false;
    }
  };

  /**
   * 북마크 삭제
   */
  const removeBookmark = async (bookmarkId: number, book: string, chapter: number): Promise<boolean> => {
    if (!authStore.isAuthenticated) return false;

    try {
      isBookmarkLoading.value = true;
      await api.delete(`/api/v1/todos/bible/bookmarks/${bookmarkId}/`);
      await loadBookmarks(book, chapter);
      return true;
    } catch (error) {
      console.error('북마크 삭제 실패:', error);
      return false;
    } finally {
      isBookmarkLoading.value = false;
    }
  };

  /**
   * 북마크 토글 (장 단위)
   */
  const toggleChapterBookmark = async (
    book: string,
    chapter: number,
    bookName: string
  ): Promise<{ success: boolean; added: boolean }> => {
    if (!authStore.isAuthenticated) {
      return { success: false, added: false };
    }

    const existingBookmark = currentBookmarks.value.find(
      b => b.book === book &&
           b.chapter === chapter &&
           b.bookmark_type === 'chapter'
    );

    if (existingBookmark) {
      const success = await removeBookmark(existingBookmark.id, book, chapter);
      return { success, added: false };
    } else {
      const title = `${bookName} ${chapter}장`;
      const success = await addBookmark(book, chapter, title, 'chapter');
      return { success, added: true };
    }
  };

  /**
   * 전체 북마크 목록 불러오기
   */
  const getAllBookmarks = async (): Promise<Bookmark[]> => {
    if (!authStore.isAuthenticated) return [];

    try {
      const response = await api.get('/api/v1/todos/bible/bookmarks/');
      return response.data || [];
    } catch (error) {
      console.error('전체 북마크 불러오기 실패:', error);
      return [];
    }
  };

  return {
    // 상태
    currentBookmarks,
    isBookmarkLoading,

    // 함수
    loadBookmarks,
    isChapterBookmarked,
    addBookmark,
    removeBookmark,
    toggleChapterBookmark,
    getAllBookmarks,
  };
};
