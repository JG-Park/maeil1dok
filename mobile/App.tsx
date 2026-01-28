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
import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import CookieManager from '@react-native-cookies/cookies';

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

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

const OAUTH_DOMAINS = [
  'kauth.kakao.com',
  'accounts.kakao.com',
  'accounts.google.com',
  'oauth.google.com',
  'appleid.apple.com',
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

  const initiateSessionBridge = async (accessToken: string, refreshToken: string): Promise<boolean> => {
    console.log('[SessionBridge] Starting with accessToken:', accessToken?.substring(0, 20) + '...');
    console.log('[SessionBridge] refreshToken:', refreshToken?.substring(0, 20) + '...');
    
    try {
      console.log('[SessionBridge] Saving to SecureStore...');
      await SecureStore.setItemAsync('maeil1dok_access_token', accessToken);
      await SecureStore.setItemAsync('maeil1dok_refresh_token', refreshToken);
      console.log('[SessionBridge] SecureStore save success');

      console.log('[SessionBridge] Calling session/issue...');
      const issueResponse = await fetch(`${API_URL}/api/v1/auth/session/issue/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });

      console.log('[SessionBridge] session/issue response status:', issueResponse.status);
      
      if (!issueResponse.ok) {
        const errorText = await issueResponse.text();
        console.log('[SessionBridge] session/issue error:', errorText);
        return false;
      }

      const issueData = await issueResponse.json();
      console.log('[SessionBridge] session/issue data:', JSON.stringify(issueData));
      const code = issueData.code;

      if (code) {
        const consumeUrl = `${API_URL}/api/v1/auth/session/consume/?code=${code}&next=${encodeURIComponent(WEB_APP_URL + '/')}`;
        console.log('[SessionBridge] Setting pendingUrl:', consumeUrl);
        setPendingUrl(consumeUrl);
        return true;
      }
      console.log('[SessionBridge] No code in response');
      return false;
    } catch (error) {
      console.error('[SessionBridge] Error:', error);
      return false;
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
        const bridgeSuccess = await initiateSessionBridge(data.access, data.refresh);
        setShowLogin(false);
        if (!bridgeSuccess) {
          setWebViewKey((prev) => prev + 1);
        }
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
      const kakaoToken = await kakaoLogin();
      
      if (kakaoToken.accessToken) {
        setIsSubmitting(true);
        const response = await fetch(`${API_URL}/api/v1/auth/social-login/v2/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            provider: 'kakao', 
            access_token: kakaoToken.accessToken,
            auto_signup: true
          }),
          credentials: 'include',
        });

        const data = await response.json();

        if (data.access) {
          const bridgeSuccess = await initiateSessionBridge(data.access, data.refresh);
          setShowLogin(false);
          if (!bridgeSuccess) {
            setWebViewKey((prev) => prev + 1);
          }
        } else if (data.needsSignup) {
          const signupUrl = `${WEB_APP_URL}/auth/kakao/setup?provider=kakao&provider_id=${data.provider_id}&email=${data.email || ''}&suggested_nickname=${encodeURIComponent(data.suggested_nickname || '')}&profile_image=${encodeURIComponent(data.profile_image || '')}`;
          setPendingUrl(signupUrl);
          setShowLogin(false);
        } else {
          Alert.alert('로그인 실패', data.error || '로그인에 실패했습니다.');
        }
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setIsSubmitting(false);
      if (error.code !== 'E_CANCELLED_OPERATION') {
        console.error('Kakao login error:', error);
        Alert.alert('오류', '카카오 로그인 중 오류가 발생했습니다.');
      }
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

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      if (credential.identityToken) {
        await handleAppleLoginWithToken(credential.identityToken, credential.fullName);
      }
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('오류', 'Apple 로그인 중 오류가 발생했습니다.');
      }
    }
  };

  const handleAppleLoginWithToken = async (
    identityToken: string, 
    fullName: AppleAuthentication.AppleAuthenticationFullName | null
  ) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/social-login/v2/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: 'apple', 
          id_token: identityToken,
          full_name: fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() || undefined : undefined,
          auto_signup: true
        }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('[Apple Login] Response:', JSON.stringify(data).substring(0, 200));

      if (data.access) {
        console.log('[Apple Login] Has access token, calling initiateSessionBridge');
        const bridgeSuccess = await initiateSessionBridge(data.access, data.refresh);
        console.log('[Apple Login] bridgeSuccess:', bridgeSuccess);
        setShowLogin(false);
        if (!bridgeSuccess) {
          console.log('[Apple Login] Bridge failed, reloading WebView');
          setWebViewKey((prev) => prev + 1);
        }
      } else if (data.needsSignup) {
        console.log('[Apple Login] Needs signup');
        const signupUrl = `${WEB_APP_URL}/auth/apple/setup?provider=apple&provider_id=${data.provider_id}&email=${data.email || ''}&suggested_nickname=${encodeURIComponent(data.suggested_nickname || '')}&profile_image=${encodeURIComponent(data.profile_image || '')}`;
        setPendingUrl(signupUrl);
        setShowLogin(false);
      } else {
        console.log('[Apple Login] Login failed:', data.error);
        Alert.alert('로그인 실패', data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('[Apple Login] Error:', error);
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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
    if (!url.startsWith(WEB_APP_URL) && !url.startsWith(API_URL) && !url.startsWith('about:')) return false;
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
        case 'requestLogout':
          (async () => {
            try {
              // 1. 백엔드 로그아웃 API 호출
              await fetch(`${API_URL}/api/v1/auth/logout/`, {
                method: 'POST',
                credentials: 'include',
              });
            } catch (error) {
              console.error('Logout API error:', error);
            }
            
            try {
              // 2. WebView 쿠키 삭제
              await CookieManager.clearAll();
              console.log('[Logout] Cookies cleared');
              
              // 3. SecureStore 토큰 삭제
              await SecureStore.deleteItemAsync('maeil1dok_access_token');
              await SecureStore.deleteItemAsync('maeil1dok_refresh_token');
              console.log('[Logout] SecureStore tokens cleared');
            } catch (error) {
              console.error('[Logout] Clear storage error:', error);
            }
            
            setWebViewKey(prev => prev + 1);
            showNativeLogin();
          })();
          break;
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
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={6}
                    style={styles.appleButton}
                    onPress={handleAppleLogin}
                  />
                )}

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
  appleButton: {
    width: '100%',
    height: 44,
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
