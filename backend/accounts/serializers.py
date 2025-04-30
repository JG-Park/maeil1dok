from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

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