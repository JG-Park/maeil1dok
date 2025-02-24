<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()

onMounted(async () => {
  await auth.initializeAuth()
})
</script>
