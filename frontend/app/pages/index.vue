<template>
  <div class="container">
    <div class="header-wrapper">
      <div class="fade-in" style="animation-delay: 0s">
        <Header />
      </div>
    </div>
    <div class="content-wrapper">
      <DailyStatus class="fade-in" style="animation-delay: 0.2s" />
      <!-- <client-only
        ><WeeklyCalendar :week-status="weekStatus.value"
      /></client-only> -->

      <!-- 공지사항 -->
      <!-- <div class="section notice-section fade-in" style="animation-delay: 0.25s">
        <div class="notice-header">
          <div class="notice-title-wrapper">
            <h2>공지사항</h2>
          </div>
        </div>
        
        <div class="notice-content" @click="navigateTo('/notice/plan-update')">
          <div class="notice-icon app-icon">
            새기능
          </div>
          <div class="notice-text">
            <div class="notice-title">푸른통독 관리 기능 추가<span class="new-badge">NEW</span></div>
            <div class="notice-description">이제 청년부 푸른통독도 함께 진행할 수 있어요</div>
          </div>
          <div class="notice-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div> -->

      <!-- 앱 설치 방법 -->
      <!-- <div class="notice-content" style="margin-top: 0.5rem" @click="navigateTo('/install')">
          <div class="notice-icon app-icon disabled">
            APP
          </div>
          <div class="notice-text">
            <div class="notice-title">매일일독 앱 설치 방법</div>
            <div class="notice-description">매일일독을 앱으로 사용해보세요</div>
          </div>
          <div class="notice-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>  -->

      <div class="horizontal-sections fade-in" style="animation-delay: 0.3s">
        <div class="section flex-1">
          <div class="section-header">
            <h2>오늘일독</h2>
            <div
              v-if="
                auth.isAuthenticated &&
                subscriptionStore.activeSubscriptions.length > 1
              "
              class="plan-selector"
            >
              <button
                class="plan-select-button"
                @click="showPlanDropdown = !showPlanDropdown"
              >
                <span>{{ selectedPlanName }}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <!-- 드롭다운 메뉴 -->
              <div v-if="showPlanDropdown" class="plan-dropdown">
                <button
                  v-for="subscription in subscriptionStore.activeSubscriptions"
                  :key="subscription.plan_id"
                  class="dropdown-item"
                  :class="{ active: subscription.plan_id === selectedPlanId }"
                  @click="selectPlan(subscription)"
                >
                  <span class="dropdown-item-text">{{
                    subscription.plan_name
                  }}</span>
                </button>
              </div>
            </div>
          </div>
          <div class="tasks">
            <div v-for="(task, index) in todayTasks" :key="index">
              <template v-if="task.title === '오늘일독'">
                <div
                  class="task split-task reading-task"
                  @click="toggleTask({ ...task, id: 1, title: '오늘일독' })"
                >
                  <div class="task-content">
                    <template v-if="task.completed">
                      <span class="check-mark">✓</span>
                    </template>
                    <template v-else>
                      <svg
                        class="check-icon"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </template>
                    <span
                      class="task-text"
                      :class="{ completed: task.completed }"
                    >
                      <span class="task-title">오늘일독</span>
                      <span class="task-subtitle"
                        >오늘의 말씀을 읽어보세요</span
                      >
                    </span>
                  </div>
                </div>

                <div
                  class="task split-task plan-task"
                  @click="toggleTask({ id: 2, title: '성경통독표' })"
                >
                  <div class="task-content">
                    <svg
                      class="check-icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15M9 5C9 5.53043 9.21071 6.03914 9.58579 6.41421C9.96086 6.78929 10.4696 7 11 7H13C13.5304 7 14.0391 6.78929 14.4142 6.41421C14.7893 6.03914 15 5.53043 15 5M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M9 12H15M9 16H15"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span class="task-text">
                      <span class="task-title">성경통독표</span>
                      <span class="task-subtitle"
                        >전체 통독 계획을 확인하세요</span
                      >
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 영상 섹션 수정 -->
        <div class="section flex-1">
          <h2>영상</h2>
          <div class="tasks">
            <!-- 하세나하시조 (월~토에만 표시) -->
            <div
              v-if="!isSunday"
              class="task video-task"
              @click="toggleTask({ id: 3, title: '하세나하시조' })"
            >
              <div class="task-content">
                <template
                  v-if="
                    todayTasks.find((t) => t.title === '하세나하시조')
                      ?.completed
                  "
                >
                  <span class="check-mark">✓</span>
                </template>
                <template v-else>
                  <svg
                    class="check-icon"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 10L19.5528 7.72361C20.2177 7.39116 21 7.87465 21 8.61803V15.382C21 16.1253 20.2177 16.6088 19.5528 16.2764L15 14M5 18H13C14.1046 18 15 17.1046 15 16V8C15 6.89543 14.1046 6 13 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </template>
                <span
                  class="task-text"
                  :class="{
                    completed: todayTasks.find(
                      (t) => t.title === '하세나하시조'
                    )?.completed,
                  }"
                >
                  <span class="task-title">하세나하시조</span>
                  <span class="task-subtitle">함께 하시조!</span>
                </span>
              </div>
            </div>

            <!-- 개론 영상 목록 -->
            <div v-if="loadingIntros" class="loading-state"></div>
            <div
              v-else
              class="task"
              v-for="(task, index) in introTasks"
              :key="index"
              @click="navigateToIntro(task)"
            >
              <div class="task-content">
                <span
                  class="check"
                  :class="{ 'check-active': task.is_completed }"
                >
                  <span class="check-mark" v-if="task.is_completed">✓</span>
                </span>
                <svg
                  class="check-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 10L19.5528 7.72361C20.2177 7.39116 21 7.87465 21 8.61803V15.382C21 16.1253 20.2177 16.6088 19.5528 16.2764L15 14M5 18H13C14.1046 18 15 17.1046 15 16V8C15 6.89543 14.1046 6 13 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span
                  class="task-text"
                  :class="{ completed: task.is_completed }"
                >
                  <span class="task-title">{{ task.book }}</span>
                  <span class="task-subtitle">개론 영상을 시청해보세요</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section fade-in" style="animation-delay: 0.7s">
        <div class="section-header">
          <h2>참여 현황</h2>
          <div
            v-if="
              auth.isAuthenticated && subscriptionStore.activeSubscriptions.length > 1
            "
            class="plan-selector"
          >
            <button
              class="plan-select-button"
              @click="showStatsPlanDropdown = !showStatsPlanDropdown"
            >
              <span>{{ selectedPlanName }}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <!-- 드롭다운 메뉴 -->
            <div v-if="showStatsPlanDropdown" class="plan-dropdown">
              <button
                v-for="subscription in subscriptionStore.activeSubscriptions"
                :key="subscription.plan_id"
                class="dropdown-item"
                :class="{ active: subscription.plan_id === selectedPlanId }"
                @click="
                  selectPlan(subscription);
                  showStatsPlanDropdown = false;
                "
              >
                <span class="dropdown-item-text">{{
                  subscription.plan_name
                }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="stats-container">
          <!-- 방문자 통계 (통합) -->
          <div class="stat-item">
            <div class="stat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z"
                  stroke="var(--primary-dark)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ visitorStats.daily_visitors.toLocaleString() }}명 /
                {{ visitorStats.total_visitors.toLocaleString() }}명
              </div>
              <div class="stat-label">오늘 / 전체 방문자</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z"
                  stroke="var(--primary-dark)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ totalMembers.toLocaleString() }}명
              </div>
              <div class="stat-label">전체 참여자</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="var(--primary-dark)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ todayReaders.toLocaleString() }}명
              </div>
              <div class="stat-label">오늘 일독 완료</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section fade-in" style="animation-delay: 0.8s">
        <div class="section-header">
          <h2>진행률</h2>
          <div
            v-if="
              auth.isAuthenticated && subscriptionStore.activeSubscriptions.length > 1
            "
            class="plan-selector"
          >
            <button
              class="plan-select-button"
              @click="showProgressPlanDropdown = !showProgressPlanDropdown"
            >
              <span>{{ selectedPlanName }}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <!-- 드롭다운 메뉴 -->
            <div v-if="showProgressPlanDropdown" class="plan-dropdown">
              <button
                v-for="subscription in subscriptionStore.activeSubscriptions"
                :key="subscription.plan_id"
                class="dropdown-item"
                :class="{ active: subscription.plan_id === selectedPlanId }"
                @click="
                  selectPlan(subscription);
                  showProgressPlanDropdown = false;
                "
              >
                <span class="dropdown-item-text">{{
                  subscription.plan_name
                }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="progress-container">
          <div class="progress-item">
            <div class="progress-icon">
              <img
                src="@/assets/images/높은뜻 푸른교회 아이콘.png"
                alt="교회 아이콘"
                class="church-icon"
              />
            </div>
            <div class="progress-bar">
              <div
                class="progress"
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
            <div class="progress-text">{{ progressPercentage }}% / 100%</div>
          </div>
          <div class="progress-item">
            <template v-if="isAuthenticated">
              <div class="progress-content">
                <div class="progress-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke="var(--primary-dark)"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21"
                      stroke="var(--primary-dark)"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress progress-green"
                    :style="{ width: `${personalProgressPercentage}%` }"
                  ></div>
                </div>
                <div class="progress-text">
                  {{ personalProgressPercentage }}% / 100%
                </div>
              </div>
            </template>
            <template v-else>
              <div class="progress-content blur-content">
                <div class="progress-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke="var(--primary-dark)"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21"
                      stroke="var(--primary-dark)"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress progress-green"
                    style="width: 20.8%"
                  ></div>
                </div>
                <div class="progress-text">20.8% / 100%</div>
              </div>
              <div class="login-required-message">
                개인 진행률을 기록하시려면 로그인해주세요 😁
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 소셜 기능 섹션 -->
      <!-- 소셜 기능 섹션 -->
      <div class="section fade-in" style="animation-delay: 1s">
        <h2>커뮤니티</h2>
        <div class="social-features">
          <NuxtLink to="/scoreboard" class="social-card">
            <div class="social-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                <line x1="3" y1="6" x2="3" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                <line x1="3" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                <line x1="3" y1="18" x2="3" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
              </svg>
            </div>
            <div class="social-content">
              <h3>리더보드</h3>
            </div>
          </NuxtLink>

          <NuxtLink to="/groups" class="social-card">
            <div class="social-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
            <div class="social-content">
              <h3>그룹</h3>
            </div>
          </NuxtLink>

          <NuxtLink v-if="auth.isAuthenticated && auth.user?.id" :to="`/profile/${auth.user.id}`" class="social-card">
            <div class="social-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"></circle>
              </svg>
            </div>
            <div class="social-content">
              <h3>내 프로필</h3>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 일요일 알림 모달 추가 -->
    <div v-if="showSundayModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>오늘은 일독이 없는 날이에요</h3>
        </div>
        <div class="modal-body">
          <div class="modal-buttons">
            <button @click="navigateToIntro" class="modal-button intro-button">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 10L19.5528 7.72361C20.2177 7.39116 21 7.87465 21 8.61803V15.382C21 16.1253 20.2177 16.6088 19.5528 16.2764L15 14M5 18H13C14.1046 18 15 17.1046 15 16V8C15 6.89543 14.1046 6 13 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              이번 주 개론 시청
            </button>
            <button
              @click="navigateToReading"
              class="modal-button reading-button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              내일 본문부터 읽기
            </button>
          </div>
        </div>
        <button @click="closeSundayModal" class="modal-close">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useHead } from "#imports";

useHead({
  title: "매일일독",
  meta: [
    { name: "description", content: "높은뜻 푸른교회의 성경 통독 관리 서비스. 매일 말씀을 읽고 진행률을 확인하세요. 45주 성경 통독 계획으로 체계적인 말씀 묵상을 시작하세요." },
    { property: "og:title", content: "매일일독" },
    { property: "og:description", content: "높은뜻 푸른교회의 성경 통독 관리 서비스. 매일 말씀을 읽고 진행률을 확인하세요." },
    { property: "og:image", content: "https://maeil1dok.app/og-image.png" },
    { property: "og:url", content: "https://maeil1dok.app/" },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "ko_KR" },
    { property: "og:site_name", content: "매일일독" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "매일일독" },
    { name: "twitter:description", content: "높은뜻 푸른교회의 성경 통독 관리 서비스. 매일 말씀을 읽고 진행률을 확인하세요." },
    { name: "twitter:image", content: "https://maeil1dok.app/og-image.png" },
  ],
  link: [
    { rel: "canonical", href: "https://maeil1dok.app/" },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "매일일독",
        url: "https://maeil1dok.app",
        description: "매일일독과 함께 올해는 성경통독하기!",
        inLanguage: "ko-KR",
        publisher: {
          "@type": "Organization",
          name: "높은뜻 푸른교회",
        },
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "매일일독",
        url: "https://maeil1dok.app",
        applicationCategory: "ReligionApplication",
        operatingSystem: "All",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "KRW",
        },
        description: "성경 통독을 체계적으로 관리하고 진행률을 확인할 수 있는 웹 애플리케이션",
      }),
    },
  ],
});

