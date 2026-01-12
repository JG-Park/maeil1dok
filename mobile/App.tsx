import { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Splash screen 유지
SplashScreen.preventAutoHideAsync();

// WebBrowser warmup (성능 최적화)
WebBrowser.maybeCompleteAuthSession();

// Notification 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 상수
const WEB_APP_URL = Constants.expoConfig?.extra?.webAppUrl || 'https://maeil1dok.app';
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.maeil1dok.app';
const APP_SCHEME = 'maeil1dok';

// OAuth 설정
const KAKAO_CLIENT_ID = Constants.expoConfig?.extra?.kakaoClientId || '';
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';
const GOOGLE_CLIENT_SECRET = Constants.expoConfig?.extra?.googleClientSecret || '';

// OAuth 프로바이더 도메인
const OAUTH_DOMAINS = [
  'kauth.kakao.com',
  'accounts.kakao.com',
  'accounts.google.com',
  'oauth.google.com',
];

// Auth 상태 타입
interface AuthState {
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
}

const STORAGE_KEY = '@maeil1dok_auth';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isError, setIsError] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  // 인증 상태
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    accessToken: null,
    refreshToken: null,
    user: null,
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // 저장된 인증 상태 로드
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.accessToken) {
            setAuthState(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    loadAuthState();
  }, []);

  // 인증 상태 저장
  const saveAuthState = async (state: AuthState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setAuthState(state);
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setAuthState({
        isLoggedIn: false,
        accessToken: null,
        refreshToken: null,
        user: null,
      });
      setShowLogin(true);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // 카카오 로그인 (웹 redirect_uri 사용 - 카카오도 커스텀 스킴 미지원)
  const handleKakaoLogin = async () => {
    try {
      // 웹 redirect_uri 사용 (카카오 OAuth 제약)
      const webRedirectUri = `${WEB_APP_URL}/auth/kakao/callback`;
      // 앱에서 왔음을 표시하는 state 파라미터
      const state = encodeURIComponent(JSON.stringify({ from: 'app', scheme: APP_SCHEME }));
      
      const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(webRedirectUri)}&response_type=code&state=${state}`;
      
      // WebBrowser로 열고, 앱으로 돌아오는 딥링크 대기
      const appRedirectUri = `${APP_SCHEME}://auth/kakao/callback`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        // 웹에서 딥링크로 전달된 토큰 처리
        const access = url.searchParams.get('access');
        const refresh = url.searchParams.get('refresh');
        const userJson = url.searchParams.get('user');
        const needsSignup = url.searchParams.get('needsSignup');
        
        if (access && refresh && userJson) {
          // 로그인 성공
          const user = JSON.parse(decodeURIComponent(userJson));
          await saveAuthState({
            isLoggedIn: true,
            accessToken: access,
            refreshToken: refresh,
            user: user,
          });
          setShowLogin(false);
        } else if (needsSignup === 'true') {
          // 회원가입 필요 - WebView로 이동
          const provider = url.searchParams.get('provider');
          const providerId = url.searchParams.get('provider_id');
          const email = url.searchParams.get('email') || '';
          const nickname = url.searchParams.get('suggested_nickname') || '';
          const profileImage = url.searchParams.get('profile_image') || '';
          
          const signupUrl = `${WEB_APP_URL}/auth/kakao/setup?provider=${provider}&provider_id=${providerId}&email=${email}&suggested_nickname=${encodeURIComponent(nickname)}&profile_image=${encodeURIComponent(profileImage)}`;
          setShowLogin(false);
          webViewRef.current?.injectJavaScript(`window.location.href = '${signupUrl}';`);
        }
      }
    } catch (error) {
      console.error('Kakao login error:', error);
    }
  };

  // 구글 로그인 (웹 redirect_uri 사용 - Google은 커스텀 스킴 미지원)
  const handleGoogleLogin = async () => {
    try {
      // 웹 redirect_uri 사용 (Google OAuth 제약)
      const webRedirectUri = `${WEB_APP_URL}/auth/google/callback`;
      // 앱에서 왔음을 표시하는 state 파라미터
      const state = encodeURIComponent(JSON.stringify({ from: 'app', scheme: APP_SCHEME }));
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(webRedirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent&state=${state}`;
      
      // WebBrowser로 열고, 앱으로 돌아오는 딥링크 대기
      const appRedirectUri = `${APP_SCHEME}://auth/google/callback`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        // 웹에서 딥링크로 전달된 토큰 처리
        const access = url.searchParams.get('access');
        const refresh = url.searchParams.get('refresh');
        const userJson = url.searchParams.get('user');
        const needsSignup = url.searchParams.get('needsSignup');
        
        if (access && refresh && userJson) {
          // 로그인 성공
          const user = JSON.parse(decodeURIComponent(userJson));
          await saveAuthState({
            isLoggedIn: true,
            accessToken: access,
            refreshToken: refresh,
            user: user,
          });
          setShowLogin(false);
        } else if (needsSignup === 'true') {
          // 회원가입 필요 - WebView로 이동
          const provider = url.searchParams.get('provider');
          const providerId = url.searchParams.get('provider_id');
          const email = url.searchParams.get('email') || '';
          const nickname = url.searchParams.get('suggested_nickname') || '';
          const profileImage = url.searchParams.get('profile_image') || '';
          
          const signupUrl = `${WEB_APP_URL}/auth/google/setup?provider=${provider}&provider_id=${providerId}&email=${email}&suggested_nickname=${encodeURIComponent(nickname)}&profile_image=${encodeURIComponent(profileImage)}`;
          setShowLogin(false);
          webViewRef.current?.injectJavaScript(`window.location.href = '${signupUrl}';`);
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  // 소셜 로그인 코드 처리
  const handleSocialLoginCode = async (provider: string, code: string, redirectUri: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/social-login/v2/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, code, redirect_uri: redirectUri }),
      });

      const data = await response.json();

      if (data.access) {
        // 로그인 성공
        await saveAuthState({
          isLoggedIn: true,
          accessToken: data.access,
          refreshToken: data.refresh,
          user: data.user,
        });
        setShowLogin(false);
      } else if (data.needsSignup) {
        // 회원가입 필요 - WebView로 이동
        const signupUrl = `${WEB_APP_URL}/auth/${provider}/setup?provider=${provider}&provider_id=${data.provider_id}&email=${data.email || ''}&suggested_nickname=${encodeURIComponent(data.suggested_nickname || '')}&profile_image=${encodeURIComponent(data.profile_image || '')}`;
        setShowLogin(false);
        webViewRef.current?.injectJavaScript(`window.location.href = '${signupUrl}';`);
      } else {
        console.error('Login failed:', data);
      }
    } catch (error) {
      console.error('Social login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 딥링크 처리
  const handleDeepLink = useCallback((event: { url: string }) => {
    const { url } = event;
    console.log('Deep link received:', url);

    // maeil1dok:// 스킴에서 path 추출
    if (url.startsWith(`${APP_SCHEME}://`)) {
      const path = url.replace(`${APP_SCHEME}://`, '');
      
      // OAuth 콜백은 무시 (WebBrowser가 처리)
      if (path.startsWith('auth/')) {
        return;
      }
      
      const webUrl = `${WEB_APP_URL}/${path}`;
      webViewRef.current?.injectJavaScript(`window.location.href = '${webUrl}';`);
    }
  }, []);

  // 초기 URL 및 딥링크 리스너 설정
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // 푸시 알림 설정
  useEffect(() => {
    registerForPushNotifications();

    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url as string | undefined;
        if (url) {
          handleDeepLink({ url });
        }
      }
    );

    return () => {
      notificationSubscription.remove();
    };
  }, [handleDeepLink]);

  // 푸시 알림 등록
  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      setPushToken(token.data);
      console.log('Push token:', token.data);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  // Android 뒤로가기 버튼 처리
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (showLogin) {
          return true; // 로그인 화면에서는 뒤로가기 막기
        }
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, [canGoBack, showLogin]);

  // 네비게이션 상태 변경 핸들러
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  // URL 요청 처리 (OAuth 리다이렉트 등)
  const handleShouldStartLoadWithRequest = (request: { url: string }) => {
    const { url } = request;

    // OAuth 도메인은 WebView에서 열기
    const isOAuthDomain = OAUTH_DOMAINS.some((domain) => url.includes(domain));
    if (isOAuthDomain) {
      return true;
    }

    // 외부 링크는 기본 브라우저에서 열기
    if (!url.startsWith(WEB_APP_URL) && !url.startsWith('about:')) {
      Linking.openURL(url);
      return false;
    }

    return true;
  };

  // WebView에 토큰 주입
  const injectAuthToken = () => {
    if (authState.accessToken && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          if (window.ReactNativeWebView) {
            // localStorage에 토큰 저장
            const authData = {
              token: '${authState.accessToken}',
              refreshToken: '${authState.refreshToken}',
              user: ${JSON.stringify(authState.user)}
            };
            localStorage.setItem('auth', JSON.stringify(authData));
            
            // 커스텀 이벤트 발생
            window.dispatchEvent(new CustomEvent('nativeAuthToken', { 
              detail: authData 
            }));
          }
        })();
      `);
    }
  };

  // WebView에 푸시 토큰 전달
  const injectPushToken = () => {
    if (pushToken && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          if (window.ReactNativeWebView) {
            window.nativePushToken = '${pushToken}';
            window.dispatchEvent(new CustomEvent('nativePushToken', { detail: '${pushToken}' }));
          }
        })();
      `);
    }
  };

  // 로딩 완료 핸들러
  const handleLoadEnd = () => {
    setIsLoading(false);
    setIsError(false);
    SplashScreen.hideAsync();
    injectPushToken();
    injectAuthToken();
  };

  // 에러 핸들러
  const handleError = () => {
    setIsLoading(false);
    setIsError(true);
    SplashScreen.hideAsync();
  };

  // WebView에서 메시지 수신
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', message);

      switch (message.type) {
        case 'requestPushToken':
          injectPushToken();
          break;
        case 'requestAuthToken':
          injectAuthToken();
          break;
        case 'navigate':
          if (message.url) {
            Linking.openURL(message.url);
          }
          break;
        case 'logout':
          handleLogout();
          break;
        case 'authStateChanged':
          // WebView에서 인증 상태 변경 알림
          if (message.data) {
            saveAuthState({
              isLoggedIn: !!message.data.token,
              accessToken: message.data.token,
              refreshToken: message.data.refreshToken,
              user: message.data.user,
            });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to parse message from WebView:', error);
    }
  };

  // 재시도 핸들러
  const handleRetry = () => {
    setIsError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  // 게스트 모드로 진입
  const handleGuestMode = () => {
    setShowLogin(false);
  };

  // 로딩 중
  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#faf8f6" />
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90A4" />
        </View>
      </SafeAreaView>
    );
  }

  // 로그인 화면
  if (showLogin || (!authState.isLoggedIn && !isAuthLoading)) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#faf8f6" />
        <View style={styles.loginContent}>
          {/* 로고 */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>매일일독</Text>
            <Text style={styles.logoSubtext}>매일 성경을 읽는 습관</Text>
          </View>

          {/* 로그인 버튼들 */}
          <View style={styles.loginButtons}>
            {/* 카카오 로그인 */}
            <TouchableOpacity 
              style={styles.kakaoButton} 
              onPress={handleKakaoLogin}
              activeOpacity={0.8}
            >
              <View style={styles.kakaoIcon}>
                <Text style={styles.kakaoIconText}>K</Text>
              </View>
              <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
            </TouchableOpacity>

            {/* 구글 로그인 */}
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>구글로 시작하기</Text>
            </TouchableOpacity>

            {/* 구분선 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 게스트 모드 */}
            <TouchableOpacity 
              style={styles.guestButton} 
              onPress={handleGuestMode}
              activeOpacity={0.8}
            >
              <Text style={styles.guestButtonText}>둘러보기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 화면
  if (isError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#faf8f6" />
        <View style={styles.errorContent}>
          <Text style={styles.errorEmoji}>📖</Text>
          <Text style={styles.errorTitle}>연결할 수 없습니다</Text>
          <Text style={styles.errorMessage}>
            인터넷 연결을 확인하고{'\n'}다시 시도해주세요
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf8f6" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webView}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        injectedJavaScript={`
          (function() {
            // React Native WebView 감지 플래그
            window.isReactNativeWebView = true;
            
            // 푸시 토큰 요청 함수
            window.requestNativePushToken = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestPushToken' }));
            };
            
            // 인증 토큰 요청 함수
            window.requestNativeAuthToken = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestAuthToken' }));
            };
            
            // 외부 링크 열기 함수
            window.openExternalLink = function(url) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'navigate', url: url }));
            };
            
            // 로그아웃 함수
            window.nativeLogout = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'logout' }));
            };
            
            // 인증 상태 변경 알림 함수
            window.notifyAuthStateChanged = function(data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'authStateChanged', data: data }));
            };
          })();
          true;
        `}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90A4" />
          </View>
        )}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90A4" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f6',
  },
  webView: {
    flex: 1,
    backgroundColor: '#faf8f6',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf8f6',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf8f6',
  },
  // 로그인 화면 스타일
  loginContainer: {
    flex: 1,
    backgroundColor: '#faf8f6',
  },
  loginContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 16,
    color: '#666',
  },
  loginButtons: {
    width: '100%',
    maxWidth: 320,
  },
  kakaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  kakaoIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#3C1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoIconText: {
    color: '#FEE500',
    fontSize: 14,
    fontWeight: '700',
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#999',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  guestButtonText: {
    fontSize: 16,
    color: '#4A90A4',
    fontWeight: '500',
  },
  // 에러 화면 스타일
  errorContainer: {
    flex: 1,
    backgroundColor: '#faf8f6',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4A90A4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
