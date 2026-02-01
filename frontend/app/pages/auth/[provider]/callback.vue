<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p>{{ statusMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavigation } from '~/composables/useNavigation'
import { useApi } from '~/composables/useApi'
import { useAuthService } from '~/composables/useAuthService'

const route = useRoute()
const auth = useAuthService()
const { consumeRedirectUrl } = useNavigation()

const statusMessage = ref('처리 중입니다...')

const parseStateParam = () => {
  const state = route.query.state as string
  if (!state) return null
  try {
    return JSON.parse(decodeURIComponent(state))
  } catch {
    return null
  }
}

const redirectToApp = (scheme: string, provider: string, params: Record<string, string>) => {
  const queryString = new URLSearchParams(params).toString()
  const deepLink = `${scheme}://auth/${provider}/callback?${queryString}`
  window.location.href = deepLink
}

onMounted(async () => {
  const { provider } = route.params
  const { code } = route.query
  const stateData = parseStateParam()
  const isFromApp = stateData?.from === 'app'
  const isLinkAction = stateData?.action === 'link'

  if (!code) {
    navigateTo('/login')
    return
  }

  // 계정 연결 (로그인된 상태에서 다른 소셜 계정 연결)
  // OAuth 리다이렉트 후 페이지가 새로 로드되므로 auth 초기화 필요
  if (isLinkAction) {
    statusMessage.value = '인증 확인 중입니다...'
    await auth.initializeAuth()
    
    if (!auth.isAuthenticated.value) {
      navigateTo({
        path: '/account/settings',
        query: { linked: 'error', message: '로그인이 필요합니다' }
      })
      return
    }
    
    statusMessage.value = '계정 연결 중입니다...'
    await handleLinkSocialAccount(provider as string, code as string)
    return
  }

  // 일반 로그인
  statusMessage.value = '로그인 처리 중입니다...'
  if (provider === 'kakao') {
    await handleKakaoCallback(code as string, isFromApp, stateData?.scheme)
  } else if (provider === 'google') {
    await handleGoogleCallback(code as string, isFromApp, stateData?.scheme)
  } else if (provider === 'apple') {
    // Apple uses id_token instead of code for direct verification
    const idToken = route.query.id_token as string
    const userInfo = route.query.user as string
    await handleAppleCallback(code as string, idToken, userInfo, isFromApp, stateData?.scheme)
  } else {
    navigateTo('/login')
  }
})

// 계정 연결 처리
const handleLinkSocialAccount = async (provider: string, code: string) => {
  try {
    const api = useApi()
    
    // Apple uses id_token for verification
    const payload: Record<string, string> = { provider, code }
    if (provider === 'apple') {
      const idToken = route.query.id_token as string
      if (idToken) {
        payload.id_token = idToken
      }
    }
    
    const response = await api.post('/api/v1/auth/link-social/', payload)

    // 연결 성공
    navigateTo({
      path: '/account/settings',
      query: { linked: 'success', provider }
    })
  } catch (error: any) {
    const errorData = error?.data || error?.response?.data || {}
    
    // 다른 계정에 이미 연동된 경우 - 병합 페이지로 리다이렉트
    if (errorData.can_merge) {
      // 병합 정보를 sessionStorage에 저장하고 설정 페이지로 이동
      sessionStorage.setItem('merge_info', JSON.stringify({
        provider,
        code,
        current_account: errorData.current_account,
        other_account: errorData.other_account
      }))
      
      navigateTo({
        path: '/account/settings',
        query: { action: 'merge' }
      })
      return
    }

    // 기타 에러
    console.error('[Link Social] Error:', error)
    navigateTo({
      path: '/account/settings',
      query: { linked: 'error', message: errorData.error || '연결 실패' }
    })
  }
}

const handleKakaoCallback = async (code: string, isFromApp = false, appScheme?: string) => {
  try {
    const response = await auth.socialLogin('kakao', code)

    if (response.needsSignup) {
      if (isFromApp && appScheme) {
        redirectToApp(appScheme, 'kakao', {
          needsSignup: 'true',
          provider: 'kakao',
          provider_id: response.kakao_id || '',
          email: response.email || '',
          suggested_nickname: response.suggested_nickname || '',
          profile_image: response.profile_image || '',
          signup_token: response.signup_token || ''
        })
      } else {
        // sessionStorage에 signup 데이터 저장 (보안: URL에 토큰 노출 방지)
        sessionStorage.setItem('social_signup_data', JSON.stringify({
          provider: 'kakao',
          provider_id: response.kakao_id || '',
          email: response.email || '',
          suggested_nickname: response.suggested_nickname || '',
          profile_image: response.profile_image || '',
          signup_token: response.signup_token || ''
        }))
        navigateTo({
          path: '/auth/kakao/setup'
        })
      }
    } else {
      if (isFromApp && appScheme) {
        redirectToApp(appScheme, 'kakao', {
          access: response.access,
          refresh: response.refresh,
          user: encodeURIComponent(JSON.stringify(response.user))
        })
      } else {
        if (response.access) {
          auth.setTokens(response.access, response.refresh)
          auth.setUser(response.user)
        }
        const redirectUrl = consumeRedirectUrl() || '/'
        navigateTo(redirectUrl)
      }
    }
  } catch (error) {
    console.error('[Kakao Callback] Error during login:', error)
    if (isFromApp && appScheme) {
      redirectToApp(appScheme, 'kakao', { error: 'login_failed' })
    } else {
      navigateTo('/login')
    }
  }
}

const handleGoogleCallback = async (code: string, isFromApp = false, appScheme?: string) => {
  try {
    const api = useApi()
    const response = await api.post('/api/v1/auth/social-login/v2/', {
      provider: 'google',
      code
    })

    const data = response.data || response

    if (data.needsSignup) {
      if (isFromApp && appScheme) {
        redirectToApp(appScheme, 'google', {
          needsSignup: 'true',
          provider: 'google',
          provider_id: data.provider_id,
          email: data.email || '',
          suggested_nickname: data.suggested_nickname || '',
          profile_image: data.profile_image || '',
          signup_token: data.signup_token || ''
        })
      } else {
        // sessionStorage에 signup 데이터 저장 (보안: URL에 토큰 노출 방지)
        sessionStorage.setItem('social_signup_data', JSON.stringify({
          provider: 'google',
          provider_id: data.provider_id,
          email: data.email || '',
          suggested_nickname: data.suggested_nickname || '',
          profile_image: data.profile_image || '',
          signup_token: data.signup_token || ''
        }))
        navigateTo({
          path: '/auth/google/setup'
        })
      }
    } else {
      if (isFromApp && appScheme) {
        redirectToApp(appScheme, 'google', {
          access: data.access,
          refresh: data.refresh,
          user: encodeURIComponent(JSON.stringify(data.user))
        })
      } else {
        if (data.access) {
          auth.setTokens(data.access, data.refresh)
          auth.setUser(data.user)
        }
        const redirectUrl = consumeRedirectUrl() || '/'
        navigateTo(redirectUrl)
      }
    }
  } catch (error) {
    console.error('[Google Callback] Error during login:', error)
    if (isFromApp && appScheme) {
      redirectToApp(appScheme, 'google', { error: 'login_failed' })
    } else {
      navigateTo('/login')
    }
  }
}

const handleAppleCallback = async (code: string, idToken: string, userInfo: string | undefined, isFromApp = false, appScheme?: string) => {
  try {
    const api = useApi()
    
    // Parse user info if provided (Apple only sends this on first login)
    let fullName: string | undefined
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        if (user.name) {
          fullName = `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() || undefined
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    const response = await api.post('/api/v1/auth/social-login/v2/', {
      provider: 'apple',
      code,
      id_token: idToken,
      full_name: fullName
    })

    const data = response.data || response

    if (data.needsSignup) {
      if (isFromApp && appScheme) {
        redirectToApp(appScheme, 'apple', {
          needsSignup: 'true',
          provider: 'apple',
          provider_id: data.provider_id,
          email: data.email || '',
          suggested_nickname: data.suggested_nickname || '',
          profile_image: data.profile_image || '',
          signup_token: data.signup_token || ''
        })
      } else {
        // sessionStorage에 signup 데이터 저장 (보안: URL에 토큰 노출 방지)
        sessionStorage.setItem('social_signup_data', JSON.stringify({
          provider: 'apple',
          provider_id: data.provider_id,
          email: data.email || '',
          suggested_nickname: data.suggested_nickname || '',
          profile_image: data.profile_image || '',
          signup_token: data.signup_token || ''
        }))
        navigateTo({
          path: '/auth/apple/setup'
        })
      }
    } else {
      if (isFromApp && appScheme) {
        redirectToApp(appScheme, 'apple', {
          access: data.access,
          refresh: data.refresh,
          user: encodeURIComponent(JSON.stringify(data.user))
        })
      } else {
        if (data.access) {
          auth.setTokens(data.access, data.refresh)
          auth.setUser(data.user)
        }
        const redirectUrl = consumeRedirectUrl() || '/'
        navigateTo(redirectUrl)
      }
    }
  } catch (error) {
    console.error('[Apple Callback] Error during login:', error)
    if (isFromApp && appScheme) {
      redirectToApp(appScheme, 'apple', { error: 'login_failed' })
    } else {
      navigateTo('/login')
    }
  }
}
</script>
