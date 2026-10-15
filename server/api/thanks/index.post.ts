import { PEOPLE } from '../../../shared/data/people'
import { recordGratitude } from '../../utils/gratitude'
import { hashIp, kvPersistent } from '../../utils/kv'
import { TOO_MANY, underLimit } from '../../utils/profile-api'
import { isUserId } from '../../utils/users'

/** 고마워요를 눌렀을 때: 그 사람의 오늘 수와 누적 수를 1 올린다 (같은 기기·같은 날·같은 사람은 한 번만) */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  const personId = typeof body?.personId === 'string' ? body.personId : ''
  if (!PEOPLE[personId]) return { ok: false as const, reason: 'invalid' as const }
  if (!(await underLimit(event, 'thanks', 400, 24 * 60 * 60))) return TOO_MANY
  const who = isUserId(body?.id) ? body.id : hashIp(getRequestIP(event, { xForwardedFor: true }) ?? 'unknown')
  try {
    return { ok: true as const, counted: await recordGratitude(personId, who) }
  } catch (err) {
    console.error('[thanks] record failed', err)
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
