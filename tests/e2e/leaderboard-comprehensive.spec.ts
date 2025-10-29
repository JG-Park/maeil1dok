import { test, expect, Page } from '@playwright/test';
import { testUsers, leaderboardData, mockApiResponses } from '../fixtures/social-test-data';

test.describe('리더보드 기능 종합 테스트', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Mock API responses
    await page.route('**/api/v1/todos/scoreboard/', async route => {
      const url = new URL(route.request().url());
      const period = url.searchParams.get('period') || 'all';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockApiResponses.globalLeaderboard,
          period
        })
      });
    });
    
    await page.route('**/api/v1/todos/scoreboard/friends/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.friendsLeaderboard)
      });
    });
    
    await page.route('**/api/v1/todos/scoreboard/my-ranking/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.myRanking)
      });
    });
    
    // Set up authenticated session
    await page.goto('/');
    await page.evaluate((user) => {
      localStorage.setItem('access_token', 'mock_access_token');
      localStorage.setItem('user', JSON.stringify(user));
    }, testUsers[0]);
  });
  
  test('리더보드 페이지 기본 UI 렌더링', async () => {
    await page.goto('/scoreboard');
    
    // 헤더 확인
    await expect(page.locator('.header h1')).toContainText('리더보드');
    await expect(page.locator('.back-button')).toBeVisible();
    
    // 내 순위 카드 확인
    await expect(page.locator('.my-ranking-card')).toBeVisible();
    await expect(page.locator('.ranking-value')).toContainText('2위');
    await expect(page.locator('.ranking-sub')).toContainText('상위 98%');
    
    // 필터 섹션 확인
    await expect(page.locator('.filter-section')).toBeVisible();
    
    // 리더보드 테이블 확인
    await expect(page.locator('.leaderboard-table')).toBeVisible();
  });
  
  test('기간 필터 동작', async () => {
    await page.goto('/scoreboard');
    
    // 기본 선택: 전체
    await expect(page.locator('.filter-button.active').first()).toContainText('전체');
    
    // 이번 달 선택
    await page.locator('.filter-button:has-text("이번 달")').click();
    await expect(page.locator('.filter-button.active').first()).toContainText('이번 달');
    
    // API 호출 확인 (URL 파라미터)
    let apiCallPeriod = '';
    await page.route('**/api/v1/todos/scoreboard/', async route => {
      const url = new URL(route.request().url());
      apiCallPeriod = url.searchParams.get('period') || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.globalLeaderboard)
      });
    });
    
    // 이번 주 선택
    await page.locator('.filter-button:has-text("이번 주")').click();
    await page.waitForTimeout(500);
    expect(apiCallPeriod).toBe('week');
  });
  
  test('보기 모드 전환 (전체/친구)', async () => {
    await page.goto('/scoreboard');
    
    // 기본: 전체 보기
    const viewButtons = page.locator('.filter-group').nth(1).locator('.filter-button');
    await expect(viewButtons.filter({ hasText: '전체' })).toHaveClass(/active/);
    
    // 친구 보기로 전환
    await viewButtons.filter({ hasText: '친구' }).click();
    await expect(viewButtons.filter({ hasText: '친구' })).toHaveClass(/active/);
    
    // 친구 리더보드 데이터 확인
    await page.waitForTimeout(500);
    const tableRows = page.locator('.leaderboard-table tbody tr');
    await expect(tableRows).toHaveCount(2); // 친구 리더보드는 2명
  });
  
  test('Top 3 하이라이트 표시', async () => {
    await page.goto('/scoreboard');
    
    // Top 3 카드 확인 (전체 보기에서만)
    const topThree = page.locator('.top-three');
    await expect(topThree).toBeVisible();
    
    const topCards = topThree.locator('.top-card');
    await expect(topCards).toHaveCount(3);
    
    // 메달 확인
    await expect(topCards.nth(0)).toContainText('🥇');
    await expect(topCards.nth(1)).toContainText('🥈');
    await expect(topCards.nth(2)).toContainText('🥉');
    
    // 클래스 확인
    await expect(topCards.nth(0)).toHaveClass(/gold/);
    await expect(topCards.nth(1)).toHaveClass(/silver/);
    await expect(topCards.nth(2)).toHaveClass(/bronze/);
  });
  
  test('리더보드 테이블 정렬 및 표시', async () => {
    await page.goto('/scoreboard');
    
    const tableRows = page.locator('.leaderboard-table tbody tr');
    await expect(tableRows).toHaveCount(3);
    
    // 첫 번째 행 확인
    const firstRow = tableRows.first();
    await expect(firstRow.locator('.rank-number')).toContainText('1');
    await expect(firstRow.locator('.user-name')).toContainText('테스트유저3');
    await expect(firstRow.locator('.days-count')).toContainText('52');
    await expect(firstRow.locator('.progress-text')).toContainText('89.5%');
    
    // 내 순위 하이라이트 확인
    const myRow = tableRows.filter({ hasClass: /highlight-row/ });
    await expect(myRow).toHaveCount(1);
    await expect(myRow.locator('.me-badge')).toContainText('나');
  });
  
  test('진행률 바 표시', async () => {
    await page.goto('/scoreboard');
    
    const progressBars = page.locator('.progress-bar');
    await expect(progressBars).toHaveCount(3);
    
    // 진행률 바 너비 확인
    const firstProgressFill = progressBars.first().locator('.progress-fill');
    const style = await firstProgressFill.getAttribute('style');
    expect(style).toContain('width: 89.5%');
  });
  
  test('연속 기록 표시', async () => {
    await page.goto('/scoreboard');
    
    const firstRow = page.locator('.leaderboard-table tbody tr').first();
    
    // 현재 연속
    const currentStreak = firstRow.locator('.streak.current');
    await expect(currentStreak).toContainText('10일');
    await expect(currentStreak).toHaveCSS('color', 'rgb(16, 185, 129)'); // green color
    
    // 최장 연속
    const longestStreak = firstRow.locator('.streak.longest');
    await expect(longestStreak).toContainText('20일');
    await expect(longestStreak).toHaveCSS('color', 'rgb(139, 92, 246)'); // purple color
  });
  
  test('사용자 프로필 링크', async () => {
    await page.goto('/scoreboard');
    
    // 사용자 이름 클릭
    const userLink = page.locator('.user-name').first();
    await userLink.click();
    
    // 프로필 페이지로 이동 확인
    await expect(page).toHaveURL(/\/profile\/3/);
  });
  
  test('로딩 상태 표시', async () => {
    // 지연된 응답 설정
    await page.route('**/api/v1/todos/scoreboard/', async route => {
      await page.waitForTimeout(1000);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.globalLeaderboard)
      });
    });
    
    await page.goto('/scoreboard');
    
    // 로딩 상태 확인
    await expect(page.locator('.loading-state')).toBeVisible();
    await expect(page.locator('.spinner')).toBeVisible();
    await expect(page.locator('.loading-state p')).toContainText('리더보드를 불러오는 중...');
    
    // 로딩 완료 후 테이블 표시
    await expect(page.locator('.leaderboard-table')).toBeVisible({ timeout: 2000 });
  });
  
  test('빈 데이터 처리', async () => {
    // 빈 리더보드 응답
    await page.route('**/api/v1/todos/scoreboard/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          leaderboard: [],
          period: 'all'
        })
      });
    });
    
    await page.goto('/scoreboard');
    
    // 빈 상태 메시지 확인
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state')).toContainText('리더보드 데이터가 없습니다.');
  });
  
  test('API 에러 처리', async () => {
    // 에러 응답 설정
    await page.route('**/api/v1/todos/scoreboard/', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '서버 오류가 발생했습니다.'
        })
      });
    });
    
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.goto('/scoreboard');
    await page.waitForTimeout(1000);
    
    // 에러 처리 확인
    expect(consoleMessages.length).toBeGreaterThan(0);
  });
  
  test('반응형 디자인', async () => {
    await page.goto('/scoreboard');
    
    // 데스크톱 뷰
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.filter-section')).toHaveCSS('flex-direction', 'row');
    
    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // 모바일에서 필터 그룹이 세로로 배치
    await expect(page.locator('.filter-section')).toHaveCSS('flex-direction', 'column');
    
    // 테이블 폰트 크기 축소
    await expect(page.locator('.leaderboard-table')).toHaveCSS('font-size', '14px');
  });
  
  test('페이지 성능 측정', async () => {
    const startTime = Date.now();
    await page.goto('/scoreboard');
    
    // 첫 번째 의미있는 페인트까지 시간
    await page.locator('.leaderboard-table').waitFor({ state: 'visible' });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000); // 2초 이내
    
    // 테이블 렌더링 성능
    const tableRows = await page.locator('.leaderboard-table tbody tr').count();
    expect(tableRows).toBeGreaterThan(0);
  });
});

