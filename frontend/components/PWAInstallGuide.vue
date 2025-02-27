<template>
  <div class="pwa-install-guide">
    <!-- 탭 셀렉터 추가 -->
    <div class="platform-tabs">
      <button 
        class="tab-button" 
        :class="{ active: selectedPlatform === 'ios' }" 
        @click="selectedPlatform = 'ios'"
      >
        <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
        </svg>
        iOS
      </button>
      <button 
        class="tab-button" 
        :class="{ active: selectedPlatform === 'android' }" 
        @click="selectedPlatform = 'android'"
      >
        <svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
          <path d="M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.27-10h0l-48.54,84.07a301.25,301.25,0,0,0-246.56,0L116.18,64.45a10,10,0,1,0-17.27,10h0l47.94,83C64.53,202.22,8.24,285.55,0,384H576c-8.24-98.45-64.54-181.78-146.85-226.55"/>
        </svg>
        Android
      </button>
    </div>

    <div class="guide-content">
      <!-- iOS 가이드 -->
      <div v-if="selectedPlatform === 'ios'" class="ios-guide">
        <h2 class="guide-title">iOS에서 매일일독 앱 설치하기</h2>
        
        <div class="steps">
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-details">
              <h3 class="step-title">Safari 브라우저로 매일일독에 접속하기</h3>
              <p class="step-desc">Safari 브라우저로 매일일독에 접속하고, 하단의 '공유' 버튼을 탭하세요.</p>
              <img src="/iOS1.png" alt="Safari 공유 버튼" class="step-image" />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-details">
              <h3 class="step-title">홈 화면에 추가 옵션 선택하기</h3>
              <p class="step-desc">위로 쓸어올리고 '홈 화면에 추가' 옵션을 선택하세요.</p>
              <img src="/iOS2.png" alt="홈 화면에 추가 옵션" class="step-image" />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-details">
              <h3 class="step-title">추가 확인하기</h3>
              <p class="step-desc">우측 상단의 '추가'를 탭하세요.</p>
              <img src="/iOS3.png" alt="추가 확인" class="step-image" />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">4</div>
            <div class="step-details">
              <h3 class="step-title">앱 실행하기</h3>
              <p class="step-desc">이제 앱으로 매일일독을 사용할 수 있습니다!</p>
              <img src="/iOS4.png" alt="홈 화면 아이콘" class="step-image" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Android 가이드 -->
      <div v-else class="android-guide">
        <h2 class="guide-title">Android에서 매일일독 앱 설치하기</h2>
        
        <div class="steps">
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-details">
              <h3 class="step-title">Chrome 브라우저로 매일일독에 접속하기</h3>
              <p class="step-desc">Chrome 브라우저로 매일일독에 접속하세요.</p>
              <div class="step-tips">
                <p class="tip">💡 설치 버튼이 나타나면 '설치'를 탭하고 3단계로 진행하세요.</p>
                <p class="tip">💡 설치 버튼이 없으면 주소창 오른쪽의 메뉴(⋮)를 탭하세요.</p>
              </div>
              <img src="/android1.png" alt="Chrome 브라우저" class="step-image" />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-details">
              <h3 class="step-title">홈 화면에 추가 선택하기</h3>
              <p class="step-desc">메뉴 목록에서 '홈 화면에 추가'를 선택하세요.</p>
              <img src="/android2.png" alt="홈 화면에 추가 옵션" class="step-image" />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-details">
              <h3 class="step-title">설치 확인하기</h3>
              <p class="step-desc">'설치'를 선택하세요.</p>
              <img src="/android3.png" alt="설치 버튼" class="step-image" />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">4</div>
            <div class="step-details">
              <h3 class="step-title">앱 실행하기</h3>
              <p class="step-desc">매일일독이 앱으로 설치되고 홈 화면에서 실행할 수 있습니다.</p>
              <img src="/android4.png" alt="설치 완료" class="step-image" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PWAInstallGuide',
  data() {
    return {
      selectedPlatform: 'ios'
    }
  },
  mounted() {
    // 기기 타입에 따라 초기 탭 설정
    this.selectedPlatform = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ? 'ios' : 'android';
  }
}
</script>

<style scoped>
.pwa-install-guide {
  margin: 0 auto;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.platform-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
}

.tab-button {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.tab-button.active {
  color: var(--primary-color, #4B9F7E);
  border-bottom: 2px solid var(--primary-color, #4B9F7E);
}

.tab-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.guide-content {
  padding: 24px 16px;
}

.guide-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
  text-align: center;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-card {
  display: flex;
  gap: 16px;
  background: #f9f9f9;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-color, #4B9F7E);
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.step-details {
  flex: 1;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.step-desc {
  font-size: 0.95rem;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.step-tips {
  background: #f0f8ff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.tip {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 6px;
}

.tip:last-child {
  margin-bottom: 0;
}

.step-image {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style> 