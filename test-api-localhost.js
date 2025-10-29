const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let apiCalls = [];
  
  // API 요청 모니터링
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      const url = request.url();
      apiCalls.push(url);
      console.log('✅ API 호출:', url);
    }
  });
  
  console.log('페이지 로드 중...\n');
  await page.goto('http://localhost:3003');
  await page.waitForTimeout(2000);
  
  // API 호출 분석
  console.log('\n=== API 호출 분석 ===');
  const localhost = apiCalls.filter(url => url.includes('localhost:8019')).length;
  const production = apiCalls.filter(url => url.includes('api.maeil1dok.app')).length;
  
  console.log(`✅ localhost:8019 호출: ${localhost}개`);
  console.log(`❌ api.maeil1dok.app 호출: ${production}개`);
  
  if (localhost > 0 && production === 0) {
    console.log('\n🎉 성공! 모든 API 호출이 localhost:8019로 전환되었습니다.');
  } else if (production > 0) {
    console.log('\n⚠️  아직 일부 API가 프로덕션으로 호출되고 있습니다.');
  }
  
  await browser.close();
})();