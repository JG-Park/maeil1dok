<template>
  <div class="callback-container">
    <div class="loading-spinner"></div>
    <p>로그인 처리 중...</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string
  const error = route.query.error as string

  if (error) {
    console.error('Google OAuth error:', error)
    router.push('/login')
    return
  }

  if (!code) {
    router.push('/login')
    return
  }

  try {
    if (state) {
      const stateObj = JSON.parse(decodeURIComponent(state))
      if (stateObj.from === 'app' && stateObj.scheme) {
        window.location.href = `${stateObj.scheme}://auth/google/callback?code=${code}`
        return
      }
    }
  } catch (e) {
    console.error('Failed to parse state:', e)
  }

  router.push(`/login?provider=google&code=${code}`)
})
</script>

<style scoped>
.callback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #faf8f6;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #4A90A4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

p {
  color: #666;
  font-size: 14px;
}
</style>
