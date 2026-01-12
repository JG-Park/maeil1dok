/**
 * useNavigation - 통합 네비게이션 컴포저블
 *
 * 스마트 뒤로가기, 리다이렉트 URL 관리 등 네비게이션 관련
 * 유틸리티 함수를 제공합니다.
 *
 * @example
 * // 기본 사용법
 * const { goBack, canGoBack } = useNavigation();
 *
 * // 스마트 뒤로가기 (앱 내 히스토리 없으면 fallback으로 이동)
 * goBack('/');
 *
 * // 뒤로가기 버튼 표시 여부 결정
 * <button v-if="canGoBack" @click="goBack()">뒤로</button>
 *
 * @example
 * // 인증 필요 작업에서 리다이렉트 URL 관리
 * const { setRedirectUrl, consumeRedirectUrl } = useNavigation();
 *
 * // 로그인 페이지로 리다이렉트 전
 * setRedirectUrl('/protected-page');
 * navigateTo('/login');
 *
 * // 로그인 성공 후
 * const redirectTo = consumeRedirectUrl() || '/';
 * navigateTo(redirectTo);
 */

import { computed, type ComputedRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNavigationStore } from '~/stores/navigation'

export interface UseNavigationReturn {
  /**
   * 스마트 뒤로가기
   * 앱 내 히스토리가 있으면 이전 페이지로, 없으면 fallback 경로로 이동
   *
   * @param fallback - 히스토리 없을 때 이동할 경로 (기본값: '/')
   */
  goBack: (fallback?: string) => void

  /**
   * 뒤로가기 가능 여부
   * 앱 내에서 이동한 히스토리가 있는지 확인
   */
  canGoBack: ComputedRef<boolean>

  /**
   * 이전 페이지 경로
   * 뒤로가기 시 이동할 페이지 경로
   */
  previousRoute: ComputedRef<string | null>

  /**
   * 현재 페이지 경로
   */
  currentRoute: ComputedRef<string | null>

  /**
   * 리다이렉트 URL 저장
   * 로그인이 필요한 페이지 접근 시 현재 URL 저장
   *
   * @param url - 저장할 URL
   */
  setRedirectUrl: (url: string) => void

  /**
   * 리다이렉트 URL 소비 (반환 후 초기화)
   * 로그인 성공 후 호출하여 원래 페이지로 복귀
   *
   * @returns 저장된 URL 또는 null
   */
  consumeRedirectUrl: () => string | null

  /**
   * 리다이렉트 URL 확인 (소비하지 않음)
   *
   * @returns 저장된 URL 또는 null
   */
  peekRedirectUrl: () => string | null

  /**
   * 현재 경로를 리다이렉트 URL로 저장
   * useAuthGuard 등에서 사용
   */
  saveCurrentAsRedirect: () => void

  /**
   * 네비게이션 상태 초기화
   * 로그아웃 시 사용
   */
  clearNavigation: () => void
}

export function useNavigation(): UseNavigationReturn {
  const router = useRouter()
  const route = useRoute()
  const navigationStore = useNavigationStore()

  // Computed properties
  const canGoBack = computed(() => navigationStore.canGoBack)
  const previousRoute = computed(() => navigationStore.previousRoute)
  const currentRoute = computed(() => navigationStore.currentRoute)

  /**
   * 스마트 뒤로가기
   */
  const goBack = (fallback: string = '/'): void => {
    if (navigationStore.canGoBack) {
      // 현재 페이지를 스택에서 제거
      navigationStore.popRoute()
      // 브라우저 히스토리 뒤로가기
      router.back()
    } else {
      // 앱 내 히스토리 없음 - fallback으로 이동
      router.push(fallback)
    }
  }

  /**
   * 리다이렉트 URL 저장
   */
  const setRedirectUrl = (url: string): void => {
    navigationStore.setRedirectUrl(url)
  }

  /**
   * 리다이렉트 URL 소비
   */
  const consumeRedirectUrl = (): string | null => {
    return navigationStore.consumeRedirectUrl()
  }

  /**
   * 리다이렉트 URL 확인
   */
  const peekRedirectUrl = (): string | null => {
    return navigationStore.peekRedirectUrl()
  }

  /**
   * 현재 경로를 리다이렉트 URL로 저장
   */
  const saveCurrentAsRedirect = (): void => {
    navigationStore.setRedirectUrl(route.fullPath)
  }

  /**
   * 네비게이션 상태 초기화
   */
  const clearNavigation = (): void => {
    navigationStore.clear()
  }

  return {
    goBack,
    canGoBack,
    previousRoute,
    currentRoute,
    setRedirectUrl,
    consumeRedirectUrl,
    peekRedirectUrl,
    saveCurrentAsRedirect,
    clearNavigation,
  }
}
