from django.db import models
from django.utils import timezone
from django.conf import settings

from django.core.exceptions import ValidationError

class BibleReadingPlan(models.Model):
    """성경 읽기 플랜"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # update_fields가 지정되면 해당 필드만 검증
        if 'update_fields' in kwargs and kwargs['update_fields']:
            # created_by 필드가 검증 대상에 포함되어 있지 않으면 전체 검증을 건너뜀
            if 'created_by' not in kwargs['update_fields']:
                super().save(*args, **kwargs)
                return
        
        # 일반적인 저장 로직
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class PlanSubscription(models.Model):
    """플랜 구독"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(BibleReadingPlan, on_delete=models.CASCADE)
    start_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'plan']

    def __str__(self):
        return f"{self.user.username}'s subscription to {self.plan.name}"

class DailyBibleSchedule(models.Model):
    """매일의 성경 읽기 스케줄"""
    plan = models.ForeignKey(
        BibleReadingPlan,
        on_delete=models.CASCADE,
        related_name='schedules',
    )
    date = models.DateField()
    book = models.CharField(max_length=50)
    start_chapter = models.IntegerField()
    end_chapter = models.IntegerField()
    audio_link = models.URLField(blank=True, null=True)
    guide_link = models.URLField(blank=True, null=True)
    
    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.plan.name} - {self.date}: {self.book} {self.start_chapter}-{self.end_chapter}장"

    def clean(self):
        # 동일한 플랜, 날짜, 책 조합이 이미 존재하는지 확인
        exists = DailyBibleSchedule.objects.filter(
            plan=self.plan,
            date=self.date,
            book=self.book
        ).exclude(pk=self.pk).exists()
        
        if exists:
            raise ValidationError('동일한 플랜, 날짜, 책 조합의 스케줄이 이미 존재합니다.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class UserBibleProgress(models.Model):
    """사용자별 성경 읽기 진도"""
    subscription = models.ForeignKey(
        PlanSubscription,
        on_delete=models.CASCADE,
        related_name='progress',
    )
    schedule = models.ForeignKey(
        DailyBibleSchedule,
        on_delete=models.CASCADE,
        related_name='progress_records',
    )
    """사용자별 성경 읽기 진도"""
    is_completed = models.BooleanField(default=False)  # 완료 여부 명시적 표시
    completed_at = models.DateTimeField(null=True, blank=True)  # 완료 시점
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def mark_as_completed(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()

    def mark_as_incomplete(self):
        self.is_completed = False
        self.completed_at = None
        self.save()

    @property
    def status(self):
        """해당 날짜의 진도 상태를 반환"""
        try:
            schedule = self.schedule
            if self.is_completed:
                return "completed"
            return "in_progress"
        except DailyBibleSchedule.DoesNotExist:
            return "no_schedule"

class VideoBibleIntro(models.Model):
    """성경 영상 개론 플랜"""
    plan = models.ForeignKey(
        BibleReadingPlan,
        on_delete=models.CASCADE,
        related_name='video_intros',
    )
    book = models.CharField(max_length=50, help_text="성경책 이름")
    url_link = models.URLField(help_text="영상 링크")
    start_date = models.DateField(help_text="시작일")
    end_date = models.DateField(help_text="종료일")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']
        constraints = [
            models.UniqueConstraint(
                fields=['plan', 'book'],
                name='unique_video_intro_per_book'
            )
        ]

    def clean(self):
        # 종료일이 시작일보다 이전인지 확인
        if self.end_date < self.start_date:
            raise ValidationError('종료일은 시작일보다 이후여야 합니다.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.plan.name} - {self.book} 개론 ({self.start_date} ~ {self.end_date})"


class UserVideoIntroProgress(models.Model):
    """사용자별 영상 개론 진행 상황"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    video_intro = models.ForeignKey(
        VideoBibleIntro,
        on_delete=models.CASCADE,
        related_name='user_progress'
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'video_intro']

    def mark_as_completed(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()

    def mark_as_incomplete(self):
        self.is_completed = False
        self.completed_at = None
        self.save()

    def __str__(self):
        status = "완료" if self.is_completed else "미완료"
        return f"{self.user.username}의 {self.video_intro.book} 개론 - {status}"


class HasenaRecord(models.Model):
    """하세나하시조(hasena) 기록"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(help_text="기록 날짜")
    is_completed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username}의 하세나 기록 - {self.date}"

class VisitorCount(models.Model):
    """일일 방문자 수 카운터"""
    date = models.DateField(unique=True)
    daily_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.date}: {self.daily_count} visitors"

    @classmethod
    def increment_daily_count(cls):
        """오늘의 방문자 수 증가"""
        today = timezone.now().date()
        visitor_count, created = cls.objects.get_or_create(
            date=today,
            defaults={'daily_count': 1}
        )
        if not created:
            # F() 표현식 대신 실제 값을 가져와서 증가
            cls.objects.filter(id=visitor_count.id).update(daily_count=models.F('daily_count') + 1)
            # 업데이트된 객체 다시 조회
            visitor_count.refresh_from_db()
        return visitor_count

    @classmethod
    def get_total_visitors(cls):
        """전체 누적 방문자 수 조회"""
        return cls.objects.aggregate(total=models.Sum('daily_count'))['total'] or 0


class ReadingGroup(models.Model):
    """성경 읽기 그룹/커뮤니티"""
    name = models.CharField(max_length=100, help_text="그룹 이름")
    description = models.TextField(blank=True, help_text="그룹 설명")
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_groups'
    )
    plans = models.ManyToManyField(
        BibleReadingPlan,
        related_name='reading_groups',
        help_text="그룹이 따르는 읽기 플랜들 (복수 선택 가능)"
    )
    is_public = models.BooleanField(default=False, help_text="공개 그룹 여부")
    max_members = models.IntegerField(default=50, help_text="최대 멤버 수")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_public']),
            models.Index(fields=['creator', '-created_at']),
        ]

    def __str__(self):
        plan_names = ", ".join([plan.name for plan in self.plans.all()[:2]])
        if self.plans.count() > 2:
            plan_names += f" 외 {self.plans.count() - 2}개"
        return f"{self.name} ({plan_names})" if plan_names else self.name

    @property
    def member_count(self):
        return self.memberships.filter(is_active=True).count()

    @property
    def is_full(self):
        return self.member_count >= self.max_members


