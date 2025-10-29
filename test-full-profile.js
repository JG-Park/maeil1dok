const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== 프로필 시스템 전체 테스트 ===\n');
  
  // 1. 로그인
  console.log('1. 로그인...');
  await page.goto('http://localhost:3003/login');
  await page.fill('#username', 'jgp3620');
  await page.fill('#password', 'mpjg1136!@');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  // 2. 프로필 페이지 접속
  console.log('2. 프로필 페이지 접속...');
  await page.goto('http://localhost:3003/profile/1');
  await page.waitForTimeout(2000);
  
  // 프로필 정보 확인
  const profileName = await page.textContent('.profile-name').catch(() => null);
  console.log(`   프로필 이름: ${profileName || '로드 실패'}`);
  
  // 3. 다른 사용자 프로필 확인
  console.log('\n3. 다른 사용자 프로필 확인...');
  await page.goto('http://localhost:3003/profile/2');
  await page.waitForTimeout(2000);
  
  // 팔로우 버튼 확인
  const followButton = await page.locator('button:has-text("팔로우")').isVisible().catch(() => false);
  console.log(`   팔로우 버튼: ${followButton ? '✅ 표시됨' : '❌ 없음'}`);
  
  // 4. 스코어보드 확인
  console.log('\n4. 스코어보드 페이지...');
  await page.goto('http://localhost:3003/scoreboard');
  await page.waitForTimeout(2000);
  
  const scoreboardTitle = await page.textContent('h1').catch(() => null);
  console.log(`   페이지 제목: ${scoreboardTitle || '로드 실패'}`);
  
  // 5. 그룹 페이지 확인
  console.log('\n5. 그룹 페이지...');
  await page.goto('http://localhost:3003/groups');
  await page.waitForTimeout(2000);
  
  const groupsTitle = await page.textContent('h1').catch(() => null);
  console.log(`   페이지 제목: ${groupsTitle || '로드 실패'}`);
  
  console.log('\n✅ 테스트 완료!');
  console.log('브라우저를 닫으려면 Ctrl+C를 누르세요.');
})();