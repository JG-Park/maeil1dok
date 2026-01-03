/**
 * 성경 본문 Fetch Composable
 *
 * 프록시 서버를 우선 사용하고, 실패 시 캐시 서버로 failback
 */

interface BibleFetchResult {
  content: string;
  contentType: 'html' | 'json';
  fromCache: boolean;
  source: 'proxy' | 'cache' | 'error';
}

interface BibleCacheResponse {
  success: boolean;
  data?: {
    version: string;
    book: string;
    chapter: number;
    content: string;
    content_type: 'html' | 'json';
    from_cache: boolean;
  };
  error?: string;
  fallback_url?: string;
}

// 요청 타임아웃 (ms)
const PROXY_TIMEOUT = 10000;  // 프록시: 10초 (빠른 실패)
const CACHE_TIMEOUT = 15000;  // 캐시: 15초

export function useBibleFetch() {
  const config = useRuntimeConfig();
  const bibleCacheUrl = config.public.bibleCacheUrl as string;

  /**
   * KNT(새한글성경) 본문 가져오기
   */
  async function fetchKntContent(
    book: string,
    chapter: number
  ): Promise<BibleFetchResult> {
    // 1차: 프록시 시도
    try {
      const result = await fetchKntFromProxy(book, chapter);
      return result;
    } catch (proxyError) {
      console.warn('[BibleFetch] 프록시 실패, 캐시 서버 시도:', proxyError);

      // 2차: 캐시 서버 failback
      if (bibleCacheUrl) {
        try {
          const result = await fetchFromCacheServer('KNT', book, chapter);
          return result;
        } catch (cacheError) {
          console.error('[BibleFetch] 캐시 서버도 실패:', cacheError);
        }
      }

      // 모두 실패
      return {
        content: '',
        contentType: 'json',
        fromCache: false,
        source: 'error',
      };
    }
  }

  /**
   * 표준 번역본 본문 가져오기 (GAE, HAN, SAE 등)
   */
  async function fetchStandardContent(
    version: string,
    book: string,
    chapter: number
  ): Promise<BibleFetchResult> {
    // 1차: 프록시 시도
    try {
      const result = await fetchStandardFromProxy(version, book, chapter);
      return result;
    } catch (proxyError) {
      console.warn('[BibleFetch] 프록시 실패, 캐시 서버 시도:', proxyError);

      // 2차: 캐시 서버 failback
      if (bibleCacheUrl) {
        try {
          const result = await fetchFromCacheServer(version, book, chapter);
          return result;
        } catch (cacheError) {
          console.error('[BibleFetch] 캐시 서버도 실패:', cacheError);
        }
      }

      // 모두 실패
      return {
        content: '',
        contentType: 'html',
        fromCache: false,
        source: 'error',
      };
    }
  }

  /**
   * 프록시에서 KNT 가져오기
   */
  async function fetchKntFromProxy(
    book: string,
    chapter: number
  ): Promise<BibleFetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

    try {
      const url = `/bible-proxy/KNT/get_chapter.php?version=d7a4326402395391-01&chapter=${book.toUpperCase()}.${chapter}`;

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const jsonData = await response.json();

      if (!jsonData.found) {
        throw new Error('Content not found');
      }

      return {
        content: JSON.stringify(jsonData),
        contentType: 'json',
        fromCache: false,
        source: 'proxy',
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 프록시에서 표준 번역본 가져오기
   */
  async function fetchStandardFromProxy(
    version: string,
    book: string,
    chapter: number
  ): Promise<BibleFetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

    try {
      const url = `/bible-proxy/bible/korbibReadpage.php?version=${version}&book=${book}&chap=${chapter}&cVersion=&fontSize=15px&fontWeight=normal`;

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const text = await response.text();

      if (!text || text.length < 100) {
        throw new Error('Empty or invalid response');
      }

      return {
        content: text,
        contentType: 'html',
        fromCache: false,
        source: 'proxy',
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 캐시 서버에서 가져오기
   */
  async function fetchFromCacheServer(
    version: string,
    book: string,
    chapter: number
  ): Promise<BibleFetchResult> {
    if (!bibleCacheUrl) {
      throw new Error('Cache server URL not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CACHE_TIMEOUT);

    try {
      const url = `${bibleCacheUrl}/api/v1/bible-cache/${version}/${book}/${chapter}/`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Cache server error: ${response.status}`);
      }

      const data: BibleCacheResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Cache server returned error');
      }

      return {
        content: data.data.content,
        contentType: data.data.content_type,
        fromCache: true,
        source: 'cache',
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 캐시 서버 가용성 확인
   */
  async function checkCacheServerAvailable(): Promise<boolean> {
    if (!bibleCacheUrl) {
      return false;
    }

    try {
      const response = await fetch(`${bibleCacheUrl}/api/v1/bible-cache/versions/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 대한성서공회 직접 링크 생성
   */
  function getFallbackUrl(version: string, book: string, chapter: number): string {
    if (version === 'KNT') {
      return `https://www.bskorea.or.kr/KNT/index.php?chapter=${book.toUpperCase()}.${chapter}`;
    }
    return `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=${version}&book=${book}&chap=${chapter}`;
  }

  return {
    fetchKntContent,
    fetchStandardContent,
    fetchFromCacheServer,
    checkCacheServerAvailable,
    getFallbackUrl,
  };
}
