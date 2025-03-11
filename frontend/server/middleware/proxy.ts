import { defineEventHandler, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const bibleTarget = 'https://www.bskorea.or.kr'
  const hasenaTarget = 'https://xn--910b782abhbh7k53rca.kr'
  
  if (event.path?.startsWith('/bible-proxy/')) {
    const url = bibleTarget + event.path.replace('/bible-proxy', '/bible')
    return proxyRequest(event, url)
  }
  
  if (event.path?.startsWith('/hasena-proxy/')) {
    const url = hasenaTarget + event.path.replace('/hasena-proxy', '/bbs')
    return proxyRequest(event, url)
  }
}) 