<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toast ref="toast" />
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import Toast from '~/components/Toast.vue'

const toast = ref()

// 전역적으로 toast 인스턴스를 제공
provide('toast', toast)

// Auth initialization moved to plugins/auth-init.ts
</script>
