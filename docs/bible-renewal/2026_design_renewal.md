# 매일1독 성경 페이지 UI/UX 리뉴얼 계획 (2026 Ver.)

## 1. 디자인 철학 (Design Philosophy)
**"Digital Scripture with a Soul"**
- **Simplicity (미니멀)**: 읽기 경험을 방해하는 요소를 최소화합니다. 콘텐츠(말씀)가 가장 돋보여야 합니다.
- **Fluidity (매끄러움)**: 화면 전환, 모달 표시, 스크롤 경험이 물 흐르듯 자연스러워야 합니다.
- **Efficiency (직관성)**: 원하는 구절을 찾거나 기능을 실행하는 데 필요한 탭 횟수를 줄입니다.

## 2. 주요 개선 영역 (Key Improvement Areas)

### A. 성경 홈 (Bible Home) - "내 영적 여정의 대시보드"
기존의 단순한 리스트 나열 방식에서 벗어나, 사용자의 읽기 맥락을 파악하여 정보를 제공하는 '피드' 또는 '대시보드' 형태로 전환합니다.

*   **Hero Section (이어보기 카드)**
    *   **AS-IS**: 텍스트 위주의 단순 버튼.
    *   **TO-BE**: 앨범 아트워크와 같은 비주얼 요소가 가미된 카드 형태. 배경에 해당 성경 파트와 어울리는 은은한 그라데이션 또는 추상적 패턴 적용. "마지막으로 읽은 구절"을 미리보기로 살짝 보여주어 클릭 유도.

*   **Bento Grid Quick Actions**
    *   **AS-IS**: 아이콘 + 텍스트의 단순 그리드.
    *   **TO-BE**: 크기가 다른 타일형 레이아웃(Bento Grid) 적용.
        *   큰 타일: "통독 진행률" (도넛 차트 등 시각화)
        *   중간 타일: "오늘의 묵상/노트" (가장 최근 노트 미리보기)
        *   작은 타일: 북마크, 하이라이트, 검색 등.

### B. 성경 뷰어 (Bible Viewer) - "몰입감 있는 독서 경험"
종이책의 편안함과 디지털의 편리함을 결합합니다.

*   **Immersive Header (헤더 최소화)**
    *   스크롤 시 헤더가 상단으로 사라지거나 투명해져서(Glassmorphism), 화면 전체를 성경 본문으로 채웁니다. 상단 터치 시 다시 나타납니다.
    *   책/장 제목만 심플하게 표시. 잡다한 아이콘은 '더보기(Menu)' 안으로 정리.

*   **Smart Bottom Bar & Action Menu**
    *   드래그 선택 시 나타나는 메뉴(Copy, Share, Highlight)를 iOS/Android 시스템 네이티브 메뉴 느낌의 **Floating Menu**로 디자인하여 손가락에 가리지 않게 배치.
    *   뷰어 하단에 고정된 네비게이션 바 대신, 필요할 때만 나타나는 플로팅 컨트롤 또는 제스처 기반 네비게이션(좌우 스와이프로 장 이동) 도입.

*   **Typography & Layout (타이포그래피)**
    *   **Font**: 본문은 명조 계열(RIDIBatang 등), UI는 고딕 계열(Pretendard)로 명확히 구분.
    *   **Line & Space**: 줄 간격(Line-height)은 1.8~2.0으로 넉넉하게, 문단 간격은 시원하게.
    *   **Verse Numbers**: 절 번호를 본문보다 흐릿한 색상(Gray-400)으로 작게 처리하거나, 문단 좌측 여백(Hanging Indent)에 배치하여 가독성 증대.

### B-2. 성경 탐색 (Navigation)
*   **Bottom Sheet Selector**
    *   **AS-IS**: 풀스크린 모달 또는 팝업.
    *   **TO-BE**: 하단에서 올라오는 **Bottom Sheet** 방식. 한 손으로 조작하기 쉽도록 설계. "창세기 > 1장" 선택 과정을 스크롤 휠(Picker) 방식이나 탭 제스처로 매끄럽게 구현.

## 3. 기술적 구현 전략 (Technical Plan)

### 단계 1: UI 컴포넌트 시스템 재정비 (Foundation)
*   **Color Palette**:
    *   `Paper White` (따뜻한 미색) - 주간 모드 배경
    *   `Deep Screen Black` (완전 블랙이 아닌 #1C1C1E 등) - 야간 모드 배경
    *   `Highlight Purple` (서비스 키 컬러) - 강조, 버튼, 활성 상태
*   **Design Tokens**: Spacing, Typography, Shadow 등을 변수화하여 일관성 유지.

### 단계 2: 구조 리팩토링 (Structure)
*   `BibleHome.vue`를 대시보드형 레이아웃으로 전면 개편.
*   `BibleViewer.vue`의 텍스트 렌더링 로직 개선 (가능하다면 가상 스크롤 도입 검토, 모바일 성능 최적화).
*   헤더/네비게이션 로직을 `Layout` 레벨이 아닌 페이지 내부 상태(Scroll spy)에 따라 유동적으로 반응하도록 변경.

### 단계 3: 인터랙션 강화 (Interaction)
*   **Micro-animations**:
    *   책장 넘기는 듯한 느낌(또는 슬라이드)의 장 이동 애니메이션.
    *   좋아요/북마크 버튼 클릭 시 튄(Bouncy) 효과.
    *   진행률 바가 차오르는 애니메이션.

## 4. 제안하는 파일 구조 변경 (New File Structure)
```
frontend/app/
  pages/
    bible/
      index.vue         # 뷰어/홈 통합 라우터 (Entry Point)
      dashboard.vue     # (Refactor) BibleHome 대체
      reader.vue        # (Refactor) BibleViewer 대체
  components/
    bible/
      dashboard/        # 대시보드 위젯들
      reader/           # 리더 관련 (Header, ActionMenu)
      navigation/       # BookSelector, BottomSheet
```
