from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer, 
    SocialLoginSerializer, EmailRegisterSerializer, LinkedAccountsSerializer,
    SetPasswordSerializer
)
from .authentication import set_auth_cookies, get_tokens_for_user
from .models import SocialAccount, EmailVerificationToken, PasswordResetToken
from .email_utils import send_verification_email, send_password_reset_email, send_welcome_email
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.db.models import Q
import requests
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from todos.models import BibleReadingPlan, PlanSubscription
import logging
import uuid

logger = logging.getLogger(__name__)
User = get_user_model()

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # 기본 플랜 구독 자동 생성
        default_plan = BibleReadingPlan.objects.filter(is_default=True).first()
        if default_plan:
            subscription = PlanSubscription.objects.create(
                user=user,
                plan=default_plan,
                start_date=timezone.now().date(),
                is_active=True
            )
            logger.info(f"사용자 {user.username}의 기본 플랜 구독이 생성되었습니다. 플랜: {default_plan.name}")
        else:
            logger.warning("기본 플랜이 설정되어 있지 않아 구독을 생성할 수 없습니다.")
        
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def social_login(request):
    try:
        serializer = SocialLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        provider = serializer.validated_data.get('provider')
        code = serializer.validated_data.get('code')
        access_token = serializer.validated_data.get('access_token')

        if provider == 'kakao':
            if access_token:
                user_info = get_kakao_user_info_by_token(access_token)
            elif code:
                user_info = get_kakao_user_info(code)
            else:
                return Response({'error': 'code or access_token required'}, status=400)
            
            if 'id' not in user_info:
                return Response(user_info, status=400)
            
            social_id = f"kakao_{user_info['id']}"
            user = User.objects.filter(username=social_id).first()
            if user:
                refresh = RefreshToken.for_user(user)
                logger.info(f"카카오 소셜 로그인 성공: user_id={user.id}, username={user.username}")

                # 응답 생성 (하위 호환을 위해 토큰도 본문에 포함)
                response = Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })

                # HttpOnly 쿠키 설정
                set_auth_cookies(response, str(refresh.access_token), str(refresh))
                return response
            else:
                suggested_nickname = user_info.get('properties', {}).get('nickname', '')
                # 카카오 계정에서 이메일 가져오기 (동의한 경우에만 제공됨)
                kakao_email = user_info.get('kakao_account', {}).get('email')
                return Response({
                    'needsSignup': True,
                    'kakao_id': user_info['id'],
                    'suggested_nickname': suggested_nickname,
                    'profile_image': user_info.get('properties', {}).get('profile_image'),
                    'email': kakao_email
                }, status=200)

    except Exception as e:
        # 보안: 내부 에러 상세를 클라이언트에 노출하지 않음
        logger.error(f"소셜 로그인 중 오류 발생: {str(e)}", exc_info=True)
        return Response({'error': '로그인 처리 중 오류가 발생했습니다.'}, status=400)

def get_kakao_user_info(code, redirect_uri=None):
    """
    카카오 OAuth 코드를 토큰으로 교환하고 사용자 정보 반환
    redirect_uri: 웹/앱에서 사용한 redirect_uri (없으면 기본값 사용)
    """
    # redirect_uri가 없으면 기본값 사용
    if not redirect_uri:
        redirect_uri = settings.KAKAO_REDIRECT_URI
    
    # 카카오 토큰 받기
    logger.debug("Kakao token request initiated")

    token_response = requests.post(
        'https://kauth.kakao.com/oauth/token',
        data={
            'grant_type': 'authorization_code',
            'client_id': settings.KAKAO_CLIENT_ID,
            'redirect_uri': redirect_uri,
            'code': code,
        }
    )
    logger.debug(f"Kakao token response status: {token_response.status_code}")
    
    # 토큰 응답 확인
    token_data = token_response.json()
    if 'access_token' not in token_data:
        raise Exception(f"Failed to get access token: {token_data}")
        
    access_token = token_data['access_token']
    
    # 사용자 정보 받기
    user_response = requests.get(
        'https://kapi.kakao.com/v2/user/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    logger.debug(f"Kakao user info response status: {user_response.status_code}")
    
    user_info = user_response.json()
    if 'id' not in user_info:
        raise Exception(f"Failed to get user info: {user_info}")
        
    # 프로필 이미지 URL 가져오기
    profile_image = user_info.get('properties', {}).get('profile_image')
    if profile_image:
        user_info['profile_image'] = profile_image
        
    return user_info

def get_kakao_user_info_by_token(access_token):
    """
    Fetch Kakao user info using native access_token without exchanging code.
    """
    logger.debug("Fetching Kakao user info by token")
    response = requests.get(
        'https://kapi.kakao.com/v2/user/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    logger.debug(f"Kakao user info by token response status: {response.status_code}")
    data = response.json()
    if 'id' not in data:
        logger.warning("Kakao user info response missing 'id' field")
        return data
    return data

def get_google_user_info(code, redirect_uri=None):
    """
    Google OAuth 코드를 토큰으로 교환하고 사용자 정보 반환
    redirect_uri: 웹/앱에서 사용한 redirect_uri (없으면 기본값 사용)
    """
    # redirect_uri가 없으면 기본값 사용
    if not redirect_uri:
        redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    # Google 토큰 받기
    token_response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }
    )
    
    token_data = token_response.json()
    if 'error' in token_data:
        logger.error(f"Google token exchange error: {token_data}")
        raise Exception(f"Google token exchange failed: {token_data.get('error_description', token_data.get('error'))}")
    
    access_token = token_data.get('access_token')
    if not access_token:
        raise Exception("No access_token in Google response")
    
    # 사용자 정보 받기
    user_info = requests.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    ).json()
    
    return user_info