import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useAuthStore } from "~/stores/auth";
import { useSubscriptionStore } from "~/stores/subscription";
import { useSelectedPlanStore } from "~/stores/selectedPlan";
import Header from "~/components/Header.vue";
import DailyStatus from "~/components/DailyStatus.vue";

const auth = useAuthStore();
const api = useApi();
const subscriptionStore = useSubscriptionStore();
const selectedPlanStore = useSelectedPlanStore();
const isAuthenticated = computed(() => auth.isAuthenticated);

const router = useRouter();
const introTasks = ref([]);
const loadingIntros = ref(false);
const hasenaStatus = ref(null);

const showSundayModal = ref(false);
const showPlanDropdown = ref(false);
const showStatsPlanDropdown = ref(false);


const showProgressPlanDropdown = ref(false);

const selectedPlanId = computed({
  get: () => selectedPlanStore.selectedPlanId,
  set: (value) => selectedPlanStore.setSelectedPlanId(value),
});

const selectedPlanName = computed(() => {
  if (!auth.isAuthenticated) return "기본 플랜";

  const selectedPlan = subscriptionStore.activeSubscriptions.find(
    (sub) => sub.plan_id === selectedPlanId.value
  );
  return selectedPlan ? selectedPlan.plan_name : "플랜 선택";
});

