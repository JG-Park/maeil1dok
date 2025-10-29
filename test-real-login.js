const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 메시지 출력
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });
  
  // 페이지 에러 출력
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  // 1. 로그인 페이지로 이동
  console.log('\n1. 로그인 페이지 접속...');
  await page.goto('http://localhost:3003/login');
  await page.waitForTimeout(2000);
  
  // 2. 실제 계정으로 로그인
  console.log('\n2. 실제 계정으로 로그인...');
  await page.fill('#username', 'jgp3620');
  await page.fill('#password', 'mpjg1136!@');
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  
  // 로그인 후 리다이렉트 대기
  console.log('\n3. 로그인 처리 대기...');
  await page.waitForTimeout(3000);
  
  // 3. 현재 URL 확인
  console.log('현재 URL:', page.url());
  
  // 4. localStorage와 authStore 확인
  console.log('\n4. 인증 상태 확인...');
  const authData = await page.evaluate(() => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const user = localStorage.getItem('user');
    
    return {
      token: token ? 'Token exists' : 'No token',
      refreshToken: refreshToken ? 'Refresh token exists' : 'No refresh token',
      user: user ? JSON.parse(user) : null,
      localStorage: {
        allKeys: Object.keys(localStorage)
      }
    };
  });
  
  console.log('Auth 데이터:', authData);
  
  // 5. Pinia Store 상태 확인
  console.log('\n5. Pinia authStore 상태 확인...');
  const storeState = await page.evaluate(() => {
    try {
      const nuxtEl = document.querySelector('#__nuxt');
      if (!nuxtEl || !nuxtEl.__vueApp) {
        return { error: 'Vue app not found' };
      }
      
      const app = nuxtEl.__vueApp;
      const pinia = app._context?.provides?.pinia;
      
      if (!pinia) {
        return { error: 'Pinia not found' };
      }
      
      const authStore = pinia._s.get('auth');
      
      if (authStore) {
        return {
          user: authStore.user,
          isAuthenticated: authStore.isAuthenticated,
          token: authStore.token ? 'Token exists' : 'No token'
        };
      }
      return { error: 'Auth store not found' };
    } catch (err) {
      return { error: err.message };
    }
  });
  
  console.log('Store 상태:', storeState);
  
  // 6. 메인 페이지로 이동
  console.log('\n6. 메인 페이지로 이동...');
  await page.goto('http://localhost:3003');
  await page.waitForTimeout(2000);
  
  // 7. 햄버거 메뉴 열기
  console.log('\n7. 햄버거 메뉴 열기...');
  const menuButton = await page.locator('.menu-button');
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.waitForTimeout(1000);
    
    // 프로필 링크 확인
    console.log('\n8. 프로필 링크 확인...');
    const profileLink = await page.locator('a:has-text("내 프로필")').first();
    
    if (await profileLink.isVisible()) {
      const href = await profileLink.getAttribute('href');
      console.log('프로필 링크 href:', href);
      
      // 링크 클릭해보기
      await profileLink.click();
      await page.waitForTimeout(2000);
      
      console.log('이동된 URL:', page.url());
    } else {
      console.log('프로필 링크를 찾을 수 없음');
    }
  } else {
    console.log('메뉴 버튼을 찾을 수 없음');
  }
  
  // 9. Header 프로필 버튼 확인
  console.log('\n9. Header 프로필 버튼 확인...');
  await page.goto('http://localhost:3003');
  await page.waitForTimeout(1000);
  
  const profileButton = await page.locator('.profile-button');
  if (await profileButton.isVisible()) {
    console.log('프로필 버튼 발견');
    await profileButton.click();
    await page.waitForTimeout(500);
    
    const dropdownLink = await page.locator('.dropdown-item:has-text("내 프로필")');
    if (await dropdownLink.isVisible()) {
      const dropdownHref = await dropdownLink.getAttribute('href');
      console.log('드롭다운 프로필 링크:', dropdownHref);
      
      await dropdownLink.click();
      await page.waitForTimeout(2000);
      console.log('드롭다운에서 이동된 URL:', page.url());
    }
  } else {
    console.log('프로필 버튼이 보이지 않음');
  }
  
  // 10. 컴포넌트 디버깅
  console.log('\n10. 컴포넌트 상태 디버깅...');
  const componentDebug = await page.evaluate(() => {
    try {
      // Menu 컴포넌트 찾기
      const menuPanel = document.querySelector('.menu-panel');
      let menuInfo = null;
      
      if (menuPanel) {
        // Vue 3 컴포넌트 인스턴스 접근
        const vnode = menuPanel._vnode || menuPanel.__vnode;
        if (vnode && vnode.component) {
          const instance = vnode.component;
          menuInfo = {
            props: instance.props,
            setupState: instance.setupState,
            data: instance.data
          };
        }
      }
      
      // Header 컴포넌트 찾기
      const header = document.querySelector('.header');
      let headerInfo = null;
      
      if (header) {
        const vnode = header._vnode || header.__vnode;
        if (vnode && vnode.component) {
          const instance = vnode.component;
          headerInfo = {
            props: instance.props,
            setupState: instance.setupState,
            data: instance.data
          };
        }
      }
      
      return {
        menu: menuInfo,
        header: headerInfo
      };
    } catch (err) {
      return { error: err.message };
    }
  });
  
  console.log('컴포넌트 디버그 정보:', JSON.stringify(componentDebug, null, 2));
  
  console.log('\n브라우저를 열어두고 있습니다. 수동으로 확인하세요.');
  console.log('종료하려면 Ctrl+C를 누르세요.');
})();