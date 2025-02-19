from rest_framework import serializers
from .models import DailyBibleSchedule

class DailyBibleScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyBibleSchedule
        fields = ['id', 'date', 'book', 'start_chapter', 'end_chapter', 'audio_link'] 