def get_apple_user_info(id_token):
    """
    Apple ID Token (JWT)을 검증하고 사용자 정보 반환
    
    Apple Sign In은 다른 OAuth와 달리 id_token (JWT)을 직접 검증해야 함
    - Apple public keys로 서명 검증
    - iss, aud, exp 클레임 확인
    - sub (subject)를 provider_id로 사용
    
    Returns:
        dict: {
            'sub': 사용자 고유 ID (provider_id로 사용),
            'email': 이메일 (privaterelay.appleid.com 도메인일 수 있음),
            'email_verified': 이메일 인증 여부,
            'is_private_email': Apple relay email 여부
        }
    """
    import jwt
    from jwt import PyJWKClient
    
    APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
    APPLE_ISSUER = "https://appleid.apple.com"
    
    # 환경변수에서 Apple Client ID 가져오기
    apple_client_id = getattr(settings, 'APPLE_CLIENT_ID', None)
    apple_ios_bundle_id = getattr(settings, 'APPLE_IOS_BUNDLE_ID', 'com.maeil1dok.app')
    if not apple_client_id:
        raise Exception("APPLE_CLIENT_ID 환경변수가 설정되지 않았습니다.")
    
    # 웹(Services ID)과 iOS(Bundle ID) 둘 다 허용
    allowed_audiences = [apple_client_id, apple_ios_bundle_id]
    
    try:
        # Apple public keys 가져오기 및 JWT 서명 검증
        jwks_client = PyJWKClient(APPLE_JWKS_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(id_token)
        
        # JWT 디코딩 및 검증
        decoded = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=allowed_audiences,
            issuer=APPLE_ISSUER,
        )
        
        # 필수 클레임 확인
        sub = decoded.get('sub')
        if not sub:
            raise Exception("Apple ID Token에 sub 클레임이 없습니다.")
        
        email = decoded.get('email')
        email_verified = decoded.get('email_verified', False)
        
        # Apple relay email 감지 (privaterelay.appleid.com 도메인)
        is_private_email = False
        if email and 'privaterelay.appleid.com' in email:
            is_private_email = True
        
        return {
            'sub': sub,
            'email': email,
            'email_verified': email_verified,
            'is_private_email': is_private_email,
        }
        
    except jwt.ExpiredSignatureError:
        logger.error("Apple ID Token이 만료되었습니다.")
        raise Exception("Apple ID Token이 만료되었습니다.")
    except jwt.InvalidAudienceError:
        logger.error("Apple ID Token의 audience가 일치하지 않습니다.")
        raise Exception("Apple ID Token 검증 실패: audience 불일치")
    except jwt.InvalidIssuerError:
        logger.error("Apple ID Token의 issuer가 일치하지 않습니다.")
        raise Exception("Apple ID Token 검증 실패: issuer 불일치")
    except jwt.PyJWKClientError as e:
        logger.error(f"Apple public key 가져오기 실패: {str(e)}")
        raise Exception(f"Apple 인증 서버 연결 실패: {str(e)}")
    except jwt.DecodeError as e:
        logger.error(f"Apple ID Token 디코딩 실패: {str(e)}")
        raise Exception(f"Apple ID Token 형식이 올바르지 않습니다.")
    except Exception as e:
        logger.error(f"Apple ID Token 검증 오류: {str(e)}")
        raise


@api_view(['POST'])
@permission_classes([AllowAny])
def check_username(request):
    username = request.data.get('username')
    exists = User.objects.filter(username=username).exists()
    return Response({'available': not exists})

@api_view(['POST'])
@permission_classes([AllowAny])
def check_nickname(request):
    nickname = request.data.get('nickname')
    exists = User.objects.filter(nickname=nickname).exists()
    return Response({'available': not exists})

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def complete_kakao_signup(request):
    try:
        nickname = request.data.get('nickname')
        kakao_id = request.data.get('kakao_id')
        profile_image = request.data.get('profile_image')
        access_token = request.data.get('access_token')
        email = request.data.get('email')  # 카카오에서 제공받은 이메일
        
        if not nickname or not kakao_id or not access_token:
            return Response({'error': '필수 정보가 누락되었습니다.'}, status=400)
        
        user_info = get_kakao_user_info_by_token(access_token)
        verified_kakao_id = user_info.get('id')
        if not verified_kakao_id:
            return Response({'error': '카카오 계정 인증에 실패했습니다.'}, status=400)
        if str(verified_kakao_id) != str(kakao_id):
            return Response({'error': '카카오 계정 정보가 일치하지 않습니다.'}, status=400)
            
        social_id = f"kakao_{kakao_id}"
        
        # 소셜 로그인은 이메일 인증 완료 처리 (email_verified=True)
        user = User.objects.create(
            username=social_id,
            nickname=nickname,
            email=email,
            email_verified=True,  # 소셜 로그인은 이미 인증된 것으로 처리
            is_social=True,
            social_provider='kakao',
            social_id=social_id,
            profile_image=profile_image
        )
        
        # 기본 플랜 구독 자동 생성
        default_plan = BibleReadingPlan.objects.filter(is_default=True).first()
        if default_plan:
            subscription = PlanSubscription.objects.create(
                user=user,
                plan=default_plan,
                start_date=timezone.now().date(),
                is_active=True
            )
            logger.info(f"카카오 사용자 {user.nickname}의 기본 플랜 구독이 생성되었습니다. 플랜: {default_plan.name}")
        else:
            logger.warning("기본 플랜이 설정되어 있지 않아 구독을 생성할 수 없습니다.")
        
        refresh = RefreshToken.for_user(user)
        logger.info(f"카카오 회원가입 및 토큰 발급 성공: user_id={user.id}, username={user.username}")

        # 응답 생성 (하위 호환을 위해 토큰도 본문에 포함)
        response = Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

        # HttpOnly 쿠키 설정
        set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response
    except Exception as e:
        # 보안: 내부 에러 상세를 클라이언트에 노출하지 않음
        logger.error(f"카카오 회원가입 중 오류 발생: {str(e)}", exc_info=True)
        return Response({'error': '회원가입 처리 중 오류가 발생했습니다.'}, status=400)


