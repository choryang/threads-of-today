import type { H3Event } from 'h3'
import { hashIp, incrementCounter, kvPersistent } from './kv'
import { MAX_SAVE_BYTES } from './users'

export const UNAVAILABLE = { ok: false as const, reason: 'unavailable' as const, message: '지금은 기록을 서버에 저장할 수 없어요. 이 기기에는 그대로 남아 있어요.' }
export const TOO_MANY = { ok: false as const, reason: 'rate' as const, message: '잠시 후 다시 시도해 주세요.' }

/** 동기화 기능을 켤 수 있는지. 영구 저장소가 없으면(운영에서 Upstash 미설정) 끈다 */
export const profileEnabled = () => kvPersistent()

export async function readProfileBody(event: H3Event): Promise<Record<string, any> | null> {
  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object') return null
  if (JSON.stringify(body).length > MAX_SAVE_BYTES) return null
  return body
}

/** IP별 횟수 제한. (INCR + EXPIRE를 한 요청으로) */
export async function underLimit(event: H3Event, name: string, limit: number, windowSeconds: number): Promise<boolean> {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds)
  const count = await incrementCounter(`rate:${name}:${bucket}:${hashIp(ip)}`, windowSeconds * 2).catch(() => 0)
  return count <= limit
}
