<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2l1.5 5.5h5.5l-4.5 3.5 1.5 5.5-4.5-3.5-4.5 3.5 1.5-5.5-4.5-3.5h5.5z" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string;
}>(), {
  size: 20
});
</script>
