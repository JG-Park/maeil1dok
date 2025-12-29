/**
 * 날짜 포맷팅 유틸리티 함수들
 */

/**
 * 날짜를 YYYY.MM.DD 형식으로 포맷
 * @param date Date 객체, ISO 문자열, 또는 null
 * @returns 포맷된 날짜 문자열 또는 빈 문자열
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷 (input[type=date]용)
 * @param date Date 객체, ISO 문자열, 또는 null
 * @returns 포맷된 날짜 문자열 또는 빈 문자열
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 날짜를 MM/DD 형식으로 포맷
 * @param date Date 객체, ISO 문자열, 또는 null
 * @returns 포맷된 날짜 문자열 또는 빈 문자열
 */
export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const month = d.getMonth() + 1
  const day = d.getDate()

  return `${month}/${day}`
}

/**
 * 날짜를 YYYY년 M월 D일 형식으로 포맷
 * @param date Date 객체, ISO 문자열, 또는 null
 * @returns 포맷된 날짜 문자열 또는 빈 문자열
 */
export function formatKoreanDate(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/**
 * 날짜를 상대적 시간으로 포맷 (예: "3일 전", "방금 전")
 * @param date Date 객체, ISO 문자열, 또는 null
 * @returns 상대적 시간 문자열 또는 빈 문자열
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  if (diffWeek < 5) return `${diffWeek}주 전`
  if (diffMonth < 12) return `${diffMonth}개월 전`
  return `${diffYear}년 전`
}

/**
 * 오늘 날짜인지 확인
 * @param date Date 객체 또는 ISO 문자열
 * @returns 오늘이면 true
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()

  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
}

/**
 * 같은 날인지 비교
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 같은 날이면 true
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2

  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}
