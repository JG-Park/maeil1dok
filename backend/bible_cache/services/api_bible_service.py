"""
API.Bible 연동 서비스

히브리어(WLC), 헬라어(SBLGNT), 영어(KJV, WEB) 성경 본문을 가져오는 서비스
https://scripture.api.bible/
"""

import logging
import requests
import json
from typing import Optional, Tuple, Dict, List
from django.conf import settings

logger = logging.getLogger(__name__)

# API.Bible 기본 URL
API_BIBLE_BASE_URL = 'https://api.scripture.api.bible/v1'

# 요청 타임아웃 (초)
REQUEST_TIMEOUT = 15

# API.Bible에서 지원하는 역본 ID 매핑
# 참고: https://scripture.api.bible/
API_BIBLE_VERSIONS = {
    # 원어 성경
    'HEB': {
        'id': 'c36eb21b5f2e6ff2-01',  # Westminster Leningrad Codex (WLC)
        'name': '히브리어 (WLC)',
        'language': 'hebrew',
        'direction': 'rtl',  # Right-to-left
    },
    'GRK': {
        'id': 'c1ee68e7d0c69de2-01',  # SBL Greek New Testament (SBLGNT) - 프리 버전 
        'name': '헬라어 (SBLGNT)',
        'language': 'greek',
        'direction': 'ltr',
    },
    # 영어 성경
    'KJV': {
        'id': 'de4e12af7f28f599-02',  # King James Version
        'name': 'KJV',
        'language': 'english',
        'direction': 'ltr',
    },
    'WEB': {
        'id': '9879dbb7cfe39e4d-04',  # World English Bible
        'name': 'WEB',
        'language': 'english',
        'direction': 'ltr',
    },
    'ASV': {
        'id': '06125adad2d5898a-01',  # American Standard Version
        'name': 'ASV',
        'language': 'english',
        'direction': 'ltr',
    },
}

# 표준 책 코드 -> API.Bible 책 코드 매핑
# API.Bible은 대문자 3글자 코드 사용
BOOK_CODE_MAP = {
    # 구약
    'gen': 'GEN', 'exo': 'EXO', 'lev': 'LEV', 'num': 'NUM', 'deu': 'DEU',
    'jos': 'JOS', 'jdg': 'JDG', 'rut': 'RUT', '1sa': '1SA', '2sa': '2SA',
    '1ki': '1KI', '2ki': '2KI', '1ch': '1CH', '2ch': '2CH', 'ezr': 'EZR',
    'neh': 'NEH', 'est': 'EST', 'job': 'JOB', 'psa': 'PSA', 'pro': 'PRO',
    'ecc': 'ECC', 'sng': 'SNG', 'isa': 'ISA', 'jer': 'JER', 'lam': 'LAM',
    'ezk': 'EZK', 'dan': 'DAN', 'hos': 'HOS', 'jol': 'JOL', 'amo': 'AMO',
    'oba': 'OBA', 'jnh': 'JON', 'mic': 'MIC', 'nam': 'NAM', 'hab': 'HAB',
    'zep': 'ZEP', 'hag': 'HAG', 'zec': 'ZEC', 'mal': 'MAL',
    # 신약
    'mat': 'MAT', 'mrk': 'MRK', 'luk': 'LUK', 'jhn': 'JHN', 'act': 'ACT',
    'rom': 'ROM', '1co': '1CO', '2co': '2CO', 'gal': 'GAL', 'eph': 'EPH',
    'php': 'PHP', 'col': 'COL', '1th': '1TH', '2th': '2TH', '1ti': '1TI',
    '2ti': '2TI', 'tit': 'TIT', 'phm': 'PHM', 'heb': 'HEB', 'jas': 'JAS',
    '1pe': '1PE', '2pe': '2PE', '1jn': '1JN', '2jn': '2JN', '3jn': '3JN',
    'jud': 'JUD', 'rev': 'REV',
}

