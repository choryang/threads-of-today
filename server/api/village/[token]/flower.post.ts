import { PEOPLE } from '../../../../shared/data/people'
import { normalizeNickname } from '../../../../shared/nickname'
import { visitorKey } from '../../../utils/gratitude'
import { kvPersistent } from '../../../utils/kv'
import { TOO_MANY, underLimit } from '../../../utils/profile-api'
import { leaveFlower } from '../../../utils/village'

/** 친구 마을의 주민에게 고마워요 → 꽃 한 송이 (같은 방문자는 같은 마을에 하루 한 송이). 레이트리밋은 고마워요와 같은 것 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  const personId = typeof body?.personId === 'string' ? body.personId : ''
  const nickname = normalizeNickname(body?.nickname)
  if (!PEOPLE[personId] || !nickname) return { ok: false as const, reason: 'invalid' as const }
  if (!(await underLimit(event, 'thanks', 400, 24 * 60 * 60))) return TOO_MANY
  const who = visitorKey(body?.id, getRequestIP(event, { xForwardedFor: true }) ?? 'unknown')
  try {
    const result = await leaveFlower(getRouterParam(event, 'token') ?? '', personId, nickname, who)
    return result === 'ok' ? { ok: true as const } : { ok: false as const, reason: result }
  } catch {
    console.error('[village] flower failed')
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
