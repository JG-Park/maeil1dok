# 매일일독 배포 가이드

## 프로덕션 환경 설정

### 1. 환경 변수 설정

프로덕션 환경에서는 다음 환경 변수가 반드시 설정되어야 합니다:

#### 루트 `.env` 파일에 추가 필요

```bash
# 프로덕션 환경 설정
NODE_ENV=production

# API Base URL (중요!)
# 이 설정이 없으면 Mixed Content 에러 발생 (HTTPS → HTTP 차단)
NUXT_PUBLIC_API_BASE=https://api.maeil1dok.app
```

### 2. Mixed Content 에러 해결

#### 문제
프로덕션 환경(HTTPS)에서 `NUXT_PUBLIC_API_BASE`가 설정되지 않으면:
- 기본값으로 `http://localhost:8019` 사용
- HTTPS 사이트에서 HTTP API 호출 시도
- 브라우저가 Mixed Content Policy로 차단
- 카카오 로그인 등 API 호출 실패

#### 해결
루트 `.env` 파일에 다음을 추가:

```bash
NUXT_PUBLIC_API_BASE=https://api.maeil1dok.app
```

### 3. Docker Compose 배포

Docker Compose는 루트 `.env` 파일의 환경 변수를 자동으로 읽습니다:

```yaml
# docker-compose.yml
frontend:
  environment:
    - NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE:-http://localhost:8019}
```

### 4. 배포 체크리스트

- [ ] 루트 `.env` 파일에 `NUXT_PUBLIC_API_BASE=https://api.maeil1dok.app` 추가
- [ ] `NODE_ENV=production` 설정
- [ ] 카카오 OAuth 설정 확인 (`KAKAO_CLIENT_ID`, `KAKAO_REDIRECT_URI`)
- [ ] 데이터베이스 설정 확인
- [ ] `docker-compose up -d --build` 실행
- [ ] 브라우저 콘솔에서 Mixed Content 에러 없는지 확인

### 5. 참고

`.env.example` 파일에 모든 필수 환경 변수가 문서화되어 있습니다.
