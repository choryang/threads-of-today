import { ownerOfManage } from '../../../shared/share'
import { kvPersistent } from '../../utils/kv'
import { ownerFlowers } from '../../utils/village'

/** 내 마을의 꽃 (주인만, 관리 키를 본문으로) */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  const owner = await ownerOfManage(body?.manage)
  if (!owner) return { ok: false as const, reason: 'invalid' as const }
  return { ok: true as const, flowers: await ownerFlowers(owner).catch(() => []) }
})
