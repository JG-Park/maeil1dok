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

// Splash screen 유지
SplashScreen.preventAutoHideAsync();

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
const APP_SCHEME = 'maeil1dok';

// OAuth 프로바이더 도메인
const OAUTH_DOMAINS = [
  'kauth.kakao.com',
  'accounts.kakao.com',
  'accounts.google.com',
  'oauth.google.com',
];

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isError, setIsError] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // 딥링크 처리
  const handleDeepLink = useCallback((event: { url: string }) => {
    const { url } = event;
    console.log('Deep link received:', url);

    // maeil1dok:// 스킴에서 path 추출
    if (url.startsWith(`${APP_SCHEME}://`)) {
      const path = url.replace(`${APP_SCHEME}://`, '');
      const webUrl = `${WEB_APP_URL}/${path}`;
      webViewRef.current?.injectJavaScript(`window.location.href = '${webUrl}';`);
    }
  }, []);

  // 초기 URL 및 딥링크 리스너 설정
  useEffect(() => {
    // 앱이 열릴 때의 초기 URL 확인
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // 딥링크 리스너
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // 푸시 알림 설정
  useEffect(() => {
    registerForPushNotifications();

    // 알림 클릭 리스너
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
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, [canGoBack]);

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
        case 'navigate':
          if (message.url) {
            Linking.openURL(message.url);
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
            
            // 외부 링크 열기 함수
            window.openExternalLink = function(url) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'navigate', url: url }));
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
