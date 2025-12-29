declare global {
  interface Window {
    Kakao: any;
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  if (process.client) {
    const script = document.createElement('script')
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js'
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      window.Kakao.init(config.public.KAKAO_CLIENT_ID)
    }
  }
}) 