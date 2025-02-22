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

class BibleProgressResponse(serializers.Serializer):
    status = serializers.CharField()  # completed, not_started
    section = serializers.SerializerMethodField()
    
    def get_section(self, obj):
        if not obj.get('section'):
            return None
            
        return {
            'date': obj['section'].date,
            'book': obj['section'].book,
            'start_chapter': obj['section'].start_chapter,
            'end_chapter': obj['section'].end_chapter,
            'is_completed': obj.get('is_completed', False)
        } 