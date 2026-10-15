import { PEOPLE } from '../../../shared/data/people'
import { kvPersistent } from '../../utils/kv'
import { readMeets } from '../../utils/meet'

/** 오늘 이 사람들을 만난 사용자 수: ?ids=a,b (최대 60명). 응답은 60초 캐시 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const ids = [...new Set(String(getQuery(event).ids ?? '').split(',').filter((id) => PEOPLE[id]))].slice(0, 60)
  if (!ids.length) return { ok: false as const, reason: 'invalid' as const }
  try {
    const counts = await readMeets(ids)
    setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=60')
    return { ok: true as const, counts }
  } catch {
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
