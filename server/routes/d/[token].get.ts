import { DAY_TYPES } from '../../../shared/day-type'
import { dayShareTitle, isToken, type DayPayload } from '../../../shared/share'
import { kvPersistent } from '../../utils/kv'
import { shares } from '../../utils/share'
import { sharePageHtml, type ShareMeta } from '../../utils/share-page'

/** 나의 하루 유형 공유 링크: OG meta가 들어간 HTML이 SPA를 띄운다 (화면은 app/pages/d/[token].vue) */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') ?? ''
  let meta: ShareMeta | null = null
  if (isToken(token) && kvPersistent()) {
    const found = await shares.lookup(token).catch(() => null)
    if (found?.kind === 'day') {
      const p = found.payload as DayPayload
      meta = { title: dayShareTitle(p), description: `${DAY_TYPES[p.type].desc}. 당신의 하루는요?`, image: `/og/day-${p.type}.png` }
    }
  }
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  // 링크마다 다른 meta라 공유 캐시에는 남기지 않는다
  setHeader(event, 'cache-control', 'private, no-store')
  return sharePageHtml(event, meta)
})
