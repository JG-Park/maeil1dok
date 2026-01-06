<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" />
    <path d="M18 14L18.55 16.45L21 17L18.55 17.55L18 20L17.45 17.55L15 17L17.45 16.45L18 14Z" opacity="0.7" />
    <path d="M6 16L6.37 17.63L8 18L6.37 18.37L6 20L5.63 18.37L4 18L5.63 17.63L6 16Z" opacity="0.5" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string;
}>(), {
  size: 20
});
</script>
