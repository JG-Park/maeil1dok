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
              <img 
                src="/iOS1.png" 
                alt="Safari 공유 버튼" 
                class="step-image" 
                @click="openImageModal('/iOS1.png')" 
              />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-details">
              <h3 class="step-title">홈 화면에 추가 옵션 선택하기</h3>
              <p class="step-desc">위로 쓸어올리고 '홈 화면에 추가' 옵션을 선택하세요.</p>
              <img 
                src="/iOS2.png" 
                alt="홈 화면에 추가 옵션" 
                class="step-image" 
                @click="openImageModal('/iOS2.png')" 
              />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-details">
              <h3 class="step-title">추가 확인하기</h3>
              <p class="step-desc">우측 상단의 '추가'를 탭하세요.</p>
              <img 
                src="/iOS3.png" 
                alt="추가 확인" 
                class="step-image" 
                @click="openImageModal('/iOS3.png')" 
              />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">4</div>
            <div class="step-details">
              <h3 class="step-title">앱 실행하기</h3>
              <p class="step-desc">이제 앱으로 매일일독을 사용할 수 있습니다!</p>
              <img 
                src="/iOS4.png" 
                alt="홈 화면 아이콘" 
                class="step-image" 
                @click="openImageModal('/iOS4.png')" 
              />
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
              <h3 class="step-title">매일일독 접속하기</h3>
              <p class="step-desc">Chrome 브라우저로 매일일독에 접속하세요.</p>
              <div class="step-tips">
                <p class="tip">💡 설치 버튼이 나타나면 '설치'를 탭하고 3단계로 진행하세요.</p>
                <p class="tip">💡 설치 버튼이 없으면 주소창 오른쪽의 메뉴(⋮)를 탭하세요.</p>
              </div>
              <img 
                src="/Android1.png" 
                alt="Chrome 브라우저" 
                class="step-image" 
                @click="openImageModal('/Android1.png')" 
              />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-details">
              <h3 class="step-title">홈 화면에 추가 선택하기</h3>
              <p class="step-desc">메뉴 목록에서 '홈 화면에 추가'를 선택하세요.</p>
              <img 
                src="/Android2.png" 
                alt="홈 화면에 추가 옵션" 
                class="step-image" 
                @click="openImageModal('/Android2.png')" 
              />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-details">
              <h3 class="step-title">설치 확인하기</h3>
              <p class="step-desc">'설치'를 선택하세요.</p>
              <img 
                src="/Android3.png" 
                alt="설치 버튼" 
                class="step-image" 
                @click="openImageModal('/Android3.png')" 
              />
            </div>
          </div>
          
          <div class="step-card">
            <div class="step-number">4</div>
            <div class="step-details">
              <h3 class="step-title">앱 실행하기</h3>
              <p class="step-desc">매일일독이 앱으로 설치되고 홈 화면에서 실행할 수 있습니다.</p>
              <img 
                src="/Android4.png" 
                alt="설치 완료" 
                class="step-image" 
                @click="openImageModal('/Android4.png')" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 이미지 모달 - teleport를 사용하여 body에 직접 렌더링 -->
    <teleport to="body">
      <div v-if="showModal" class="fullscreen-image-modal" @click="closeImageModal">
        <div class="modal-content" @click.stop>
          <div class="modal-controls">
            <button class="zoom-button" @click="zoomIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <button class="zoom-button" @click="zoomOut">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <button class="close-button" @click="closeImageModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div 
            class="image-container" 
            :style="{ 
              transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})` 
            }"
            ref="imageContainer"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <img :src="currentImage" alt="확대된 이미지" class="modal-image" />
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
export default {
  name: 'PWAInstallGuide',
  data() {
    return {
      selectedPlatform: 'ios',
      showModal: false,
      currentImage: '',
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      touchStartDistance: 0
    }
  },
  mounted() {
    // 기기 타입에 따라 초기 탭 설정
    this.selectedPlatform = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ? 'ios' : 'android';
  },
  methods: {
    openImageModal(imageUrl) {
      this.currentImage = imageUrl;
      this.showModal = true;
      this.zoomLevel = 1;
      this.panX = 0;
      this.panY = 0;
      document.body.style.overflow = 'hidden';
    },
    closeImageModal() {
      this.showModal = false;
      document.body.style.overflow = '';
    },
    zoomIn() {
      if (this.zoomLevel < 3) {
        this.zoomLevel += 0.5;
      }
    },
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel -= 0.5;
        // 줌 아웃 시 이미지가 화면 밖으로 나가지 않도록 조정
        this.constrainPan();
      }
    },
    // 이미지 드래그 움직임 제한
    constrainPan() {
      // 줌 레벨이 1 이하면 이동 안 함
      if (this.zoomLevel <= 1) {
        this.panX = 0;
        this.panY = 0;
      }
      // 이동 범위 제한 (간단한 구현)
      const maxPan = (this.zoomLevel - 1) * 150;
      this.panX = Math.max(-maxPan, Math.min(maxPan, this.panX));
      this.panY = Math.max(-maxPan, Math.min(maxPan, this.panY));
    },
    // 터치 이벤트 핸들러
    handleTouchStart(event) {
      event.preventDefault();
      
      // 멀티 터치 감지 (핀치)
      if (event.touches.length === 2) {
        // 두 손가락 사이의 거리 계산
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        this.touchStartDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      } 
      // 싱글 터치 (이동)
      else if (event.touches.length === 1) {
        this.startX = event.touches[0].clientX;
        this.startY = event.touches[0].clientY;
        this.lastX = this.panX;
        this.lastY = this.panY;
      }
    },
    handleTouchMove(event) {
      event.preventDefault();
      
      // 핀치 줌 (두 손가락)
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        // 핀치 거리 변화에 따른 줌 레벨 조정
        if (this.touchStartDistance > 0) {
          const scale = currentDistance / this.touchStartDistance;
          const newZoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel * scale));
          
          // 급격한 변화 방지를 위한 감쇠
          this.zoomLevel = this.zoomLevel + (newZoomLevel - this.zoomLevel) * 0.1;
          this.touchStartDistance = currentDistance;
        }
      } 
      // 이미지 이동 (한 손가락)
      else if (event.touches.length === 1 && this.zoomLevel > 1) {
        const moveX = event.touches[0].clientX - this.startX;
        const moveY = event.touches[0].clientY - this.startY;
        
        // 확대된 상태에서만 이동 허용
        this.panX = this.lastX + moveX * 0.8; // 이동 감도 조정
        this.panY = this.lastY + moveY * 0.8;
        this.constrainPan();
      }
    },
    handleTouchEnd(event) {
      // 터치 종료 시 제약 적용
      this.constrainPan();
    }
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
  cursor: pointer;
  transition: opacity 0.2s;
}

.step-image:hover {
  opacity: 0.9;
}

/* 이미지 모달 스타일 재정의 */
.fullscreen-image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: zoom-out;
}

.modal-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease; /* 부드러운 이동을 위해 transition 시간 줄임 */
  will-change: transform; /* 성능 최적화 */
  touch-action: none; /* 브라우저 기본 터치 동작 방지 */
}

.modal-image {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  user-select: none; /* 이미지 선택 방지 */
  -webkit-user-drag: none; /* 이미지 드래그 방지 */
}

.modal-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  z-index: 10000;
}

.zoom-button, .close-button {
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.zoom-button:hover, .close-button:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style> 