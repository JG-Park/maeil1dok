import { defineEventHandler, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const bibleTarget = 'https://www.bskorea.or.kr'
  const hasenaTarget = 'https://xn--910b782abhbh7k53rca.kr'
  
  // 새한글 성경(KNT) 요청 처리
  if (event.path?.startsWith('/bible-proxy/KNT/')) {
    // KNT는 루트 경로에 있으므로 /bible-proxy/KNT/ -> /KNT/
    const url = bibleTarget + event.path.replace('/bible-proxy/KNT', '/KNT')
    return proxyRequest(event, url)
  }
  
  // 일반 성경 요청 처리 (개역개정 등)
  if (event.path?.startsWith('/bible-proxy/bible/')) {
    const url = bibleTarget + event.path.replace('/bible-proxy/bible', '/bible')
    return proxyRequest(event, url)
  }
  
  // 하세나 프록시 처리
  if (event.path?.startsWith('/hasena-proxy/')) {
    const url = hasenaTarget + event.path.replace('/hasena-proxy', '/bbs')
    return proxyRequest(event, url)
  }
}) 