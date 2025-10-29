const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 및 네트워크 로그
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('브라우저 에러:', msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/v1/auth/token/')) {
      console.log('로그인 API 응답:', response.status(), response.statusText());
    }
  });
  
  console.log('1. 로그인 페이지 접속...');
  await page.goto('http://localhost:3003/login');
  await page.waitForTimeout(2000);
  
  console.log('2. 로그인 정보 입력...');
  await page.fill('#username', 'jgp3620');
  await page.fill('#password', 'mpjg1136!@');
  
  console.log('3. 로그인 버튼 클릭...');
  await page.click('button[type="submit"]');
  
  console.log('4. 로그인 처리 대기...');
  await page.waitForTimeout(3000);
  
  console.log('5. 현재 URL:', page.url());
  
  // localStorage 확인
  const authData = await page.evaluate(() => {
    return {
      token: localStorage.getItem('access_token') ? '✅ 있음' : '❌ 없음',
      refresh: localStorage.getItem('refresh_token') ? '✅ 있음' : '❌ 없음',
      user: localStorage.getItem('user') ? '✅ 있음' : '❌ 없음'
    };
  });
  
  console.log('\n=== 인증 정보 ===');
  console.log('Access Token:', authData.token);
  console.log('Refresh Token:', authData.refresh);
  console.log('User Info:', authData.user);
  
  if (authData.token === '✅ 있음') {
    console.log('\n✅ 로그인 성공!');
    
    // 프로필 페이지 테스트
    console.log('\n6. 프로필 페이지 이동...');
    await page.goto('http://localhost:3003/profile/1');
    await page.waitForTimeout(2000);
    
    const profileName = await page.textContent('.profile-name').catch(() => null);
    console.log('프로필 이름:', profileName || '로드 실패');
  } else {
    console.log('\n❌ 로그인 실패');
  }
  
  console.log('\n브라우저를 닫으려면 Ctrl+C를 누르세요.');
})();