const isSunday = computed(() => {
  return new Date().getDay() === 0;
});

const fetchStats = async () => {
  try {
    const planId = selectedPlanStore.effectivePlanId;

    // 사용자 통계 가져오기
    const usersResponse = await api.get("/api/v1/todos/stats/users/", {
      params: { plan_id: planId },
    });
    if (usersResponse.data.success) {
      totalMembers.value = usersResponse.data.total_users;
    }

    const planStatsResponse = await api.get("/api/v1/todos/stats/plan/", {
      params: { plan_id: planId },
    });

    if (planStatsResponse.data.success) {
      todayReaders.value = planStatsResponse.data.today_completed_users;
    }

    const progressResponse = await api.get("/api/v1/todos/stats/progress/", {
      params: { plan_id: planId },
    });

    if (progressResponse.data.success) {
      progressPercentage.value = progressResponse.data.theoretical_progress;
      personalProgressPercentage.value = progressResponse.data.user_progress;
    }
  } catch (error) {
  }
};

(async () => {
  try {
    if (auth.isAuthenticated) {
      await subscriptionStore.fetchSubscriptions();

      selectedPlanStore.initializeFromStorage();

      if (
        !selectedPlanId.value ||
        !subscriptionStore.activeSubscriptions.find(
          (sub) => sub.plan_id === selectedPlanId.value
        )
      ) {
        if (subscriptionStore.activeSubscriptions.length > 0) {
          selectedPlanStore.setSelectedPlanId(
            subscriptionStore.activeSubscriptions[0].plan_id
          );
        }
      }
    } else {
      // 구독이 없으면 null로 설정 (기본 플랜은 effectivePlanId에서 처리)
      selectedPlanStore.setSelectedPlanId(null);
    }

    await fetchStats();
  } catch (error) {
  }
})();

