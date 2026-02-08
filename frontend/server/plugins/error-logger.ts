export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, { event }) => {
    const url = event?.node?.req?.url || 'unknown'
    const method = event?.node?.req?.method || 'unknown'
    const userAgent = event?.node?.req?.headers?.['user-agent'] || 'unknown'
    const cookies = event?.node?.req?.headers?.cookie || 'none'
    
    console.error('========== SSR ERROR ==========')
    console.error('URL:', url)
    console.error('Method:', method)
    console.error('User-Agent:', userAgent)
    console.error('Has Cookies:', cookies !== 'none' ? 'YES' : 'NO')
    console.error('Error Name:', error?.name)
    console.error('Error Message:', error?.message)
    console.error('Error Stack:', error?.stack)
    console.error('===============================')
  })

  nitroApp.hooks.hook('request', async (event) => {
    const url = event?.node?.req?.url || 'unknown'
    const cookies = event?.node?.req?.headers?.cookie || 'none'
    const hasAuthCookie = cookies.includes('access_token')
    
    if (hasAuthCookie) {
      console.log('[SSR Request] URL:', url, '| Has Auth Cookie: YES')
    }
  })
})
