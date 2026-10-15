import type { H3Event } from 'h3'
import { isToken, type ShareKind } from '../../shared/share'
import { kvPersistent } from './kv'
import { shares } from './share'

/**
 * 공유 링크 주소(/d/{token} 등)가 돌려줄 HTML. 앱은 SPA(ssr: false)라 링크 미리보기를 만드는 크롤러가 meta를 읽지 못한다.
 * 그래서 SPA의 빈 껍데기 HTML을 받아 OG meta만 바꿔 넣어 돌려준다. 브라우저는 그 HTML로 평소처럼 SPA를 띄운다.
 */
export interface ShareMeta {
  title: string
  description: string
  /** /og/... 처럼 사이트 안 경로 (절대 주소로 바꿔 넣는다) */
  image: string
  imageWidth?: number
  imageHeight?: number
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function sharePageHtml(event: H3Event, meta: ShareMeta | null): Promise<string> {
  const res = await useNitroApp().localFetch('/', { headers: { accept: 'text/html' } })
  let html = await res.text()
  if (!meta) return html
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true })
  const image = new URL(meta.image, url.origin).toString()
  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="${meta.imageWidth ?? 1200}">`,
    `<meta property="og:image:height" content="${meta.imageHeight ?? 630}">`,
    `<meta property="og:url" content="${esc(url.origin + url.pathname)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="description" content="${esc(meta.description)}">`,
  ].join('')
  // 앱 기본 OG·설명과 제목을 이 링크의 것으로 바꾼다
  html = html
    .replace(/<meta (property="og:[^"]+"|name="description"|name="twitter:[^"]+")[^>]*>/g, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace('</head>', `${tags}</head>`)
  return html
}

/**
 * 공유 링크 주소의 서버 라우트 (/d, /p, /v가 같이 쓴다): 토큰으로 그 링크를 찾아 OG meta를 만들고 SPA 껍데기에 넣어 돌려준다.
 * 링크가 없거나 만료됐으면 앱 기본 meta 그대로(화면은 SPA가 '열 수 없어요'를 보여 준다).
 */
export function defineShareRoute<P>(kind: ShareKind, metaOf: (payload: P, token: string) => ShareMeta | null) {
  return defineEventHandler(async (event) => {
    const token = getRouterParam(event, 'token') ?? ''
    let meta: ShareMeta | null = null
    if (isToken(token) && kvPersistent()) {
      const found = await shares.lookup(token).catch(() => null)
      if (found?.kind === kind) meta = metaOf(found.payload as P, token)
    }
    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    // 링크마다 다른 meta라 공유 캐시에는 남기지 않는다
    setHeader(event, 'cache-control', 'private, no-store')
    return sharePageHtml(event, meta)
  })
}