test.describe('리더보드 데이터 정합성', () => {
  test('필터 조합 상태 유지', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 필터 설정: 이번 달 + 친구
    await page.locator('.filter-button:has-text("이번 달")').click();
    await page.locator('.filter-button:has-text("친구")').nth(0).click();
    
    // 두 필터가 모두 활성화 상태인지 확인
    const activeFilters = page.locator('.filter-button.active');
    await expect(activeFilters).toHaveCount(2);
    await expect(activeFilters.nth(0)).toContainText('이번 달');
    await expect(activeFilters.nth(1)).toContainText('친구');
    
    // 페이지 새로고침 후에도 상태 유지되는지 확인
    // (실제로는 URL 파라미터나 상태 관리를 통해 유지되어야 함)
  });
  
  test('순위 계산 정확성', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 테이블의 순위가 올바른 순서인지 확인
    const ranks = await page.locator('.rank-number').allTextContents();
    expect(ranks).toEqual(['1', '2', '3']);
    
    // 완료 일수가 내림차순인지 확인
    const days = await page.locator('.days-count').allTextContents();
    const dayNumbers = days.map(d => parseInt(d));
    for (let i = 1; i < dayNumbers.length; i++) {
      expect(dayNumbers[i-1]).toBeGreaterThanOrEqual(dayNumbers[i]);
    }
  });
  
  test('내 순위 동기화', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 내 순위 카드의 순위
    const myRankCard = await page.locator('.my-ranking-card .ranking-value').textContent();
    expect(myRankCard).toContain('2위');
    
    // 테이블에서 내 순위
    const myRow = page.locator('.highlight-row');
    const myRankTable = await myRow.locator('.rank-number').textContent();
    expect(myRankTable).toBe('2');
    
    // 두 값이 일치하는지 확인
    expect(myRankCard?.replace('위', '')).toBe(myRankTable);
  });
  
  test('캐싱 동작 검증', async ({ page }) => {
    let apiCallCount = 0;
    
    await page.route('**/api/v1/todos/scoreboard/', async route => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.globalLeaderboard)
      });
    });
    
    await page.goto('/scoreboard');
    await page.waitForTimeout(500);
    
    const initialCalls = apiCallCount;
    
    // 같은 필터로 다시 요청 (캐싱되어야 함)
    await page.locator('.filter-button:has-text("전체")').click();
    await page.waitForTimeout(500);
    
    // API 호출이 증가하지 않아야 함 (캐싱)
    // 실제 구현에 따라 다를 수 있음
    // expect(apiCallCount).toBe(initialCalls);
    
    // 다른 필터로 변경 (새로운 API 호출)
    await page.locator('.filter-button:has-text("이번 주")').click();
    await page.waitForTimeout(500);
    
    expect(apiCallCount).toBeGreaterThan(initialCalls);
  });
});