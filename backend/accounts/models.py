from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    nickname = models.CharField(max_length=50, unique=True)
    
    # 소셜 로그인 필드
    is_social = models.BooleanField(default=False)
    social_provider = models.CharField(max_length=20, null=True, blank=True)
    social_id = models.CharField(max_length=100, null=True, blank=True)
    profile_image = models.URLField(max_length=500, null=True, blank=True)
    
    # 기존 필드 중 불필요한 것들은 null=True로 설정
    email = models.EmailField(null=True, blank=True)
    
    # related_name 추가
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['nickname']
