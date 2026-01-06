/**
 * Bible Types
 *
 * 모든 Bible 관련 타입 정의를 중앙 집중화
 */

// ============================================
// Core Types
// ============================================

/**
 * 성경 위치 (책/장/절)
 */
export interface BiblePosition {
  book: string;
  chapter: number;
  verse?: number;
  book_name?: string;
}

/**
 * 읽기 위치 (성경 위치 + 역본/스크롤)
 */
export interface ReadingPosition extends BiblePosition {
  version?: string;
  scroll_position?: number;
}

/**
 * 절 선택 범위
 */
export interface VerseSelection {
  start: number;
  end: number;
  text: string;
}

// ============================================
// Reading Stats
// ============================================

/**
 * 책별 진도
 */
export interface BookProgress {
  read: number;
  total: number;
}

/**
 * 읽기 통계
 */
export interface ReadingStats {
  total_chapters_read: number;
  books_read: number;
  books_completed: number;
  current_streak: number;
  books_progress: Record<string, BookProgress>;
}

/**
 * 최근 읽기 기록
 */
export interface RecentRecord {
  book: string;
  chapter: number;
  book_name: string;
  read_date: string;
}

// ============================================
// User Data Types
// ============================================

/**
 * 북마크
 */
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

/**
 * 묵상노트
 */
export interface Note {
  id: number;
  book: string;
  book_name?: string;
  chapter: number;
  start_verse?: number;
  end_verse?: number;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 하이라이트
 */
export interface Highlight {
  id: number;
  book: string;
  book_name?: string;
  chapter: number;
  start_verse: number;
  end_verse: number;
  color: string;
  memo?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================
// View Types
// ============================================

/**
 * 성경 페이지 뷰 모드
 */
export type ViewMode = 'reader' | 'home' | 'toc';

/**
 * 테마 모드
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * 기본 진입점
 */
export type DefaultEntryPoint = 'last-position' | 'home' | 'toc';
