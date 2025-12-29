# 매일일독 마이그레이션 노트

**작성일**: 2025-12-29

이 문서는 Nuxt 3 → 4, Django 5.1 → 5.2 마이그레이션 후 변경된 코드 사용법을 설명합니다.

---

## 1. Frontend (Nuxt 4) 변경 사항

### 1.1 디렉토리 구조 변경

**변경 전** (Nuxt 3 기본 구조):
```
frontend/
├── pages/
├── components/
├── composables/
├── stores/
├── layouts/
├── plugins/
├── assets/
├── app.vue
└── error.vue
```

**변경 후** (Nuxt 4 권장 구조):
```
frontend/
├── app/
│   ├── pages/
│   ├── components/
│   ├── composables/
│   ├── stores/
│   ├── layouts/
│   ├── plugins/
│   ├── utils/
│   ├── assets/
│   ├── app.vue
│   └── error.vue
├── public/
├── server/
└── nuxt.config.ts
```

### 1.2 경로 별칭 변경

CSS 및 파일 import 시 `@/` 대신 `~/` 사용을 권장합니다:

```typescript
// 변경 전
import '@/assets/css/main.css'

// 변경 후
import '~/assets/css/main.css'
```

### 1.3 nuxt.config.ts 변경

```typescript
export default defineNuxtConfig({
  // 호환성 날짜 업데이트
  compatibilityDate: '2025-12-29',

  // CSS 경로 변경
  css: [
    '~/assets/css/main.css',
    '~/assets/css/global.css',
    '~/assets/css/mobile-nav.css'
  ],

  // 레거시 auth 설정 제거됨 (사용하지 않던 설정)
})
```

### 1.4 useAsyncData / useFetch 변경 (주의)

Nuxt 4에서 일부 동작이 변경되었습니다:

```typescript
// 캐시된 데이터가 다른 pre-rendered 페이지에서 재사용될 수 있음
const { data } = await useFetch('/api/data')

// 캐시를 피하려면 key를 동적으로 설정
const { data } = await useFetch('/api/data', {
  key: `data-${Date.now()}`
})
```

### 1.5 Pinia 사용법 (변경 없음)

Pinia 3.0은 Pinia 2.x와 거의 동일하게 사용할 수 있습니다:

```typescript
// 변경 없음 - 기존 코드 그대로 사용 가능
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
```

---

## 2. Backend (Django 5.2) 변경 사항

### 2.1 Model.save() 변경

Django 5.2에서 positional arguments가 제거되었습니다:

```python
# 변경 전 (deprecated)
instance.save(True, True, None, None)

# 변경 후 (올바른 방법)
instance.save(
    force_insert=True,
    force_update=True,
    using=None,
    update_fields=None
)
```

### 2.2 DRF 3.16 변경 사항

#### 최소 요구 사항
- Django 4.2+
- Python 3.9+

#### SerializerMethodField 수정
`unique_together` validation이 `SerializerMethodField`와 함께 사용될 때 수정됨:

```python
class MySerializer(serializers.ModelSerializer):
    computed_field = serializers.SerializerMethodField()

    class Meta:
        model = MyModel
        fields = ['id', 'name', 'computed_field']
        # unique_together validation이 올바르게 동작함
```

### 2.3 설정 파일 변경

```python
# settings.py - 문서 링크 업데이트
# https://docs.djangoproject.com/en/5.2/ref/settings/

# 기존 설정은 그대로 유지됨
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.CookieJWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    # ... 기존 설정 유지
}
```

---

## 3. Docker 변경 사항

### Dockerfile 변경

```dockerfile
# 변경 전
FROM python:3.11-slim

# 변경 후
FROM python:3.12-slim
```

### 이미지 재빌드 필요

```bash
docker-compose build --no-cache backend
```

---

## 4. 개발 환경 설정

### Frontend

```bash
cd frontend
npm install          # 의존성 설치
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
```

### Backend

```bash
cd backend
pip install -r requirements.txt  # 의존성 설치
python manage.py migrate         # 마이그레이션 적용
python manage.py runserver       # 개발 서버 실행
```

---

## 5. 문제 해결

### 5.1 Nuxt 빌드 오류: lodash-es not found

```bash
npm install lodash-es
```

### 5.2 Pinia 호환성 경고

```bash
# @pinia/nuxt 버전을 0.11.3+로 업그레이드
npm install @pinia/nuxt@latest
```

### 5.3 Django 마이그레이션 오류

```bash
# 마이그레이션 상태 확인
python manage.py showmigrations

# 마이그레이션 재생성 (필요시)
python manage.py makemigrations
python manage.py migrate
```

---

## 6. 버전 확인 명령어

### Frontend
```bash
cd frontend
npm list nuxt vue pinia @pinia/nuxt
```

### Backend
```bash
cd backend
pip show django djangorestframework
python --version
```

---

## 7. 롤백 절차

긴급 롤백이 필요한 경우:

```bash
# Git에서 이전 버전으로 복원
git checkout HEAD~1 -- frontend/ backend/

# Frontend 재설치
cd frontend && npm install

# Backend 재설치
cd backend && pip install -r requirements.txt
```
