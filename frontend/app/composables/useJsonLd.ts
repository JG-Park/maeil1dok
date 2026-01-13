/**
 * JSON-LD 구조화 데이터 composable
 * 검색엔진 최적화를 위한 Schema.org 마크업 생성
 */
export const useJsonLd = () => {
  /**
   * Organization 스키마 추가
   */
  const addOrganizationSchema = () => {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: '매일일독',
            url: 'https://maeil1dok.app',
            logo: 'https://maeil1dok.app/icon-512x512.png',
            description: '올해는 매일일독과 함께 성경일독!',
          }),
        },
      ],
    })
  }

  /**
   * WebSite 스키마 추가
   */
  const addWebSiteSchema = () => {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: '매일일독',
            url: 'https://maeil1dok.app',
            description: '매일일독과 함께 올해는 성경통독하기!',
            inLanguage: 'ko-KR',
            publisher: {
              '@type': 'Organization',
              name: '매일일독',
            },
          }),
        },
      ],
    })
  }

  /**
   * WebApplication 스키마 추가
   */
  const addWebApplicationSchema = () => {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '매일일독',
            url: 'https://maeil1dok.app',
            applicationCategory: 'ReligionApplication',
            operatingSystem: 'All',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'KRW',
            },
            description: '성경 통독을 체계적으로 관리하고 진행률을 확인할 수 있는 웹 애플리케이션',
          }),
        },
      ],
    })
  }

  /**
   * 모든 기본 스키마 한번에 추가
   */
  const addDefaultSchemas = () => {
    addOrganizationSchema()
    addWebSiteSchema()
    addWebApplicationSchema()
  }

  return {
    addOrganizationSchema,
    addWebSiteSchema,
    addWebApplicationSchema,
    addDefaultSchemas,
  }
}
