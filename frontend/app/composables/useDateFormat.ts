/**
 * Date formatting composable
 * 날짜 포맷 관련 유틸리티 함수들을 제공합니다.
 */
export const useDateFormat = () => {
  /**
   * 상대적 날짜 포맷 (오늘, 어제, N일 전, N주 전)
   * 30일 이상인 경우 짧은 날짜 포맷 (1월 1일)
   */
  const formatRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  /**
   * 짧은 날짜 포맷 (1월 1일)
   */
  const formatShortDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  /**
   * 전체 날짜 포맷 (2024년 1월 1일)
   */
  const formatFullDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return {
    formatRelativeDate,
    formatShortDate,
    formatFullDate,
  };
};
