from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

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


class UserProfile(models.Model):
    """사용자 프로필 정보"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='profile'
    )
    bio = models.TextField(max_length=500, blank=True, help_text="자기소개")
    total_completed_days = models.IntegerField(default=0, help_text="총 완료한 일수")
    current_streak = models.IntegerField(default=0, help_text="현재 연속 일수")
    longest_streak = models.IntegerField(default=0, help_text="최장 연속 일수")
    joined_date = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=True, help_text="프로필 공개 여부")
    
    class Meta:
        ordering = ['-total_completed_days']
    
    def __str__(self):
        return f"{self.user.nickname}'s Profile"


class Follow(models.Model):
    """팔로우 관계"""
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='following',
        on_delete=models.CASCADE
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='followers',
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['follower', 'following']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['follower', '-created_at']),
            models.Index(fields=['following', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.follower.nickname} follows {self.following.nickname}"


class UserAchievement(models.Model):
    """사용자 업적/성취"""
    ACHIEVEMENT_TYPES = [
        ('first_complete', '첫 완독'),
        ('streak_7', '7일 연속'),
        ('streak_30', '30일 연속'),
        ('streak_100', '100일 연속'),
        ('total_30', '누적 30일'),
        ('total_100', '누적 100일'),
        ('total_365', '누적 365일'),
        ('book_complete', '책 완독'),
        ('testament_complete', '구약/신약 완독'),
        ('bible_complete', '성경 완독'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='achievements',
        on_delete=models.CASCADE
    )
    achievement_type = models.CharField(
        max_length=50,
        choices=ACHIEVEMENT_TYPES
    )
    achieved_at = models.DateTimeField(auto_now_add=True)
    milestone_value = models.IntegerField(default=0, help_text="달성 값 (예: 연속 일수)")
    details = models.JSONField(default=dict, blank=True, help_text="추가 정보")
    
    class Meta:
        unique_together = ['user', 'achievement_type']
        ordering = ['-achieved_at']
    
    def __str__(self):
        return f"{self.user.nickname} - {self.get_achievement_type_display()}"
