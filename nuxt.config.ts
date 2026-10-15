export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // 진행 상황을 브라우저(localStorage)에 저장하는 게임이라 SPA로 동작한다. 서버는 /api만 쓴다.
  ssr: false,
  devtools: { enabled: false },
  nitro: {
    vercel: {
      config: {
        // Vercel Cron: 이틀 지난 날짜 키(meet:*, thanks:day:*) 청소. 서울 새벽 4시 = UTC 19시. CRON_SECRET 환경 변수 필요
        crons: [{ path: '/api/cron/cleanup', schedule: '0 19 * * *' }],
      },
    },
  },
  css: ['~/assets/css/main.css', '~/assets/css/today.css'],
  runtimeConfig: {
    // NUXT_ANTHROPIC_API_KEY, NUXT_ANTHROPIC_MODEL 환경 변수로 덮어쓴다.
    anthropicApiKey: '',
    anthropicModel: 'claude-haiku-5-5',
    // NUXT_AI_DAILY_LIMIT: IP별 하루 AI 호출 한도
    aiDailyLimit: 20,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ko', class: 'today-ui' },
      title: '내 하루에 닿은 사람들',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '오늘 당신만 그런 게 아니었어요. 하루 한 번, 오늘 손에 닿은 물건을 따라 같은 하루를 보낸 한 사람을 만나요' },
        { name: 'theme-color', content: '#FFFFFF' },
        { property: 'og:title', content: '내 하루에 닿은 사람들' },
        { property: 'og:description', content: '오늘 당신만 그런 게 아니었어요. 지구 반대편에도 당신 같은 하루를 보낸 사람이 있어요' },
        { property: 'og:image', content: '/og/thread.png' },
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
