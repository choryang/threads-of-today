import { timingSafeEqual } from 'node:crypto'
import { cleanupDatedKeys } from '../../utils/cleanup'
import { kvPersistent } from '../../utils/kv'

/**
 * Vercel Cron이 하루 한 번(서울 새벽 4시 = UTC 19시, nuxt.config의 nitro.vercel.config.crons) 부른다.
 * Vercel이 보내는 Authorization: Bearer {CRON_SECRET}이 맞을 때만 돈다. CRON_SECRET이 없으면 늘 거절한다.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  const got = Buffer.from(getHeader(event, 'authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret ?? ''}`)
  if (!secret || got.length !== want.length || !timingSafeEqual(got, want)) {
    setResponseStatus(event, 401)
    return { ok: false as const }
  }
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const removed = await cleanupDatedKeys()
  console.info('[cron] cleanup', removed)
  return { ok: true as const, removed }
})
