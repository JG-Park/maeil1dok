"""
성경 본문 Fetch 서비스

bskorea.or.kr에서 성경 본문을 가져오고 캐싱하는 서비스
"""

import logging
import requests
from typing import Optional, Tuple
from django.conf import settings

from bible_cache.models import BibleContentCache

logger = logging.getLogger(__name__)

# bskorea.or.kr 기본 URL
BSKOREA_BASE_URL = 'https://www.bskorea.or.kr'

# 지원하는 번역본 목록
SUPPORTED_VERSIONS = frozenset({
    'KNT',      # 새한글성경
    'GAE',      # 개역개정
    'HAN',      # 개역한글
    'SAE',      # 표준새번역
    'SAENEW',   # 새번역
    'COG',      # 공동번역
    'COGNEW',   # 공동번역 개정판
})

# 요청 타임아웃 (초)
REQUEST_TIMEOUT = 15


class BibleFetchError(Exception):
    """성경 본문 가져오기 실패 예외"""
    pass


class BibleFetchService:
    """성경 본문 Fetch 서비스"""

    @staticmethod
    def get_bible_content(
        version: str,
        book: str,
        chapter: int,
        force_refresh: bool = False
    ) -> Tuple[str, str, bool]:
        """
        성경 본문 가져오기 (캐시 우선, fallback으로 원본 fetch)

        Args:
            version: 번역본 코드
            book: 성경책 코드
            chapter: 장 번호
            force_refresh: 캐시 무시하고 강제 새로고침

        Returns:
            Tuple[content, content_type, from_cache]
            - content: 성경 본문 (HTML/JSON)
            - content_type: 'html' 또는 'json'
            - from_cache: 캐시에서 가져왔는지 여부

        Raises:
            BibleFetchError: 원본에서도 캐시에서도 가져오기 실패
        """
        version = version.upper()
        book = book.lower()

        # 버전 유효성 검사
        if version not in SUPPORTED_VERSIONS:
            raise BibleFetchError(f"지원하지 않는 번역본: {version}")

        # 1. 캐시 확인 (force_refresh가 아닌 경우)
        if not force_refresh:
            cached = BibleContentCache.get_cached_content(version, book, chapter)
            if cached and cached.fetch_success:
                logger.debug(f"Cache hit: {version}:{book}:{chapter}")
                return cached.content, cached.content_type, True

        # 2. 원본에서 fetch 시도
        try:
            content, content_type, source_url = BibleFetchService._fetch_from_source(
                version, book, chapter
            )

            # 캐시에 저장
            BibleContentCache.save_to_cache(
                version=version,
                book=book,
                chapter=chapter,
                content=content,
                content_type=content_type,
                source_url=source_url,
                fetch_success=True
            )

            logger.info(f"Fetched and cached: {version}:{book}:{chapter}")
            return content, content_type, False

        except Exception as e:
            logger.warning(f"원본 fetch 실패: {version}:{book}:{chapter} - {e}")

            # 3. 원본 실패 시 캐시에서 조회 (stale 허용)
            cached = BibleContentCache.get_cached_content(version, book, chapter)
            if cached:
                logger.info(f"Using stale cache: {version}:{book}:{chapter}")
                return cached.content, cached.content_type, True

            # 4. 캐시도 없으면 에러
            raise BibleFetchError(
                f"성경 본문을 가져올 수 없습니다: {version}:{book}:{chapter}"
            )

    @staticmethod
    def _fetch_from_source(
        version: str,
        book: str,
        chapter: int
    ) -> Tuple[str, str, str]:
        """
        bskorea.or.kr에서 성경 본문 직접 가져오기

        Returns:
            Tuple[content, content_type, source_url]
        """
        if version == 'KNT':
            return BibleFetchService._fetch_knt(book, chapter)
        else:
            return BibleFetchService._fetch_standard(version, book, chapter)

    @staticmethod
    def _fetch_knt(book: str, chapter: int) -> Tuple[str, str, str]:
        """
        새한글성경(KNT) 가져오기

        KNT는 JSON 형식으로 응답
        """
        url = f"{BSKOREA_BASE_URL}/KNT/get_chapter.php"
        params = {
            'version': 'd7a4326402395391-01',
            'chapter': f"{book.upper()}.{chapter}"
        }

        response = requests.get(
            url,
            params=params,
            timeout=REQUEST_TIMEOUT,
            headers={
                'User-Agent': 'Maeil1Dok/1.0',
                'Accept': 'application/json',
            }
        )
        response.raise_for_status()

        # JSON 응답 검증
        json_data = response.json()
        if not json_data.get('found'):
            raise BibleFetchError(f"KNT 본문을 찾을 수 없음: {book}.{chapter}")

        source_url = f"{url}?version=d7a4326402395391-01&chapter={book.upper()}.{chapter}"
        return response.text, 'json', source_url

    @staticmethod
    def _fetch_standard(
        version: str,
        book: str,
        chapter: int
    ) -> Tuple[str, str, str]:
        """
        표준 번역본 가져오기 (GAE, HAN, SAE 등)

        표준 번역본은 HTML 형식으로 응답
        """
        url = f"{BSKOREA_BASE_URL}/bible/korbibReadpage.php"
        params = {
            'version': version,
            'book': book,
            'chap': chapter,
            'sec': 1,
            'cVersion': '',
            'fontSize': '15px',
            'fontWeight': 'normal',
        }

        response = requests.get(
            url,
            params=params,
            timeout=REQUEST_TIMEOUT,
            headers={
                'User-Agent': 'Maeil1Dok/1.0',
                'Accept': 'text/html',
            }
        )
        response.raise_for_status()

        # HTML 응답 검증 (기본적인 검증만)
        if not response.text or len(response.text) < 100:
            raise BibleFetchError(f"빈 응답: {version}:{book}:{chapter}")

        source_url = response.url
        return response.text, 'html', source_url

    @staticmethod
    def prefetch_chapter_range(
        version: str,
        book: str,
        start_chapter: int,
        end_chapter: int
    ) -> dict:
        """
        여러 장을 미리 캐싱 (백그라운드 작업용)

        Returns:
            dict: {'success': [...], 'failed': [...]}
        """
        results = {'success': [], 'failed': []}

        for chapter in range(start_chapter, end_chapter + 1):
            try:
                BibleFetchService.get_bible_content(
                    version, book, chapter, force_refresh=False
                )
                results['success'].append(chapter)
            except BibleFetchError as e:
                logger.error(f"Prefetch 실패: {version}:{book}:{chapter} - {e}")
                results['failed'].append({'chapter': chapter, 'error': str(e)})

        return results
