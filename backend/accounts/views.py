from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer, SocialLoginSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import requests
from django.conf import settings
from django.utils import timezone
from todos.models import BibleReadingPlan, PlanSubscription
import logging

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
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            else:
                suggested_nickname = user_info.get('properties', {}).get('nickname', '')
                return Response({
                    'needsSignup': True,
                    'kakao_id': user_info['id'],
                    'suggested_nickname': suggested_nickname,
                    'profile_image': user_info.get('properties', {}).get('profile_image')
                }, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=400)

def get_kakao_user_info(code):
    # 카카오 토큰 받기
    print("Kakao token request data:", {
        'grant_type': 'authorization_code',
        'client_id': settings.KAKAO_CLIENT_ID,
        'redirect_uri': settings.KAKAO_REDIRECT_URI,
        'code': code,
    })
    
    token_response = requests.post(
        'https://kauth.kakao.com/oauth/token',
        data={
            'grant_type': 'authorization_code',
            'client_id': settings.KAKAO_CLIENT_ID,
            'redirect_uri': settings.KAKAO_REDIRECT_URI,
            'code': code,
        }
    )
    print("Kakao token response:", token_response.text)
    
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
    print("Kakao user info response:", user_response.text)
    
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
    print(f"[views] get_kakao_user_info_by_token with token: {access_token}")
    response = requests.get(
        'https://kapi.kakao.com/v2/user/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    print(f"[views] user info by token response: {response.text}")
    data = response.json()
    if 'id' not in data:
        print("[views] get_kakao_user_info_by_token error data:", data)
        return data
    return data

def get_google_user_info(code):
    # Google 토큰 받기
    token_response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'grant_type': 'authorization_code',
        }
    )
    access_token = token_response.json().get('access_token')
    
    # 사용자 정보 받기
    user_info = requests.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    ).json()
    
    return user_info

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
@permission_classes([AllowAny])
def complete_kakao_signup(request):
    try:
        nickname = request.data.get('nickname')
        kakao_id = request.data.get('kakao_id')
        profile_image = request.data.get('profile_image')
        
        if not nickname or not kakao_id:
            return Response({'error': '필수 정보가 누락되었습니다.'}, status=400)
            
        social_id = f"kakao_{kakao_id}"
        
        user = User.objects.create(
            username=social_id,
            nickname=nickname,
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
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    except Exception as e:
        logger.error(f"카카오 회원가입 중 오류 발생: {str(e)}")
        return Response({'error': str(e)}, status=400)
