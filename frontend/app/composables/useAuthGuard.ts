/**
 * useAuthGuard - 인증 체크 유틸리티
 *
 * 인증이 필요한 작업 전에 사용하여 비로그인 사용자를 로그인 페이지로 리다이렉트합니다.
 *
 * @example
 * const { requireAuth } = useAuthGuard();
 *
 * const handleAction = () => {
 *   if (!requireAuth()) return;
 *   // 인증된 사용자만 실행되는 코드
 * };
 */

import { useAuthStore } from '~/stores/auth';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '~/composables/useToast';

export function useAuthGuard() {
  const authStore = useAuthStore();
  const router = useRouter();
  const route = useRoute();
  const toast = useToast();

  /**
   * 인증이 필요한 작업 전에 호출
   * @param message - 커스텀 메시지 (기본값: '로그인이 필요합니다')
   * @returns true if authenticated, false if redirected to login
   */
  const requireAuth = (message: string = '로그인이 필요합니다'): boolean => {
    if (!authStore.isAuthenticated) {
      toast.info(message);
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
      return false;
    }
    return true;
  };

  return {
    requireAuth,
    isAuthenticated: authStore.isAuthenticated,
  };
}