const todayTasks = ref([
  {
    id: 1,
    title: "오늘일독",
    completed: false,
  },
  {
    id: 2,
    title: "성경통독표",
    completed: false,
  },
  {
    id: 3,
    title: "하세나하시조",
    completed: false,
  },
]);

// todayTasks 초기화 시 하세나하시조 항목 추가 방식 변경
const initTodayTasks = () => {
  todayTasks.value = [
    { title: "오늘일독", completed: false },
    { title: "하세나하시조", completed: false }, // 하세나하시조 항목 추가
  ];
};

// 모달 닫기
const closeSundayModal = () => {
  showSundayModal.value = false;
};

// 통계 데이터를 위한 ref 추가
const totalMembers = ref(0);
const todayReaders = ref(0);
const progressPercentage = ref(0);
const personalProgressPercentage = ref(0);

// 방문자 통계 상태 추가
const visitorStats = ref({
  daily_visitors: 0,
  total_visitors: 0,
});

// 방문자 통계 가져오기
const fetchVisitorStats = async () => {
  try {
    const response = await api.get("/api/v1/todos/stats/visitors/");
    if (response.data.success) {
      visitorStats.value = {
        daily_visitors: response.data.daily_visitors,
        total_visitors: response.data.total_visitors,
      };
    } else {
      // 오류 응답이지만 이전 값은 유지
    }
  } catch (error) {
    // 오류 발생 시 기본값 설정 (빈 화면 방지)
    if (
      !visitorStats.value.daily_visitors &&
      !visitorStats.value.total_visitors
    ) {
      visitorStats.value = {
        daily_visitors: 0,
        total_visitors: 0,
      };
    }
  }
};

// 방문자 수 증가
const incrementVisitorCount = async () => {
  try {
    const response = await api.post("/api/v1/todos/stats/visitors/increment/");

    if (response.data && response.data.success) {
      // 응답에서 직접 데이터를 사용
      visitorStats.value = {
        daily_visitors: response.data.daily_count || 0,
        total_visitors:
          visitorStats.value.total_visitors + (response.data.counted ? 1 : 0),
      };
    } else {
      // 서버에서 실패 응답이 왔을 때 통계만 가져오기
      await fetchVisitorStats();
    }
  } catch (error) {
    // 실패해도 기존 통계는 표시
    await fetchVisitorStats();
    throw error; // 에러를 다시 던져서 호출자가 처리할 수 있게 함
  }
};

// 플랜 선택 핸들러 수정
const selectPlan = async (subscription) => {
  selectedPlanStore.setSelectedPlanId(subscription.plan_id);
  showPlanDropdown.value = false;
  showStatsPlanDropdown.value = false;
  showProgressPlanDropdown.value = false;

  // 플랜 변경 시 통계 다시 로드
  await fetchStats();
};

// 드롭다운 외부 클릭 시 닫기
const closeDropdownOnOutsideClick = (event) => {
  // 오늘일독 드롭다운
  if (showPlanDropdown.value) {
    const dropdown = document.querySelector(
      ".horizontal-sections .plan-selector"
    );
    if (dropdown && !dropdown.contains(event.target)) {
      showPlanDropdown.value = false;
    }
  }

  // 참여 현황 드롭다운
  if (showStatsPlanDropdown.value) {
    const statsDropdown = document
      .querySelector(".stats-container")
      .previousElementSibling.querySelector(".plan-selector");
    if (statsDropdown && !statsDropdown.contains(event.target)) {
      showStatsPlanDropdown.value = false;
    }
  }

  // 진행률 드롭다운
  if (showProgressPlanDropdown.value) {
    const progressDropdown = document
      .querySelector(".progress-container")
      .previousElementSibling.querySelector(".plan-selector");
    if (progressDropdown && !progressDropdown.contains(event.target)) {
      showProgressPlanDropdown.value = false;
    }
  }
};

