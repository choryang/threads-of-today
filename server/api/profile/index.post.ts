import { TOO_MANY, UNAVAILABLE, profileEnabled, readProfileBody, underLimit } from '../../utils/profile-api'
import { createUser } from '../../utils/users'

/** 첫 방문: 익명 id·기기 비밀값·복구 코드 발급. 이 기기의 기록을 함께 받아 바로 저장한다. */
export default defineEventHandler(async (event) => {
  if (!profileEnabled()) return UNAVAILABLE
  const body = await readProfileBody(event)
  if (!(await underLimit(event, 'profile', 30, 24 * 60 * 60))) return TOO_MANY
  try {
    return { ok: true as const, ...(await createUser(body?.save)) }
  } catch (err) {
    console.error('[profile] create failed', err)
    return UNAVAILABLE
  }
})
