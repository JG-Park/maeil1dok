<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21L16.5 16.5" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string;
}>(), {
  size: 20
});
</script>
