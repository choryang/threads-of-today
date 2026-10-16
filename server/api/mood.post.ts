import { isMoodId } from '../../shared/data/moods'
import { visitorKey } from '../utils/visitor'
import { kvPersistent } from '../utils/kv'
import { recordMood } from '../utils/meet'
import { TOO_MANY, underLimit } from '../utils/profile-api'

/**
 * 모두의 오늘 (새 기획): 오늘 이 마음으로 실을 묶었다. 마음 id만 받는다(사람·물건·한 줄은 받지 않는다).
 * 같은 사용자는 하루 한 번으로 센다(HyperLogLog). 사용자 id는 해시로만 쓴다
 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  if (!body || !isMoodId(body.mood)) return { ok: false as const, reason: 'invalid' as const }
  if (!(await underLimit(event, 'mood', 30, 24 * 60 * 60))) return TOO_MANY
  try {
    await recordMood(body.mood, visitorKey(body.id, getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'))
    return { ok: true as const }
  } catch {
    console.error('[mood] record failed')
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
