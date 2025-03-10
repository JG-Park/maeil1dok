<script setup>
// 여기서는 router layout만 설정하고 내용은 intro.vue로 리다이렉트
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  // 원래 intro 페이지로 이동하면서 파라미터도 전달
  router.replace(`/intro?id=${route.params.id}`)
})
</script>

<template>
  <div>로딩 중...</div>
</template> 