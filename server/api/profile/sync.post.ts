import { UNAVAILABLE, profileEnabled, readProfileBody } from '../../utils/profile-api'
import { isUserId, syncUser } from '../../utils/users'

/** 앱을 열 때와 여정을 마칠 때: 이 기기의 기록과 서버 기록을 합친다. */
export default defineEventHandler(async (event) => {
  if (!profileEnabled()) return UNAVAILABLE
  const body = await readProfileBody(event)
  if (!body || !isUserId(body.id)) return { ok: false as const, reason: 'invalid' as const }
  try {
    const result = await syncUser(body.id, body.secret, body.save)
    return result ? { ok: true as const, ...result } : { ok: false as const, reason: 'unknown-user' as const }
  } catch (err) {
    console.error('[profile] sync failed', err)
    return UNAVAILABLE
  }
})
