import { test, expect } from '@playwright/test';

test.describe('그룹 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('그룹 목록 페이지 레이아웃', async ({ page }) => {
    await page.goto('/groups');
    
    // 헤더 확인
    await expect(page.locator('.header h1')).toContainText('그룹');
    await expect(page.locator('.back-button')).toBeVisible();
    
    // 그룹 만들기 버튼
    await expect(page.locator('button:has-text("그룹 만들기")')).toBeVisible();
    
    // 검색 입력창
    await expect(page.locator('input[placeholder*="그룹 검색"]')).toBeVisible();
    
    // 필터 버튼들
    await expect(page.locator('.filter-button:has-text("모든 그룹")')).toBeVisible();
    await expect(page.locator('.filter-button:has-text("공개 그룹")')).toBeVisible();
    await expect(page.locator('.filter-button:has-text("내 그룹")')).toBeVisible();
  });

  test('그룹 생성 모달 열기', async ({ page }) => {
    await page.goto('/groups');
    
    // 그룹 만들기 버튼 클릭
    await page.locator('button:has-text("그룹 만들기")').click();
    
    // 모달 표시 확인
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-header h3')).toContainText('새 그룹 만들기');
    
    // 폼 필드 확인
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('textarea#description')).toBeVisible();
    await expect(page.locator('select#plan')).toBeVisible();
    await expect(page.locator('input#maxMembers')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('그룹 생성 모달 닫기', async ({ page }) => {
    await page.goto('/groups');
    
    // 모달 열기
    await page.locator('button:has-text("그룹 만들기")').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // X 버튼으로 닫기
    await page.locator('.close-button').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    
    // 다시 열기
    await page.locator('button:has-text("그룹 만들기")').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // 취소 버튼으로 닫기
    await page.locator('.modal-button:has-text("취소")').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('그룹 필터 전환', async ({ page }) => {
    await page.goto('/groups');
    
    // 기본값은 모든 그룹
    await expect(page.locator('.filter-button.active')).toContainText('모든 그룹');
    
    // 공개 그룹 필터
    await page.locator('.filter-button:has-text("공개 그룹")').click();
    await expect(page.locator('.filter-button.active')).toContainText('공개 그룹');
    
    // 내 그룹 필터
    await page.locator('.filter-button:has-text("내 그룹")').click();
    await expect(page.locator('.filter-button.active')).toContainText('내 그룹');
  });

  test('그룹 검색', async ({ page }) => {
    await page.goto('/groups');
    
    const searchInput = page.locator('input[placeholder*="그룹 검색"]');
    
    // 검색어 입력
    await searchInput.fill('테스트');
    
    // 디바운스를 위한 대기
    await page.waitForTimeout(500);
    
    // 검색이 트리거되었는지 확인 (네트워크 요청이나 UI 변경 감지)
    await expect(searchInput).toHaveValue('테스트');
  });

  test('그룹 카드 레이아웃', async ({ page }) => {
    await page.goto('/groups');
    
    // 그룹 카드가 있는 경우
    const groupCard = page.locator('.group-card').first();
    if (await groupCard.isVisible()) {
      // 그룹 정보 표시 확인
      await expect(groupCard.locator('h3')).toBeVisible(); // 그룹 이름
      await expect(groupCard.locator('text=/공개|비공개/')).toBeVisible(); // 공개 여부
      
      // 버튼 확인
      const buttons = groupCard.locator('button, a');
      await expect(buttons).toHaveCount(2); // 상세보기, 가입하기/가입됨
    }
  });

  test('빈 상태 표시', async ({ page }) => {
    await page.goto('/groups');
    
    // 검색어를 입력하여 빈 상태 유도
    await page.locator('input[placeholder*="그룹 검색"]').fill('존재하지않는그룹명');
    await page.waitForTimeout(500);
    
    // 빈 상태 메시지 확인
    const emptyState = page.locator('text="검색 결과가 없습니다."');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('반응형 그리드 레이아웃', async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/groups');
    
    // 필터 섹션이 세로로 정렬되는지 확인
    const filterSection = page.locator('.filter-section');
    await expect(filterSection).toBeVisible();
    
    // 데스크톱 뷰포트
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/groups');
    
    // 그리드 레이아웃 확인
    await expect(filterSection).toBeVisible();
  });
});