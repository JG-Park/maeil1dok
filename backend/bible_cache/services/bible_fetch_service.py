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

# 두라노 우리말성경 기본 URL
DURANNO_BASE_URL = 'https://www.duranno.com/bdictionary'

# 지원하는 번역본 목록
SUPPORTED_VERSIONS = frozenset({
    'KNT',      # 새한글성경
    'GAE',      # 개역개정
    'HAN',      # 개역한글
    'SAE',      # 표준새번역
    'SAENEW',   # 새번역
    'COG',      # 공동번역
    'COGNEW',   # 공동번역 개정판
    'WOORI',    # 우리말성경 (두라노)
})

# 요청 타임아웃 (초)
REQUEST_TIMEOUT = 15

# KNT 전용 책 코드 매핑 (표준 코드 -> KNT API 코드)
# KNT API는 일부 책에서 다른 코드 체계를 사용함
KNT_BOOK_CODE_MAP = {
    'jnh': 'JON',  # 요나서: 표준은 jnh, KNT는 JON
}

# 우리말성경(두라노) 책 번호 매핑 (표준 코드 -> vl 파라미터)
# URL: /result_woori.asp?s=r&kd=104&vl={책번호}&ct={장번호}
WOORI_BOOK_CODE_MAP = {
    # 구약 (1-39)
    'gen': 1,   # 창세기
    'exo': 2,   # 출애굽기
    'lev': 3,   # 레위기
    'num': 4,   # 민수기
    'deu': 5,   # 신명기
    'jos': 6,   # 여호수아
    'jdg': 7,   # 사사기
    'rut': 8,   # 룻기
    '1sa': 9,   # 사무엘상
    '2sa': 10,  # 사무엘하
    '1ki': 11,  # 열왕기상
    '2ki': 12,  # 열왕기하
    '1ch': 13,  # 역대상
    '2ch': 14,  # 역대하
    'ezr': 15,  # 에스라
    'neh': 16,  # 느헤미야
    'est': 17,  # 에스더
    'job': 18,  # 욥기
    'psa': 19,  # 시편
    'pro': 20,  # 잠언
    'ecc': 21,  # 전도서
    'sng': 22,  # 아가
    'isa': 23,  # 이사야
    'jer': 24,  # 예레미야
    'lam': 25,  # 예레미야애가
    'ezk': 26,  # 에스겔
    'dan': 27,  # 다니엘
    'hos': 28,  # 호세아
    'jol': 29,  # 요엘
    'amo': 30,  # 아모스
    'oba': 31,  # 오바댜
    'jnh': 32,  # 요나 (표준 코드: jnh)
    'mic': 33,  # 미가
    'nam': 34,  # 나훔
    'hab': 35,  # 하박국
    'zep': 36,  # 스바냐
    'hag': 37,  # 학개
    'zec': 38,  # 스가랴
    'mal': 39,  # 말라기
    # 신약 (40-66)
    'mat': 40,  # 마태복음
    'mrk': 41,  # 마가복음
    'luk': 42,  # 누가복음
    'jhn': 43,  # 요한복음
    'act': 44,  # 사도행전
    'rom': 45,  # 로마서
    '1co': 46,  # 고린도전서
    '2co': 47,  # 고린도후서
    'gal': 48,  # 갈라디아서
    'eph': 49,  # 에베소서
    'php': 50,  # 빌립보서
    'col': 51,  # 골로새서
    '1th': 52,  # 데살로니가전서
    '2th': 53,  # 데살로니가후서
    '1ti': 54,  # 디모데전서
    '2ti': 55,  # 디모데후서
    'tit': 56,  # 디도서
    'phm': 57,  # 빌레몬서
    'heb': 58,  # 히브리서
    'jas': 59,  # 야고보서
    '1pe': 60,  # 베드로전서
    '2pe': 61,  # 베드로후서
    '1jn': 62,  # 요한일서
    '2jn': 63,  # 요한이서
    '3jn': 64,  # 요한삼서
    'jud': 65,  # 유다서
    'rev': 66,  # 요한계시록
}


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
        원본 소스에서 성경 본문 직접 가져오기

        Returns:
            Tuple[content, content_type, source_url]
        """
        if version == 'KNT':
            return BibleFetchService._fetch_knt(book, chapter)
        elif version == 'WOORI':
            return BibleFetchService._fetch_woori(book, chapter)
        else:
            return BibleFetchService._fetch_standard(version, book, chapter)

    @staticmethod
    def _fetch_knt(book: str, chapter: int) -> Tuple[str, str, str]:
        """
        새한글성경(KNT) 가져오기

        KNT는 JSON 형식으로 응답
        """
        # KNT 전용 책 코드 변환 (필요한 경우)
        knt_book = KNT_BOOK_CODE_MAP.get(book.lower(), book.upper())

        url = f"{BSKOREA_BASE_URL}/KNT/get_chapter.php"
        params = {
            'version': 'd7a4326402395391-01',
            'chapter': f"{knt_book}.{chapter}"
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
            raise BibleFetchError(f"KNT 본문을 찾을 수 없음: {knt_book}.{chapter}")

        source_url = f"{url}?version=d7a4326402395391-01&chapter={knt_book}.{chapter}"
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
    def _fetch_woori(book: str, chapter: int) -> Tuple[str, str, str]:
        """
        우리말성경(두라노) 가져오기

        두라노 웹사이트에서 성경 본문을 가져옴
        URL 패턴: /result_woori.asp?s=r&kd=104&vl={책번호}&ct={장번호}
        """
        import re

        book_code = book.lower()
        if book_code not in WOORI_BOOK_CODE_MAP:
            raise BibleFetchError(f"우리말성경에서 지원하지 않는 책: {book}")

        vl = WOORI_BOOK_CODE_MAP[book_code]
        url = f"{DURANNO_BASE_URL}/result_woori.asp"
        params = {
            's': 'r',
            'kd': '104',  # 우리말성경 버전 코드
            'vl': vl,
            'ct': chapter,
        }

        response = requests.get(
            url,
            params=params,
            timeout=REQUEST_TIMEOUT,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'ko-KR,ko;q=0.9',
            }
        )
        response.raise_for_status()

        # 응답 인코딩 설정 (두라노는 euc-kr 사용)
        response.encoding = 'euc-kr'
        html_content = response.text

        # HTML에서 성경 본문만 추출하여 JSON으로 변환
        verses = BibleFetchService._parse_woori_html(html_content, book, chapter)

        if not verses:
            raise BibleFetchError(f"우리말성경 본문을 찾을 수 없음: {book} {chapter}장")

        # JSON 형식으로 반환 (프론트엔드에서 파싱하기 쉽게)
        import json
        content = json.dumps({
            'version': 'WOORI',
            'book': book,
            'chapter': chapter,
            'verses': verses,
            'found': True
        }, ensure_ascii=False)

        source_url = f"{url}?s=r&kd=104&vl={vl}&ct={chapter}"
        return content, 'json', source_url

    @staticmethod
    def _parse_woori_html(html_content: str, book: str, chapter: int) -> list:
        """
        두라노 우리말성경 HTML에서 본문 추출

        두라노 HTML 구조:
        - 절 번호: >숫자. </td>
        - 본문: <font class=tk4l>텍스트</font>

        Returns:
            list: [{'verse': 1, 'text': '...'}, ...]
        """
        import re

        verses = []

        # 두라노 HTML 패턴: >숫자. </td> ... <font class=tk4l>본문</font>
        # 절 번호와 본문을 함께 매칭
        verse_pattern = re.compile(
            r'>(\d+)\.\s*</td>\s*<td[^>]*>\s*<font[^>]*class\s*=\s*["\']?tk4l["\']?[^>]*>([^<]+)</font>',
            re.IGNORECASE | re.DOTALL
        )

        for match in verse_pattern.finditer(html_content):
            verse_num = int(match.group(1))
            verse_text = match.group(2).strip()
            if verse_text:
                verses.append({
                    'verse': verse_num,
                    'text': verse_text
                })

        # 위 방법으로 추출 안 되면 대체 패턴 시도
        if not verses:
            # 절 번호만 먼저 찾고, 그 다음 tk4l 클래스의 텍스트 추출
            alt_pattern = re.compile(
                r'>(\d+)\.\s*</td>.*?<font[^>]*>([^<]+)</font>',
                re.IGNORECASE | re.DOTALL
            )
            for match in alt_pattern.finditer(html_content):
                verse_num = int(match.group(1))
                verse_text = match.group(2).strip()
                if verse_text and len(verse_text) > 5:  # 너무 짧은 텍스트 제외
                    verses.append({
                        'verse': verse_num,
                        'text': verse_text
                    })

        # 중복 제거 및 정렬
        seen = set()
        unique_verses = []
        for v in verses:
            if v['verse'] not in seen:
                seen.add(v['verse'])
                unique_verses.append(v)

        unique_verses.sort(key=lambda x: x['verse'])

        return unique_verses

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
