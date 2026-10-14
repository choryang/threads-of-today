export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // 진행 상황을 브라우저(localStorage)에 저장하는 게임이라 SPA로 동작한다. 서버는 /api만 쓴다.
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // NUXT_ANTHROPIC_API_KEY, NUXT_ANTHROPIC_MODEL 환경 변수로 덮어쓴다.
    anthropicApiKey: '',
    anthropicModel: 'claude-haiku-5-5',
    // NUXT_AI_DAILY_LIMIT: IP별 하루 AI 호출 한도
    aiDailyLimit: 20,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      title: '내 하루에 닿은 사람들',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '오늘 쓴 물건이 내 손에 오기까지 거쳐 온 사람들을 만나는 수집 게임' },
        { name: 'theme-color', content: '#0F1B2D' },
        { property: 'og:title', content: '내 하루에 닿은 사람들' },
        { property: 'og:description', content: '커피 한 잔, 휴대폰 하나에 몇 나라 사람들이 닿아 있을까?' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          crossorigin: 'anonymous',
          href: 'https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@500&display=swap',
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
})
