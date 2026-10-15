import { kvPersistent } from '../../utils/kv'
import { shares } from '../../utils/share'

/** 보낸 사람이 자기 링크에 온 답을 읽는다. 관리 키는 주소가 아니라 본문으로 받는다 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  const found = await shares.replies(body?.manage).catch(() => null)
  return found ? { ok: true as const, replies: found.replies } : { ok: false as const, reason: 'not-found' as const }
})
