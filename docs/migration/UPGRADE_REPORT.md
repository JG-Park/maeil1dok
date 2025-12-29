# 매일일독 스택 업그레이드 리포트

**작성일**: 2025-12-29
**작성자**: Claude Code (Opus 4.5)

---

## 1. 버전 변경 요약

### Frontend (Nuxt.js)

| 패키지 | 변경 전 | 변경 후 | 비고 |
|--------|---------|---------|------|
| Node.js | 24.7.0 | 24.7.0 | 유지 (최신) |
| Nuxt | 3.15.4 → 3.20.2 | **4.2.2** | 메이저 업그레이드 |
| Vue | 3.5.x | 3.5.26 | 마이너 업데이트 |
| Vite | - | 7.3.0 | 최신 |
| Pinia | 3.0.1 | 3.0.4 | 마이너 업데이트 |
| @pinia/nuxt | 0.10.1 | 0.11.3 | Nuxt 4 호환 |
| axios | 1.7.9 | 최신 | 보안 업데이트 |

### Backend (Django)

| 패키지 | 변경 전 | 변경 후 | 비고 |
|--------|---------|---------|------|
| Python (Docker) | 3.11 | **3.12** | 메이저 업그레이드 |
| Django | 5.1.x | **5.2.9 LTS** | LTS 업그레이드 |
| DRF | 3.14.x | **3.16.0** | 메이저 업그레이드 |
| django-cors-headers | 4.0.x | 4.6.0+ | 마이너 업데이트 |
| djangorestframework-simplejwt | 5.3.x | 5.4.0+ | 마이너 업데이트 |
| requests | 2.31.0 | 2.32.0+ | 보안 업데이트 |

---

## 2. 주요 변경 사항

### 2.1 Frontend 변경 사항

#### Nuxt 4 업그레이드
- **compatibilityDate**: `2024-11-01` → `2025-12-29`
- **새 디렉토리 구조**: 클라이언트 코드를 `app/` 폴더로 이동
  ```
  frontend/
  ├── app/           # 새로 생성된 폴더
  │   ├── app.vue
  │   ├── error.vue
  │   ├── pages/
  │   ├── components/
  │   ├── composables/
  │   ├── stores/
  │   ├── layouts/
  │   ├── plugins/
  │   ├── utils/
  │   └── assets/
  ├── public/        # 유지
  ├── server/        # 유지
  └── nuxt.config.ts
  ```

#### 보안 취약점 해결
- `npm audit` 결과: 14개 취약점 → **0개**
- 해결된 취약점:
  - axios DoS 취약점 (high)
  - devalue prototype pollution (high)
  - form-data unsafe random (critical)
  - @nuxt/devtools XSS (moderate)
  - esbuild 보안 이슈 (moderate)
  - brace-expansion ReDoS (moderate)

#### 설정 정리
- 사용하지 않는 레거시 `auth` 설정 제거 (모듈 미설치 상태였음)
- CSS 경로를 `@/` → `~/` 로 통일

#### 추가된 의존성
- `lodash-es`: 빌드 오류 해결을 위해 추가

### 2.2 Backend 변경 사항

#### Django 5.2 LTS 업그레이드
- **지원 기간**: 2028년까지 장기 지원
- Python 3.10+ 필요 (3.12 사용)

#### DRF 3.16 업그레이드
- Django 5.1/5.2 완벽 지원
- Python 3.13 지원
- 최소 Django 버전: 4.2
- 최소 Python 버전: 3.9

#### Docker 변경
- Python 이미지: `3.11-slim` → `3.12-slim`

---

## 3. 단계별 작업 로그

### D-1: 보안 취약점 수정
```bash
npm audit fix
# 결과: 14 vulnerabilities → 0 vulnerabilities
```

### D-2: Nuxt 4 업그레이드
```bash
# package.json 수정
"nuxt": "^3.15.4" → "^4.2.2"
"@pinia/nuxt": "^0.10.1" → "^0.11.3"
"pinia": "^3.0.1" → "^3.0.4"

# 의존성 추가
npm install lodash-es

# 빌드 테스트
npm run build  # 성공
```

### D-3: 디렉토리 구조 변경
```bash
mkdir -p app
mv pages components composables stores layouts plugins utils assets app.vue error.vue app/
```

### E: Django 업그레이드
```bash
# requirements.txt 수정
Django==5.2.9
djangorestframework==3.16.0

# Dockerfile 수정
FROM python:3.12-slim
```

---

## 4. 위험 요소 및 남은 과제

### 잠재적 위험 요소
1. **Nuxt 4 Breaking Changes**
   - `useAsyncData`, `useFetch` 동작 변경 가능성
   - 일부 Nuxt 모듈 호환성 확인 필요

2. **Django 5.2 Breaking Changes**
   - `Model.save()` positional arguments 제거됨
   - 일부 deprecated API 제거됨

### 남은 과제
1. **통합 테스트 필요**
   - 로그인/로그아웃 플로우
   - API 호출 정상 동작 확인
   - 데이터 페칭 정상 동작 확인

2. **배포 전 확인 사항**
   - 스테이징 환경에서 전체 기능 테스트
   - Docker 이미지 빌드 테스트
   - Vercel 배포 테스트

---

## 5. 롤백 방법

### Frontend 롤백
```bash
git checkout HEAD~1 -- frontend/
cd frontend && npm install
```

### Backend 롤백
```bash
git checkout HEAD~1 -- backend/requirements.txt docker/backend/Dockerfile
```

---

## 6. 참고 자료

- [Nuxt 4 Upgrade Guide](https://nuxt.com/docs/getting-started/upgrade)
- [Django 5.2 Release Notes](https://docs.djangoproject.com/en/5.2/releases/5.2/)
- [DRF 3.16 Announcement](https://www.django-rest-framework.org/community/3.16-announcement/)
- [Pinia v3 Migration](https://pinia.vuejs.org/cookbook/migration-v2-v3.html)
