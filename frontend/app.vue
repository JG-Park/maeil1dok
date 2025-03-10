<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toast ref="toast" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { useAuthStore } from '~/stores/auth'
import Toast from '~/components/Toast.vue'

const auth = useAuthStore()
const isInitialized = ref(false)
const toast = ref()

// 전역적으로 toast 인스턴스를 제공
provide('toast', toast)

onMounted(async () => {
  try {
    await auth.initializeAuth()
  } catch (error) {
  } finally {
    isInitialized.value = true
  }
})
</script>
