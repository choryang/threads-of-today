import { createHash } from 'node:crypto'
import { Redis } from '@upstash/redis'

/**
 * 키-값 저장소. 운영은 Upstash Redis(Vercel 마켓플레이스), 로컬 개발은 파일(.data/kv), 그 밖에는 메모리.
 * 마운트는 server/plugins/kv.ts가 한다. 모든 키는 Redis에서 "mdp:" 아래에 놓인다.
 */
export const KV_PREFIX = 'mdp'

/** Vercel 마켓플레이스 연동이 넣어 주는 KV_* 이름과 Upstash 콘솔의 UPSTASH_* 이름을 모두 받는다 */
export function kvCredentials(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

let redis: Redis | null | undefined
/** 원자적 연산(INCR, SET NX)용 Upstash 클라이언트. Upstash가 없으면 null */
function redisClient(): Redis | null {
  if (redis === undefined) {
    const cred = kvCredentials()
    redis = cred ? new Redis(cred) : null
  }
  return redis
}

/** 기기 사이 동기화처럼 서버 인스턴스가 바뀌어도 남아야 하는 기능을 켤 수 있는지 */
export function kvPersistent(): boolean {
  return !!kvCredentials() || import.meta.dev
}

export const kv = () => useStorage('kv')

/** 카운터를 1 올리고 새 값을 돌려준다. Upstash에서는 INCR + EXPIRE를 한 번의 요청(pipeline)으로 보낸다. */
export async function incrementCounter(key: string, ttlSeconds: number): Promise<number> {
  const r = redisClient()
  if (r) {
    const full = `${KV_PREFIX}:${key}`
    const [count] = await r.pipeline().incr(full).expire(full, ttlSeconds).exec<[number, number]>()
    return count
  }
  // 메모리·파일 드라이버: 개발용이라 원자성은 보장하지 않는다
  const count = ((await kv().getItem<number>(key)) ?? 0) + 1
  await kv().setItem(key, count)
  return count
}

/**
 * 정렬 집합의 이름마다 점수를 1씩 올린다 (재료 요청 집계). Upstash에서는 ZINCRBY를 한 번의 요청(pipeline)으로 보낸다.
 * 메모리·파일 드라이버에서는 { 이름: 횟수 } 객체 하나로 흉내 낸다 (원자성 없음).
 */
export async function incrementScores(key: string, members: string[]): Promise<void> {
  if (!members.length) return
  const r = redisClient()
  if (r) {
    const full = `${KV_PREFIX}:${key}`
    const p = r.pipeline()
    for (const m of members) p.zincrby(full, 1, m)
    await p.exec()
    return
  }
  const counts = (await kv().getItem<Record<string, number>>(key)) ?? {}
  for (const m of members) counts[m] = (counts[m] ?? 0) + 1
  await kv().setItem(key, counts)
}

/** incrementScores로 센 점수를 많은 순으로 돌려준다 */
export async function readScores(key: string): Promise<Array<[string, number]>> {
  const r = redisClient()
  if (r) {
    const flat = await r.zrange<(string | number)[]>(`${KV_PREFIX}:${key}`, 0, -1, { rev: true, withScores: true })
    const out: Array<[string, number]> = []
    for (let i = 0; i < flat.length; i += 2) out.push([String(flat[i]), Number(flat[i + 1])])
    return out
  }
  const counts = (await kv().getItem<Record<string, number>>(key)) ?? {}
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

/** 키가 없을 때만 쓴다 (복구 코드 중복 방지). 썼으면 true */
export async function setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  const r = redisClient()
  if (r) return (await r.set(`${KV_PREFIX}:${key}`, value, { nx: true, ex: ttlSeconds })) === 'OK'
  if (await kv().hasItem(key)) return false
  await kv().setItem(key, value, { ttl: ttlSeconds })
  return true
}

/** IP를 그대로 저장하지 않고 소금 친 해시로 바꾼다 */
export function hashIp(ip: string): string {
  return createHash('sha256').update(`${process.env.NUXT_IP_SALT ?? 'my-day-people'}:${ip}`).digest('base64url').slice(0, 16)
}

/** incrementCounter로 센 값들을 읽는다. 없는 키는 0 */
export async function readCounters(keys: string[]): Promise<number[]> {
  if (!keys.length) return []
  const r = redisClient()
  if (r) {
    const values = await r.mget<(number | string | null)[]>(...keys.map((k) => `${KV_PREFIX}:${k}`))
    return values.map((v) => Number(v ?? 0) || 0)
  }
  return Promise.all(keys.map(async (k) => (await kv().getItem<number>(k)) ?? 0))
}

/** incrementScores로 센 점수 중 몇 이름만 읽는다. 없는 이름은 0 */
export async function readScoresOf(key: string, members: string[]): Promise<number[]> {
  if (!members.length) return []
  const r = redisClient()
  if (r) {
    const full = `${KV_PREFIX}:${key}`
    const p = r.pipeline()
    for (const m of members) p.zscore(full, m)
    const values = await p.exec<(number | null)[]>()
    return values.map((v) => Number(v ?? 0) || 0)
  }
  const counts = (await kv().getItem<Record<string, number>>(key)) ?? {}
  return members.map((m) => counts[m] ?? 0)
}

/**
 * HyperLogLog: 키마다 member를 더한다(PFADD)고 기간을 건다(EXPIRE). 같은 member를 여러 번 더해도 한 번으로 센다.
 * Upstash에서는 키 전부를 파이프라인 한 번으로 보낸다. 개발용 저장소에서는 배열로 흉내 낸다(정확히 센다).
 */
export async function hllAdd(keys: string[], member: string, ttlSeconds: number): Promise<void> {
  if (!keys.length) return
  const r = redisClient()
  if (r) {
    const p = r.pipeline()
    for (const k of keys) {
      p.pfadd(`${KV_PREFIX}:${k}`, member)
      p.expire(`${KV_PREFIX}:${k}`, ttlSeconds)
    }
    await p.exec()
    return
  }
  for (const k of keys) {
    const set = new Set((await kv().getItem<string[]>(k)) ?? [])
    set.add(member)
    await kv().setItem(k, [...set], { ttl: ttlSeconds })
  }
}

/** HyperLogLog 키마다 센 수 (PFCOUNT를 파이프라인으로). 없는 키는 0 */
export async function hllCount(keys: string[]): Promise<number[]> {
  if (!keys.length) return []
  const r = redisClient()
  if (r) {
    const p = r.pipeline()
    for (const k of keys) p.pfcount(`${KV_PREFIX}:${k}`)
    return (await p.exec<number[]>()).map((n) => Number(n) || 0)
  }
  return Promise.all(keys.map(async (k) => ((await kv().getItem<string[]>(k)) ?? []).length))
}
