import { kvPersistent } from '../../utils/kv'
import { introCounts } from '../../utils/intro'

/** 내가 보낸 소개 링크들의 고마워요 수 (관리 키 목록을 본문으로, 최대 50개) */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const body = await readBody(event).catch(() => null)
  const manages = Array.isArray(body?.manages) ? (body.manages as unknown[]).filter((m): m is string => typeof m === 'string').slice(0, 50) : []
  if (!manages.length) return { ok: true as const, counts: [] }
  return { ok: true as const, counts: await introCounts(manages).catch(() => manages.map(() => 0)) }
})
