import { kvPersistent } from '../../utils/kv'
import { shares } from '../../utils/share'

/** 공유 링크를 연 사람이 보는 내용 { kind, payload, expiresAt }. 없거나 만료됐으면 not-found */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const found = await shares.lookup(getRouterParam(event, 'token') ?? '').catch(() => null)
  return found ? { ok: true as const, ...found } : { ok: false as const, reason: 'not-found' as const }
})
