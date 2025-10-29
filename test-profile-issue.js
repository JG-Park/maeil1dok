const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 개발자 도구 콘솔 메시지 출력
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });
  
  // 페이지 에러 출력
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  // 1. 메인 페이지 접속
  console.log('\n1. 메인 페이지 접속...');
  await page.goto('http://localhost:3003');
  await page.waitForTimeout(2000);
  
  // 2. 로그인 상태 시뮬레이션
  console.log('\n2. 로그인 상태 설정...');
  await page.evaluate(() => {
    const testUser = {
      id: 123,
      nickname: '테스트유저',
      email: 'test@example.com',
      profile_image: null
    };
    
    // localStorage에 토큰과 사용자 정보 저장
    localStorage.setItem('access_token', 'test_token_12345');
    localStorage.setItem('refresh_token', 'refresh_token_12345');
    localStorage.setItem('user', JSON.stringify(testUser));
    
    console.log('localStorage 설정 완료:', {
      token: localStorage.getItem('access_token'),
      user: localStorage.getItem('user')
    });
  });
  
  // 3. 페이지 새로고침
  console.log('\n3. 페이지 새로고침...');
  await page.reload();
  await page.waitForTimeout(2000);
  
  // 4. authStore 상태 확인
  console.log('\n4. authStore 상태 확인...');
  
  // 앱이 완전히 로드될 때까지 대기
  await page.waitForFunction(() => {
    return document.querySelector('#__nuxt') && 
           document.querySelector('#__nuxt').__vueApp;
  }, { timeout: 5000 }).catch(() => {
    console.log('Vue 앱이 로드되지 않음');
    return null;
  });
  
  const authStoreState = await page.evaluate(() => {
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
          token: authStore.token,
          storeExists: true
        };
      }
      return { error: 'Auth store not found' };
    } catch (err) {
      return { error: err.message };
    }
  });
  
  console.log('AuthStore 상태:', authStoreState);
  
  // 5. 햄버거 메뉴 클릭
  console.log('\n5. 햄버거 메뉴 열기...');
  await page.click('.menu-button');
  await page.waitForTimeout(1000);
  
  // 6. 프로필 링크 확인
  console.log('\n6. 프로필 링크 확인...');
  const profileLink = await page.locator('.menu-item:has-text("내 프로필")');
  
  if (await profileLink.isVisible()) {
    const href = await profileLink.getAttribute('href');
    console.log('프로필 링크 href:', href);
    
    // 링크 내부의 실제 값 확인
    const linkInfo = await page.evaluate(() => {
      const link = document.querySelector('.menu-item:has-text("내 프로필")');
      return {
        href: link?.getAttribute('href'),
        innerHTML: link?.innerHTML
      };
    });
    console.log('링크 정보:', linkInfo);
  } else {
    console.log('프로필 링크가 보이지 않음');
  }
  
  // 7. 컴포넌트 내부 상태 확인
  console.log('\n7. Menu 컴포넌트 상태 확인...');
  const menuComponentState = await page.evaluate(() => {
    try {
      const menuEl = document.querySelector('.menu-panel');
      if (menuEl && menuEl.__vueParentComponent) {
        const component = menuEl.__vueParentComponent;
        return {
          user: component.ctx?.user,
          authStore: component.ctx?.authStore,
          componentExists: true
        };
      }
      return { error: 'Menu component not found' };
    } catch (err) {
      return { error: err.message };
    }
  });
  
  console.log('Menu 컴포넌트 상태:', menuComponentState);
  
  // 8. Header 프로필 버튼 확인
  console.log('\n8. Header 프로필 버튼 확인...');
  const profileButton = await page.locator('.profile-button');
  if (await profileButton.isVisible()) {
    await profileButton.click();
    await page.waitForTimeout(1000);
    
    const profileDropdownLink = await page.locator('.dropdown-item:has-text("내 프로필")');
    if (await profileDropdownLink.isVisible()) {
      const dropdownHref = await profileDropdownLink.getAttribute('href');
      console.log('드롭다운 프로필 링크:', dropdownHref);
    }
  }
  
  // 브라우저는 열어둠
  console.log('\n브라우저를 열어두고 있습니다. 수동으로 확인하세요.');
  console.log('종료하려면 Ctrl+C를 누르세요.');
})();