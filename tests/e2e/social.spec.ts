import { test, expect } from '@playwright/test';

test.describe('소셜 기능 통합 테스트', () => {
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

  test('메인 페이지에서 소셜 기능 진입점', async ({ page }) => {
    await page.goto('/');
    
    // 커뮤니티 섹션 확인
    const communitySection = page.locator('text="커뮤니티"');
    await expect(communitySection).toBeVisible();
    
    // 소셜 기능 카드들 확인
    await expect(page.locator('text="내 프로필"')).toBeVisible();
    await expect(page.locator('text="리더보드"')).toBeVisible();
    await expect(page.locator('text="그룹"')).toBeVisible();
  });

  test('메뉴에서 소셜 기능 접근', async ({ page }) => {
    await page.goto('/');
    
    // 메뉴 버튼 클릭
    await page.locator('.menu-button').click();
    
    // 메뉴 항목 확인
    await expect(page.locator('.menu-item:has-text("프로필")')).toBeVisible();
    await expect(page.locator('.menu-item:has-text("리더보드")')).toBeVisible();
    await expect(page.locator('.menu-item:has-text("그룹")')).toBeVisible();
  });

  test('네비게이션 플로우 - 프로필에서 다른 페이지로', async ({ page }) => {
    // 프로필 페이지에서 시작
    await page.goto('/profile/1');
    
    // 뒤로가기 버튼 테스트
    await page.locator('.back-button').click();
    await expect(page).toHaveURL('/');
    
    // 스코어보드로 이동
    await page.goto('/scoreboard');
    await expect(page.locator('.header h1')).toContainText('리더보드');
    
    // 사용자 프로필 링크 클릭 (테이블에 데이터가 있는 경우)
    const userLink = page.locator('.user-name').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await expect(page.locator('.header h1')).toContainText('프로필');
    }
  });

  test('모바일 하단 네비게이션', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 하단 네비게이션 확인
    const bottomNav = page.locator('.bottom-navigation');
    if (await bottomNav.isVisible()) {
      await expect(bottomNav.locator('.nav-item')).toHaveCount(5);
      
      // 프로필 네비게이션 아이템 클릭
      await bottomNav.locator('.nav-item:has-text("프로필")').click();
      await expect(page).toHaveURL(/\/profile\/\d+/);
    }
  });

  test('팔로우 플로우', async ({ page }) => {
    // 다른 사용자 프로필 방문
    await page.goto('/profile/2');
    
    // 팔로우 버튼 클릭
    const followButton = page.locator('.action-button');
    if (await followButton.isVisible()) {
      const buttonText = await followButton.textContent();
      
      if (buttonText?.includes('팔로우')) {
        await followButton.click();
        // API 응답 대기
        await page.waitForTimeout(500);
        
        // 버튼 텍스트가 변경되었는지 확인
        const updatedText = await followButton.textContent();
        expect(updatedText).toContain('언팔로우');
      }
    }
  });

  test('그룹 가입 플로우', async ({ page }) => {
    await page.goto('/groups');
    
    // 그룹 카드에서 가입하기 버튼 찾기
    const joinButton = page.locator('button:has-text("가입하기")').first();
    if (await joinButton.isVisible()) {
      await joinButton.click();
      
      // API 응답 대기
      await page.waitForTimeout(500);
      
      // 가입됨 상태로 변경 확인
      await expect(page.locator('button:has-text("가입됨")')).toBeVisible();
    }
  });

  test('프로필 편집 플로우', async ({ page }) => {
    // 자신의 프로필 페이지로 이동
    await page.goto('/profile/1');
    
    // 프로필 편집 버튼 클릭
    await page.locator('.action-button:has-text("프로필 편집")').click();
    
    // 프로필 편집 페이지로 이동
    await expect(page).toHaveURL('/profile/edit');
    
    // 자기소개 입력
    const bioTextarea = page.locator('textarea#bio');
    await bioTextarea.fill('테스트 자기소개입니다.');
    
    // 저장 버튼 클릭
    await page.locator('button:has-text("저장")').click();
    
    // 프로필 페이지로 돌아가기
    await expect(page).toHaveURL('/profile/1');
  });

  test('스코어보드 필터링 통합', async ({ page }) => {
    await page.goto('/scoreboard');
    
    // 기간 필터 변경
    await page.locator('.filter-button:has-text("이번 달")').click();
    
    // 보기 모드 변경
    const viewButtons = page.locator('.filter-group').nth(1).locator('.filter-button');
    await viewButtons.filter({ hasText: '친구' }).click();
    
    // 두 필터가 동시에 적용되는지 확인
    await expect(page.locator('.filter-button.active')).toHaveCount(2);
  });

  test('전체 네비게이션 일관성', async ({ page }) => {
    const pages = [
      { url: '/profile/1', title: '프로필' },
      { url: '/scoreboard', title: '리더보드' },
      { url: '/groups', title: '그룹' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      
      // 공통 헤더 요소 확인
      await expect(page.locator('.header')).toBeVisible();
      await expect(page.locator('.header h1')).toContainText(pageInfo.title);
      await expect(page.locator('.back-button')).toBeVisible();
      
      // fade-in 애니메이션 클래스 확인
      await expect(page.locator('.fade-in').first()).toBeVisible();
    }
  });
});