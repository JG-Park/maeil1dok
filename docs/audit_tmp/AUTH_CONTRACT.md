# 인증 계약 (Authentication Contract)

## 1. 인증 기준

| 항목 | 정의 |
|------|------|
| **로그인 성공** | 서버에서 JWT 토큰 발급 + HttpOnly 쿠키 설정 |
| **로그인 유지** | 브라우저 요청에 쿠키가 자동 포함됨 |
| **인증 상태 확인** | `/api/v1/auth/user/` 호출로 세션 유효성 검증 |
| **인증 판단 기준** | `user` 객체 존재 여부 (프론트엔드) |

## 2. 토큰 정책

| 토큰 | TTL | 저장 위치 | 설명 |
|------|-----|----------|------|
| Access Token | 1시간 | HttpOnly Cookie | API 인증에 사용 |
| Refresh Token | 30일 | HttpOnly Cookie | Access Token 갱신에 사용 |

## 3. 쿠키 설정

| 속성 | 프로덕션 | 개발 |
|------|---------|------|
| HttpOnly | true | true |
| Secure | true | false |
| SameSite | None | Lax |
| Path | / | / |

## 4. 인증 흐름

### 4.1 로그인

```
사용자 → 카카오 OAuth → 백엔드 callback
    → JWT 발급 → HttpOnly 쿠키 설정
    → 프론트엔드 → user 정보 저장
```

### 4.2 새로고침 시 인증 복원

```
페이지 로드 → auth-init.client.ts
    → initializeAuth() 호출
    → /api/v1/auth/user/ 요청 (쿠키 자동 포함)
    → 200: user 정보 저장 → 인증됨
    → 401: 비인증 상태로 전환
```

### 4.3 토큰 갱신

```
Access Token 만료 → 401 응답
    → /api/v1/auth/token/refresh/ 요청
    → 쿠키에서 Refresh Token 읽음
    → 새 Access Token 발급 → 쿠키 갱신
    → 원래 요청 재시도
```

### 4.4 로그아웃

```
로그아웃 요청 → /api/v1/auth/logout/
    → Refresh Token 블랙리스트 처리
    → 쿠키 삭제
    → 프론트엔드 상태 초기화
```

## 5. 에러 처리

| HTTP 상태 | 의미 | 프론트엔드 처리 |
|----------|------|----------------|
| 200 | 인증 성공 | user 정보 저장 |
| 401 | 미인증/토큰 만료 | 토큰 갱신 시도 → 실패 시 로그아웃 |
| 403 | 권한 없음 | 에러 표시 |

## 6. 보안 정책

- 토큰은 HttpOnly 쿠키에만 저장 (XSS 방어)
- localStorage는 하위 호환용으로만 사용 (마이그레이션 완료 후 제거 예정)
- CORS는 명시적 오리진 목록만 허용
- 에러 메시지에 내부 정보 노출 금지