// 이벤트 리스너 등록 및 해제
// 기본 플랜 ID 가져오기
const fetchDefaultPlan = async () => {
  try {
    const response = await api.get("/api/v1/todos/plan/");
    if (response.data?.plan_id) {
      selectedPlanStore.setDefaultPlanId(response.data.plan_id);
    }
  } catch (error) {
    // 오류 시 무시
  }
};

onMounted(() => {
  document.addEventListener("click", closeDropdownOnOutsideClick);

  // 기본 플랜 ID 가져오기
  fetchDefaultPlan();

  // 방문자 카운트 관련 로직 실행
  const initVisitorCount = async () => {
    const today = new Date().toDateString();
    const visitKey = `visited_${today}`;

    if (!sessionStorage.getItem(visitKey)) {
      try {
        await incrementVisitorCount();
      } catch (error) {
        await fetchVisitorStats();
      }
      sessionStorage.setItem(visitKey, "true");
    } else {
      await fetchVisitorStats();
    }
  };

  // 페이지 데이터 로드 및 이벤트 리스너 등록
  initVisitorCount();
  fetchVideoIntros();
  initTodayTasks();
  fetchHasenaStatus();

  // 이벤트 리스너 등록
  window.addEventListener("hasenaStatusUpdated", refreshHasenaStatus);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeDropdownOnOutsideClick);

  // 컴포넌트 언마운트 시 이벤트 리스너 제거
  window.removeEventListener("hasenaStatusUpdated", refreshHasenaStatus);
});

// selectedPlanId가 변경될 때 통계 다시 로드
watch(
  () => selectedPlanId.value,
  async (newValue) => {
    if (newValue) {
      await fetchStats();
    }
  }
);

// auth 상태 변경 감시 수정
watch(
  () => auth.isAuthenticated,
  async (newValue) => {
    if (newValue) {
      await subscriptionStore.fetchSubscriptions();
      if (subscriptionStore.activeSubscriptions.length > 0) {
        // 저장된 플랜 ID가 있고 유효한 경우 그대로 사용, 아니면 첫 번째 구독의 플랜 ID 사용
        const storedPlanId = selectedPlanId.value;
        if (
          !storedPlanId ||
          !subscriptionStore.activeSubscriptions.find(
            (sub) => sub.plan_id === storedPlanId
          )
        ) {
          selectedPlanStore.setSelectedPlanId(
            subscriptionStore.activeSubscriptions[0].plan_id
          );
        }
      }
    } else {
      // 로그아웃 시 선택 플랜 초기화 (기본 플랜은 effectivePlanId에서 처리)
      selectedPlanStore.setSelectedPlanId(null);
    }
  }
);

// toggleTask 함수에서 디버깅 추가
const toggleTask = async (task) => {
  // 오늘일독 버튼
  if (task.id === 1 || task.title === "오늘일독") {
    if (isSunday.value) {
      showSundayModal.value = true;
    } else {
      await handleTodayReading();
    }
    return;
  }

  // 성경통독표 버튼 - 일정 체크 없이 바로 이동
  if (task.id === 2 || task.title === "성경통독표") {
    const planId = selectedPlanStore.effectivePlanId;
    router.push(`/reading-plan?plan=${planId}`);
    return;
  }

  // 하세나하시조 버튼 - 완료 상태 반영
  if (task.id === 3 || task.title === "하세나하시조") {
    router.push("/hasena");
    return;
  }
};

// 오늘일독 버튼 클릭 시 실행되는 함수를 단순화
const handleTodayReading = async () => {
  try {
    // 선택된 플랜 ID 확인 (비로그인 사용자는 기본 플랜 사용)
    const planId = selectedPlanStore.effectivePlanId;

    // 오늘의 스케줄 조회
    const response = await api.get(
      `/api/v1/todos/schedules/today/?plan_id=${planId}`
    );

    if (
      response.data.success &&
      response.data.schedules &&
      response.data.schedules.length > 0
    ) {
      // 첫 번째 스케줄 정보 가져오기
      const schedule = response.data.schedules[0];

      // reading 페이지로 이동
      router.push({
        path: "/reading",
        query: {
          plan: planId,
          book: schedule.book_code,
          chapter: schedule.start_chapter,
        },
      });
    } else {
      // 일정이 없는 경우에도 reading 페이지로 이동
      router.push({
        path: "/reading",
        query: { plan: planId },
      });
    }
  } catch (error) {
  }
};

