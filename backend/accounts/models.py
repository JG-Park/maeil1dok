from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class GenderChoices(models.TextChoices):
        MALE = "M", "남성"
        FEMALE = "F", "여성"
        OTHER = "O", "기타"
    
    email = models.EmailField(unique=True)
    gender = models.CharField(max_length=1, choices=GenderChoices.choices)
    birth_date = models.DateField(null=True)
    
    # 소셜 로그인 필드
    is_social = models.BooleanField(default=False)
    social_provider = models.CharField(max_length=20, null=True, blank=True)
    social_id = models.CharField(max_length=100, null=True, blank=True)
    
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
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
