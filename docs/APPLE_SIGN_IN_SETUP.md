# Apple Sign In 설정 가이드

Sign in with Apple을 매일일독 앱에 통합하기 위한 Apple Developer Console 설정 가이드입니다.

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [App ID 설정](#1-app-id-설정)
3. [Services ID 설정 (웹용)](#2-services-id-설정-웹용)
4. [Key 생성](#3-key-생성)
5. [환경변수 설정](#4-환경변수-설정)
6. [도메인 검증](#5-도메인-검증)

---

## 사전 요구사항

- Apple Developer Program 멤버십 (연 $99)
- Apple Developer 계정 관리자 권한
- 도메인 소유권 (maeil1dok.app)

---

## 1. App ID 설정

### 1.1 App ID 생성/수정

1. [Apple Developer Console](https://developer.apple.com/account/) 접속
2. **Certificates, Identifiers & Profiles** 클릭
3. 좌측 메뉴에서 **Identifiers** 선택
4. 기존 App ID 선택 또는 **+** 버튼으로 새로 생성

### 1.2 Sign in with Apple 활성화

1. App ID 상세 페이지에서 **Capabilities** 섹션 확인
2. **Sign in with Apple** 체크박스 활성화
3. **Edit** 클릭하여 설정:
   - **Enable as a primary App ID** 선택
4. **Save** 클릭

---

## 2. Services ID 설정 (웹용)

웹 앱(maeil1dok.app)에서 Apple 로그인을 사용하려면 Services ID가 필요합니다.

### 2.1 Services ID 생성

1. **Identifiers** 페이지에서 **+** 버튼 클릭
2. **Services IDs** 선택 후 **Continue**
3. 정보 입력:
   - **Description**: `매일일독 웹`
   - **Identifier**: `app.maeil1dok.web` (권장)
4. **Continue** → **Register**

### 2.2 Services ID 설정

1. 생성된 Services ID 클릭
2. **Sign in with Apple** 체크박스 활성화
3. **Configure** 클릭
4. 설정 입력:
   - **Primary App ID**: 1단계에서 생성한 App ID 선택
   - **Domains and Subdomains**: 
     ```
     maeil1dok.app
     api.maeil1dok.app
     ```
   - **Return URLs**:
     ```
     https://maeil1dok.app/auth/apple/callback
     https://api.maeil1dok.app/api/v1/auth/apple/callback
     ```
5. **Save** → **Continue** → **Save**

> **개발 환경**: localhost는 Apple에서 허용하지 않습니다. 개발 시에는 ngrok 등의 터널링 도구를 사용하거나, 프로덕션 환경에서 테스트하세요.

---

## 3. Key 생성

Apple 서버와 통신하기 위한 Private Key를 생성합니다.

### 3.1 Key 생성

1. 좌측 메뉴에서 **Keys** 선택
2. **+** 버튼 클릭
3. 정보 입력:
   - **Key Name**: `매일일독 Sign In`
4. **Sign in with Apple** 체크박스 활성화
5. **Configure** 클릭:
   - **Primary App ID**: 1단계에서 생성한 App ID 선택
6. **Save** → **Continue** → **Register**

### 3.2 Private Key 다운로드

1. **Download** 버튼 클릭하여 `.p8` 파일 다운로드
2. **Key ID** 기록 (예: `ABC123DEF4`)

> ⚠️ **중요**: Private Key는 한 번만 다운로드할 수 있습니다. 안전한 곳에 보관하세요.

---

## 4. 환경변수 설정

### 필요한 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `APPLE_CLIENT_ID` | Services ID (웹용) | `app.maeil1dok.web` |
| `APPLE_TEAM_ID` | Apple Developer Team ID | `ABCD123456` |
| `APPLE_KEY_ID` | 3단계에서 생성한 Key ID | `ABC123DEF4` |
| `APPLE_PRIVATE_KEY` | .p8 파일 내용 (줄바꿈 포함) | `-----BEGIN PRIVATE KEY-----\n...` |

### Team ID 확인 방법

1. [Apple Developer 멤버십 페이지](https://developer.apple.com/account/#/membership) 접속
2. **Team ID** 항목 확인

### 4.1 Backend 환경변수 (Django)

`.env` 파일 또는 Docker 환경변수에 추가:

```bash
# Apple Sign In
APPLE_CLIENT_ID=app.maeil1dok.web
APPLE_TEAM_ID=ABCD123456
APPLE_KEY_ID=ABC123DEF4
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
...
-----END PRIVATE KEY-----"
```

> **Docker Compose**: `docker-compose.yml`의 `environment` 섹션에 추가하거나 `.env` 파일 참조

### 4.2 Frontend 환경변수 (Nuxt 3)

`nuxt.config.ts`의 `runtimeConfig.public`에 추가:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      // 기존 설정...
      APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID || '',
      APPLE_REDIRECT_URI: process.env.APPLE_REDIRECT_URI || 'https://maeil1dok.app/auth/apple/callback',
    }
  }
})
```

`.env` 파일:
```bash
APPLE_CLIENT_ID=app.maeil1dok.web
APPLE_REDIRECT_URI=https://maeil1dok.app/auth/apple/callback
```

### 4.3 Mobile 환경변수 (Expo)

`mobile/app.json`의 `expo.extra`에 추가:

```json
{
  "expo": {
    "extra": {
      "appleClientId": "app.maeil1dok.web",
      "eas": {
        "projectId": "..."
      }
    },
    "ios": {
      "usesAppleSignIn": true
    }
  }
}
```

> **중요**: iOS에서 Apple Sign In을 사용하려면 `usesAppleSignIn: true` 설정이 필수입니다.

---

## 5. Website URLs 설정

Services ID의 Configure를 클릭하면 **Web Authentication Configuration** 창이 나타납니다.

### 5.1 Website URLs 추가

1. Services ID 설정 페이지에서 **Sign in with Apple** 체크박스 활성화
2. **Configure** 버튼 클릭
3. **Web Authentication Configuration** 창에서:
   - **Primary App ID**: 앱 ID 선택 (예: `jgp3620maeil1dok...`)
   - **Website URLs** 섹션의 **+** 버튼 클릭
4. 다음 URL들을 추가:
   - `https://maeil1dok.app` (도메인)
   - `https://maeil1dok.app/auth/apple/callback` (Return URL)

### 5.2 설정 완료

1. **Done** 버튼 클릭
2. **Continue** → **Save** 클릭

> **참고**: 이전에는 도메인 검증 파일(`.well-known/apple-developer-domain-association.txt`)이 필요했지만, 현재 Apple Developer Console UI에서는 Website URLs를 직접 등록하는 방식으로 변경되었습니다.

---

## 다음 단계

설정이 완료되면:

1. Backend에서 Apple OAuth 엔드포인트 구현
2. Frontend에서 Apple 로그인 버튼 추가
3. Mobile에서 `expo-apple-authentication` 패키지 사용

---

## 참고 자료

- [Sign in with Apple - Apple Developer](https://developer.apple.com/sign-in-with-apple/)
- [Configuring Your Webpage for Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/configuring_your_webpage_for_sign_in_with_apple)
- [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Verifying a User - Apple Developer](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user)

---

## 트러블슈팅

### "Invalid redirect_uri" 오류
- Services ID의 Website URLs에 정확한 콜백 URL이 등록되어 있는지 확인
- URL에 trailing slash 포함 여부 확인 (Apple은 정확히 일치해야 함)
- 예: `https://maeil1dok.app/auth/apple/callback` (끝에 `/` 없음)

### "Invalid client_id" 오류
- `APPLE_CLIENT_ID` 환경변수가 Services ID와 일치하는지 확인
- Services ID 예: `app.maeil1dok.web` 또는 실제 등록한 Identifier

### iOS 앱에서 Apple 로그인 버튼이 안 보임
- `app.json`에 `"usesAppleSignIn": true` 설정 확인
- EAS Build로 다시 빌드 필요 (Expo Go에서는 작동하지 않음)
