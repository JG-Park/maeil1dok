/**
 * useBibleContent - Bible 본문 콘텐츠 로딩 및 파싱 로직
 *
 * 성경 본문을 외부 API에서 가져와 파싱하고 렌더링 가능한 HTML로 변환합니다.
 * KNT(새한글성경)와 표준 역본(개역개정 등)에 대해 각각 다른 파싱 로직을 적용합니다.
 *
 * @example
 * const { content, isLoading, loadContent } = useBibleContent();
 *
 * // 콘텐츠 로드
 * await loadContent('gen', 1, 'GAE');
 *
 * // 렌더링
 * <div v-html="content" />
 */

import { ref, type Ref } from 'vue';
import { useBibleFetch } from '~/composables/useBibleFetch';
import { useBibleData } from '~/composables/useBibleData';

/**
 * useBibleContent 반환 타입
 */
export interface UseBibleContentReturn {
  // 상태
  content: Ref<string>;
  chapterTitle: Ref<string>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;

  // 액션
  loadContent: (book: string, chapter: number, version: string) => Promise<void>;
  clearContent: () => void;
}

/**
 * Bible 본문 콘텐츠 로딩 및 파싱 composable
 */
export function useBibleContent(): UseBibleContentReturn {
  // ============================================
  // Dependencies
  // ============================================

  const { fetchKntContent, fetchStandardContent, getFallbackUrl } = useBibleFetch();
  const { bookNames } = useBibleData();

  // ============================================
  // State
  // ============================================

  const content = ref('');
  const chapterTitle = ref('');
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // ============================================
  // Internal Parsing Functions
  // ============================================

  /**
   * KNT(새한글성경) 본문 파싱
   */
  const parseKntContent = (jsonData: any, book: string, chapter: number): string => {
    const suffix = book === 'psa' ? '편' : '장';
    chapterTitle.value = `${bookNames[book]} ${chapter}${suffix}`;

    if (!jsonData.html) {
      return '<p class="no-content">내용을 찾을 수 없습니다.</p>';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(jsonData.html, 'text/html');

    // 본문 추출
    const contentEl = doc.querySelector('.content') || doc.body;
    const verses: string[] = [];

    contentEl.querySelectorAll('p, .verse').forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        verses.push(`<p class="verse">${text}</p>`);
      }
    });

    return verses.length > 0
      ? verses.join('')
      : '<p class="no-content">내용을 찾을 수 없습니다.</p>';
  };

  /**
   * font 태그 전처리 (브라우저의 잘못된 HTML 수정 방지)
   */
  const preprocessFontTags = (html: string): string => {
    let processed = html;

    // 1단계: font class="name/area/orgin" 태그를 span으로 변환
    let prevLength = 0;
    let iterations = 0;
    while (processed.length !== prevLength && iterations < 10) {
      prevLength = processed.length;
      iterations++;
      processed = processed
        .replace(/<font\s+class="name">([^<]*)<\/font>/gi, '<span class="bible-name">$1</span>')
        .replace(/<font\s+class="area">([^<]*)<\/font>/gi, '<span class="bible-area">$1</span>')
        .replace(/<font\s+class="orgin">([^<]*)<\/font>/gi, '$1');
    }

    // 2단계: smallTitle을 section-title로 변환
    processed = processed.replace(/<font\s+class="smallTitle">([\s\S]*?)<\/font>/gi, '<h4 class="section-title">$1</h4>');

    // 3단계: chapNum 제거
    processed = processed.replace(/<font\s+class="chapNum">[^<]*<\/font>/gi, '');

    // 4단계: 나머지 font 태그 내용만 유지
    iterations = 0;
    prevLength = 0;
    while (processed.length !== prevLength && iterations < 10) {
      prevLength = processed.length;
      iterations++;
      processed = processed.replace(/<font[^>]*>([^<]*)<\/font>/gi, '$1');
    }

    // 5단계: 고아 </font> 태그 제거
    processed = processed.replace(/<\/font>/gi, '');

    return processed;
  };

  /**
   * DOM 정리 함수
   */
  const cleanupBibleElement = (bibleElement: Element): void => {
    // section-title 내부의 a 태그는 href만 제거
    const sectionTitles = bibleElement.querySelectorAll('h4.section-title');
    sectionTitles.forEach((section) => {
      const anchors = section.querySelectorAll('a');
      anchors.forEach((anchor) => {
        anchor.removeAttribute('href');
      });
    });

    // 그 외의 a 태그는 완전히 제거
    const otherAnchors = bibleElement.querySelectorAll('a:not(h4.section-title a)');
    otherAnchors.forEach((anchor) => {
      anchor.remove();
    });

    // 기타 불필요한 요소 제거
    const elementsToRemove = bibleElement.querySelectorAll(
      'input, select, form, .fontcontrol, [style*="display:none"], [style*="display: none"]'
    );
    elementsToRemove.forEach((el) => el.remove());
  };

  /**
   * 구절 텍스트에서 태그 정리
   */
  const cleanVerseText = (html: string): string => {
    let text = html;
    // font 태그를 span으로 변환
    text = text
      .replace(/<font\s+class="name">([^<]*)<\/font>/gi, '<span class="bible-name">$1</span>')
      .replace(/<font\s+class="area">([^<]*)<\/font>/gi, '<span class="bible-area">$1</span>')
      .replace(/<font\s+class="orgin">([^<]*)<\/font>/gi, '$1')
      .replace(/<font[^>]*>([^<]*)<\/font>/gi, '$1')
      .replace(/<\/font>/gi, '');

    // bible-name, bible-area 클래스 보존하고 나머지 태그 제거
    const placeholders: string[] = [];
    text = text.replace(/<span\s+class="bible-(name|area)">[^<]*<\/span>/gi, (match) => {
      placeholders.push(match);
      return `__BIBLE_PLACEHOLDER_${placeholders.length - 1}__`;
    });
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/__BIBLE_PLACEHOLDER_(\d+)__/g, (_, idx) => placeholders[parseInt(idx)] || '');

    return text.trim();
  };

  /**
   * 표준 역본 파싱
   */
  const parseStandardContent = (htmlText: string, book: string, chapter: number): string => {
    // font 태그 전처리
    const preprocessedHtml = preprocessFontTags(htmlText);
    const parser = new DOMParser();
    const doc = parser.parseFromString(preprocessedHtml, 'text/html');
    const bibleElement = doc.getElementById('tdBible1');

    if (!bibleElement) {
      return generateErrorContent(book, chapter);
    }

    // DOM 정리
    cleanupBibleElement(bibleElement);

    // 장 제목 설정
    const chapNum = bibleElement.querySelector('.chapNum');
    const suffix = book === 'psa' ? '편' : '장';
    if (chapNum) {
      const chapterNumber = chapNum.textContent
        ?.replace('제', '')
        .replace('장', '')
        .replace('편', '')
        .trim();
      chapterTitle.value = `${bookNames[book]} ${chapterNumber}${suffix}`;
    } else {
      chapterTitle.value = `${bookNames[book]} ${chapter}${suffix}`;
    }

    // 본문 추출 (TreeWalker 사용)
    const verses: string[] = [];
    const processedVerses = new Set<string>();

    const walker = document.createTreeWalker(
      bibleElement,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node: Node) => {
          const el = node as Element;
          if (el.tagName === 'H4' && el.classList?.contains('section-title')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          if (el.classList?.contains('number')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let currentNode: Node | null;
    while ((currentNode = walker.nextNode())) {
      const el = currentNode as Element;

      if (el.tagName === 'H4' && el.classList?.contains('section-title')) {
        // 섹션 타이틀 처리
        let titleText = el.textContent?.trim()
          .replace(/\(\s*\)/g, '')
          .replace(/\s+/g, ' ')
          .trim() || '';

        titleText = titleText.replace(
          /(\([^)]+\))/g,
          '<span class="reference">$1</span>'
        );

        if (titleText) {
          verses.push(`<h3 class="section-title">${titleText}</h3>`);
        }
      } else if (el.classList?.contains('number')) {
        // 절 번호 처리
        const number = el.textContent?.trim().replace(/\s+/g, '') || '';

        if (processedVerses.has(number)) continue;
        processedVerses.add(number);

        // 부모 span에서 본문 추출
        const parentSpan = el.parentElement;
        if (parentSpan && parentSpan.tagName === 'SPAN') {
          let rawHtml = parentSpan.innerHTML;
          rawHtml = rawHtml.replace(/<span[^>]*class="number"[^>]*>.*?<\/span>/gi, '');
          const text = cleanVerseText(rawHtml);

          verses.push(
            `<div class="verse"><span class="verse-number">${number}</span><span class="verse-text">${text}</span></div>`
          );
        }
      }
    }

    // 내용이 없으면 백업 방법 시도
    if (verses.length === 0) {
      const textNodes = Array.from(bibleElement.querySelectorAll('span')).filter(
        (span) => span.querySelector('.number')
      );

      textNodes.forEach((node) => {
        const numberSpan = node.querySelector('.number');
        if (numberSpan) {
          const number = numberSpan.textContent?.trim().replace(/\s+/g, '') || '';
          let rawHtml = node.innerHTML;
          rawHtml = rawHtml.replace(/<span[^>]*class="number"[^>]*>.*?<\/span>/gi, '');
          const text = cleanVerseText(rawHtml);

          verses.push(
            `<div class="verse"><span class="verse-number">${number}</span><span class="verse-text">${text}</span></div>`
          );
        }
      });
    }

    return verses.length > 0
      ? verses.join('')
      : '<p class="no-content">내용을 찾을 수 없습니다.</p>';
  };

  /**
   * 에러 콘텐츠 생성
   */
  const generateErrorContent = (book: string, chapter: number, version: string = 'GAE'): string => {
    const fallbackUrl = getFallbackUrl(version, book, chapter);
    return `
      <div class="error-message">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>성경을 불러오는데 문제가 발생했습니다</h3>
        <p>잠시 후 다시 시도하거나, 대한성서공회 사이트에서 직접 확인해주세요.</p>
        <a href="${fallbackUrl}" target="_blank" class="external-link">
          대한성서공회에서 보기
        </a>
      </div>
    `;
  };

  // ============================================
  // Public Actions
  // ============================================

  /**
   * 성경 본문 로드
   */
  const loadContent = async (book: string, chapter: number, version: string): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      if (version === 'KNT') {
        // KNT(새한글성경) 로드
        const result = await fetchKntContent(book, chapter);

        if (result.source === 'error') {
          content.value = generateErrorContent(book, chapter, version);
          return;
        }

        try {
          const jsonData = JSON.parse(result.content);
          if (jsonData.found) {
            content.value = parseKntContent(jsonData, book, chapter);
          } else {
            content.value = generateErrorContent(book, chapter, version);
          }
        } catch {
          content.value = generateErrorContent(book, chapter, version);
        }
      } else {
        // 표준 역본 로드
        const result = await fetchStandardContent(version, book, chapter);

        if (result.source === 'error') {
          content.value = generateErrorContent(book, chapter, version);
          return;
        }

        content.value = parseStandardContent(result.content, book, chapter);
      }
    } catch (e) {
      console.error('성경 본문 로드 실패:', e);
      error.value = e as Error;
      content.value = generateErrorContent(book, chapter, version);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 콘텐츠 초기화
   */
  const clearContent = (): void => {
    content.value = '';
    chapterTitle.value = '';
    error.value = null;
  };

  // ============================================
  // Return
  // ============================================

  return {
    // State
    content,
    chapterTitle,
    isLoading,
    error,

    // Actions
    loadContent,
    clearContent,
  };
}
