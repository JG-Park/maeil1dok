import { defineEventHandler, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const target = 'https://www.bskorea.or.kr'
  
  if (event.path?.startsWith('/bible-proxy/')) {
    const url = target + event.path.replace('/bible-proxy', '/bible')
    return proxyRequest(event, url)
  }
}) 