# 구약 책 목록 (히브리어 성경에만 있는 책)
OLD_TESTAMENT_BOOKS = {
    'gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa',
    '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro',
    'ecc', 'sng', 'isa', 'jer', 'lam', 'ezk', 'dan', 'hos', 'jol', 'amo',
    'oba', 'jnh', 'mic', 'nam', 'hab', 'zep', 'hag', 'zec', 'mal',
}

# 신약 책 목록 (헬라어 성경에만 있는 책)
NEW_TESTAMENT_BOOKS = {
    'mat', 'mrk', 'luk', 'jhn', 'act', 'rom', '1co', '2co', 'gal', 'eph',
    'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm', 'heb', 'jas',
    '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev',
}


class ApiBibleError(Exception):
    """API.Bible 관련 예외"""
    pass


class ApiBibleService:
    """API.Bible 연동 서비스"""
    
    @staticmethod
    def get_api_key() -> str:
        """API 키 가져오기"""
        api_key = getattr(settings, 'API_BIBLE_KEY', None) or \
                  getattr(settings, 'API_BIBLE_API_KEY', None)
        if not api_key:
            import os
            api_key = os.environ.get('API_BIBLE_KEY') or os.environ.get('API_BIBLE_API_KEY')
        
        if not api_key:
            raise ApiBibleError("API.Bible API 키가 설정되지 않았습니다. API_BIBLE_KEY 환경변수를 설정하세요.")
        
        return api_key
    
    @staticmethod
    def is_supported_version(version: str) -> bool:
        """지원하는 API.Bible 역본인지 확인"""
        return version.upper() in API_BIBLE_VERSIONS
    
    @staticmethod
    def get_version_info(version: str) -> Optional[Dict]:
        """역본 정보 가져오기"""
        return API_BIBLE_VERSIONS.get(version.upper())
    
    @staticmethod
    def is_book_available(version: str, book: str) -> bool:
        """해당 역본에서 책이 사용 가능한지 확인"""
        version = version.upper()
        book = book.lower()
        
        if version == 'HEB':
            return book in OLD_TESTAMENT_BOOKS
        elif version == 'GRK':
            return book in NEW_TESTAMENT_BOOKS
        else:
            # 영어 성경은 구약/신약 모두 포함
            return book in OLD_TESTAMENT_BOOKS or book in NEW_TESTAMENT_BOOKS
    
    @staticmethod
    def fetch_chapter(version: str, book: str, chapter: int) -> Tuple[str, str, str]:
        """
        API.Bible에서 성경 본문 가져오기
        
        Args:
            version: 역본 코드 (HEB, GRK, KJV, WEB, ASV)
            book: 성경책 코드 (gen, mat 등)
            chapter: 장 번호
            
        Returns:
            Tuple[content, content_type, source_url]
            - content: JSON 형식의 본문 데이터
            - content_type: 'json'
            - source_url: API URL
            
        Raises:
            ApiBibleError: API 호출 실패
        """
        version = version.upper()
        book = book.lower()
        
        # 역본 확인
        version_info = API_BIBLE_VERSIONS.get(version)
        if not version_info:
            raise ApiBibleError(f"지원하지 않는 역본: {version}")
        
        # 책 가용성 확인
        if not ApiBibleService.is_book_available(version, book):
            testament = "구약" if version == 'GRK' else "신약"
            raise ApiBibleError(f"{version_info['name']}에는 {testament} 성경이 없습니다.")
        
        # API 키 가져오기
        api_key = ApiBibleService.get_api_key()
        
        # 책 코드 변환
        api_book = BOOK_CODE_MAP.get(book)
        if not api_book:
            raise ApiBibleError(f"알 수 없는 책 코드: {book}")
        
        bible_id = version_info['id']
        chapter_id = f"{api_book}.{chapter}"
        
        # API 호출
        url = f"{API_BIBLE_BASE_URL}/bibles/{bible_id}/chapters/{chapter_id}"
        
        headers = {
            'api-key': api_key,
            'Accept': 'application/json',
        }
        
        params = {
            'content-type': 'json',  # JSON 형식으로 요청
            'include-notes': 'false',
            'include-titles': 'true',
            'include-chapter-numbers': 'false',
            'include-verse-numbers': 'true',
            'include-verse-spans': 'false',
        }
        
        try:
            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' not in data:
                raise ApiBibleError(f"API 응답 형식 오류: {version}:{book}:{chapter}")
            
            # 응답 데이터 가공
            chapter_data = data['data']
            verses = ApiBibleService._parse_content(chapter_data.get('content', ''))
            
            result = {
                'version': version,
                'versionName': version_info['name'],
                'book': book,
                'chapter': chapter,
                'direction': version_info['direction'],
                'language': version_info['language'],
                'verses': verses,
                'found': True,
                'reference': chapter_data.get('reference', f'{api_book} {chapter}'),
            }
            
            content = json.dumps(result, ensure_ascii=False)
            return content, 'json', url
            
        except requests.exceptions.Timeout:
            raise ApiBibleError(f"API 요청 타임아웃: {version}:{book}:{chapter}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise ApiBibleError(f"본문을 찾을 수 없음: {version}:{book}:{chapter}")
            elif e.response.status_code == 401:
                raise ApiBibleError("API 키가 유효하지 않습니다.")
            elif e.response.status_code == 403:
                raise ApiBibleError("이 역본에 대한 접근 권한이 없습니다.")
            else:
                raise ApiBibleError(f"API 오류 ({e.response.status_code}): {version}:{book}:{chapter}")
        except requests.exceptions.RequestException as e:
            raise ApiBibleError(f"네트워크 오류: {e}")
    
    @staticmethod
    def _parse_content(content: str) -> List[Dict]:
        """
        API.Bible 콘텐츠 파싱
        
        API.Bible은 콘텐츠를 여러 형식으로 반환할 수 있음:
        - HTML: <span data-number="1">...</span>
        - JSON items array
        - Plain text with verse markers
        
        여기서는 HTML 형식을 파싱하여 절별 데이터로 변환
        """
        import re
        
        verses = []
        
        if not content:
            return verses
        
        # HTML 형식 파싱: <span data-number="N" ...>text</span>
        # 또는 <span class="v" data-number="N">text</span>
        verse_pattern = re.compile(
            r'<span[^>]*data-number="(\d+)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*)</span>',
            re.IGNORECASE | re.DOTALL
        )
        
        for match in verse_pattern.finditer(content):
            verse_num = int(match.group(1))
            verse_text = match.group(2)
            
            # HTML 태그 제거
            verse_text = re.sub(r'<[^>]+>', '', verse_text)
            verse_text = verse_text.strip()
            
            if verse_text:
                verses.append({
                    'verse': verse_num,
                    'text': verse_text
                })
        
        # 위 패턴으로 찾지 못한 경우, 간단한 절 번호 패턴 시도
        if not verses:
            # 패턴: [숫자] 텍스트 또는 숫자. 텍스트
            simple_pattern = re.compile(r'(?:\[(\d+)\]|^(\d+)\.\s*)(.+?)(?=\[\d+\]|\d+\.\s|$)', re.MULTILINE)
            
            for match in simple_pattern.finditer(content):
                verse_num = int(match.group(1) or match.group(2))
                verse_text = match.group(3).strip()
                
                if verse_text:
                    verses.append({
                        'verse': verse_num,
                        'text': verse_text
                    })
        
        # 정렬
        verses.sort(key=lambda x: x['verse'])
        
        return verses
    
    @staticmethod
    def get_available_versions() -> List[Dict]:
        """사용 가능한 역본 목록 반환"""
        return [
            {
                'code': code,
                'name': info['name'],
                'language': info['language'],
                'direction': info['direction'],
            }
            for code, info in API_BIBLE_VERSIONS.items()
        ]
