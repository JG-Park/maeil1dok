from rest_framework import serializers
from .models import DailyBibleSchedule, UserBibleProgress

class DailyBibleScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyBibleSchedule
        fields = ['id', 'date', 'book', 'start_chapter', 'end_chapter', 'audio_link', 'guide_link']

class UserBibleProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBibleProgress
        fields = ['date', 'book', 'last_chapter_read', 'status']
        read_only_fields = ['status'] 