// 모달에서 독서 페이지로 이동하는 함수 - 단순화
const navigateToReading = async () => {
  closeSundayModal();
  const planId = selectedPlanStore.effectivePlanId;

  try {
    // 내일 일정 가져오기
    const response = await api.get(
      `/api/v1/todos/schedules/tomorrow/?plan_id=${planId}`
    );

    if (
      response.data.success &&
      response.data.schedules &&
      response.data.schedules.length > 0
    ) {
      const schedule = response.data.schedules[0];
      const bookCode = schedule.book_code;
      const startChapter = schedule.start_chapter || 1;

      router.push(
        `/reading?plan=${planId}&book=${bookCode}&chapter=${startChapter}`
      );
    } else {
      ("내일 일정이 없습니다");
      router.push(`/reading?plan=${planId}`);
    }
  } catch (error) {
    router.push(`/reading?plan=${planId}`);
  }
};

// 모달에서 개론 영상으로 이동하는 함수 - 단순화
const navigateToIntro = (task) => {
  if (task) {
    router.push(`/intro/${task.id}`);
  } else {
    closeSundayModal();
    router.push("/intro");
  }
};

// 영상 개론 목록 가져오기
const fetchVideoIntros = async () => {
  loadingIntros.value = true;

  try {
    // 선택된 플랜 또는 기본 플랜 ID 사용
    const planId = selectedPlanStore.effectivePlanId;
    const url = planId
      ? `/api/v1/todos/user/video/intro/?plan_id=${planId}`
      : "/api/v1/todos/user/video/intro/";

    const response = await api.get(url);
    if (!response.data || !Array.isArray(response.data)) {
      // 응답이 오류인 경우 상태 코드와 헤더 확인
      introTasks.value = [];
      return;
    }

    // 현재 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 데이터 구조를 확인하고 안전하게 필터링
    introTasks.value = response.data
      .filter((item) => {
        // 데이터 구조 체크
        if (!item) return false;

        // API 응답 구조에 따라 날짜 정보 추출
        let startDateStr, endDateStr, bookName, planId;

        if (item.video_intro) {
          // video_intro 구조
          startDateStr = item.video_intro.start_date;
          endDateStr = item.video_intro.end_date;
          bookName = item.video_intro.book;
          planId = item.video_intro.plan;
        } else {
          // 직접 속성
          startDateStr = item.start_date;
          endDateStr = item.end_date;
          bookName = item.book || "이름 없음";
          planId = item.plan;
        }

        if (!startDateStr || !endDateStr) return false;

        // 선택된 플랜 ID와 일치하는지 확인 (백엔드 필터링이 이미 적용되었다면 생략 가능)
        if (
          selectedPlanId.value &&
          planId &&
          parseInt(planId) !== parseInt(selectedPlanId.value)
        ) {
          return false;
        }

        try {
          const startDate = new Date(startDateStr);
          const endDate = new Date(endDateStr);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);

          // 오늘 날짜가 시작일과 종료일 사이에 있는지 확인
          const isAvailableToday = today >= startDate && today <= endDate;

          return isAvailableToday;
        } catch (err) {
          return false;
        }
      })
      .map((item) => {
        // 데이터 구조에 따라 다르게 매핑
        if (item.video_intro) {
          return {
            id: item.video_intro.id,
            book: item.video_intro.book,
            is_completed: item.is_completed,
            url: item.video_intro.url_link,
            plan_id: item.video_intro.plan,
          };
        } else {
          return {
            id: item.id,
            book: item.book || "제목 없음",
            is_completed: item.is_completed || false,
            url: item.url_link || "",
            plan_id: item.plan,
          };
        }
      });
  } catch (err) {
    introTasks.value = [];
  } finally {
    loadingIntros.value = false;
  }
};

// auth 상태 변화 감지 시 영상 개론 목록 갱신
watch(
  () => auth.isAuthenticated,
  (newValue) => {
    // 로그인 상태에 관계없이 항상 fetchVideoIntros 호출
    fetchVideoIntros();
  }
);

// 선택된 플랜 변경 시 영상 개론 목록 갱신
watch(
  () => selectedPlanId.value,
  () => {
    fetchVideoIntros();
  }
);

// 하세나 완료 상태 조회 함수 수정
const fetchHasenaStatus = async () => {
  try {
    // 로그인 상태 확인 후 API 호출
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      // 로그인하지 않은 경우 API 호출하지 않음
      return;
    }

    const response = await useApi().get("/api/v1/todos/hasena/status/");
    hasenaStatus.value = response.data;
  } catch (error) {
    // 오류 처리 로직
  }
};

// 컴포넌트 언마운트 시 이벤트 리스너 제거
onBeforeUnmount(() => {
  document.removeEventListener("click", closeDropdownOnOutsideClick);
  window.removeEventListener("hasenaStatusUpdated", refreshHasenaStatus);
});

// 하세나 상태 변경 시 재조회
const refreshHasenaStatus = async () => {
  await fetchHasenaStatus();
};
</script>

<style scoped>
:root {
  --primary-color: #617475;
  --primary-light: #e9ecec;
  --primary-dark: #4a5a5b;
  --text-primary: #2c3e50;
  --text-secondary: #666666;
  --background-light: #fafafa;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --background-color: #efece8;
}

