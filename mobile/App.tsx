import { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import * as Font from 'expo-font';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const WEB_APP_URL = Constants.expoConfig?.extra?.webAppUrl || 'https://maeil1dok.app';
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.maeil1dok.app';
const APP_SCHEME = 'maeil1dok';

const KAKAO_CLIENT_ID = Constants.expoConfig?.extra?.kakaoClientId || '';
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

const OAUTH_DOMAINS = [
  'kauth.kakao.com',
  'accounts.kakao.com',
  'accounts.google.com',
  'oauth.google.com',
];

function AppContent() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isError, setIsError] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  const [showLogin, setShowLogin] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
        'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
        'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
        'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
      });
      setFontsLoaded(true);
      SplashScreen.hideAsync();
    };
    loadFonts();
  }, []);

  const showNativeLogin = () => {
    setEmail('');
    setPassword('');
    setShowLogin(true);
  };

  const hideNativeLogin = () => {
    setShowLogin(false);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '/';
        }
      `);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/email-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.access) {
        setShowLogin(false);
        setWebViewKey((prev) => prev + 1);
      } else {
        Alert.alert('로그인 실패', data.error || '이메일 또는 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const webRedirectUri = `${WEB_APP_URL}/auth/kakao/callback`;
      const state = encodeURIComponent(JSON.stringify({ from: 'app', scheme: APP_SCHEME }));
      const appRedirectUri = `${APP_SCHEME}://auth/kakao/callback`;
      
      const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(webRedirectUri)}&response_type=code&state=${state}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          await handleSocialLoginCode('kakao', code, webRedirectUri);
        }
      }
    } catch (error) {
      console.error('Kakao login error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const webRedirectUri = `${WEB_APP_URL}/auth/google/callback`;
      const state = encodeURIComponent(JSON.stringify({ from: 'app', scheme: APP_SCHEME }));
      const appRedirectUri = `${APP_SCHEME}://auth/google/callback`;
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(webRedirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent&state=${state}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          await handleSocialLoginCode('google', code, webRedirectUri);
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleSocialLoginCode = async (provider: string, code: string, redirectUri: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/social-login/v2/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, code, redirect_uri: redirectUri }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.access) {
        setShowLogin(false);
        setWebViewKey((prev) => prev + 1);
      } else if (data.needsSignup) {
        const signupUrl = `${WEB_APP_URL}/auth/${provider}/setup?provider=${provider}&provider_id=${data.provider_id}&email=${data.email || ''}&suggested_nickname=${encodeURIComponent(data.suggested_nickname || '')}&profile_image=${encodeURIComponent(data.profile_image || '')}`;
        setPendingUrl(signupUrl);
        setShowLogin(false);
      } else {
        Alert.alert('로그인 실패', data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = () => {
    setPendingUrl(`${WEB_APP_URL}/register-email`);
    setShowLogin(false);
  };

  const handleForgotPassword = () => {
    setPendingUrl(`${WEB_APP_URL}/auth/forgot-password`);
    setShowLogin(false);
  };

  const handleDeepLink = useCallback((event: { url: string }) => {
    const { url } = event;
    if (url.startsWith(`${APP_SCHEME}://`)) {
      const path = url.replace(`${APP_SCHEME}://`, '');
      if (path.startsWith('auth/')) return;
      const webUrl = `${WEB_APP_URL}/${path}`;
      webViewRef.current?.injectJavaScript(`window.location.href = '${webUrl}';`);
    }
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [handleDeepLink]);

  useEffect(() => {
    registerForPushNotifications();
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url as string | undefined;
        if (url) handleDeepLink({ url });
      }
    );
    return () => notificationSubscription.remove();
  }, [handleDeepLink]);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      setPushToken(token.data);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (showLogin) {
          hideNativeLogin();
          return true;
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

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    if (navState.url.includes('/login') && navState.url.startsWith(WEB_APP_URL)) {
      showNativeLogin();
    }
  };

  const handleShouldStartLoadWithRequest = (request: { url: string }) => {
    const { url } = request;
    if (url.includes('/login') && url.startsWith(WEB_APP_URL)) {
      showNativeLogin();
      return false;
    }
    const isOAuthDomain = OAUTH_DOMAINS.some((domain) => url.includes(domain));
    if (isOAuthDomain) return true;
    if (!url.startsWith(WEB_APP_URL) && !url.startsWith('about:')) return false;
    return true;
  };

  const injectPushToken = () => {
    if (pushToken && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          window.nativePushToken = '${pushToken}';
          window.dispatchEvent(new CustomEvent('nativePushToken', { detail: '${pushToken}' }));
        })();
      `);
    }
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    setIsError(false);
    SplashScreen.hideAsync();
    injectPushToken();
    if (pendingUrl) {
      webViewRef.current?.injectJavaScript(`window.location.href = '${pendingUrl}';`);
      setPendingUrl(null);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setIsError(true);
    SplashScreen.hideAsync();
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      switch (message.type) {
        case 'auth:logout':
        case 'auth:expired':
        case 'logout':
          showNativeLogin();
          break;
        case 'navigate':
          if (message.url) {
            WebBrowser.openBrowserAsync(message.url, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
            });
          }
          break;
        case 'requestPushToken':
          injectPushToken();
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  };

  const handleRetry = () => {
    setIsError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#faf8f6" />
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4B9F7E" />
        </View>
      </SafeAreaView>
    );
  }

  if (showLogin) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#faf8f6" />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.loginBox}>
              <TouchableOpacity style={styles.backButton} onPress={hideNativeLogin}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <Image 
                  source={require('./assets/logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity 
                  style={styles.kakaoButton} 
                  onPress={handleKakaoLogin}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  <Image 
                    source={require('./assets/kakao-icon.png')} 
                    style={styles.kakaoIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.googleButton} 
                  onPress={handleGoogleLogin}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  <Image 
                    source={require('./assets/google-icon.png')} 
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleButtonText}>구글로 시작하기</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>또는 이메일로 계속</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, styles.inputTop]}
                  placeholder="이메일"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                <TextInput
                  style={[styles.input, styles.inputBottom]}
                  placeholder="비밀번호"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isSubmitting}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                onPress={handleEmailLogin}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? '로그인 중...' : '로그인'}
                </Text>
              </TouchableOpacity>

              <View style={styles.authLinks}>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotLink}>비밀번호를 잊으셨나요?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRegister}>
                  <Text style={styles.registerLink}>이메일로 회원가입</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
        key={webViewKey}
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
            window.isReactNativeWebView = true;
            window.isAndroidApp = ${Platform.OS === 'android'};
            window.nativeInsets = { top: ${insets.top}, bottom: ${insets.bottom}, left: ${insets.left}, right: ${insets.right} };
            window.requestNativePushToken = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestPushToken' }));
            };
            document.documentElement.style.setProperty('--native-top-inset', '${insets.top}px');
            document.documentElement.style.setProperty('--native-bottom-inset', '${insets.bottom}px');
            document.body.classList.add('native-app');
            if (${Platform.OS === 'android'}) {
              document.body.classList.add('android-native-app');
            }
          })();
          true;
        `}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4B9F7E" />
          </View>
        )}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4B9F7E" />
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
  loginContainer: {
    flex: 1,
    backgroundColor: '#faf8f6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loginBox: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    gap: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#64748b',
    fontFamily: 'Pretendard-Regular',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    height: 32,
    width: 120,
  },
  socialButtons: {
    gap: 12,
  },
  kakaoIcon: {
    width: 18,
    height: 18,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  kakaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    gap: 8,
  },
  kakaoButtonText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: '#000000',
    letterSpacing: -0.8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 8,
  },
  googleButtonText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: '#1f2937',
    letterSpacing: -0.8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  dividerText: {
    fontFamily: 'Pretendard-Regular',
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#64748b',
    letterSpacing: -0.7,
  },
  inputGroup: {
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    fontFamily: 'Pretendard-Regular',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    letterSpacing: -0.8,
  },
  inputTop: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 0,
  },
  inputBottom: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  submitButton: {
    backgroundColor: '#4B9F7E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'Pretendard-Medium',
    color: '#fff',
    fontSize: 14,
    letterSpacing: -0.8,
  },
  authLinks: {
    alignItems: 'center',
    gap: 8,
  },
  forgotLink: {
    fontFamily: 'Pretendard-Regular',
    color: '#64748b',
    fontSize: 14,
    letterSpacing: -0.7,
  },
  registerLink: {
    fontFamily: 'Pretendard-Medium',
    color: '#4B9F7E',
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    letterSpacing: -0.7,
  },
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
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 20,
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4B9F7E',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#fff',
    fontSize: 16,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
