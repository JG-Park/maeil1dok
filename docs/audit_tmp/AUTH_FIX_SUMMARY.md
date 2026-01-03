# 인증 시스템 버그 수정 요약

## 문제 현상

**증상**: 페이지 새로고침 시 로그인 상태 소실

## 근본 원인

### 버그 #1: API Guard에서 인증 확인 엔드포인트 차단

**파일**: `frontend/app/composables/useApi.ts:100-108`

**Before**:
```typescript
const requiresAuth = url.includes('/api/v1/auth/user/') || ...

if (requiresAuth && !authStore.isAuthenticated) {
  return { data: { success: false, message: 'Authentication required' } };
}
```

**문제**:
- `/api/v1/auth/user/`가 `requiresAuth=true`로 설정됨
- 새로고침 시 `user=null` → `isAuthenticated=false`
- Guard에서 차단되어 서버로 요청이 가지 않음
- 쿠키가 전송되지 않아 인증 복원 실패

**After**:
```typescript
const isAuthCheckEndpoint = url.includes('/api/v1/auth/user/') ||
                            url.includes('/api/v1/auth/verify/');

if (requiresAuth && !isAuthCheckEndpoint && !authStore.isAuthenticated) {
  return { data: { success: false, message: 'Authentication required' } };
}
```

### 버그 #2: 에러 핸들링에서 상태 코드 파싱 실패

**파일**: `frontend/app/stores/auth.ts:148-157`

**Before**:
```typescript
if (error?.response?.status === 401 || error?.response?.status === 403) {
```

**문제**:
- fetch API 에러에는 `response.status` 속성이 없음 (axios 스타일)
- 에러 타입 구분 실패

**After**:
```typescript
const statusCode = error?.status || error?.response?.status
if (statusCode === 401 || statusCode === 403) {
```

### 버그 #3: 쿠키 기반 토큰 갱신 미지원

**파일**: `frontend/app/stores/auth.ts:476-517`

**Before**:
```typescript
if (!this.refreshToken) {
  return false  // 쿠키 기반에서는 refreshToken이 null
}
```

**After**:
```typescript
if (!this.useCookieAuth && !this.refreshToken) {
  return false
}
// 쿠키 기반: 서버가 쿠키에서 refresh token을 읽음
```

## 보안 취약점 수정

### 1. 토큰 노출 (심각도: 높음)

**파일**: `backend/accounts/views.py`

- print 문으로 토큰 로깅 → logger.debug()로 변경
- 에러 메시지에 내부 정보 노출 → 일반적인 메시지로 변경

### 2. CORS 와일드카드 (심각도: 높음)

**파일**: `backend/config/settings.py`

- `CORS_ORIGIN_ALLOW_ALL=True` → 명시적 오리진 목록 사용

## 변경된 파일

| 파일 | 변경 라인 |
|------|----------|
| `frontend/app/composables/useApi.ts` | +59, -12 |
| `frontend/app/stores/auth.ts` | +40, -9 |
| `backend/accounts/views.py` | +15, -15 |
| `backend/config/settings.py` | +10, -3 |

## 테스트 시나리오

### 필수 테스트

1. **로그인 후 새로고침**: 로그인 유지 확인
2. **탭 복제**: 새 탭에서도 로그인 유지
3. **브라우저 종료 후 재접속**: 로그인 유지 (30일 이내)
4. **세션 만료**: 401 응답 + 자동 로그아웃
5. **로그아웃 후 뒤로가기**: 보호 페이지 접근 불가

### 검증 포인트

- Network 탭: `/api/v1/auth/user/` 요청이 서버로 전송되는지
- Cookie: `access_token`, `refresh_token` 쿠키 존재 확인
- 응답 코드: 200 (인증됨) 또는 401 (미인증)

## 로컬 테스트 방법

```bash
# 백엔드 실행
cd backend
python manage.py runserver 0.0.0.0:8019

# 프론트엔드 실행
cd frontend
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

## 잔여 리스크

1. **localStorage 하위 호환**: 마이그레이션 완료 후 제거 필요
2. **응답 본문 토큰 포함**: 쿠키 전용으로 전환 시 제거 권장
3. **다중 인스턴스 세션**: Redis 도입 검토 필요

## 다음 액션

- [ ] 프로덕션 배포 후 모니터링
- [ ] localStorage 기반 인증 코드 제거 (마이그레이션 완료 후)
- [ ] 응답 본문에서 토큰 필드 제거
- [ ] 세션 저장소 Redis 전환 검토
