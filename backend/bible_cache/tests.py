"""
성경 본문 캐시 테스트
"""

from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from bible_cache.models import BibleContentCache
from bible_cache.services import BibleFetchService
from bible_cache.services.bible_fetch_service import BibleFetchError


class BibleContentCacheModelTest(TestCase):
    """BibleContentCache 모델 테스트"""

    def test_generate_cache_key(self):
        """캐시 키 생성 테스트"""
        key = BibleContentCache.generate_cache_key('GAE', 'GEN', 1)
        self.assertEqual(key, 'GAE:gen:1')

    def test_save_and_get_cached_content(self):
        """캐시 저장 및 조회 테스트"""
        # 저장
        obj, created = BibleContentCache.save_to_cache(
            version='GAE',
            book='gen',
            chapter=1,
            content='<html>Test content</html>',
            content_type='html',
            source_url='https://example.com',
            fetch_success=True
        )

        self.assertTrue(created)
        self.assertEqual(obj.cache_key, 'GAE:gen:1')

        # 조회
        cached = BibleContentCache.get_cached_content('GAE', 'gen', 1)
        self.assertIsNotNone(cached)
        self.assertEqual(cached.content, '<html>Test content</html>')

    def test_upsert_existing_cache(self):
        """기존 캐시 업데이트 테스트"""
        # 최초 저장
        BibleContentCache.save_to_cache(
            version='GAE',
            book='gen',
            chapter=1,
            content='Old content',
            content_type='html'
        )

        # 업데이트
        obj, created = BibleContentCache.save_to_cache(
            version='GAE',
            book='gen',
            chapter=1,
            content='New content',
            content_type='html'
        )

        self.assertFalse(created)  # 업데이트이므로 created=False
        self.assertEqual(obj.content, 'New content')

        # DB에 하나만 있어야 함
        self.assertEqual(BibleContentCache.objects.count(), 1)


class BibleFetchServiceTest(TestCase):
    """BibleFetchService 테스트"""

    def test_unsupported_version(self):
        """지원하지 않는 번역본 테스트"""
        with self.assertRaises(BibleFetchError) as context:
            BibleFetchService.get_bible_content('INVALID', 'gen', 1)

        self.assertIn('지원하지 않는 번역본', str(context.exception))

    @patch('bible_cache.services.bible_fetch_service.requests.get')
    def test_fetch_standard_version(self, mock_get):
        """표준 번역본 fetch 테스트"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '<html><div id="tdBible1">Bible content</div></html>'
        mock_response.url = 'https://www.bskorea.or.kr/bible/...'
        mock_get.return_value = mock_response

        content, content_type, from_cache = BibleFetchService.get_bible_content(
            'GAE', 'gen', 1
        )

        self.assertEqual(content_type, 'html')
        self.assertFalse(from_cache)
        self.assertIn('Bible content', content)

    @patch('bible_cache.services.bible_fetch_service.requests.get')
    def test_fetch_knt_version(self, mock_get):
        """KNT 번역본 fetch 테스트"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'found': True, 'content': 'KNT content'}
        mock_response.text = '{"found": true, "content": "KNT content"}'
        mock_get.return_value = mock_response

        content, content_type, from_cache = BibleFetchService.get_bible_content(
            'KNT', 'gen', 1
        )

        self.assertEqual(content_type, 'json')
        self.assertFalse(from_cache)

    def test_cache_fallback_on_fetch_failure(self):
        """fetch 실패 시 캐시 fallback 테스트"""
        # 미리 캐시에 저장
        BibleContentCache.save_to_cache(
            version='GAE',
            book='gen',
            chapter=1,
            content='Cached content',
            content_type='html',
            fetch_success=True
        )

        # fetch 실패 시뮬레이션
        with patch('bible_cache.services.bible_fetch_service.requests.get') as mock_get:
            mock_get.side_effect = Exception('Network error')

            content, content_type, from_cache = BibleFetchService.get_bible_content(
                'GAE', 'gen', 1, force_refresh=True
            )

            self.assertTrue(from_cache)
            self.assertEqual(content, 'Cached content')


class BibleCacheAPITest(APITestCase):
    """API 엔드포인트 테스트"""

    def test_get_supported_versions(self):
        """지원 번역본 목록 조회"""
        response = self.client.get('/api/v1/bible-cache/versions/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('versions', response.data)
        self.assertTrue(len(response.data['versions']) > 0)

    def test_invalid_version(self):
        """잘못된 번역본 요청"""
        response = self.client.get('/api/v1/bible-cache/INVALID/gen/1/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_invalid_chapter(self):
        """잘못된 장 번호 요청"""
        response = self.client.get('/api/v1/bible-cache/GAE/gen/0/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('bible_cache.services.bible_fetch_service.requests.get')
    def test_get_bible_content_success(self, mock_get):
        """성경 본문 조회 성공"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '<html>Bible content</html>'
        mock_response.url = 'https://www.bskorea.or.kr/bible/...'
        mock_get.return_value = mock_response

        response = self.client.get('/api/v1/bible-cache/GAE/gen/1/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['version'], 'GAE')

    def test_cache_status_not_found(self):
        """캐시 상태 - 캐시 없음"""
        response = self.client.get('/api/v1/bible-cache/GAE/gen/1/status/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['cached'])

    def test_cache_status_found(self):
        """캐시 상태 - 캐시 있음"""
        # 캐시 저장
        BibleContentCache.save_to_cache(
            version='GAE',
            book='gen',
            chapter=1,
            content='Cached',
            content_type='html'
        )

        response = self.client.get('/api/v1/bible-cache/GAE/gen/1/status/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['cached'])
