from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('user/', views.get_user, name='get_user'),
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('social-login/', views.social_login, name='social_login'),
    path('check-username/', views.check_username, name='check_username'),
    path('check-nickname/', views.check_nickname, name='check_nickname'),
    path('kakao/complete-signup/', views.complete_kakao_signup, name='complete_kakao_signup'),
] 