import { PEOPLE } from '../../../shared/data/people'
import { visitorKey } from '../../utils/gratitude'
import { kvPersistent } from '../../utils/kv'
import { recordMeets } from '../../utils/meet'
import { TOO_MANY, underLimit } from '../../utils/profile-api'

/** 오늘 만난 사람들을 센다 (클라이언트가 사람마다 하루 한 번만 보낸다). 사용자 id는 해시로만 쓴다 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  const ids = Array.isArray(body?.personIds) ? [...new Set((body.personIds as unknown[]).filter((id): id is string => typeof id === 'string' && !!PEOPLE[id]))].slice(0, 60) : []
  if (!ids.length) return { ok: false as const, reason: 'invalid' as const }
  if (!(await underLimit(event, 'meet', 300, 24 * 60 * 60))) return TOO_MANY
  try {
    await recordMeets(ids, visitorKey(body?.id, getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'))
    return { ok: true as const }
  } catch {
    console.error('[meet] record failed')
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
