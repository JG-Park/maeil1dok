from django.urls import path
from . import views

urlpatterns = [
    path('bible-schedules/', views.bible_schedule_list, name='bible_schedule_list'),
    path('bible-schedules/<int:pk>/', views.bible_schedule_detail, name='bible_schedule_detail'),
    path('bible-schedules/upload/', views.upload_schedule, name='upload_schedule'),
    path('today-reading/', views.get_today_reading, name='today-reading'),
    path('reading-schedule/', views.get_reading_schedule, name='reading-schedule'),
    path('bible-schedules/upcoming/', views.get_bible_schedules, name='get-bible-schedules'),
] 