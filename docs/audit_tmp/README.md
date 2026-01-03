# maeil1dok.app 서비스 전역 감사 - 통합 SSOT

## 감사 개요

- **대상 서비스**: maeil1dok.app (http://localhost:3456)
- **감사 시작일**: 2025-12-30
- **도구**: Chrome DevTools MCP
- **현재 반복 회차**: 1회차 (표면 결함 수집)

---

## 태스크 현황

| ID | 제목 | 우선순위 | 상태 | 레이어 | 핵심 증상 |
|----|------|----------|------|--------|-----------|
| T0001 | 홈페이지 방문자 API 중복 호출 | P2 | CLOSED | API/Frontend | 재현 불가 - 현재 1회만 호출됨 |
| T0002 | 리더보드 필터 클릭 시 홈으로 리다이렉트 | P1 | INVESTIGATE | Router/Auth | 간헐적 발생, 재현 조건 파악 필요 |
| T0003 | 리더보드 필터 변경 시 중복 API 호출 | P2 | CLOSED | API/State | 재현 불가 - 각 필터 클릭당 1회 호출 |
| T0004 | 리더보드 뒤로가기 버튼 클릭 시 500 오류 | P0 | OPEN | SSR/Nuxt | 간헐적 500 에러, Hydration 실패 |

---

## P0 결함 요약

### T0004: 리더보드 뒤로가기 버튼 클릭 시 500 오류

**재현 조건:**
1. 홈페이지에서 리더보드 링크 클릭
2. 리더보드 페이지 로드 완료 대기
3. 필터 버튼 여러 번 클릭 (이번 달, 이번 주, 전체 등)
4. "뒤로 가기" 버튼 클릭
5. 간헐적으로 500 서버 오류 페이지 표시

**콘솔 에러:**
```
[Vue Router warn]: uncaught error during route navigation
[nuxt] error caught during app initialization
Hydration completed but contains mismatches
Hydration class mismatch on JSHandle@node
  - rendered on server: class="null"
  - expected on client: class="max-w-md w-full text-center"
Failed to load module script: MIME type "text/css"
```

**영향:**
- 사용자가 500 에러 페이지에 갇힘
- "홈으로 돌아가기" 버튼도 작동하지 않음
- 페이지 새로고침으로만 복구 가능

**가능 원인:**
- Nuxt SSR hydration 타이밍 이슈
- 스코어보드 스토어 상태 정리 문제 (onUnmounted에서 clearScoreboardData 호출)
- Vue Router 네비게이션 가드 오류

## 간헐적 결함 (INVESTIGATE)

1. **T0002**: 리더보드 필터 클릭 시 홈으로 리다이렉트
   - 이전 세션에서 1회 관찰됨
   - 후속 테스트에서 재현 불가
   - 가능 원인: 인증 상태 변경, 네트워크 타이밍, T0004와 연관 가능성

2. **T0004**: 리더보드 뒤로가기 버튼 클릭 시 500 오류
   - 현재 세션에서 1회 재현됨
   - 후속 테스트에서는 정상 작동
   - 가능 원인: Nuxt SSR hydration, 스토어 상태 관리

---

## 테스트 결과 요약

### 정상 동작 확인

1. **필터 연타 테스트**: 빠른 필터 변경 시 API 중복 호출 없음
2. **API 호출 패턴**: 각 필터 클릭당 정확히 1회 API 호출
3. **데이터 표시**: 리더보드 데이터 정상 표시
4. **방문자 통계**: 홈페이지에서 1회만 호출됨 (수정된 것으로 보임)

### 발견된 문제점

1. **P0 - T0004**: 500 서버 오류 (간헐적, 심각도 높음)
2. **P1 - T0002**: 홈으로 리다이렉트 (간헐적, 재현 필요)

---

## API 계약 현황

| API 엔드포인트 | 상태 | 비고 |
|----------------|------|------|
| `/api/v1/todos/stats/visitors/` | ✅ 정상 | 1회만 호출됨 |
| `/api/v1/todos/scoreboard/` | ✅ 정상 | 각 필터당 1회 호출 |
| `/api/v1/todos/scoreboard/my-ranking/` | ✅ 정상 | 인증 시 호출 |

---

## 다음 반복에서 집중할 영역

1. **T0004 근본 원인 분석** (P0, 최우선)
   - `scoreboard.vue`의 `onUnmounted` 훅 검토
   - Nuxt SSR hydration 타이밍 조사
   - 에러 바운더리 및 복구 로직 점검

2. **T0002 연관성 조사**
   - T0004와 동일 원인일 가능성 검토

3. **에러 페이지 UX 개선**
   - "홈으로 돌아가기" 버튼이 작동하지 않는 문제 수정 필요

---

## 감사 완료 항목

- [x] 전역 스캔 및 초기 결함 수집
- [x] API 호출 구조 감사 (중복/레이스/취소)
- [x] 상태/흐름 파괴 테스트 (연타/뒤로가기/새로고침)
- [x] UX/UI 비상식 탐지
- [x] 태스크 문서화 및 우선순위 지정
- [x] 최종 결과 정리
