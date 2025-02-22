from django.db import models
from django.utils import timezone
from django.conf import settings

class DailyRoutine(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    bible_reading_completed = models.BooleanField(default=False)
    hasena_video_completed = models.BooleanField(default=False)
    hasena_holiday = models.BooleanField(default=False)  # 하세나하시조 휴일 여부

    class Meta:
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user.username}'s routine on {self.date}"

class DailyBibleSchedule(models.Model):
    """매일의 성경 읽기 스케줄"""
    date = models.DateField()
    book = models.CharField(max_length=50)  # 성경 책명
    start_chapter = models.IntegerField()  # 시작 장
    end_chapter = models.IntegerField()  # 끝 장
    audio_link = models.URLField(blank=True, null=True)  # 오디오 링크
    guide_link = models.URLField(blank=True, null=True)  # 가이드 링크 추가
    
    class Meta:
        ordering = ['date']
        unique_together = ['date', 'book']

    def __str__(self):
        return f"{self.date}: {self.book} {self.start_chapter}-{self.end_chapter}장"

class UserBibleProgress(models.Model):
    """사용자별 성경 읽기 진도"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    book = models.CharField(max_length=50)
    last_chapter_read = models.IntegerField()
    is_completed = models.BooleanField(default=False)  # 완료 여부 명시적 표시
    completed_at = models.DateTimeField(null=True, blank=True)  # 완료 시점
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['date']

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
            schedule = DailyBibleSchedule.objects.get(date=self.date)
            if self.last_chapter_read == 0:
                return "not_started"
            elif self.is_completed:
                return "completed"
            elif self.last_chapter_read < schedule.end_chapter:
                return "in_progress"
            return "completed"
        except DailyBibleSchedule.DoesNotExist:
            return "no_schedule"
