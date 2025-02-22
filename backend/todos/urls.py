from django.urls import path
from . import views

urlpatterns = [
    path('bible-schedules/', views.bible_schedule_list, name='bible_schedule_list'),
    path('bible-schedules/<int:pk>/', views.bible_schedule_detail, name='bible_schedule_detail'),
    path('bible-schedules/upload/', views.upload_schedule, name='upload_schedule'),
    path('today-reading/', views.get_today_reading, name='today-reading'),
    path('reading-schedule/', views.get_reading_schedule, name='reading-schedule'),
    path('bible-schedules/upcoming/', views.get_bible_schedules, name='get-bible-schedules'),
    path('bible-progress/', views.update_bible_progress, name='update_bible_progress'),
    path('bible-progress/complete/', views.complete_bible_reading, name='complete_bible_reading'),
    path('bible-progress/cancel/', views.cancel_bible_reading, name='cancel_bible_reading'),
    path('bible-progress/status/', views.get_bible_progress, name='get_bible_progress'),
    path('bible-progress/bulk-update/', views.bulk_update_bible_progress, name='bulk_update_bible_progress'),
    path('reading-history/', views.get_reading_history, name='reading-history'),
    path('completed-sections/', views.get_completed_sections_count, name='completed-sections'),
] 