<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p>로그인 처리 중입니다...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuthStore()

onMounted(async () => {
  const { provider } = route.params
  const { code } = route.query
  
  if (provider === 'kakao' && code) {
    await handleKakaoCallback(code as string)
  } else {
    console.error('Invalid provider or code')
    navigateTo('/login')
  }
})

const handleKakaoCallback = async (code: string) => {
  try {
    const response = await auth.socialLogin('kakao', code)
    
    if (response.needsSignup) {
      // 회원가입이 필요한 경우 닉네임 설정 페이지로
      navigateTo({
        path: '/auth/kakao/setup',
        query: {
          kakao_id: response.kakao_id,
          suggested_nickname: response.suggested_nickname,
          profile_image: response.profile_image
        }
      })
    } else {
      // 기존 회원은 토큰 저장 후 홈으로
      if (response.access) {
        auth.setTokens(response.access, response.refresh)
        auth.setUser(response.user)
      }
      navigateTo('/')
    }
  } catch (error) {
    console.error('Kakao login failed:', error)
    navigateTo('/login')
  }
}
</script> 