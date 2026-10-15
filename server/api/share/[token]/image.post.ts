import { isToken } from '../../../../shared/share'
import { kv, kvPersistent } from '../../../utils/kv'
import { TOO_MANY, underLimit } from '../../../utils/profile-api'
import { shares } from '../../../utils/share'

/**
 * 오늘의 실 카드 그림(V2Quote, 앱이 1080×1350으로 그린 JPEG)을 올린다. 링크를 만든 기기(관리 키)만.
 * 링크 미리보기(og:image)와 /og/t/{token}.jpg로 쓴다. 그림에는 한 줄·직접 쓴 말이 들어가지 않는다(앱이 그리지 않는다).
 * 저장: share-image:{token} (링크와 같은 기간)
 */
export const MAX_IMAGE_BYTES = 450_000

export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const token = getRouterParam(event, 'token') ?? ''
  const body = await readBody(event).catch(() => null)
  if (!isToken(token) || !body || typeof body !== 'object' || typeof body.image !== 'string') return { ok: false as const, reason: 'invalid' as const }
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(body.image)
  const bytes = m ? Buffer.from(m[1]!, 'base64') : null
  // JPEG 시작 표시(FF D8 FF)와 크기만 본다
  if (!bytes || bytes.length > MAX_IMAGE_BYTES || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return { ok: false as const, reason: 'invalid' as const }
  if (!(await underLimit(event, 'share-image', 60, 24 * 60 * 60))) return TOO_MANY
  try {
    const rec = await shares.manages(token, body.manage)
    if (!rec || rec.kind !== 'thread') return { ok: false as const, reason: 'invalid' as const }
    const ttl = Math.max(1, Math.ceil((rec.expiresAt - Date.now()) / 1000))
    await kv().setItem(`share-image:${token}`, bytes.toString('base64'), { ttl })
    return { ok: true as const }
  } catch {
    console.error('[share] image failed')
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
