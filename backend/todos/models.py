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
    book = models.CharField(max_length=50)  # 성경 책명
    last_chapter_read = models.IntegerField()  # 마지막으로 읽은 장
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['date']

    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.book} {self.last_chapter_read}장까지"

    @property
    def status(self):
        """해당 날짜의 진도 상태를 반환"""
        try:
            schedule = DailyBibleSchedule.objects.get(date=self.date)
            if self.last_chapter_read == 0:
                return "미시작"
            elif self.last_chapter_read < schedule.end_chapter:
                return "진행중"
            else:
                return "완료"
        except DailyBibleSchedule.DoesNotExist:
            return "일정 없음"
