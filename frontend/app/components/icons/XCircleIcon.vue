<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
    <path d="M15 9L9 15M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string;
}>(), {
  size: 20
});
</script>
