/**
 * 성경 책 정보 상수
 */

export interface BibleBook {
  code: string
  name: string
  chapters: number
  testament: 'old' | 'new'
}

export const BIBLE_BOOKS: BibleBook[] = [
  // 구약
  { code: 'gen', name: '창세기', chapters: 50, testament: 'old' },
  { code: 'exo', name: '출애굽기', chapters: 40, testament: 'old' },
  { code: 'lev', name: '레위기', chapters: 27, testament: 'old' },
  { code: 'num', name: '민수기', chapters: 36, testament: 'old' },
  { code: 'deu', name: '신명기', chapters: 34, testament: 'old' },
  { code: 'jos', name: '여호수아', chapters: 24, testament: 'old' },
  { code: 'jdg', name: '사사기', chapters: 21, testament: 'old' },
  { code: 'rut', name: '룻기', chapters: 4, testament: 'old' },
  { code: '1sa', name: '사무엘상', chapters: 31, testament: 'old' },
  { code: '2sa', name: '사무엘하', chapters: 24, testament: 'old' },
  { code: '1ki', name: '열왕기상', chapters: 22, testament: 'old' },
  { code: '2ki', name: '열왕기하', chapters: 25, testament: 'old' },
  { code: '1ch', name: '역대상', chapters: 29, testament: 'old' },
  { code: '2ch', name: '역대하', chapters: 36, testament: 'old' },
  { code: 'ezr', name: '에스라', chapters: 10, testament: 'old' },
  { code: 'neh', name: '느헤미야', chapters: 13, testament: 'old' },
  { code: 'est', name: '에스더', chapters: 10, testament: 'old' },
  { code: 'job', name: '욥기', chapters: 42, testament: 'old' },
  { code: 'psa', name: '시편', chapters: 150, testament: 'old' },
  { code: 'pro', name: '잠언', chapters: 31, testament: 'old' },
  { code: 'ecc', name: '전도서', chapters: 12, testament: 'old' },
  { code: 'sng', name: '아가', chapters: 8, testament: 'old' },
  { code: 'isa', name: '이사야', chapters: 66, testament: 'old' },
  { code: 'jer', name: '예레미야', chapters: 52, testament: 'old' },
  { code: 'lam', name: '예레미야애가', chapters: 5, testament: 'old' },
  { code: 'ezk', name: '에스겔', chapters: 48, testament: 'old' },
  { code: 'dan', name: '다니엘', chapters: 12, testament: 'old' },
  { code: 'hos', name: '호세아', chapters: 14, testament: 'old' },
  { code: 'jol', name: '요엘', chapters: 3, testament: 'old' },
  { code: 'amo', name: '아모스', chapters: 9, testament: 'old' },
  { code: 'oba', name: '오바댜', chapters: 1, testament: 'old' },
  { code: 'jnh', name: '요나', chapters: 4, testament: 'old' },
  { code: 'mic', name: '미가', chapters: 7, testament: 'old' },
  { code: 'nam', name: '나훔', chapters: 3, testament: 'old' },
  { code: 'hab', name: '하박국', chapters: 3, testament: 'old' },
  { code: 'zep', name: '스바냐', chapters: 3, testament: 'old' },
  { code: 'hag', name: '학개', chapters: 2, testament: 'old' },
  { code: 'zec', name: '스가랴', chapters: 14, testament: 'old' },
  { code: 'mal', name: '말라기', chapters: 4, testament: 'old' },
  // 신약
  { code: 'mat', name: '마태복음', chapters: 28, testament: 'new' },
  { code: 'mrk', name: '마가복음', chapters: 16, testament: 'new' },
  { code: 'luk', name: '누가복음', chapters: 24, testament: 'new' },
  { code: 'jhn', name: '요한복음', chapters: 21, testament: 'new' },
  { code: 'act', name: '사도행전', chapters: 28, testament: 'new' },
  { code: 'rom', name: '로마서', chapters: 16, testament: 'new' },
  { code: '1co', name: '고린도전서', chapters: 16, testament: 'new' },
  { code: '2co', name: '고린도후서', chapters: 13, testament: 'new' },
  { code: 'gal', name: '갈라디아서', chapters: 6, testament: 'new' },
  { code: 'eph', name: '에베소서', chapters: 6, testament: 'new' },
  { code: 'php', name: '빌립보서', chapters: 4, testament: 'new' },
  { code: 'col', name: '골로새서', chapters: 4, testament: 'new' },
  { code: '1th', name: '데살로니가전서', chapters: 5, testament: 'new' },
  { code: '2th', name: '데살로니가후서', chapters: 3, testament: 'new' },
  { code: '1ti', name: '디모데전서', chapters: 6, testament: 'new' },
  { code: '2ti', name: '디모데후서', chapters: 4, testament: 'new' },
  { code: 'tit', name: '디도서', chapters: 3, testament: 'new' },
  { code: 'phm', name: '빌레몬서', chapters: 1, testament: 'new' },
  { code: 'heb', name: '히브리서', chapters: 13, testament: 'new' },
  { code: 'jas', name: '야고보서', chapters: 5, testament: 'new' },
  { code: '1pe', name: '베드로전서', chapters: 5, testament: 'new' },
  { code: '2pe', name: '베드로후서', chapters: 3, testament: 'new' },
  { code: '1jn', name: '요한일서', chapters: 5, testament: 'new' },
  { code: '2jn', name: '요한이서', chapters: 1, testament: 'new' },
  { code: '3jn', name: '요한삼서', chapters: 1, testament: 'new' },
  { code: 'jud', name: '유다서', chapters: 1, testament: 'new' },
  { code: 'rev', name: '요한계시록', chapters: 22, testament: 'new' },
]

// 책 코드 -> 장 수 매핑
export const BOOK_CHAPTERS: Record<string, number> = BIBLE_BOOKS.reduce(
  (acc, book) => {
    acc[book.code] = book.chapters
    return acc
  },
  {} as Record<string, number>
)

// 책 코드 -> 이름 매핑
export const BOOK_NAMES: Record<string, string> = BIBLE_BOOKS.reduce(
  (acc, book) => {
    acc[book.code] = book.name
    return acc
  },
  {} as Record<string, string>
)

// 역본 정보
export const BIBLE_VERSIONS = [
  { code: 'GAE', name: '개역개정' },
  { code: 'KNT', name: '새한글성경' },
  { code: 'HAN', name: '한글킹제임스' },
  { code: 'NIV', name: 'NIV' },
  { code: 'SAE', name: '새번역' },
  { code: 'COGNEW', name: '공동번역 개정판' },
] as const

export type BibleVersionCode = (typeof BIBLE_VERSIONS)[number]['code']
