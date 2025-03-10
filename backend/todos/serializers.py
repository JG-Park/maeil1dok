from rest_framework import serializers
from .models import DailyBibleSchedule, UserBibleProgress, BibleReadingPlan, PlanSubscription, VideoBibleIntro
from django.contrib.auth import get_user_model
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

class DailyBibleScheduleSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = DailyBibleSchedule
        fields = '__all__'
        
    def validate_audio_link(self, value):
        # None 값 처리
        if value is None:
            return ''
        
        # float 타입이면 문자열로 변환
        if isinstance(value, float):
            # NaN 체크
            import math
            if math.isnan(value):
                return ''
            # 소수점 없는 정수형 숫자로 보이면 정수로 변환
            if value.is_integer():
                value = str(int(value))
            else:
                value = str(value)
        
        # 문자열 타입이 아니면 문자열로 변환
        if not isinstance(value, str):
            value = str(value)
        
        # 빈 문자열은 그대로 통과
        value = value.strip()
        if value == '':
            return ''
        
        # URL 형식 검증
        try:
            URLValidator()(value)
        except ValidationError:
            # URL 형식이 아니면서 http:// 또는 https://로 시작하지 않으면 https:// 추가
            if not value.startswith(('http://', 'https://')):
                value = 'https://' + value
                # 다시 유효성 검사
                try:
                    URLValidator()(value)
                except ValidationError:
                    raise serializers.ValidationError("유효한 URL을 입력하세요.")
        return value
        
    def validate_guide_link(self, value):
        # audio_link와 동일한 로직 적용
        # None 값 처리
        if value is None:
            return ''
        
        # float 타입이면 문자열로 변환
        if isinstance(value, float):
            # NaN 체크
            import math
            if math.isnan(value):
                return ''
            # 소수점 없는 정수형 숫자로 보이면 정수로 변환
            if value.is_integer():
                value = str(int(value))
            else:
                value = str(value)
        
        # 문자열 타입이 아니면 문자열로 변환
        if not isinstance(value, str):
            value = str(value)
        
        # 빈 문자열은 그대로 통과
        value = value.strip()
        if value == '':
            return ''
        
        # URL 형식 검증
        try:
            URLValidator()(value)
        except ValidationError:
            if not value.startswith(('http://', 'https://')):
                value = 'https://' + value
                try:
                    URLValidator()(value)
                except ValidationError:
                    raise serializers.ValidationError("유효한 URL을 입력하세요.")
        return value

class UserBibleProgressSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='subscription.plan.name', read_only=True)
    date = serializers.SerializerMethodField()
    
    class Meta:
        model = UserBibleProgress
        fields = ['id', 'subscription', 'plan_name', 'is_completed', 'completed_at', 'date', 'schedule']
        
    def get_date(self, obj):
        # schedule을 통해 날짜 정보 가져오기
        return obj.schedule.date if obj.schedule else None

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

class BibleReadingPlanSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()
    subscriber_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BibleReadingPlan
        fields = [
            'id', 'name', 'description', 'is_default', 'is_active',
            'created_by', 'created_by_username', 'subscriber_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_by_username', 'subscriber_count']
    
    def get_created_by_username(self, obj):
        if obj.created_by:
            return obj.created_by.username
        return None
    
    def get_subscriber_count(self, obj):
        return obj.plansubscription_set.filter(is_active=True).count()

class PlanSubscriptionSerializer(serializers.ModelSerializer):
    plan_id = serializers.IntegerField(source='plan.id')
    plan_name = serializers.CharField(source='plan.name')
    is_default = serializers.BooleanField(source='plan.is_default')
    
    class Meta:
        model = PlanSubscription
        fields = [
            'id', 'plan_id', 'plan_name', 
            'is_active', 'is_default', 'start_date'
        ]

class VideoBibleIntroSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = VideoBibleIntro
        fields = ['id', 'plan', 'plan_name', 'book', 'url_link', 'start_date', 'end_date']
        read_only_fields = ['id'] 