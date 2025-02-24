# 매일일독 (Daily Bible Reading)

매일일독은 높은뜻 푸른교회의 45주 성경통독표에 기반하여
매일매일 성경통독을 통해 완전한 성경일독을 체계적으로 진행할 수 있도록 돕는 서비스입니다.

## 주요 기능

### 🎯 성경통독 관리
- 교회 제공 성경통독표 기반의 매일 읽기 가이드
- 개인별 통독 진행률 추적
- (지원 예정)소그룹별 통독 현황 및 스코어보드

### 📱 모바일 최적화 (지원 예정)
- PWA(Progressive Web App) 지원
- 웹 푸시 알림을 통한 통독 리마인더

### 🎥 영상 콘텐츠
- 주일: 성경개론 영상
- 매일: 성경 읽기 해설 및 오디오 영상

## 기술 스택

- Backend: Django (Python), MariaDB
- Frontend: Vue.js, Nuxt.js
- Infrastructure: Docker, Docker Compose
- Authentication: OAuth 2.0 (Google, Kakao)
- Notification: Firebase Cloud Messaging (FCM)

## 개발 로드맵

### 1차 개발 (현재)
- [x] 프로젝트 기획 및 설계
- [x] Django 백엔드 및 MariaDB 모델링
- [x] Vue/Nuxt.js 프론트엔드 초기 화면
- [x] Docker Compose 배포 환경
- [x] 유튜브 영상 등록 및 관리
- [x] 회원 기능 구현
- [ ] 성경통독표 및 진행률 저장 기능

### 2차 개발
- [ ] OAuth 로그인 (카카오, 구글)
- [ ] 소그룹 생성 및 참여 기능
- [ ] 소그룹별 스코어보드 UI

### 3차 개발
- [ ] PWA 설정 및 웹 푸시 알림
- [ ] 성능 최적화 및 테스트

## 프로젝트 참여
주님께서 제게 맡겨주신 달란트를 이렇게 사용해보고 싶었습니다.
또한 개인의 자기 계발과 성장을 위해 매일일독을 개발하고 있습니다.
따라서 아직은 프로젝트 참여는 받지 않는 점 양해 부탁드립니다!

## 라이선스
MIT License
