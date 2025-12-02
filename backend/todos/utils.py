"""
성경 읽기 일정 관련 유틸리티 함수
"""

# 66권 성경 축약어 맵
BOOK_ABBREVIATIONS = {
    # 구약 (39권)
    '창세기': '창',
    '출애굽기': '출',
    '레위기': '레',
    '민수기': '민',
    '신명기': '신',
    '여호수아': '수',
    '사사기': '삿',
    '룻기': '룻',
    '사무엘상': '삼상',
    '사무엘하': '삼하',
    '열왕기상': '왕상',
    '열왕기하': '왕하',
    '역대상': '대상',
    '역대하': '대하',
    '에스라': '스',
    '느헤미야': '느',
    '에스더': '에',
    '욥기': '욥',
    '시편': '시',
    '잠언': '잠',
    '전도서': '전',
    '아가': '아',
    '이사야': '사',
    '예레미야': '렘',
    '예레미야애가': '애',
    '에스겔': '겔',
    '다니엘': '단',
    '호세아': '호',
    '요엘': '욜',
    '아모스': '암',
    '오바댜': '옵',
    '요나': '욘',
    '미가': '미',
    '나훔': '나',
    '하박국': '합',
    '스바냐': '습',
    '학개': '학',
    '스가랴': '슥',
    '말라기': '말',
    # 신약 (27권)
    '마태복음': '마',
    '마가복음': '막',
    '누가복음': '눅',
    '요한복음': '요',
    '사도행전': '행',
    '로마서': '롬',
    '고린도전서': '고전',
    '고린도후서': '고후',
    '갈라디아서': '갈',
    '에베소서': '엡',
    '빌립보서': '빌',
    '골로새서': '골',
    '데살로니가전서': '살전',
    '데살로니가후서': '살후',
    '디모데전서': '딤전',
    '디모데후서': '딤후',
    '디도서': '딛',
    '빌레몬서': '몬',
    '히브리서': '히',
    '야고보서': '약',
    '베드로전서': '벧전',
    '베드로후서': '벧후',
    '요한일서': '요일',
    '요한이서': '요이',
    '요한삼서': '요삼',
    '유다서': '유',
    '요한계시록': '계',
}

# 플랜 색상 팔레트 (기본값)
DEFAULT_PLAN_COLORS = [
    '#3B82F6',  # blue
    '#10B981',  # green
    '#F59E0B',  # amber
    '#EF4444',  # red
    '#8B5CF6',  # purple
    '#EC4899',  # pink
    '#06B6D4',  # cyan
    '#F97316',  # orange
]


def get_abbreviated_book(book_name: str) -> str:
    """
    성경 책 이름을 축약어로 변환
    예: '히브리서' -> '히'
    """
    return BOOK_ABBREVIATIONS.get(book_name, book_name[:2] if book_name else '')


def abbreviate_schedule(book: str, start_chapter: int, end_chapter: int) -> str:
    """
    일정을 축약 형식으로 변환
    예: ('히브리서', 1, 6) -> '히 1-6'
        ('시편', 119, 119) -> '시 119'
    """
    abbr = get_abbreviated_book(book)
    if start_chapter == end_chapter:
        return f"{abbr} {start_chapter}"
    return f"{abbr} {start_chapter}-{end_chapter}"


def get_plan_color(index: int, custom_color: str = None) -> str:
    """
    플랜 색상을 반환. custom_color가 있으면 사용, 없으면 인덱스 기반 기본 색상
    """
    if custom_color:
        return custom_color
    return DEFAULT_PLAN_COLORS[index % len(DEFAULT_PLAN_COLORS)]
