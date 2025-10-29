# 백엔드 구현 상태 체크

## ✅ 구현 완료된 기능

### 1. Profile 시스템 ✅
**모델 (accounts/models.py)**
- `UserProfile` 모델: bio, 완료일수, 연속일수, 최장연속, 공개여부 등
- 프로필 통계 자동 계산

**API 엔드포인트 (accounts/urls.py)**
- GET `/api/v1/accounts/profile/<user_id>/` - 프로필 조회
- PUT `/api/v1/accounts/profile/` - 프로필 수정
- GET `/api/v1/accounts/profile/<user_id>/calendar/` - 달력 데이터
- GET `/api/v1/accounts/profile/<user_id>/achievements/` - 업적 조회

### 2. Follow 시스템 ✅
**모델 (accounts/models.py)**
- `Follow` 모델: follower, following 관계
- unique_together 제약, 인덱스 포함

**API 엔드포인트 (accounts/urls.py)**
- POST `/api/v1/accounts/follow/` - 팔로우
- DELETE `/api/v1/accounts/unfollow/<user_id>/` - 언팔로우
- GET `/api/v1/accounts/followers/<user_id>/` - 팔로워 목록
- GET `/api/v1/accounts/following/<user_id>/` - 팔로잉 목록
- GET `/api/v1/accounts/friends/` - 친구 목록 (상호 팔로우)
- GET `/api/v1/accounts/search/` - 사용자 검색

### 3. Achievements 시스템 ✅
**모델 (accounts/models.py)**
- `UserAchievement` 모델: 다양한 업적 타입 지원
- 업적 타입: 첫 완독, 7/30/100일 연속, 누적 30/100/365일, 책/구약신약/성경 완독

### 4. Groups 시스템 ✅
**모델 (todos/models.py)**
- `ReadingGroup` 모델: 그룹 정보, 플랜 연결
- `GroupMembership` 모델: 멤버십, 역할(admin/member)
- `GroupInvitation` 모델: 초대 시스템

**API 엔드포인트 (todos/urls.py)**
- GET `/api/v1/todos/groups/` - 그룹 목록
- POST `/api/v1/todos/groups/create/` - 그룹 생성
- GET `/api/v1/todos/groups/<group_id>/` - 그룹 상세
- POST `/api/v1/todos/groups/<group_id>/join/` - 그룹 가입
- POST `/api/v1/todos/groups/<group_id>/leave/` - 그룹 탈퇴
- GET `/api/v1/todos/groups/<group_id>/members/` - 멤버 목록
- POST `/api/v1/todos/groups/<group_id>/invite/` - 초대
- GET `/api/v1/todos/invitations/` - 내 초대 목록
- POST `/api/v1/todos/invitations/<id>/respond/` - 초대 응답

### 5. Scoreboard/Leaderboard 시스템 ✅
**API 엔드포인트 (todos/urls.py)**
- GET `/api/v1/todos/scoreboard/` - 전체 리더보드
- GET `/api/v1/todos/scoreboard/friends/` - 친구 리더보드
- GET `/api/v1/todos/scoreboard/group/<group_id>/` - 그룹 리더보드
- GET `/api/v1/todos/scoreboard/my-ranking/` - 내 랭킹

**기능**
- 기간별 필터링 (전체/주간/월간)
- 플랜별 필터링
- 완료율, 연속일수 기준 랭킹

## ❌ 누락되거나 미완성인 기능

### 1. 업적 자동 달성 시스템 ❌
- 현재 업적 모델은 있지만, 자동으로 업적을 달성하는 로직 없음
- 필요한 것:
  - 읽기 완료 시 업적 체크 및 부여 로직
  - 신호(signal) 또는 서비스 메서드로 구현 필요

### 2. 프로필 통계 자동 업데이트 ❌
- UserProfile의 통계 필드들이 자동 업데이트되지 않음
- 필요한 것:
  - 읽기 완료 시 통계 업데이트 로직
  - current_streak, longest_streak 계산 로직

### 3. 그룹 활동 피드 ❌
- 그룹 내 활동 기록/피드 기능 없음
- 필요한 것:
  - GroupActivity 모델
  - 그룹 내 공지사항, 댓글 기능

### 4. 알림 시스템 ❌
- 팔로우, 그룹 초대, 업적 달성 알림 없음
- 필요한 것:
  - Notification 모델
  - 알림 생성 및 조회 API

### 5. 프론트엔드 연동 부분 ⚠️
- 일부 API 응답 구조가 프론트엔드와 맞지 않을 수 있음
- Serializer 추가 확인 필요

## 마이그레이션 상태
- ✅ `0005_userprofile_follow_userachievement.py` - Profile, Follow, Achievement
- ✅ `0014_readinggroup_groupmembership_groupinvitation_and_more.py` - Groups

## 다음 단계 제안
1. 업적 자동 달성 시스템 구현
2. 프로필 통계 자동 업데이트 구현
3. 알림 시스템 구현
4. 그룹 활동 피드 구현
5. 프론트엔드와 API 연동 테스트