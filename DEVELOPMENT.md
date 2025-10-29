# 개발 환경 설정 가이드

## 환경 구성

이 프로젝트는 Docker Compose를 기반으로 구성되어 있습니다.

### 포트 설정
- **Backend API**: 8019
- **Frontend**: 3019 (Docker), 3003 (로컬 npm run dev)
- **MySQL**: 3319
- **phpMyAdmin**: 8099

## 실행 방법

### 1. Docker Compose (권장)
```bash
# 전체 서비스 실행
docker-compose up

# 백그라운드 실행
docker-compose up -d

# 서비스 중지
docker-compose down
```

### 2. 로컬 개발 (프론트엔드만)
```bash
# Backend는 Docker로 실행
docker-compose up db backend

# Frontend는 로컬에서 실행 (Hot Reload 활성화)
cd frontend
npm install
npm run dev
```

## API 설정

### 개발 환경
- **Docker Compose**: 자동으로 `http://localhost:8019` 사용
- **로컬 npm run dev**: 자동으로 `http://localhost:8019` 사용
- **SSR**: Docker 환경에서는 `http://backend:8000`, 로컬에서는 `http://localhost:8019`

### 프로덕션 환경
`.env` 파일에 설정:
```bash
NUXT_PUBLIC_API_BASE=https://api.maeil1dok.app
```

## 환경 변수

### 프론트엔드 (.env)
```bash
# API Base URL (선택적, 기본값 사용 권장)
# NUXT_PUBLIC_API_BASE=http://localhost:8019

# OAuth 설정
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_JS_KEY=your_kakao_js_key
GOOGLE_CLIENT_ID=your_google_client_id
```

### 백엔드 (backend/.env)
```bash
DEBUG=True
SECRET_KEY=your_secret_key
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=db  # Docker 환경
```

## 데이터베이스

### phpMyAdmin 접속
```
URL: http://localhost:8099
서버: db
사용자: dailybible_dev
비밀번호: .env 파일 참조
```

### 마이그레이션
```bash
# Docker 환경
docker-compose exec backend python manage.py migrate

# 로컬 환경
cd backend
python manage.py migrate
```

## 트러블슈팅

### CORS 에러
백엔드 `.env`의 `CORS_ALLOWED_ORIGINS`에 프론트엔드 URL 추가 필요

### API 연결 실패
1. Backend 서비스 실행 확인: `docker-compose ps`
2. 포트 확인: Backend는 8019 포트 사용
3. 방화벽 설정 확인

### 프론트엔드 포트 충돌
기본 포트 3000이 사용 중일 경우 자동으로 3003 등으로 변경됨

## 개발 워크플로우

1. **기능 개발**: 로컬에서 프론트엔드 개발 (npm run dev)
2. **통합 테스트**: Docker Compose로 전체 서비스 실행
3. **프로덕션 빌드**: Docker 이미지 빌드 및 배포

## 주요 명령어

```bash
# 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend

# 컨테이너 재시작
docker-compose restart backend

# 데이터베이스 초기화
docker-compose down -v
docker-compose up

# 슈퍼유저 생성
docker-compose exec backend python manage.py createsuperuser
```