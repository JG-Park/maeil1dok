from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, UserProfile, Follow, UserAchievement
from todos.models import UserBibleProgress
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    is_staff = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'nickname', 'profile_image', 'is_staff')
        read_only_fields = ('id', 'is_staff')
        
    def get_is_staff(self, obj):
        # superuser나 staff 권한이 있는 경우 admin으로 간주
        return obj.is_superuser or obj.is_staff

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'nickname')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("이미 사용중인 아이디입니다.")
        return value

    def validate_nickname(self, value):
        if User.objects.filter(nickname=value).exists():
            raise serializers.ValidationError("이미 사용중인 닉네임입니다.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            nickname=validated_data['nickname']
        )
        return user

class SocialLoginSerializer(serializers.Serializer):
    provider = serializers.CharField()  # 'kakao' or 'google'
    code = serializers.CharField(required=False, allow_blank=True)  # OAuth 인증 코드
    access_token = serializers.CharField(required=False, allow_blank=True)  # Native Kakao access token

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['nickname'] = user.nickname
        token['is_social'] = user.is_social
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        logger.info(f"일반 로그인 성공: user_id={self.user.id}, username={self.user.username}")
        return data 


class UserProfileSerializer(serializers.ModelSerializer):
    """사용자 프로필 시리얼라이저"""
    user = UserSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_mutual_follow = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'bio', 'total_completed_days',
            'current_streak', 'longest_streak', 'joined_date',
            'is_public', 'followers_count', 'following_count',
            'is_following', 'is_mutual_follow'
        ]
        read_only_fields = ['joined_date', 'total_completed_days', 'current_streak', 'longest_streak']
    
    def get_followers_count(self, obj):
        return obj.user.followers.count()
    
    def get_following_count(self, obj):
        return obj.user.following.count()
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(
                follower=request.user,
                following=obj.user
            ).exists()
        return False
    
    def get_is_mutual_follow(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(
                follower=request.user,
                following=obj.user
            ).exists() and Follow.objects.filter(
                follower=obj.user,
                following=request.user
            ).exists()
        return False


class FollowSerializer(serializers.ModelSerializer):
    """팔로우 관계 시리얼라이저"""
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['created_at']


class UserAchievementSerializer(serializers.ModelSerializer):
    """사용자 업적 시리얼라이저"""
    achievement_display = serializers.CharField(source='get_achievement_type_display', read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = [
            'id', 'achievement_type', 'achievement_display',
            'achieved_at', 'milestone_value', 'details'
        ]
        read_only_fields = ['achieved_at']


class UserCalendarDataSerializer(serializers.Serializer):
    """사용자 달력 데이터 시리얼라이저"""
    date = serializers.DateField()
    is_completed = serializers.BooleanField()
    book = serializers.CharField()
    chapters = serializers.CharField()


class UserSearchSerializer(serializers.ModelSerializer):
    """사용자 검색 시리얼라이저"""
    is_following = serializers.SerializerMethodField()
    total_completed_days = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'nickname', 'profile_image', 'is_following', 'total_completed_days']
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(
                follower=request.user,
                following=obj
            ).exists()
        return False
    
    def get_total_completed_days(self, obj):
        try:
            return obj.profile.total_completed_days
        except:
            return 0