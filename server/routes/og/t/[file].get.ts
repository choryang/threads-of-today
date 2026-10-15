import { isToken } from '../../../../shared/share'
import { kv, kvPersistent } from '../../../utils/kv'

/** 오늘의 실 카드 그림 /og/t/{token}.jpg (링크 미리보기). 없으면 공통 그림으로 */
export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, 'file') ?? ''
  const token = file.replace(/\.jpg$/, '')
  const data = isToken(token) && kvPersistent() ? await kv().getItem<string>(`share-image:${token}`).catch(() => null) : null
  if (typeof data !== 'string' || !data) return sendRedirect(event, '/og/thread.png', 302)
  setHeader(event, 'content-type', 'image/jpeg')
  setHeader(event, 'cache-control', 'public, max-age=86400')
  return Buffer.from(data, 'base64')
})
