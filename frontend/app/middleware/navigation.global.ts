/**
 * Navigation Tracking Middleware
 *
 * 모든 라우트 변경을 추적하여 네비게이션 스토어에 기록합니다.
 * 이를 통해 앱 내 이동 히스토리를 파악하고 스마트 뒤로가기를 구현합니다.
 *
 * 파일명의 .global 접미사로 인해 모든 라우트에 자동 적용됩니다.
 */

import { useNavigationStore } from '~/stores/navigation'

export default defineNuxtRouteMiddleware((to, _from) => {
  // 클라이언트에서만 실행
  if (!import.meta.client) return

  const navigationStore = useNavigationStore()

  // 스토어 초기화 (sessionStorage에서 복원)
  navigationStore.initialize()

  // 추적에서 제외할 경로 패턴
  const excludedPaths = [
    '/auth/kakao/callback',
    '/auth/google/callback',
    '/auth/naver/callback',
  ]

  // OAuth 콜백 페이지는 추적하지 않음
  // 이 페이지들은 일시적인 중간 페이지이므로 히스토리에 포함하지 않음
  if (excludedPaths.some(path => to.path.startsWith(path))) {
    return
  }

  // 새 경로를 히스토리 스택에 추가
  navigationStore.pushRoute(to.fullPath)
})
