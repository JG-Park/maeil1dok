import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/test-users';

test.describe('인증 테스트', () => {
  test('로그인 페이지 접근', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 페이지 요소 확인
    await expect(page.locator('h1')).toContainText('로그인');
    await expect(page.locator('button:has-text("카카오로 로그인")')).toBeVisible();
    await expect(page.locator('button:has-text("구글로 로그인")')).toBeVisible();
  });

  test('로그인 상태에서 프로필 드롭다운 표시', async ({ page }) => {
    // 테스트를 위한 임시 로그인 토큰 설정
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
    
    await page.reload();
    
    // 프로필 버튼 확인
    const profileButton = page.locator('.profile-button');
    await expect(profileButton).toBeVisible();
    
    // 프로필 드롭다운 열기
    await profileButton.click();
    
    // 드롭다운 메뉴 항목 확인
    await expect(page.locator('.dropdown-menu')).toBeVisible();
    await expect(page.locator('.dropdown-item:has-text("내 프로필")')).toBeVisible();
    await expect(page.locator('.dropdown-item:has-text("프로필 편집")')).toBeVisible();
    await expect(page.locator('.dropdown-item:has-text("로그아웃")')).toBeVisible();
  });

  test('로그아웃 기능', async ({ page }) => {
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
    
    await page.reload();
    
    // 프로필 드롭다운 열기
    await page.locator('.profile-button').click();
    
    // 로그아웃 클릭
    await page.locator('.dropdown-item:has-text("로그아웃")').click();
    
    // 로그아웃 확인
    const loginButton = page.locator('.auth-button:has-text("로그인")');
    await expect(loginButton).toBeVisible();
    
    // localStorage 확인
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeNull();
  });

  test('비인증 상태에서 보호된 페이지 접근', async ({ page }) => {
    // 프로필 편집 페이지 접근 시도
    await page.goto('/profile/edit');
    
    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL('/login');
  });
});