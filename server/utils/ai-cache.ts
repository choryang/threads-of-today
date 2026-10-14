import type { Decomposed } from '../../shared/logic'
import { dateKey } from '../../shared/logic'
import { normalize } from '../../shared/match'
import { hashIp, incrementCounter, kv } from './kv'

/**
 * AI가 분해한 결과를 모든 사용자가 함께 쓰는 캐시. 키는 정규화한 입력(사진이면 Claude가 알아본 물건 이름).
 * hits는 조회 수(동시에 들어온 조회는 하나로 셀 수 있는 근사값). 검토 후 사전에 옮길 수 있게 scripts/export-cache.ts로 뽑는다.
 */
export interface CachedDecompose extends Decomposed {
  hits: number
  firstSeen: string
  lastSeen: string
  source: 'ai'
}

/** 오래 안 쓰인 항목은 지운다. 조회할 때마다 다시 늘어난다. */
const CACHE_TTL = 180 * 24 * 60 * 60

export const cacheKey = (text: string) => `cache:text:${normalize(text)}`

/** 캐시에서 찾으면 조회 수를 올려 돌려준다. (GET 1 + SET 1) */
export async function readCache(text: string): Promise<CachedDecompose | null> {
  if (!normalize(text)) return null
  const key = cacheKey(text)
  const entry = await kv().getItem<CachedDecompose>(key)
  if (!entry?.materialIds?.length) return null
  const updated = { ...entry, hits: (entry.hits ?? 0) + 1, lastSeen: dateKey() }
  await kv().setItem(key, updated, { ttl: CACHE_TTL })
  return updated
}

/** (SET 1) */
export async function writeCache(text: string, result: Decomposed): Promise<void> {
  if (!normalize(text)) return
  const today = dateKey()
  const entry: CachedDecompose = {
    name: result.name,
    materialIds: result.materialIds,
    ...(result.twist ? { twist: result.twist } : {}),
    ...(result.voice ? { voice: result.voice } : {}),
    hits: 1,
    firstSeen: today,
    lastSeen: today,
    source: 'ai',
  }
  await kv().setItem(cacheKey(text), entry, { ttl: CACHE_TTL })
}

/** IP별 하루 AI 호출 횟수를 1 올리고, 한도 안이면 true. (INCR + EXPIRE를 한 요청으로) */
export async function allowAiCall(ip: string, dailyLimit: number): Promise<boolean> {
  const count = await incrementCounter(`rate:ai:${dateKey()}:${hashIp(ip)}`, 2 * 24 * 60 * 60)
  return count <= dailyLimit
}

export const toDecomposed = ({ name, materialIds, twist, voice }: Decomposed): Decomposed => ({ name, materialIds, twist, voice })
