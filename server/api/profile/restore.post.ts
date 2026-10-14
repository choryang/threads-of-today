import { normalizeRecoveryCode } from '../../../shared/recovery'
import { TOO_MANY, UNAVAILABLE, profileEnabled, readProfileBody, underLimit } from '../../utils/profile-api'
import { restoreUser } from '../../utils/users'

/** 다른 기기에서 이어 하기: 복구 코드로 기록을 불러와 이 기기의 기록과 합친다. IP별로 시간당 10번까지만 시도할 수 있다. */
export default defineEventHandler(async (event) => {
  if (!profileEnabled()) return UNAVAILABLE
  const body = await readProfileBody(event)
  if (!(await underLimit(event, 'restore', 10, 60 * 60))) return TOO_MANY
  const code = normalizeRecoveryCode(body?.code)
  const notFound = { ok: false as const, reason: 'not-found' as const, message: '코드를 찾지 못했어요. 낱말과 숫자를 다시 확인해 주세요.' }
  if (!code) return notFound
  try {
    const result = await restoreUser(code, body?.save)
    return result ? { ok: true as const, ...result } : notFound
  } catch (err) {
    console.error('[profile] restore failed', err)
    return UNAVAILABLE
  }
})
