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
            visitor_count.daily_count = models.F('daily_count') + 1
            visitor_count.save()
        return visitor_count

    @classmethod
    def get_total_visitors(cls):
        """전체 누적 방문자 수 조회"""
        return cls.objects.aggregate(total=models.Sum('daily_count'))['total'] or 0