class GroupMembership(models.Model):
    """그룹 멤버십"""
    ROLE_CHOICES = [
        ('admin', '관리자'),
        ('member', '멤버'),
    ]
    
    group = models.ForeignKey(
        ReadingGroup,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='member'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    show_in_profile = models.BooleanField(
        default=True,
        help_text="프로필에 이 그룹 표시 여부"
    )

    class Meta:
        unique_together = ['group', 'user']
        ordering = ['-joined_at']
        indexes = [
            models.Index(fields=['group', 'is_active']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.nickname} in {self.group.name} as {self.get_role_display()}"


class GroupInvitation(models.Model):
    """그룹 초대"""
    STATUS_CHOICES = [
        ('pending', '대기중'),
        ('accepted', '수락'),
        ('declined', '거절'),
        ('expired', '만료'),
    ]

    group = models.ForeignKey(
        ReadingGroup,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    invitee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_invitations'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    message = models.TextField(blank=True, help_text="초대 메시지")
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['group', 'invitee']
        ordering = ['-created_at']

    def __str__(self):
        return f"Invitation to {self.invitee.nickname} for {self.group.name}"


class UserPlanDisplaySettings(models.Model):
    """사용자별 플랜 표시 설정 (캘린더용)"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='plan_display_settings'
    )
    subscription = models.OneToOneField(
        PlanSubscription,
        on_delete=models.CASCADE,
        related_name='display_settings'
    )
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        help_text="플랜 표시 색상 (HEX)"
    )
    display_order = models.IntegerField(
        default=0,
        help_text="캘린더에서 표시 순서"
    )
    is_visible = models.BooleanField(
        default=True,
        help_text="캘린더에 표시 여부"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'created_at']
        indexes = [
            models.Index(fields=['user', 'is_visible']),
        ]
        verbose_name = "플랜 표시 설정"
        verbose_name_plural = "플랜 표시 설정"

    def __str__(self):
        return f"{self.user.nickname}'s display settings for {self.subscription.plan.name}"


class UserReadingPosition(models.Model):
    """사용자의 마지막 읽은 위치"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reading_position'
    )
    book = models.CharField(max_length=10, help_text="성경책 코드 (gen, exo...)")
    chapter = models.IntegerField(help_text="장 번호")
    verse = models.IntegerField(null=True, blank=True, help_text="절 번호 (선택)")
    scroll_position = models.FloatField(default=0, help_text="스크롤 위치 (0-1)")
    version = models.CharField(max_length=10, default='GAE', help_text="역본")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "읽기 위치"
        verbose_name_plural = "읽기 위치"

    def __str__(self):
        return f"{self.user.nickname} - {self.book} {self.chapter}"


class BibleBookmark(models.Model):
    """성경 북마크"""
    BOOKMARK_TYPE_CHOICES = [
        ('chapter', '장'),
        ('verse', '절'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bible_bookmarks'
    )
    bookmark_type = models.CharField(max_length=10, choices=BOOKMARK_TYPE_CHOICES)
    book = models.CharField(max_length=10, help_text="성경책 코드")
    chapter = models.IntegerField()
    start_verse = models.IntegerField(null=True, blank=True, help_text="시작 절")
    end_verse = models.IntegerField(null=True, blank=True, help_text="끝 절")
    title = models.CharField(max_length=100, blank=True, help_text="북마크 제목")
    color = models.CharField(max_length=7, default='#3B82F6', help_text="표시 색상")
    memo = models.TextField(blank=True, help_text="간단한 메모")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'book', 'chapter']),
            models.Index(fields=['user', 'bookmark_type']),
        ]
        verbose_name = "북마크"
        verbose_name_plural = "북마크"

    def __str__(self):
        if self.bookmark_type == 'verse':
            return f"{self.book} {self.chapter}:{self.start_verse}"
        return f"{self.book} {self.chapter}"


class ReflectionNote(models.Model):
    """성경 묵상노트"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reflection_notes'
    )
    book = models.CharField(max_length=10, help_text="성경책 코드")
    chapter = models.IntegerField()
    start_verse = models.IntegerField(null=True, blank=True)
    end_verse = models.IntegerField(null=True, blank=True)
    content = models.TextField(help_text="묵상 내용")
    is_private = models.BooleanField(default=True, help_text="비공개 여부")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'book', 'chapter']),
            models.Index(fields=['user', '-created_at']),
        ]
        verbose_name = "묵상노트"
        verbose_name_plural = "묵상노트"

    def __str__(self):
        return f"{self.user.nickname} - {self.book} {self.chapter}"


class PersonalReadingRecord(models.Model):
    """개인 성경 읽기 기록 (Plan 무관)"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='personal_reading_records'
    )
    book = models.CharField(max_length=10, help_text="성경책 코드")
    chapter = models.IntegerField()
    read_date = models.DateField(help_text="읽은 날짜")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'book', 'chapter']
        indexes = [
            models.Index(fields=['user', 'book']),
            models.Index(fields=['user', 'read_date']),
        ]
        verbose_name = "개인 읽기 기록"
        verbose_name_plural = "개인 읽기 기록"

    def __str__(self):
        return f"{self.user.nickname} - {self.book} {self.chapter}"
