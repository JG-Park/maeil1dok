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

  if (provider === 'kakao' && code) {
    await handleKakaoCallback(code as string, isFromApp, stateData?.scheme)
  } else if (provider === 'google' && code) {
    await handleGoogleCallback(code as string, isFromApp, stateData?.scheme)
  } else {
    navigateTo('/login')
  }
})

const handleKakaoCallback = async (code: string, isFromApp = false, appScheme?: string) => {
  try {
    const response = await auth.socialLogin('kakao', code)

    if (response.needsSignup) {
      if (isFromApp && appScheme) {
        redirectToApp(appScheme, 'kakao', {
          needsSignup: 'true',
          provider: 'kakao',
          provider_id: response.kakao_id || '',
          email: '',
          suggested_nickname: response.suggested_nickname || '',
          profile_image: response.profile_image || ''
        })
      } else {
        navigateTo({
          path: '/auth/kakao/setup',
          query: {
            kakao_id: response.kakao_id,
            suggested_nickname: response.suggested_nickname,
            profile_image: response.profile_image
          }
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
</script> 