# ========================================
# 이메일/비밀번호 인증 (매일일독 계정)
# ========================================

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def email_register(request):
    """이메일/비밀번호로 회원가입"""
    serializer = EmailRegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    try:
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        nickname = serializer.validated_data['nickname']
        
        # 이메일 중복 확인
        if User.objects.filter(email=email).exists():
            return Response({'error': '이미 사용 중인 이메일입니다.'}, status=400)
        
        # 닉네임 중복 확인
        if User.objects.filter(nickname=nickname).exists():
            return Response({'error': '이미 사용 중인 닉네임입니다.'}, status=400)
        
        # 사용자 생성
        user = User.objects.create(
            username=f"email_{uuid.uuid4().hex[:12]}",  # 고유 username
            email=email,
            nickname=nickname,
            is_social=False,
            has_usable_password_flag=True
        )
        user.set_password(password)
        user.save()
        
        # 기본 플랜 구독 생성
        _create_default_subscription(user)
        
        # 토큰 발급
        refresh = RefreshToken.for_user(user)
        response = Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
        set_auth_cookies(response, str(refresh.access_token), str(refresh))
        
        logger.info(f"이메일 회원가입 성공: user_id={user.id}, email={email}")
        return response
        
    except Exception as e:
        logger.error(f"이메일 회원가입 중 오류: {str(e)}", exc_info=True)
        return Response({'error': '회원가입 처리 중 오류가 발생했습니다.'}, status=400)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def email_login(request):
    """이메일 또는 아이디/비밀번호로 로그인 (레거시 아이디 로그인 지원)"""
    identifier = request.data.get('email')
    password = request.data.get('password')
    
    if not identifier or not password:
        return Response({'error': '이메일(또는 아이디)과 비밀번호를 입력해주세요.'}, status=400)
    
    try:
        user = User.objects.filter(Q(email=identifier) | Q(username=identifier)).first()
        
        if not user or not user.check_password(password):
            return Response({'error': '이메일/아이디 또는 비밀번호가 올바르지 않습니다.'}, status=400)
        
        refresh = RefreshToken.for_user(user)
        response = Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
        set_auth_cookies(response, str(refresh.access_token), str(refresh))
        
        logger.info(f"로그인 성공: user_id={user.id}, identifier={identifier}")
        return response
        
    except Exception as e:
        logger.error(f"로그인 중 오류: {str(e)}", exc_info=True)
        return Response({'error': '로그인 처리 중 오류가 발생했습니다.'}, status=400)


