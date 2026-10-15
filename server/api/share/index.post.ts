import { isShareKind } from '../../../shared/share'
import { kvPersistent } from '../../utils/kv'
import { TOO_MANY, underLimit } from '../../utils/profile-api'
import { shares } from '../../utils/share'

/** 공유 링크 만들기·다시 만들기. { kind, payload, manage? } → { token, manage, path } (사용자 id·복구 코드는 받지도 돌려주지도 않는다) */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 2000 || !isShareKind(body.kind)) return { ok: false as const, reason: 'invalid' as const }
  if (!(await underLimit(event, 'share', 60, 24 * 60 * 60))) return TOO_MANY
  try {
    const made = await shares.issue(body.kind, body.payload, body.manage)
    return made ? { ok: true as const, ...made } : { ok: false as const, reason: 'invalid' as const }
  } catch {
    console.error('[share] issue failed')
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
