<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import Toast from '@/components/Toast.vue'

const auth = useAuthStore()
const isInitialized = ref(false)

onMounted(async () => {
  try {
    await auth.initializeAuth()
  } catch (error) {
  } finally {
    isInitialized.value = true
  }
})
</script>
