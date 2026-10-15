import { DATED_KEY_PATTERNS, expiredDatedKey } from '../../shared/cleanup'
import { seoulDateKey } from '../../shared/logic'
import { deleteKeys, scanKeys } from './kv'

/** 이틀 지난 날짜 키를 찾아 지운다. 지운 수를 키 종류별로 */
export async function cleanupDatedKeys(now = Date.now()): Promise<Record<string, number>> {
  const today = seoulDateKey(now)
  const removed: Record<string, number> = {}
  for (const pattern of DATED_KEY_PATTERNS) {
    const old = (await scanKeys(pattern)).filter((k) => expiredDatedKey(k, today))
    await deleteKeys(old)
    removed[pattern] = old.length
  }
  return removed
}