# ========================================
# 소셜 계정 연동 (신규)
# ========================================

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def social_login_v2(request):
    """
    통합 소셜 로그인 (v2)
    - 카카오/구글/애플 지원
    - SocialAccount 모델 사용
    - 계정 연동 지원
    
    Apple 로그인 시:
    - id_token (JWT) 필수
    - user_name (선택): 첫 로그인 시 Apple에서 제공하는 사용자 이름
    """
    serializer = SocialLoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    provider = serializer.validated_data.get('provider')
    code = serializer.validated_data.get('code')
    access_token = serializer.validated_data.get('access_token')
    # 앱에서 사용한 redirect_uri (웹과 다를 수 있음)
    redirect_uri = request.data.get('redirect_uri')
    
    try:
        # 소셜 제공자별 사용자 정보 가져오기
        if provider == 'kakao':
            if access_token:
                social_info = get_kakao_user_info_by_token(access_token)
            elif code:
                social_info = get_kakao_user_info(code, redirect_uri)
            else:
                return Response({'error': 'code 또는 access_token이 필요합니다.'}, status=400)
            
            provider_id = str(social_info.get('id'))
            email = social_info.get('kakao_account', {}).get('email')
            profile_image = social_info.get('properties', {}).get('profile_image')
            nickname_suggestion = social_info.get('properties', {}).get('nickname', '')
            
        elif provider == 'google':
            if access_token:
                social_info = get_google_user_info_by_token(access_token)
            elif code:
                social_info = get_google_user_info(code, redirect_uri)
            else:
                return Response({'error': 'code 또는 access_token이 필요합니다.'}, status=400)
            
            provider_id = social_info.get('sub')
            email = social_info.get('email')
            profile_image = social_info.get('picture')
            nickname_suggestion = social_info.get('name', '')
            
        elif provider == 'apple':
            # Apple Sign In: id_token (JWT) 직접 검증
            id_token = request.data.get('id_token')
            if not id_token:
                return Response({'error': 'Apple 로그인에는 id_token이 필요합니다.'}, status=400)
            
            social_info = get_apple_user_info(id_token)
            
            provider_id = social_info.get('sub')
            email = social_info.get('email')
            # Apple은 프로필 이미지를 제공하지 않음
            profile_image = None
            # Apple은 첫 로그인 시에만 이름을 제공하므로 빈 문자열로 설정
            nickname_suggestion = request.data.get('user_name', '')
            
            # Apple relay email인 경우 로그에 기록
            if social_info.get('is_private_email'):
                logger.info(f"Apple 로그인: relay email 사용 - {email}")
        else:
            return Response({'error': '지원하지 않는 소셜 제공자입니다.'}, status=400)
        
        if not provider_id:
            return Response({'error': '소셜 계정 정보를 가져올 수 없습니다.'}, status=400)
        
        # 기존 SocialAccount 확인
        social_account = SocialAccount.objects.filter(
            provider=provider,
            provider_id=provider_id
        ).select_related('user').first()
        
        if social_account:
            # 기존 연동 계정으로 로그인
            user = social_account.user
            refresh = RefreshToken.for_user(user)
            
            response = Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
            set_auth_cookies(response, str(refresh.access_token), str(refresh))
            
            logger.info(f"소셜 로그인 성공 (v2): provider={provider}, user_id={user.id}")
            return response
        
        # 레거시 계정 확인 (기존 social_id 필드)
        legacy_social_id = f"{provider}_{provider_id}"
        legacy_user = User.objects.filter(username=legacy_social_id).first()
        
        if legacy_user:
            # 레거시 계정을 새 SocialAccount로 마이그레이션
            SocialAccount.objects.create(
                user=legacy_user,
                provider=provider,
                provider_id=provider_id,
                email=email,
                profile_image=profile_image,
                extra_data=social_info
            )
            
            # 소셜 로그인은 이메일 인증 완료 처리
            if email and not legacy_user.email_verified:
                legacy_user.email = email
                legacy_user.email_verified = True
                legacy_user.save(update_fields=['email', 'email_verified'])
            
            refresh = RefreshToken.for_user(legacy_user)
            response = Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(legacy_user).data
            })
            set_auth_cookies(response, str(refresh.access_token), str(refresh))
            
            logger.info(f"레거시 계정 마이그레이션: provider={provider}, user_id={legacy_user.id}")
            return response
        
        # 신규 사용자 - 가입 필요
        return Response({
            'needsSignup': True,
            'provider': provider,
            'provider_id': provider_id,
            'email': email,
            'suggested_nickname': nickname_suggestion,
            'profile_image': profile_image
        }, status=200)
        
    except Exception as e:
        logger.error(f"소셜 로그인 v2 오류: {str(e)}", exc_info=True)
        return Response({'error': '로그인 처리 중 오류가 발생했습니다.'}, status=400)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def complete_social_signup(request):
    """소셜 회원가입 완료 (통합)"""
    try:
        provider = request.data.get('provider')
        provider_id = request.data.get('provider_id')
        nickname = request.data.get('nickname')
        email = request.data.get('email')
        profile_image = request.data.get('profile_image')
        access_token = request.data.get('access_token')
        
        if not provider or not provider_id or not nickname or not access_token:
            return Response({'error': '필수 정보가 누락되었습니다.'}, status=400)
        
        if provider == 'kakao':
            social_info = get_kakao_user_info_by_token(access_token)
            verified_provider_id = social_info.get('id')
        elif provider == 'google':
            social_info = get_google_user_info_by_token(access_token)
            verified_provider_id = social_info.get('sub')
        else:
            return Response({'error': '지원하지 않는 소셜 제공자입니다.'}, status=400)
        
        if not verified_provider_id:
            return Response({'error': '소셜 계정 인증에 실패했습니다.'}, status=400)
        if str(verified_provider_id) != str(provider_id):
            return Response({'error': '소셜 계정 정보가 일치하지 않습니다.'}, status=400)
        
        # 닉네임 중복 확인
        if User.objects.filter(nickname=nickname).exists():
            return Response({'error': '이미 사용 중인 닉네임입니다.'}, status=400)
        
        # 이미 연동된 계정인지 확인
        if SocialAccount.objects.filter(provider=provider, provider_id=provider_id).exists():
            return Response({'error': '이미 가입된 소셜 계정입니다.'}, status=400)
        
        with transaction.atomic():
            # 사용자 생성 (소셜 로그인은 이메일 인증 완료 처리)
            user = User.objects.create(
                username=f"{provider}_{provider_id}",
                nickname=nickname,
                email=email,
                email_verified=True,  # 소셜 로그인은 이미 인증됨
                profile_image=profile_image,
                is_social=True,
                social_provider=provider,
                social_id=f"{provider}_{provider_id}"
            )
            
            # SocialAccount 생성
            SocialAccount.objects.create(
                user=user,
                provider=provider,
                provider_id=provider_id,
                email=email,
                profile_image=profile_image
            )
            
            # 기본 플랜 구독 생성
            _create_default_subscription(user)
        
        refresh = RefreshToken.for_user(user)
        response = Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
        set_auth_cookies(response, str(refresh.access_token), str(refresh))
        
        logger.info(f"소셜 회원가입 완료: provider={provider}, user_id={user.id}")
        return response
        
    except Exception as e:
        logger.error(f"소셜 회원가입 오류: {str(e)}", exc_info=True)
        return Response({'error': '회원가입 처리 중 오류가 발생했습니다.'}, status=400)