.header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  /* z-index 감소 */
  background: var(--background-color);
}

.content-wrapper {
  padding-top: 60px;
  /* Header의 높이만큼 상단 패딩 추가 */
}

.container {
  max-width: 768px;
  margin: 0 auto;
  background: var(--background-color);
  min-height: 100vh;
  padding-bottom: 1.5rem;
  position: relative;
  /* 추가 */
}

.section {
  background: var(--color-bg-card);
  margin: 0.875rem 1rem;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.section:hover {
  box-shadow: var(--shadow-md);
}

h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.task {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.875rem;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-100);
  -webkit-tap-highlight-color: transparent;
}

.task-content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

@media (hover: hover) {
  .task:hover:not(.completed) {
    background: var(--primary-light);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  .task:hover:not(.completed) .arrow {
    opacity: 1;
    background: rgba(97, 163, 117, 0.1);
    transform: translateX(2px);
  }
}

.task.completed {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.check {
  display: none;
}

.check-icon {
  color: var(--text-secondary);
  opacity: 0.8;
  margin-right: 0.875rem;
}

.task:hover .check-icon {
  color: var(--primary-color);
  opacity: 1;
}

.check-mark {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.875rem;
  color: var(--primary-color);
  font-size: 1.2rem;
}

.task-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: all 0.3s ease;
  position: relative;
}

.task-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
  position: relative;
  width: fit-content;
}

.task-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.completed .task-title {
  color: #999;
}

.completed .task-subtitle {
  opacity: 0.7;
  color: #999;
}

.completed .task-title::after {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 0;
  height: 1.5px;
  background-color: #999;
  animation: strikethrough 0.3s ease-out forwards;
  transform-origin: left;
  pointer-events: none;
}

@keyframes strikethrough {
  0% {
    width: 0;
  }

  100% {
    width: 100%;
  }
}

.arrow {
  color: var(--text-secondary);
  opacity: 0.6;
  transition: all 0.2s ease;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: 50%;
}

.task:not(.completed) .arrow {
  color: var(--primary-color);
}

.task.completed .arrow {
  color: #999;
  opacity: 0.8;
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  padding: 0.25rem;
}

.calendar-header {
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.25rem 0;
  text-align: center;
  opacity: 0.8;
}

.calendar-date {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-100);
  transition: all 0.2s ease;
  padding: 0.25rem 0;
}

.date-number {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
}

.date-indicator {
  position: absolute;
  bottom: 18%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: var(--primary-color);
  opacity: 0.8;
}

.calendar-date.completed {
  background: var(--color-bg-card);
  border-color: var(--primary-color);
  border-width: 1px;
}

.calendar-date.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(97, 163, 117, 0.1);
}

.calendar-date.active .date-number {
  color: white;
  font-weight: 600;
}

.calendar-date.active .date-indicator {
  background-color: white;
  opacity: 1;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-icon svg {
  width: 24px;
  height: 24px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-slate-200);
  border-radius: 999px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #366dae;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-green {
  background: var(--primary-dark);
}

.progress-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  min-width: 100px;
  font-weight: 500;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  opacity: 0;
  animation: fadeIn 0.4s ease-out forwards;
}

.horizontal-sections {
  display: flex;
  gap: 0.875rem;
  padding: 0 1rem;
  margin: 0.875rem 0;
}

.flex-1 {
  flex: 1;
  margin: 0;
}

/* 모바일 대응을 위한 미디어 쿼리 수정 */
@media (max-width: 640px) {
  .horizontal-sections {
    flex-direction: column;
    padding: 0;
    gap: 0;
    /* 간격 제거 */
  }

  .flex-1 {
    margin: 0.875rem 1rem;
    margin-bottom: 0;
    /* 하단 마진 제거 */
  }

  .flex-1 + .flex-1 {
    margin-top: 0.875rem;
    /* 두 번째 카드부터 상단 마진 적용 */
  }

  .section {
    margin: 0.875rem 1rem;
  }

  .calendar {
    gap: 0.375rem;
    padding: 0.125rem;
  }

  .calendar-date {
    border-radius: 8px;
  }
}

.church-icon {
  width: 24px;
}

.task.not-logged-in {
  opacity: 0.7;
  cursor: pointer;
}

.task.not-logged-in .task-subtitle {
  color: var(--primary-color);
}

.calendar-wrapper,
.progress-wrapper {
  position: relative;
}

.blur-content {
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
}

.login-required-message {
  position: absolute;
  top: 80%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-bg-card);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.progress-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

/* 블러 처리된 요소의 자식 요소들도 같이 블러되도록 설정 */
.blur-content > * {
  filter: blur(4px);
}

