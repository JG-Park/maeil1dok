<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 3v5h5M21 21v-5h-5" />
    <path d="M21 9A9 9 0 0 0 6.343 6.343L3 9M3 15a9 9 0 0 0 14.657 2.657L21 15" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string;
}>(), {
  size: 20
});
</script>
