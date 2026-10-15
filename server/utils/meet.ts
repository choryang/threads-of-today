import { compactDate } from '../../shared/today'
import { seoulDateKey } from '../../shared/logic'
import { hllAdd, hllCount } from './kv'

/**
 * 모두의 오늘: meet:{사람}:{YYYYMMDD} HyperLogLog에 익명 사용자 id의 해시를 더한다(Redis에서는 mdp: 아래). 48시간 뒤 만료.
 * 같은 사용자가 여러 번 만나도 한 번으로 센다.
 */
const TTL = 48 * 60 * 60
const key = (personId: string, date: string) => `meet:${personId}:${compactDate(date)}`

export async function recordMeets(personIds: string[], who: string, now = Date.now()): Promise<void> {
  const date = seoulDateKey(now)
  await hllAdd(personIds.map((id) => key(id, date)), who, TTL)
}

/** 같은 날 같은 사람들 묻기를 60초 동안 이 서버에서 다시 쓰지 않는다 */
const cache = new Map<string, { at: number; counts: Record<string, number> }>()
const CACHE_MS = 60_000

export async function readMeets(personIds: string[], now = Date.now()): Promise<Record<string, number>> {
  const date = seoulDateKey(now)
  const ck = `${date}|${[...personIds].sort().join(',')}`
  const hit = cache.get(ck)
  if (hit && now - hit.at < CACHE_MS) return hit.counts
  const counts = await hllCount(personIds.map((id) => key(id, date)))
  const out = Object.fromEntries(personIds.map((id, i) => [id, counts[i] ?? 0]))
  if (cache.size > 500) cache.clear()
  cache.set(ck, { at: now, counts: out })
  return out
}
