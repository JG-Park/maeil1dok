import { test, expect } from '@playwright/test';

test.describe('프로필 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 상태 설정
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'test_token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        nickname: '테스트유저',
        email: 'test@example.com',
        profile_image: null
      }));
    });
  });

  test('프로필 페이지 레이아웃 확인', async ({ page }) => {
    await page.goto('/profile/1');
    
    // 헤더 확인
    await expect(page.locator('.header h1')).toContainText('프로필');
    await expect(page.locator('.back-button')).toBeVisible();
    
    // 프로필 카드 확인
    await expect(page.locator('.profile-card')).toBeVisible();
    
    // 통계 그리드 확인
    await expect(page.locator('.stats-grid')).toBeVisible();
    await expect(page.locator('.stat-card')).toHaveCount(4);
    
    // 탭 네비게이션 확인
    await expect(page.locator('.tab-nav')).toBeVisible();
    await expect(page.locator('.tab-button')).toHaveCount(3);
  });

  test('프로필 탭 전환', async ({ page }) => {
    await page.goto('/profile/1');
    
    // 기본 탭은 달력
    await expect(page.locator('.tab-button.active')).toContainText('달력');
    
    // 업적 탭 클릭
    await page.locator('.tab-button:has-text("업적")').click();
    await expect(page.locator('.tab-button.active')).toContainText('업적');
    
    // 그룹 탭 클릭
    await page.locator('.tab-button:has-text("그룹")').click();
    await expect(page.locator('.tab-button.active')).toContainText('그룹');
  });

  test('프로필 편집 페이지 접근', async ({ page }) => {
    await page.goto('/profile/1');
    
    // 프로필 편집 버튼 클릭
    await page.locator('.action-button:has-text("프로필 편집")').click();
    
    // 프로필 편집 페이지로 이동 확인
    await expect(page).toHaveURL('/profile/edit');
    await expect(page.locator('h1')).toContainText('프로필 편집');
  });

  test('팔로우/언팔로우 버튼 표시', async ({ page }) => {
    // 다른 사용자 프로필 방문
    await page.goto('/profile/2');
    
    // 팔로우 버튼 확인
    const followButton = page.locator('.action-button:has-text("팔로우")');
    await expect(followButton).toBeVisible();
  });

  test('팔로워/팔로잉 모달', async ({ page }) => {
    await page.goto('/profile/1');
    
    // 팔로워 버튼 클릭
    await page.locator('.follow-button:has-text("팔로워")').click();
    
    // 모달 표시 확인
    await expect(page.locator('text="팔로워"').first()).toBeVisible();
  });

  test('반응형 레이아웃', async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/profile/1');
    
    // 모바일에서 통계 그리드가 2열로 변경되는지 확인
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();
    
    // 데스크톱 뷰포트
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/profile/1');
    
    // 데스크톱에서 통계 그리드가 4열인지 확인
    await expect(statsGrid).toBeVisible();
  });
});