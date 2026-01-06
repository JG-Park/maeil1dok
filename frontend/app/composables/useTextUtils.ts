/**
 * Text utilities composable
 * 텍스트 처리 관련 유틸리티 함수들을 제공합니다.
 */
export const useTextUtils = () => {
  /**
   * 텍스트 자르기 (말줄임표 추가)
   * @param text 원본 텍스트
   * @param length 최대 길이
   * @param suffix 접미사 (기본: '...')
   */
  const truncate = (text: string | null | undefined, length: number, suffix = '...'): string => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  };

  /**
   * HTML 태그 제거
   */
  const stripHtml = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  /**
   * 줄바꿈을 공백으로 변환
   */
  const normalizeWhitespace = (text: string): string => {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  };

  return {
    truncate,
    stripHtml,
    normalizeWhitespace,
  };
};