# ========================================
# 계정 연동 관리
# ========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_linked_accounts(request):
    """연결된 소셜 계정 목록 조회"""
    user = request.user
    social_accounts = SocialAccount.objects.filter(user=user)
    
    email = user.email
    if not email:
        for sa in social_accounts:
            if sa.email:
                email = sa.email
                break
    
    return Response({
        'has_password': user.has_password_set(),
        'email': email,
        'linked_accounts': [
            {
                'provider': sa.provider,
                'provider_display': sa.get_provider_display(),
                'email': sa.email,
                'profile_image': sa.profile_image,
                'linked_at': sa.created_at,
                'can_unlink': user.can_unlink_provider(sa.provider)
            }
            for sa in social_accounts
        ]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_social_account(request):
    """
    소셜 계정 연동 추가
    
    이미 다른 계정에 연동된 경우 병합을 위한 상세 정보 반환
    """
    user = request.user
    provider = request.data.get('provider')
    access_token = request.data.get('access_token')
    code = request.data.get('code')
    
    if not provider:
        return Response({'error': '소셜 제공자를 지정해주세요.'}, status=400)
    
    try:
        # 소셜 정보 가져오기
        if provider == 'kakao':
            if access_token:
                social_info = get_kakao_user_info_by_token(access_token)
            elif code:
                social_info = get_kakao_user_info(code)
            else:
                return Response({'error': 'access_token 또는 code가 필요합니다.'}, status=400)
            
            provider_id = str(social_info.get('id'))
            email = social_info.get('kakao_account', {}).get('email')
            profile_image = social_info.get('properties', {}).get('profile_image')
            
        elif provider == 'google':
            if access_token:
                social_info = get_google_user_info_by_token(access_token)
            elif code:
                social_info = get_google_user_info(code)
            else:
                return Response({'error': 'access_token 또는 code가 필요합니다.'}, status=400)
            
            provider_id = social_info.get('sub')
            email = social_info.get('email')
            profile_image = social_info.get('picture')
        else:
            return Response({'error': '지원하지 않는 소셜 제공자입니다.'}, status=400)
        
        if not provider_id:
            return Response({'error': '소셜 계정 정보를 가져올 수 없습니다.'}, status=400)
        
        # 이미 다른 계정에 연동되어 있는지 확인
        existing = SocialAccount.objects.filter(
            provider=provider, 
            provider_id=provider_id
        ).select_related('user').first()
        
        if existing:
            if existing.user_id == user.id:
                return Response({'error': '이미 연동된 계정입니다.'}, status=400)
            else:
                other_user = existing.user
                # 병합을 위한 상세 정보 반환
                return Response({
                    'error': '이 소셜 계정은 다른 사용자에게 연동되어 있습니다.',
                    'can_merge': True,
                    'current_account': {
                        'id': user.id,
                        'nickname': user.nickname,
                        'email': user.email,
                        'profile_image': user.profile_image,
                        'providers': list(user.social_accounts.values_list('provider', flat=True)),
                        'has_password': user.has_password_set(),
                        'created_at': user.date_joined.isoformat(),
                    },
                    'other_account': {
                        'id': other_user.id,
                        'nickname': other_user.nickname,
                        'email': other_user.email,
                        'profile_image': other_user.profile_image,
                        'providers': list(other_user.social_accounts.values_list('provider', flat=True)),
                        'has_password': other_user.has_password_set(),
                        'created_at': other_user.date_joined.isoformat(),
                    },
                    'provider': provider,
                }, status=409)
        
        # 연동 추가
        SocialAccount.objects.create(
            user=user,
            provider=provider,
            provider_id=provider_id,
            email=email,
            profile_image=profile_image,
            extra_data=social_info
        )
        
        logger.info(f"소셜 계정 연동 추가: user_id={user.id}, provider={provider}")
        return Response({'success': True, 'message': f'{provider} 계정이 연동되었습니다.'})
        
    except Exception as e:
        logger.error(f"소셜 계정 연동 오류: {str(e)}", exc_info=True)
        return Response({'error': '계정 연동 중 오류가 발생했습니다.'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlink_social_account(request):
    """소셜 계정 연동 해제"""
    user = request.user
    provider = request.data.get('provider')
    
    if not provider:
        return Response({'error': '소셜 제공자를 지정해주세요.'}, status=400)
    
    if not user.can_unlink_provider(provider):
        return Response({
            'error': '비밀번호를 설정하거나 다른 로그인 방법을 연동한 후 해제할 수 있습니다.'
        }, status=400)
    
    try:
        deleted, _ = SocialAccount.objects.filter(user=user, provider=provider).delete()
        
        if deleted:
            logger.info(f"소셜 계정 연동 해제: user_id={user.id}, provider={provider}")
            return Response({'success': True, 'message': f'{provider} 계정 연동이 해제되었습니다.'})
        else:
            return Response({'error': '연동된 계정을 찾을 수 없습니다.'}, status=404)
            
    except Exception as e:
        logger.error(f"소셜 계정 연동 해제 오류: {str(e)}", exc_info=True)
        return Response({'error': '연동 해제 중 오류가 발생했습니다.'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_password(request):
    user = request.user
    serializer = SetPasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    new_password = serializer.validated_data['new_password']
    current_password = serializer.validated_data.get('current_password')
    
    if user.has_password_set():
        if not current_password:
            return Response({'error': '현재 비밀번호를 입력해주세요.'}, status=400)
        if not user.check_password(current_password):
            return Response({'error': '현재 비밀번호가 올바르지 않습니다.'}, status=400)
    
    user.set_password(new_password)
    user.has_usable_password_flag = True
    user.token_version += 1
    user.save(update_fields=['password', 'has_usable_password_flag', 'token_version'])
    
    logger.info(f"비밀번호 설정 완료: user_id={user.id}")
    return Response({'success': True, 'message': '비밀번호가 설정되었습니다.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_all_devices(request):
    user = request.user
    user.token_version += 1
    user.save(update_fields=['token_version'])
    
    logger.info(f"모든 기기에서 로그아웃: user_id={user.id}")
    return Response({'success': True, 'message': '모든 기기에서 로그아웃되었습니다.'})


# ========================================
# 계정 병합
# ========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merge_accounts(request):
    """
    계정 병합 API
    
    사용자가 어느 계정을 유지할지 선택 가능:
    - keep_account='current': 현재 로그인한 계정 유지
    - keep_account='other': 소셜 연동된 다른 계정 유지
    
    선택된 계정의 데이터만 유지하고, 다른 계정의 소셜 연동만 이전
    삭제될 계정은 30일 후 삭제 예정으로 표시
    """
    user = request.user
    provider = request.data.get('provider')
    code = request.data.get('code')
    keep_account = request.data.get('keep_account', 'current')  # 'current' or 'other'
    
    if not provider or not code:
        return Response({'error': '소셜 계정 정보가 필요합니다.'}, status=400)
    
    if keep_account not in ['current', 'other']:
        return Response({'error': 'keep_account는 current 또는 other여야 합니다.'}, status=400)
    
    try:
        # 소셜 계정 정보 가져오기
        if provider == 'kakao':
            social_info = get_kakao_user_info(code)
            provider_id = str(social_info.get('id'))
            email = social_info.get('kakao_account', {}).get('email')
            profile_image = social_info.get('properties', {}).get('profile_image')
        elif provider == 'google':
            social_info = get_google_user_info(code)
            provider_id = social_info.get('sub')
            email = social_info.get('email')
            profile_image = social_info.get('picture')
        else:
            return Response({'error': '지원하지 않는 소셜 제공자입니다.'}, status=400)
        
        if not provider_id:
            return Response({'error': '소셜 계정 정보를 가져올 수 없습니다.'}, status=400)
        
        # 대상 계정 찾기
        other_social = SocialAccount.objects.filter(
            provider=provider,
            provider_id=provider_id
        ).select_related('user').first()
        
        if not other_social:
            # 레거시 계정 확인
            legacy_id = f"{provider}_{provider_id}"
            other_user = User.objects.filter(username=legacy_id).first()
            if not other_user:
                return Response({'error': '병합할 계정을 찾을 수 없습니다.'}, status=404)
        else:
            other_user = other_social.user
        
        if other_user.id == user.id:
            return Response({'error': '같은 계정입니다.'}, status=400)
        
        # 어느 계정을 유지할지 결정
        if keep_account == 'current':
            keep_user = user
            delete_user = other_user
        else:
            keep_user = other_user
            delete_user = user
        
        with transaction.atomic():
            # 삭제될 계정의 소셜 연동을 유지할 계정으로 이전
            SocialAccount.objects.filter(user=delete_user).update(user=keep_user)
            
            # 새로 연결하려던 소셜 계정이 이미 있으면 스킵, 없으면 생성
            if not SocialAccount.objects.filter(user=keep_user, provider=provider, provider_id=provider_id).exists():
                SocialAccount.objects.create(
                    user=keep_user,
                    provider=provider,
                    provider_id=provider_id,
                    email=email,
                    profile_image=profile_image,
                    extra_data=social_info
                )
            
            # 삭제될 계정 30일 후 삭제 예정으로 표시
            delete_user.is_active = False
            delete_user.scheduled_deletion_at = timezone.now() + timedelta(days=30)
            delete_user.merged_into = keep_user
            delete_user.username = f"merged_{delete_user.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
            delete_user.nickname = f"삭제예정_{delete_user.id}"
            delete_user.save()
            
            logger.info(f"계정 병합 완료: 유지={keep_user.id}, 삭제예정={delete_user.id}")
        
        # 유지된 계정이 현재 로그인 계정이 아닌 경우 새 토큰 발급
        result = {
            'success': True,
            'message': '계정이 병합되었습니다. 삭제될 계정은 30일 후 완전히 삭제됩니다.',
            'kept_user_id': keep_user.id,
            'deleted_user_id': delete_user.id,
        }
        
        if keep_account == 'other':
            # 다른 계정을 선택한 경우 새 토큰 발급
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(keep_user)
            result['access'] = str(refresh.access_token)
            result['refresh'] = str(refresh)
            result['user'] = {
                'id': keep_user.id,
                'nickname': keep_user.nickname,
                'email': keep_user.email,
                'profile_image': keep_user.profile_image,
            }
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"계정 병합 오류: {str(e)}", exc_info=True)
        return Response({'error': '계정 병합 중 오류가 발생했습니다.'}, status=400)


# ========================================
# 헬퍼 함수
# ========================================

def get_google_user_info_by_token(access_token):
    """Google access_token으로 사용자 정보 조회"""
    response = requests.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    return response.json()


def _create_default_subscription(user):
    """기본 플랜 구독 생성"""
    default_plan = BibleReadingPlan.objects.filter(is_default=True).first()
    if default_plan:
        PlanSubscription.objects.create(
            user=user,
            plan=default_plan,
            start_date=timezone.now().date(),
            is_active=True
        )
        logger.info(f"사용자 {user.nickname}의 기본 플랜 구독 생성됨")
    else:
        logger.warning("기본 플랜이 설정되어 있지 않음")


def _transfer_user_data(from_user, to_user):
    """사용자 데이터 이전 (계정 병합용)"""
    from todos.models import UserBibleProgress
    
    # 성경 읽기 진행 상황 이전 (중복 제외)
    existing_progress = set(UserBibleProgress.objects.filter(user=to_user).values_list(
        'schedule_id', 'plan_id', flat=False
    ))
    
    for progress in UserBibleProgress.objects.filter(user=from_user):
        key = (progress.schedule_id, progress.plan_id)
        if key not in existing_progress:
            progress.user = to_user
            progress.save()
    
    # 프로필 통계 병합
    try:
        from_profile = from_user.profile
        to_profile = to_user.profile
        to_profile.total_completed_days = max(
            to_profile.total_completed_days, 
            from_profile.total_completed_days
        )
        to_profile.longest_streak = max(
            to_profile.longest_streak,
            from_profile.longest_streak
        )
        to_profile.save()
    except Exception:
        pass


# ========================================
# 이메일 인증
# ========================================

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def send_verification_email_view(request):
    """이메일 인증 메일 발송"""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': '이메일을 입력해주세요.'}, status=400)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': '해당 이메일로 가입된 계정이 없습니다.'}, status=404)
    
    if user.email_verified:
        return Response({'error': '이미 인증된 이메일입니다.'}, status=400)
    
    token_obj = EmailVerificationToken.create_token(user, email)
    
    if send_verification_email(email, token_obj.token, user.nickname):
        logger.info(f"이메일 인증 메일 발송: user_id={user.id}, email={email}")
        return Response({'success': True, 'message': '인증 메일이 발송되었습니다.'})
    else:
        return Response({'error': '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'}, status=500)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def verify_email(request):
    """이메일 인증 토큰 검증"""
    token = request.data.get('token')
    
    if not token:
        return Response({'error': '인증 토큰이 필요합니다.'}, status=400)
    
    try:
        token_obj = EmailVerificationToken.objects.select_related('user').get(token=token)
    except EmailVerificationToken.DoesNotExist:
        return Response({'error': '유효하지 않은 인증 링크입니다.'}, status=400)
    
    if not token_obj.is_valid():
        return Response({'error': '인증 링크가 만료되었습니다. 새로운 인증 메일을 요청해주세요.'}, status=400)
    
    if token_obj.verify():
        user = token_obj.user
        send_welcome_email(user.email, user.nickname)
        
        refresh = RefreshToken.for_user(user)
        response = Response({
            'success': True,
            'message': '이메일 인증이 완료되었습니다.',
            'user': UserSerializer(user).data
        })
        set_auth_cookies(response, str(refresh.access_token), str(refresh))
        
        logger.info(f"이메일 인증 완료: user_id={user.id}")
        return response
    else:
        return Response({'error': '인증 처리 중 오류가 발생했습니다.'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_verification_email(request):
    """인증 메일 재발송 (로그인 상태)"""
    user = request.user
    
    if user.email_verified:
        return Response({'error': '이미 인증된 이메일입니다.'}, status=400)
    
    if not user.email:
        return Response({'error': '이메일이 설정되어 있지 않습니다.'}, status=400)
    
    token_obj = EmailVerificationToken.create_token(user, user.email)
    
    if send_verification_email(user.email, token_obj.token, user.nickname):
        logger.info(f"인증 메일 재발송: user_id={user.id}")
        return Response({'success': True, 'message': '인증 메일이 발송되었습니다.'})
    else:
        return Response({'error': '메일 발송에 실패했습니다.'}, status=500)


# ========================================
# 비밀번호 재설정
# ========================================

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def request_password_reset(request):
    """비밀번호 재설정 요청"""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': '이메일을 입력해주세요.'}, status=400)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'success': True, 
            'message': '해당 이메일로 비밀번호 재설정 안내가 발송됩니다.'
        })
    
    if not user.has_password_set() and not user.email_verified:
        return Response({
            'success': True,
            'message': '해당 이메일로 비밀번호 재설정 안내가 발송됩니다.'
        })
    
    token_obj = PasswordResetToken.create_token(user)
    
    if send_password_reset_email(email, token_obj.token, user.nickname):
        logger.info(f"비밀번호 재설정 메일 발송: user_id={user.id}")
    
    return Response({
        'success': True,
        'message': '해당 이메일로 비밀번호 재설정 안내가 발송됩니다.'
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """비밀번호 재설정 토큰 유효성 검사"""
    token = request.data.get('token')
    
    if not token:
        return Response({'error': '토큰이 필요합니다.'}, status=400)
    
    try:
        token_obj = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response({'valid': False, 'error': '유효하지 않은 링크입니다.'}, status=400)
    
    if not token_obj.is_valid():
        return Response({'valid': False, 'error': '링크가 만료되었습니다.'}, status=400)
    
    return Response({'valid': True})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not token or not new_password:
        return Response({'error': '토큰과 새 비밀번호가 필요합니다.'}, status=400)
    
    if len(new_password) < 8:
        return Response({'error': '비밀번호는 8자 이상이어야 합니다.'}, status=400)
    
    try:
        token_obj = PasswordResetToken.objects.select_related('user').get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response({'error': '유효하지 않은 링크입니다.'}, status=400)
    
    if not token_obj.is_valid():
        return Response({'error': '링크가 만료되었습니다. 새로운 재설정 링크를 요청해주세요.'}, status=400)
    
    user = token_obj.user
    user.set_password(new_password)
    user.has_usable_password_flag = True
    user.token_version += 1
    user.save(update_fields=['password', 'has_usable_password_flag', 'token_version'])
    
    token_obj.use_token()
    
    refresh = RefreshToken.for_user(user)
    response = Response({
        'success': True,
        'message': '비밀번호가 변경되었습니다.',
        'user': UserSerializer(user).data
    })
    set_auth_cookies(response, str(refresh.access_token), str(refresh))
    
    logger.info(f"비밀번호 재설정 완료: user_id={user.id}")
    return response


# ========================================
# 계정 삭제
# ========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    계정 삭제 API (30일 유예 기간)
    
    - 비밀번호가 설정된 경우: 비밀번호 확인 필요
    - 소셜 로그인만 사용 중인 경우: 이미 인증된 상태로 확인
    - 삭제 요청 시 30일 후 완전 삭제 예정으로 표시
    """
    user = request.user
    password = request.data.get('password')
    
    # 이미 삭제 예정인 계정인지 확인
    if user.scheduled_deletion_at:
        return Response({
            'error': '이미 삭제 예정인 계정입니다.',
            'scheduled_deletion_at': user.scheduled_deletion_at.isoformat()
        }, status=400)
    
    # 재인증: 비밀번호가 설정되어 있으면 비밀번호 확인 필요
    if user.has_password_set():
        if not password:
            return Response({'error': '비밀번호를 입력해주세요.'}, status=400)
        if not user.check_password(password):
            return Response({'error': '비밀번호가 올바르지 않습니다.'}, status=400)
    # 소셜 로그인만 사용 중인 경우: 이미 인증된 상태이므로 추가 확인 불필요
    
    try:
        with transaction.atomic():
            # 30일 후 삭제 예정으로 표시
            user.is_active = False
            user.scheduled_deletion_at = timezone.now() + timedelta(days=30)
            user.nickname = f"삭제예정_{user.id}"
            user.token_version += 1  # 모든 기기에서 로그아웃
            user.save(update_fields=[
                'is_active', 
                'scheduled_deletion_at', 
                'nickname', 
                'token_version'
            ])
            
            logger.info(f"계정 삭제 요청: user_id={user.id}, scheduled_deletion_at={user.scheduled_deletion_at}")
        
        return Response({
            'success': True,
            'message': '계정 삭제가 요청되었습니다. 30일 후 완전히 삭제됩니다.',
            'scheduled_deletion_at': user.scheduled_deletion_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"계정 삭제 요청 오류: user_id={user.id}, error={str(e)}", exc_info=True)
        return Response({'error': '계정 삭제 요청 중 오류가 발생했습니다.'}, status=500)


# ========================================
# 세션 브리지 (Native ↔ WebView 인증 동기화)
# ========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def session_bridge_issue(request):
    """
    세션 브리지 코드 발급
    - 인증된 사용자만 접근 가능
    - 1회용 코드 생성 (TTL 60초)
    - Native 앱에서 호출하여 WebView 쿠키 동기화에 사용
    """
    from django.core.cache import cache
    
    user = request.user
    code = str(uuid.uuid4())
    cache_key = f'session_bridge:{code}'
    
    cache.set(cache_key, user.id, timeout=60)
    
    logger.info(f"세션 브리지 코드 발급: user_id={user.id}, code={code[:8]}...")
    
    return Response({'code': code})


@api_view(['GET'])
@permission_classes([AllowAny])
def session_bridge_consume(request):
    """
    세션 브리지 코드 소비
    - 1회용 코드를 검증하고 쿠키 설정 후 리다이렉트
    - WebView에서 호출하여 인증 쿠키 획득
    """
    from django.core.cache import cache
    from django.http import HttpResponseRedirect
    
    code = request.GET.get('code')
    next_url = request.GET.get('next', '/')
    
    if not code:
        return Response({'error': 'code_required'}, status=400)
    
    cache_key = f'session_bridge:{code}'
    user_id = cache.get(cache_key)
    
    if user_id is None:
        return Response({'error': 'invalid_or_expired_code'}, status=400)
    
    cache.delete(cache_key)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning(f"세션 브리지: 사용자 없음 user_id={user_id}")
        return Response({'error': 'user_not_found'}, status=400)
    
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    response = HttpResponseRedirect(next_url)
    set_auth_cookies(response, access_token, refresh_token)
    
    logger.info(f"세션 브리지 코드 소비: user_id={user.id}, next={next_url}")
    
    return response
