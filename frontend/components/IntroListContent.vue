<template>
  <div class="bible-schedule-wrapper">
    <div class="schedule-body">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>목록을 불러오는 중입니다...</span>
      </div>
      <div v-else-if="error" class="no-schedules">
        <span>{{ error }}</span>
      </div>
      <div v-else-if="introductions.length === 0" class="no-schedules">
        <span>표시할 소개 영상이 없습니다.</span>
      </div>
      <div v-else class="schedule-list">
        <div
          v-for="intro in introductions"
          :key="intro.id"
          class="schedule-item"
          :class="getIntroStatusClass(intro)"
          @click="navigateToDetail(intro.id)"
        >
          <div class="checkbox">
            <input
              type="checkbox"
              :checked="intro.is_completed"
              @click.stop="toggleCompletion(intro)"
              :disabled="isToggling[intro.id]"
            />
          </div>
          <div class="schedule-info">
            <div class="schedule-date">
              <span v-if="isCurrentIntro(intro)" class="current-week-badge"
                >현재 주차</span
              >
              {{ formatDate(intro.start_date) }} ~
              {{ formatDate(intro.end_date) }}
            </div>
            <div class="schedule-reading">
              <span v-if="isCurrentIntro(intro)" class="current-location-badge"
                >현재 주차</span
              >
              <span class="bible-text">{{ intro.book }}</span>
            </div>
          </div>
          <div class="status-text">
            <svg
              v-if="intro.is_completed"
              class="status-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else
              class="status-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            {{ getStatusText(intro) }}
          </div>
          <!-- Navigation indication icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="nav-icon"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useAuthStore } from "~/stores/auth";
import { useToast } from "~/composables/useToast";

const introductions = ref([]);
const loading = ref(true);
const error = ref(null);
const router = useRouter();
const api = useApi();
const authStore = useAuthStore();
const { success, error: showError } = useToast();

// 토글 진행 중인 항목 추적
const isToggling = reactive({});

const fetchIntroductions = async () => {
  loading.value = true;
  error.value = null;
  try {
    // 로그인 상태에 따라 다른 API 엔드포인트 호출
    const endpoint = authStore.isAuthenticated
      ? "/api/v1/todos/user/video/intro/"
      : "/api/v1/todos/video/intro/";

    const response = await api.get(endpoint);
    if (response.data && response.data.results) {
      introductions.value = response.data.results;
    } else if (Array.isArray(response.data)) {
      introductions.value = response.data;
    } else {
      introductions.value = [];
      console.warn(
        "Unexpected API response structure for introductions:",
        response.data
      );
      error.value = "데이터 형식이 올바르지 않습니다.";
    }
  } catch (err) {
    console.error("Error fetching introductions:", err);
    error.value =
      "소개 목록을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.";
  } finally {
    loading.value = false;
  }
};

const navigateToDetail = (introId) => {
  router.push(`/intro?id=${introId}`);
};

// 현재 날짜가 intro의 start_date와 end_date 사이에 있는지 확인
const isCurrentIntro = (intro) => {
  const today = new Date();
  const startDate = new Date(intro.start_date);
  const endDate = new Date(intro.end_date);

  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  return today >= startDate && today <= endDate;
};

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 개론 상태에 따른 클래스 반환
const getIntroStatusClass = (intro) => {
  if (intro.is_completed) return "completed";

  const today = new Date();
  const startDate = new Date(intro.start_date);
  const endDate = new Date(intro.end_date);

  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (today >= startDate && today <= endDate) {
    return "current";
  } else if (endDate < today) {
    return "not_completed";
  } else {
    return "upcoming";
  }
};

// 상태 텍스트 반환
const getStatusText = (intro) => {
  if (intro.is_completed) return "완료";

  const today = new Date();
  const startDate = new Date(intro.start_date);
  const endDate = new Date(intro.end_date);

  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (today >= startDate && today <= endDate) {
    return "현재 주차";
  } else if (endDate < today) {
    return "미완료";
  } else {
    return "예정";
  }
};

// 완료 상태 토글 함수
const toggleCompletion = async (intro) => {
  if (!authStore.isAuthenticated) {
    // 로그인이 필요한 경우 로그인 페이지로 이동
    router.push(
      `/login?redirect=${encodeURIComponent(
        router.currentRoute.value.fullPath
      )}`
    );
    return;
  }

  // 이미 토글 중인 경우 처리 방지
  if (isToggling[intro.id]) {
    return;
  }

  // 토글 상태 시작
  isToggling[intro.id] = true;

  try {
    // 낙관적 업데이트 (UI 즉시 반영)
    const newCompletionStatus = !intro.is_completed;
    intro.is_completed = newCompletionStatus;

    // API 호출하여 서버에 상태 업데이트
    const response = await api.post("/api/v1/todos/video/intro/progress/", {
      video_intro_id: intro.id,
      is_completed: newCompletionStatus,
    });

    // 응답 데이터에서 완료 상태 가져오기 (서버 상태와 일치시키기)
    if (response.data && response.data.is_completed !== undefined) {
      intro.is_completed = response.data.is_completed;
    }

    // 성공 메시지 표시
    if (intro.is_completed) {
      success("완료 처리되었습니다.");
    } else {
      success("미완료 처리되었습니다.");
    }
  } catch (err) {
    console.error("완료 상태 변경 실패:", err);
    // 에러 발생 시 상태 롤백
    intro.is_completed = !intro.is_completed;
    showError("상태 변경에 실패했습니다. 다시 시도해주세요.");
  } finally {
    // 토글 상태 완료
    isToggling[intro.id] = false;
  }
};

// 사용자 인증 상태 변경 감지
const initializeData = async () => {
  await fetchIntroductions();
};

// 인증 상태 변경 감지
watch(
  () => authStore.isAuthenticated,
  (newAuthState) => {
    // 인증 상태가 변경되면 데이터 다시 가져오기
    fetchIntroductions();
  }
);

onMounted(() => {
  initializeData();
});
</script>
<style scoped src="./BibleScheduleContent.style.css"></style>
