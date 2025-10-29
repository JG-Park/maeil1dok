const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 네트워크 요청 모니터링
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('API 요청:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('API 응답:', response.status(), response.url());
    }
  });
  
  console.log('1. 메인 페이지 접속...');
  await page.goto('http://localhost:3003');
  await page.waitForTimeout(2000);
  
  console.log('\n2. 로그인 페이지 접속...');
  await page.goto('http://localhost:3003/login');
  await page.waitForTimeout(2000);
  
  console.log('\n3. 로그인 시도...');
  await page.fill('#username', 'jgp3620');
  await page.fill('#password', 'mpjg1136!@');
  await page.click('button[type="submit"]');
  
  console.log('\n4. API 호출 대기 중...');
  await page.waitForTimeout(5000);
  
  console.log('\n5. 프로필 페이지 접속...');
  await page.goto('http://localhost:3003/profile/85');
  await page.waitForTimeout(3000);
  
  console.log('\n✅ API 설정 테스트 완료');
  console.log('로컬 개발 환경에서는 localhost:8000으로 API 호출이 되어야 합니다.');
  console.log('브라우저를 닫으려면 Ctrl+C를 누르세요.');
})();