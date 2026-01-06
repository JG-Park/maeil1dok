/**
 * Tongdok Mode Composable
 *
 * 통독모드 상태 관리 및 관련 기능 제공
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBibleData } from './useBibleData';
import { useApi } from './useApi';

export interface PlanDetail {
  book: string;
  start_chapter: number;
  end_chapter: number;
  is_complete: boolean;
}

export interface ReadingDetailResponse {
  data?: {
    plan_detail?: PlanDetail[];
    audio_link?: string;
    guide_link?: string;
    schedule_date?: string;
    message?: string;
    is_complete?: boolean;
  };
}

export const useTongdokMode = () => {
  const route = useRoute();
  const router = useRouter();
  const api = useApi();
  const { bookNames } = useBibleData();

  // 상태
  const tongdokMode = ref(false);
  const tongdokScheduleId: Ref<number | null> = ref(null);
  const tongdokPlanId: Ref<number | null> = ref(null);
  const readingDetailResponse: Ref<ReadingDetailResponse | null> = ref(null);
  const isCompleting = ref(false);

  /**
   * 통독모드 초기화 (URL 파라미터 확인)
   */
  const initTongdokMode = (): void => {
    const { tongdok, schedule, plan } = route.query;
    tongdokMode.value = tongdok === 'true' || !!plan;
    tongdokScheduleId.value = schedule ? Number(schedule) : null;
    tongdokPlanId.value = plan ? Number(plan) : null;
  };

  /**
   * 통독모드 현재 일정 범위 표시용 computed
   */
  const getTongdokScheduleRange = (currentBook: string, currentChapter: number): string | null => {
    if (!tongdokMode.value || !readingDetailResponse.value?.data?.plan_detail) {
      return null;
    }

    const planDetails = readingDetailResponse.value.data.plan_detail;
    if (planDetails.length === 0) return null;

    // 현재 장이 속한 구간 찾기
    const currentDetail = planDetails.find(detail =>
      detail.book === currentBook &&
      currentChapter >= detail.start_chapter &&
      currentChapter <= detail.end_chapter
    );

    if (!currentDetail) return null;

    const bookName = bookNames[currentDetail.book] || currentDetail.book;
    const chapters = currentDetail.start_chapter === currentDetail.end_chapter
      ? `${currentDetail.start_chapter}장`
      : `${currentDetail.start_chapter}-${currentDetail.end_chapter}장`;

    return `${bookName} ${chapters}`;
  };

  /**
   * 통독모드에서 마지막 장인지 확인
   */
  const isLastChapterInTongdok = (currentBook: string, currentChapter: number): boolean => {
    if (!tongdokMode.value || !readingDetailResponse.value?.data?.plan_detail) {
      return false;
    }

    const planDetails = readingDetailResponse.value.data.plan_detail;
    if (planDetails.length === 0) return false;

    // 마지막 구간의 마지막 장인지 확인
    const lastDetail = planDetails[planDetails.length - 1];
    if (!lastDetail) return false;

    return currentBook === lastDetail.book &&
           currentChapter === lastDetail.end_chapter;
  };

  /**
   * 장 완료 여부 확인
   */
  const isChapterCompleted = (book: string, chapter: number): boolean => {
    if (!readingDetailResponse.value?.data?.plan_detail) return false;

    const detail = readingDetailResponse.value.data.plan_detail.find((d) => {
      const isTargetBook = d.book === book;
      const isInRange = chapter >= d.start_chapter && chapter <= d.end_chapter;
      return isTargetBook && isInRange;
    });

    return detail?.is_complete || false;
  };

  /**
   * 통독모드 끄기
   */
  const disableTongdokMode = (): void => {
    tongdokMode.value = false;
    tongdokScheduleId.value = null;
    tongdokPlanId.value = null;

    // URL에서 통독 관련 파라미터 제거
    const { tongdok, schedule, plan, from, ...restQuery } = route.query;
    router.replace({ query: restQuery });
  };

  /**
   * 통독모드 켜기
   */
  const enableTongdokMode = (scheduleId?: number): void => {
    tongdokMode.value = true;
    if (scheduleId) {
      tongdokScheduleId.value = scheduleId;
    }

    // URL에 통독 관련 파라미터 추가
    router.replace({
      query: {
        ...route.query,
        tongdok: 'true',
        ...(scheduleId && { schedule: scheduleId.toString() })
      }
    });
  };

  /**
   * 읽기 응답 데이터 설정
   */
  const setReadingDetailResponse = (response: ReadingDetailResponse | null): void => {
    readingDetailResponse.value = response;
  };

  /**
   * 현재 일정의 구간 정보 가져오기
   */
  const getCurrentSectionChapters = (currentBook: string): Array<{
    book: string;
    book_kor: string;
    chapters: number[];
  }> => {
    if (!readingDetailResponse.value?.data?.plan_detail) return [];

    const planDetails = readingDetailResponse.value.data.plan_detail;
    return planDetails.map(detail => ({
      book: detail.book,
      book_kor: bookNames[detail.book] || detail.book,
      chapters: Array.from(
        { length: detail.end_chapter - detail.start_chapter + 1 },
        (_, i) => detail.start_chapter + i
      )
    }));
  };

  /**
   * 통독 전체 범위 문자열 가져오기
   */
  const getFullScheduleRange = (): string => {
    if (!readingDetailResponse.value?.data?.plan_detail) return '';

    const planDetails = readingDetailResponse.value.data.plan_detail;
    if (planDetails.length === 0) return '';

    // 모든 구간을 문자열로
    return planDetails.map(detail => {
      const bookName = bookNames[detail.book] || detail.book;
      const chapters = detail.start_chapter === detail.end_chapter
        ? `${detail.start_chapter}장`
        : `${detail.start_chapter}-${detail.end_chapter}장`;
      return `${bookName} ${chapters}`;
    }).join(', ');
  };

  /**
   * 통독 완료 처리 API 호출
   */
  const completeReading = async (): Promise<boolean> => {
    if (!tongdokPlanId.value || !tongdokScheduleId.value) {
      console.warn('Plan ID or Schedule ID is missing');
      return false;
    }

    isCompleting.value = true;
    try {
      await api.post('/api/v1/todos/reading/update/', {
        plan_id: tongdokPlanId.value,
        schedule_ids: [tongdokScheduleId.value],
        action: 'complete'
      });
      return true;
    } catch (error) {
      console.error('통독 완료 처리 실패:', error);
      return false;
    } finally {
      isCompleting.value = false;
    }
  };

  return {
    // 상태
    tongdokMode,
    tongdokScheduleId,
    tongdokPlanId,
    readingDetailResponse,
    isCompleting,

    // 함수
    initTongdokMode,
    getTongdokScheduleRange,
    getFullScheduleRange,
    isLastChapterInTongdok,
    isChapterCompleted,
    disableTongdokMode,
    enableTongdokMode,
    setReadingDetailResponse,
    getCurrentSectionChapters,
    completeReading,
  };
};
