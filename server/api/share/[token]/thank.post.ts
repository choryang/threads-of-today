import { visitorKey } from '../../../utils/gratitude'
import { thankIntro } from '../../../utils/intro'
import { kvPersistent } from '../../../utils/kv'
import { TOO_MANY, underLimit } from '../../../utils/profile-api'

/** 소개받은 사람이 가입 없이 고마워요 (같은 기기·IP는 한 링크에 한 번). 레이트리밋은 고마워요와 같은 것 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  if (!(await underLimit(event, 'thanks', 400, 24 * 60 * 60))) return TOO_MANY
  const who = visitorKey(body?.id, getRequestIP(event, { xForwardedFor: true }) ?? 'unknown')
  try {
    const done = await thankIntro(getRouterParam(event, 'token') ?? '', who)
    return done ? { ok: true as const, ...done } : { ok: false as const, reason: 'not-found' as const }
  } catch {
    console.error('[intro] thank failed')
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
