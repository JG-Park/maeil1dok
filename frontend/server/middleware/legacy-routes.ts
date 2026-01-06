/**
 * Legacy Routes Redirect Middleware
 *
 * 기존 /reading, /reading-plan URL을 새로운 /bible, /plan으로 리다이렉트
 * - /reading → /bible (쿼리 파라미터 유지)
 * - /reading-plan → /plan
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // /reading → /bible 리다이렉트
  if (pathname === '/reading') {
    const params = url.searchParams.toString()
    const redirectUrl = params ? `/bible?${params}` : '/bible'
    return sendRedirect(event, redirectUrl, 301)
  }

  // /reading-plan → /plan 리다이렉트
  if (pathname === '/reading-plan') {
    return sendRedirect(event, '/plan', 301)
  }
})
