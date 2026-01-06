/**
 * Note Composable
 *
 * 묵상노트 CRUD 기능 제공
 */
import { ref, type Ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

export interface Note {
  id: number;
  book: string;
  chapter: number;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export const useNote = () => {
  const authStore = useAuthStore();
  const api = useApi();

  // 상태
  const currentNotes: Ref<Note[]> = ref([]);
  const isNoteLoading = ref(false);
  const showNoteModal = ref(false);
  const editingNote: Ref<Note | null> = ref(null);
  const noteContent = ref('');

  /**
   * 현재 장의 묵상노트 불러오기
   */
  const loadNotes = async (book: string, chapter: number): Promise<void> => {
    if (!authStore.isAuthenticated) return;

    try {
      isNoteLoading.value = true;
      const response = await api.get('/api/v1/bible/notes/by_chapter/', {
        params: { book, chapter }
      });
      currentNotes.value = response.data || [];
    } catch (error) {
      console.error('묵상노트 불러오기 실패:', error);
      currentNotes.value = [];
    } finally {
      isNoteLoading.value = false;
    }
  };

  /**
   * 특정 장에 노트가 있는지 확인
   */
  const hasNoteForChapter = (book: string, chapter: number): boolean => {
    return currentNotes.value.some(
      n => n.book === book && n.chapter === chapter
    );
  };

  /**
   * 묵상노트 모달 열기
   */
  const openNoteModal = (book: string, chapter: number): void => {
    const existingNote = currentNotes.value.find(
      n => n.book === book && n.chapter === chapter
    );

    if (existingNote) {
      editingNote.value = existingNote;
      noteContent.value = existingNote.content;
    } else {
      editingNote.value = null;
      noteContent.value = '';
    }

    showNoteModal.value = true;
  };

  /**
   * 묵상노트 모달 닫기
   */
  const closeNoteModal = (): void => {
    showNoteModal.value = false;
    editingNote.value = null;
    noteContent.value = '';
  };

  /**
   * 묵상노트 저장
   */
  const saveNote = async (book: string, chapter: number): Promise<boolean> => {
    if (!noteContent.value.trim()) return false;
    if (!authStore.isAuthenticated) return false;

    try {
      isNoteLoading.value = true;

      if (editingNote.value) {
        // 수정
        await api.patch(`/api/v1/bible/notes/${editingNote.value.id}/`, {
          content: noteContent.value
        });
      } else {
        // 새로 작성
        await api.post('/api/v1/bible/notes/', {
          book,
          chapter,
          content: noteContent.value,
          is_private: true
        });
      }

      closeNoteModal();
      await loadNotes(book, chapter);
      return true;
    } catch (error) {
      console.error('묵상노트 저장 실패:', error);
      return false;
    } finally {
      isNoteLoading.value = false;
    }
  };

  /**
   * 묵상노트 삭제
   */
  const deleteNote = async (book: string, chapter: number): Promise<boolean> => {
    if (!editingNote.value) return false;
    if (!authStore.isAuthenticated) return false;

    try {
      isNoteLoading.value = true;
      await api.delete(`/api/v1/bible/notes/${editingNote.value.id}/`);
      closeNoteModal();
      await loadNotes(book, chapter);
      return true;
    } catch (error) {
      console.error('묵상노트 삭제 실패:', error);
      return false;
    } finally {
      isNoteLoading.value = false;
    }
  };

  /**
   * 전체 묵상노트 목록 불러오기
   */
  const getAllNotes = async (): Promise<Note[]> => {
    if (!authStore.isAuthenticated) return [];

    try {
      const response = await api.get('/api/v1/bible/notes/');
      return response.data || [];
    } catch (error) {
      console.error('전체 묵상노트 불러오기 실패:', error);
      return [];
    }
  };

  /**
   * 특정 노트 상세 조회
   */
  const getNoteById = async (noteId: number): Promise<Note | null> => {
    if (!authStore.isAuthenticated) return null;

    try {
      const response = await api.get(`/api/v1/bible/notes/${noteId}/`);
      return response.data || null;
    } catch (error) {
      console.error('묵상노트 조회 실패:', error);
      return null;
    }
  };

  return {
    // 상태
    currentNotes,
    isNoteLoading,
    showNoteModal,
    editingNote,
    noteContent,

    // 함수
    loadNotes,
    hasNoteForChapter,
    openNoteModal,
    closeNoteModal,
    saveNote,
    deleteNote,
    getAllNotes,
    getNoteById,
  };
};