.split-task {
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.reading-task {
  background: #f5f9ff;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  border-radius: 12px 12px 0 0;
}

.reading-task:hover {
  background: #edf4ff !important;
  border-color: #366dae !important;
}

.reading-task:hover .check-icon {
  color: #366dae !important;
}

.plan-task {
  background: var(--primary-light);
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  margin-bottom: 1rem;
  border-radius: 0 0 12px 12px;
}

.plan-task:hover {
  background: #e5efeb !important;
  border-color: var(--primary-color) !important;
}

.plan-task .check-icon {
  color: var(--primary-color);
}

.reading-task .check-icon,
.reading-task .check-mark {
  color: #366dae;
}

.task:has(.task-title:contains("하세나하시조")) {
  background: #f5f9ff;
}

.task:has(.task-title:contains("하세나하시조")):hover {
  background: #edf4ff !important;
  border-color: #366dae !important;
}

.task:has(.task-title:contains("하세나하시조")) .check-icon,
.task:has(.task-title:contains("하세나하시조")) .check-mark {
  color: #366dae;
}

.video-task {
  margin-bottom: 0.5rem;
}

.coming-soon {
  background: linear-gradient(to bottom right, #ffffff, #f8f9fa);
}

.coming-soon-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 1px solid var(--color-slate-100);
  transition: all 0.2s ease;
}

.feature:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  border-radius: 10px;
}

.feature-content {
  flex: 1;
}

.feature-content h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.feature-content p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 640px) {
  .coming-soon {
    margin: 0.875rem 1rem;
  }
}

.stats-container {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-slate-50);
  border-radius: 12px;
  border: 1px solid var(--color-slate-100);
  transition: all 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  border-radius: 10px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

@media (max-width: 640px) {
  .stats-container {
    flex-direction: column;
  }
}

/* 공지사항 섹션 스타일 */
.notice-section {
  cursor: pointer;
  transition: all 0.2s ease;
}

.notice-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.04), 0 3px 6px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.03);
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.notice-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notice-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.new-badge {
  background: var(--error);
  color: white;
  font-size: 0.5rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notice-content {
  display: flex;
  align-items: center;
  background: var(--color-slate-50);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-slate-100);
}

.notice-icon.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #ebf5ff;
  border-radius: 10px;
  color: var(--info);
  margin-right: 1rem;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.8rem;
}

.notice-icon.app-icon.disabled {
  background: var(--gray-100);
  color: var(--gray-500);
}

.notice-text {
  flex: 1;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.notice-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.notice-arrow {
  color: var(--text-secondary);
  opacity: 0.6;
  margin-left: 0.5rem;
}

.notice-section:hover .notice-arrow {
  color: var(--primary-color);
  opacity: 1;
  transform: translateX(2px);
}

/* 소셜 기능 섹션 스타일 */
.social-features {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.social-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-slate-50);
  border-radius: 12px;
  border: 1px solid var(--color-slate-100);
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.social-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  background: var(--color-bg-card);
  border-color: var(--primary-color);
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  border-radius: 10px;
  color: var(--primary-dark);
  flex-shrink: 0;
}

.social-content {
  flex: 1;
}

.social-content h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* GitHub 링크 스타일 */
.github-link-container {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
  margin-top: 1rem;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.github-link:hover {
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
}

.github-icon {
  opacity: 0.7;
}

.github-link:hover .github-icon {
  opacity: 1;
}

/* 모달 스타일 추가 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  animation: modalFadeIn 0.3s ease;
}

.modal-header {
  text-align: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  font-size: 1.2rem;
  color: var(--text-primary);
  margin: 0;
}

.modal-body {
  text-align: center;
}

.modal-body p {
  color: var(--text-secondary);
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.modal-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.reading-button {
  background: #f5f9ff;
  color: #366dae;
}

.reading-button:hover {
  background: #edf4ff;
  transform: translateY(-1px);
}

.intro-button {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.intro-button:hover {
  background: #e5efeb;
  transform: translateY(-1px);
}

.modal-close {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-slate-200);
  background: var(--color-bg-card);
  border-radius: 12px;
  font-size: 0.95rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-slate-100);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 기존 스타일에 추가 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plan-selector {
  position: relative;
  margin-bottom: 1rem;
}

.plan-select-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  max-width: 125px;
  min-width: 125px;
}

.plan-select-button:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.plan-select-button span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.plan-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 160px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-slate-200);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  overflow: hidden;
  animation: dropdownFadeIn 0.2s ease;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  color: var(--text-primary);
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--color-slate-100);
  overflow: hidden;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: var(--primary-light);
}

.dropdown-item.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 500;
}

.dropdown-item-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-state {
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  background: var(--color-slate-100);
  margin: 0.875rem 1rem;
}

.empty-state {
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  background: var(--color-slate-100);
  font-size: 0.85rem;
}

/* notice-section 스타일 내부에 추가 */
.notice-icon.plan-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-light);
  border-radius: 10px;
  color: var(--primary-dark);
  margin-right: 1rem;
  flex-shrink: 0;
}

.notice-content {
  margin-bottom: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notice-content:hover {
  transform: translateY(-1px);
  background: var(--color-slate-100);
}

.notice-content + .notice-content {
  margin-top: 0.75rem;
}
</style>
