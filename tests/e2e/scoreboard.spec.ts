import { test, expect } from '@playwright/test';

test.describe('스코어보드 기능 테스트', () => {
  test('스코어보드 페이지 레이아웃', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 헤더 확인
    await expect(page.locator('.header h1')).toContainText('리더보드');
    await expect(page.locator('.back-button')).toBeVisible();
    
    // 필터 섹션 확인
    await expect(page.locator('.filter-section')).toBeVisible();
    
    // 기간 필터 버튼
    await expect(page.locator('.filter-button:has-text("전체")')).toBeVisible();
    await expect(page.locator('.filter-button:has-text("이번 달")')).toBeVisible();
    await expect(page.locator('.filter-button:has-text("이번 주")')).toBeVisible();
    
    // 보기 모드 버튼
    await expect(page.locator('.filter-button:has-text("전체")').nth(1)).toBeVisible();
    await expect(page.locator('.filter-button:has-text("친구")')).toBeVisible();
  });

  test('기간 필터 전환', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 기본값은 전체
    await expect(page.locator('.filter-button.active').first()).toContainText('전체');
    
    // 이번 달 클릭
    await page.locator('.filter-button:has-text("이번 달")').click();
    await expect(page.locator('.filter-button.active').first()).toContainText('이번 달');
    
    // 이번 주 클릭
    await page.locator('.filter-button:has-text("이번 주")').click();
    await expect(page.locator('.filter-button.active').first()).toContainText('이번 주');
  });

  test('보기 모드 전환', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 로그인 상태 설정
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'test_token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        nickname: '테스트유저',
        email: 'test@example.com'
      }));
    });
    await page.reload();
    
    // 전체 보기가 기본
    const viewButtons = page.locator('.filter-group').nth(1).locator('.filter-button');
    await expect(viewButtons.filter({ hasText: '전체' })).toHaveClass(/active/);
    
    // 친구 보기로 전환
    await viewButtons.filter({ hasText: '친구' }).click();
    await expect(viewButtons.filter({ hasText: '친구' })).toHaveClass(/active/);
  });

  test('내 순위 카드 표시', async ({ page }) => {
    // 로그인 상태 설정
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'test_token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        nickname: '테스트유저',
        email: 'test@example.com'
      }));
    });
    
    await page.goto('/scoreboard');
    
    // 내 순위 카드가 표시되는지 확인
    const rankingCard = page.locator('.my-ranking-card');
    await expect(rankingCard).toBeVisible();
  });

  test('리더보드 테이블 구조', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 테이블 헤더 확인
    const tableHeaders = page.locator('.leaderboard-table th');
    await expect(tableHeaders).toContainText(['순위', '사용자', '완료 일수', '진행률', '현재 연속', '최장 연속']);
  });

  test('Top 3 하이라이트', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 전체 보기에서 Top 3 카드 표시 확인
    const topThree = page.locator('.top-three');
    
    // Top 3 카드가 있을 때만 테스트
    if (await topThree.isVisible()) {
      const topCards = page.locator('.top-card');
      await expect(topCards.first()).toHaveClass(/gold/);
    }
  });

  test('반응형 테이블', async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/scoreboard');
    
    // 테이블이 스크롤 가능한지 확인
    const tableWrapper = page.locator('.table-wrapper');
    await expect(tableWrapper).toBeVisible();
    
    // 데스크톱 뷰포트
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/scoreboard');
    
    await expect(tableWrapper).toBeVisible();
  });
});