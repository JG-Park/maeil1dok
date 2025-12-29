"""
HttpOnly Cookie 기반 JWT 인증

보안 개선:
- JWT 토큰을 HttpOnly 쿠키에 저장하여 XSS 공격으로부터 보호
- Access Token: httpOnly=True, secure=True, sameSite=None (크로스 도메인)
- Refresh Token: httpOnly=True, secure=True, sameSite=None
- CSRF 토큰으로 추가 보호
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# 쿠키 이름 상수
ACCESS_TOKEN_COOKIE = 'access_token'
REFRESH_TOKEN_COOKIE = 'refresh_token'


class CookieJWTAuthentication(JWTAuthentication):
    """
    HttpOnly 쿠키에서 JWT 토큰을 읽는 인증 클래스

    기존 Authorization 헤더 방식도 fallback으로 지원하여
    점진적 마이그레이션 가능
    """

    def authenticate(self, request):
        # 1. 먼저 쿠키에서 토큰 확인
        raw_token = request.COOKIES.get(ACCESS_TOKEN_COOKIE)

        # 2. 쿠키에 없으면 기존 Authorization 헤더에서 확인 (하위 호환)
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None

        # 3. 토큰 검증
        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError as e:
            logger.debug(f"Token validation failed: {e}")
            return None

        return self.get_user(validated_token), validated_token


def get_cookie_settings():
    """
    환경에 따른 쿠키 설정 반환

    프로덕션: Secure=True, SameSite=None (크로스 도메인 쿠키)
    개발: Secure=False, SameSite=Lax
    """
    is_production = not settings.DEBUG

    return {
        'httponly': True,
        'secure': is_production,  # HTTPS only in production
        'samesite': 'None' if is_production else 'Lax',
        'path': '/',
    }


def set_auth_cookies(response, access_token, refresh_token=None):
    """
    응답에 인증 쿠키 설정

    Args:
        response: Django Response 객체
        access_token: JWT access token 문자열
        refresh_token: JWT refresh token 문자열 (optional)
    """
    cookie_settings = get_cookie_settings()

    # Access Token 쿠키 (1시간)
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=str(access_token),
        max_age=60 * 60,  # 1시간
        **cookie_settings
    )

    # Refresh Token 쿠키 (30일)
    if refresh_token:
        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE,
            value=str(refresh_token),
            max_age=60 * 60 * 24 * 30,  # 30일
            **cookie_settings
        )

    return response


def clear_auth_cookies(response):
    """
    인증 쿠키 삭제 (로그아웃)
    """
    cookie_settings = get_cookie_settings()

    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        path=cookie_settings['path'],
        samesite=cookie_settings['samesite']
    )
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE,
        path=cookie_settings['path'],
        samesite=cookie_settings['samesite']
    )

    return response


def get_tokens_for_user(user):
    """
    사용자에 대한 JWT 토큰 쌍 생성
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
