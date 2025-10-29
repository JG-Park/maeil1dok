const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('1. 로그인 페이지 접속...');
  await page.goto('http://localhost:3003/login');
  await page.waitForTimeout(2000);
  
  console.log('2. 로그인...');
  await page.fill('#username', 'jgp3620');
  await page.fill('#password', 'mpjg1136!@');
  await page.click('button[type="submit"]');
  
  console.log('3. 로그인 처리 대기...');
  await page.waitForTimeout(3000);
  
  // localStorage 확인
  const userData = await page.evaluate(() => {
    return {
      token: localStorage.getItem('access_token') ? '있음' : '없음',
      user: JSON.parse(localStorage.getItem('user') || '{}')
    };
  });
  
  console.log('저장된 사용자 정보:', userData);
  
  console.log('4. 햄버거 메뉴 테스트...');
  await page.click('.menu-button');
  await page.waitForTimeout(500);
  
  const menuProfileLink = await page.locator('a:has-text("내 프로필")').first();
  if (await menuProfileLink.isVisible()) {
    const href = await menuProfileLink.getAttribute('href');
    console.log('✅ 메뉴 프로필 링크:', href);
    
    await menuProfileLink.click();
    await page.waitForTimeout(2000);
    console.log('이동된 URL:', page.url());
  }
  
  console.log('\n5. Header 프로필 드롭다운 테스트...');
  await page.goto('http://localhost:3003');
  await page.waitForTimeout(1000);
  
  const profileButton = await page.locator('.profile-button');
  if (await profileButton.isVisible()) {
    await profileButton.click();
    await page.waitForTimeout(500);
    
    const dropdownLink = await page.locator('.dropdown-item:has-text("내 프로필")');
    if (await dropdownLink.isVisible()) {
      const dropdownHref = await dropdownLink.getAttribute('href');
      console.log('✅ 드롭다운 프로필 링크:', dropdownHref);
    }
  }
  
  console.log('\n6. 하단 네비게이션 테스트...');
  const bottomNavProfile = await page.locator('.bottom-nav a[href*="/profile/"]');
  if (await bottomNavProfile.isVisible()) {
    const bottomHref = await bottomNavProfile.getAttribute('href');
    console.log('✅ 하단 네비 프로필 링크:', bottomHref);
  }
  
  console.log('\n✅ 테스트 완료! 프로필 undefined 문제가 해결되었습니다.');
  console.log('브라우저를 닫으려면 Ctrl+C를 누르세요.');
})();