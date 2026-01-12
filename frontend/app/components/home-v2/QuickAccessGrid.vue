<template>
  <section class="quick-access">
    <h3 class="section-title">Explore</h3>
    
    <div class="grid-2">
      <NuxtLink to="/plan" class="sub-card">
        <div class="icon-box">
          <CalendarIcon size="24" />
        </div>
        <div class="sub-title">통독표</div>
        <div class="sub-desc">전체 계획 보기</div>
      </NuxtLink>
      
      <NuxtLink to="/intro" class="sub-card">
        <div class="icon-box">
          <MonitorIcon size="24" />
        </div>
        <div class="sub-title">개론 영상</div>
        <div class="sub-desc">깊이 있는 이해</div>
      </NuxtLink>
      
      <NuxtLink to="/hasena" class="sub-card">
        <div class="icon-box">
          <PlayIcon size="24" />
        </div>
        <div class="sub-title">하세나하시조</div>
        <div class="sub-desc">오늘의 영상</div>
      </NuxtLink>
      
      <NuxtLink to="/groups" class="sub-card">
        <div class="icon-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="sub-title">커뮤니티</div>
        <div class="sub-desc">함께 읽는 기쁨</div>
      </NuxtLink>
      
      <NuxtLink :to="profileLink" class="sub-card">
        <div class="icon-box">
          <HistoryIcon size="24" />
        </div>
        <div class="sub-title">내 활동</div>
        <div class="sub-desc">기록과 통계</div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import CalendarIcon from '~/components/icons/CalendarIcon.vue';
import MonitorIcon from '~/components/icons/MonitorIcon.vue';
import PlayIcon from '~/components/icons/PlayIcon.vue';
import HistoryIcon from '~/components/icons/HistoryIcon.vue';

const authStore = useAuthStore();

const profileLink = computed(() => {
  return authStore.user ? `/profile/${authStore.user.id}` : '/login';
});
</script>

<style scoped>
.quick-access {
  margin-bottom: 2rem;
}

.section-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  margin: 0 0 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.sub-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: var(--paper-shadow);
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(0,0,0,0.02);
}

.sub-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(44, 51, 51, 0.06);
}

.icon-box {
  width: 40px;
  height: 40px;
  background: var(--bg-color); /* 다크모드 대응 변수 */
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: var(--text-main);
}

.sub-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: var(--text-main);
}

.sub-desc {
  font-size: 0.8125rem;
  color: var(--text-sub);
}

@media (max-width: 480px) {
  .sub-card {
    padding: 1.25rem;
  }
}

[data-theme="dark"] .sub-card {
  background: var(--color-bg-card);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

[data-theme="dark"] .icon-box {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}
</style>