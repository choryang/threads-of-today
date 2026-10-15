import { kvPersistent } from '../../utils/kv'
import { publicVillage } from '../../utils/village'

/** 친구 마을 (공개용): 닉네임, 주민 id 목록, 최근 꽃만. 진행 기록 전체는 주지 않는다 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const v = await publicVillage(getRouterParam(event, 'token') ?? '').catch(() => null)
  if (!v) return { ok: false as const, reason: 'not-found' as const }
  if (!v.open) return { ok: false as const, reason: 'closed' as const, nickname: v.nickname }
  return { ok: true as const, nickname: v.nickname, residents: v.residents, flowers: v.flowers }
})
