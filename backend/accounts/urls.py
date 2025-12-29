from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, profile_views, cookie_views
from .views import CustomTokenObtainPairView
from .cookie_views import CookieTokenObtainPairView, CookieTokenRefreshView

urlpatterns = [
    # HttpOnly Cookie 기반 인증 엔드포인트 (권장)
    path('token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', cookie_views.cookie_logout, name='logout'),
    path('csrf/', cookie_views.get_csrf_token, name='csrf_token'),
    path('verify/', cookie_views.verify_auth, name='verify_auth'),

    # 기존 인증 관련 엔드포인트 (하위 호환)
    path('register/', views.register, name='register'),
    path('login/', CookieTokenObtainPairView.as_view(), name='login'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh_legacy'),
    path('user/', views.get_user, name='get_user'),
    path('social-login/', views.social_login, name='social_login'),
    path('check-username/', views.check_username, name='check_username'),
    path('check-nickname/', views.check_nickname, name='check_nickname'),
    path('complete-kakao-signup/', views.complete_kakao_signup, name='complete_kakao_signup'),
    
    # 프로필 관련 엔드포인트
    path('profile/<int:user_id>/', profile_views.get_user_profile, name='get_user_profile'),
    path('profile/', profile_views.update_user_profile, name='update_user_profile'),
    path('profile/<int:user_id>/calendar/', profile_views.get_user_calendar, name='get_user_calendar'),
    path('profile/<int:user_id>/achievements/', profile_views.get_user_achievements, name='get_user_achievements'),
    
    # 팔로우 관련 엔드포인트
    path('follow/', profile_views.follow_user, name='follow_user'),
    path('unfollow/<int:user_id>/', profile_views.unfollow_user, name='unfollow_user'),
    path('followers/<int:user_id>/', profile_views.get_followers, name='get_followers'),
    path('following/<int:user_id>/', profile_views.get_following, name='get_following'),
    path('friends/', profile_views.get_friends, name='get_friends'),
    
    # 사용자 검색
    path('search/', profile_views.search_users, name='search_users'),
]