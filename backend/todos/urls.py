from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'bible-plans', views.BibleReadingPlanViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    path('schedules/', views.schedule_list, name='schedule-list'),
    path('schedules/<int:pk>/', views.schedule_detail, name='schedule-detail'),
    path('schedules/month/', views.get_schedules_for_month, name='schedules-month'),
    path('schedules/today/', views.get_today_schedules, name='schedules-today'),
    path('schedules/upload-excel/', views.upload_schedules_excel, name='upload-schedules-excel'),
    
    path('reading/', views.update_bible_progress, name='update_bible_progress'),
    path('reading/update/', views.update_bible_progress, name='update_bible_progress'),
    path('reading/history/', views.get_reading_history, name='progress-history'),
    
    path('plans/user/', views.get_user_plans, name='user-plans'),
    
    path('plan/', views.plan_subscription_list, name='plan-subscription-list'),
    path('plan/<int:pk>/', views.plan_subscription_detail, name='plan-subscription-detail'),
    path('plan/<int:pk>/toggle-active/', views.plan_subscription_toggle_active, name='plan-subscription-toggle-active'),
    path('plan/<int:pk>/progress/', views.plan_subscription_progress, name='plan-subscription-progress'),
    path('plan/<int:pk>/unsubscribe/', views.plan_subscription_unsubscribe, name='plan-subscription-unsubscribe'),
    
    path('detail/', views.get_chapter_detail, name='chapter-detail'),
    path('next-position/', views.get_next_reading_position, name='next-reading-position'),
    
    # 영상 개론 관련 URL
    path('video/intro/', views.video_intro_list, name='video-intro-list'),
    path('video/intro/<int:pk>/', views.video_intro_detail, name='video-intro-detail'),
    path('video/intro/upload/', views.upload_video_intros, name='upload-video-intros'),
    path('user/video/intro/', views.get_user_video_intros, name='user-video-intros'),
    
    # 하세나 관련 URL
    path('hasena/', views.hasena_record_list, name='hasena-record-list'),
    path('hasena/<int:pk>/', views.hasena_record_detail, name='hasena-record-detail'),
    path('hasena/update/', views.hasena_record_update, name='hasena-record-update'),
    path('hasena/status/', views.get_user_hasena_status, name='hasena-user-status'),
    
    # 영상 개론 진행 상황 관련 URL
    path('video/intro/progress/', views.update_video_intro_progress, name='update-video-intro-progress'),
    
    # 통계 관련 URL
    path('stats/users/', views.get_total_users, name='total-users'),
    path('stats/plan/', views.get_plan_stats, name='plan-stats'),
    path('stats/progress/', views.get_progress_stats, name='progress-stats'),
    path('stats/visitors/', views.get_visitor_stats, name='visitor-stats'),
    path('stats/visitors/increment/', views.increment_visitor_count, name='increment-visitor-count'),
] 