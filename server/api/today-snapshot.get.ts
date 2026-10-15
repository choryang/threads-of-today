import { kvPersistent } from '../utils/kv'
import { snapshotMaxAgeSeconds, todaySnapshot } from '../utils/meet'

/**
 * 모두의 오늘 스냅샷: 오늘 사람마다 만난 사용자 수 전체를 한 번에 (사용자마다 같은 응답이라 CDN에 둔다).
 * 서버 저장값은 MEET_SNAPSHOT_MINUTES(기본 30분)가 지났을 때만 다시 세고, 응답도 CDN에서 같은 시간(s-maxage) +
 * 다시 받는 동안 1시간까지 예전 것을 준다. 기기는 maxAgeSeconds 동안 다시 묻지 않는다.
 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  try {
    const { snapshot, fresh } = await todaySnapshot()
    const maxAgeSeconds = snapshotMaxAgeSeconds()
    setHeader(event, 'cache-control', fresh ? `public, max-age=0, s-maxage=${maxAgeSeconds}, stale-while-revalidate=3600` : 'public, max-age=0, s-maxage=10')
    return { ok: true as const, snapshot, maxAgeSeconds }
  } catch {
    console.error('[today-snapshot] failed')
    setHeader(event, 'cache-control', 'no-store')
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
