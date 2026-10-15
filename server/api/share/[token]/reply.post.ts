import { kvPersistent } from '../../../utils/kv'
import { TOO_MANY, underLimit } from '../../../utils/profile-api'
import { shares } from '../../../utils/share'

/** 받은 사람이 '보여주기'를 눌렀을 때만: 고른 물건과 닉네임을 보낸 사람의 링크에 남긴다 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  if (!(await underLimit(event, 'share-reply', 60, 24 * 60 * 60))) return TOO_MANY
  const ok = await shares.reply(getRouterParam(event, 'token') ?? '', { items: body?.items, nickname: body?.nickname }).catch(() => false)
  return ok ? { ok: true as const } : { ok: false as const, reason: 'invalid' as const }
})
