<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p>로그인 처리 중입니다...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavigation } from '~/composables/useNavigation'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const auth = useAuthStore()
const { consumeRedirectUrl } = useNavigation()

const parseStateParam = () => {
  const state = route.query.state as string
  if (!state) return null
  try {
    return JSON.parse(decodeURIComponent(state))
  } catch {
    return null
  }
}

const redirectToApp = (scheme: string, params: Record<string, string>) => {
  const queryString = new URLSearchParams(params).toString()
  const deepLink = `${scheme}://auth/google/callback?${queryString}`
  window.location.href = deepLink
}

onMounted(async () => {
  const { provider } = route.params
  const { code } = route.query
  const stateData = parseStateParam()
  const isFromApp = stateData?.from === 'app'

  if (provider === 'kakao' && code) {
    await handleKakaoCallback(code as string)
  } else if (provider === 'google' && code) {
    await handleGoogleCallback(code as string, isFromApp, stateData?.scheme)
  } else {
    navigateTo('/login')
  }
})

const handleKakaoCallback = async (code: string) => {
  try {
    const response = await auth.socialLogin('kakao', code)

    if (response.needsSignup) {
      // 회원가입이 필요한 경우 닉네임 설정 페이지로
      // 리다이렉트 URL은 스토어에 유지됨 (setup 완료 후 소비)
      navigateTo({
        path: '/auth/kakao/setup',
        query: {
          kakao_id: response.kakao_id,
          suggested_nickname: response.suggested_nickname,
          profile_image: response.profile_image
        }
      })
    } else {
      // 기존 회원은 토큰 저장 후 원래 페이지로
      if (response.access) {
        auth.setTokens(response.access, response.refresh)
        auth.setUser(response.user)
        // Timer is automatically started by setTokens()
      }
      // 네비게이션 스토어에서 리다이렉트 URL 소비
      const redirectUrl = consumeRedirectUrl() || '/'
      navigateTo(redirectUrl)
    }
  } catch (error) {
    console.error('[Kakao Callback] Error during login:', error)
    navigateTo('/login')
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
        redirectToApp(appScheme, {
          needsSignup: 'true',
          provider: 'google',
          provider_id: data.provider_id,
          email: data.email || '',
          suggested_nickname: data.suggested_nickname || '',
          profile_image: data.profile_image || ''
        })
      } else {
        navigateTo({
          path: '/auth/google/setup',
          query: {
            provider: 'google',
            provider_id: data.provider_id,
            email: data.email || '',
            suggested_nickname: data.suggested_nickname,
            profile_image: data.profile_image || ''
          }
        })
      }
    } else {
      if (isFromApp && appScheme) {
        redirectToApp(appScheme, {
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
      redirectToApp(appScheme, { error: 'login_failed' })
    } else {
      navigateTo('/login')
    }
  }
}
</script> 