import { kvPersistent } from '../../utils/kv'
import { shares } from '../../utils/share'

/** 링크는 그대로 두고 내용만 바꾼다 (마을 주민·방문 받기). 관리 키는 본문으로 받는다 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 8000) return { ok: false as const, reason: 'invalid' as const }
  const done = await shares.update(body.manage, body.payload).catch(() => null)
  return done ? { ok: true as const, ...done } : { ok: false as const, reason: 'not-found' as const }
})
