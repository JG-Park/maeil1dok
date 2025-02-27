<template>
  <div class="pwa-install-guide">
    <div class="guide-content">
      <div v-if="isIOS" class="ios-guide">
        <h2 class="guide-title">iOS에서 매일일독 앱 설치하기</h2>
        
        <div class="steps">
          <div class="step mb-6">
            <p class="mb-2">1. Safari 브라우저로 매일일독에 접속하고, 하단의 '공유' 버튼을 탭하세요.</p>
            <img src="/iOS1.png" alt="Safari 공유 버튼" class="rounded-lg shadow-md max-w-full h-auto" />
          </div>
          
          <div class="step mb-6">
            <p class="mb-2">2. 위로 쓸어올리고 '홈 화면에 추가' 옵션을 선택하세요.</p>
            <img src="/iOS2.png" alt="홈 화면에 추가 옵션" class="rounded-lg shadow-md max-w-full h-auto" />
          </div>
          
          <div class="step mb-6">
            <p class="mb-2">3. 우측 상단의 '추가'를 탭하세요.</p>
            <img src="/iOS3.png" alt="추가 확인" class="rounded-lg shadow-md max-w-full h-auto" />
          </div>
          
          <div class="step">
            <p class="mb-2">4. 이제 앱으로 매일일독을 사용할 수 있습니다!</p>
            <img src="/iOS4.png" alt="홈 화면 아이콘" class="rounded-lg shadow-md max-w-full h-auto" />
          </div>
        </div>
      </div>
      
      <div v-else class="android-guide">
        <h2 class="guide-title">Android 설치 안내</h2>
        <p>Android 설치 안내는 준비 중입니다.</p>
        <!-- 추후 Android 안내 추가 예정 -->
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PWAInstallGuide',
  data() {
    return {
      isIOS: false
    }
  },
  mounted() {
    // iOS 기기 감지
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
}
</script>

<style scoped>
.pwa-install-guide {
  max-width: 500px;
  margin: 0 auto;
}

.guide-content {
  padding: 1rem;
}

.guide-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2C3E50;
  margin-bottom: 1.5rem;
  text-align: center;
}

.step img {
  border: 1px solid #e2e8f0;
}
</style> 