/**
 * Navigation Init Plugin
 *
 * 앱 시작 시 네비게이션 스토어를 초기화합니다.
 * sessionStorage에서 이전 상태를 복원하여 페이지 새로고침에도
 * 네비게이션 히스토리가 유지됩니다.
 *
 * .client.ts 접미사로 클라이언트에서만 실행됩니다.
 */

import { useNavigationStore } from '~/stores/navigation'

export default defineNuxtPlugin(() => {
  const navigationStore = useNavigationStore()
  navigationStore.initialize()
})
