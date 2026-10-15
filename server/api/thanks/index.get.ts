import { PEOPLE } from '../../../shared/data/people'
import { readGratitude } from '../../utils/gratitude'
import { kvPersistent } from '../../utils/kv'

/** 사람들의 고마움 수: ?ids=a,b (최대 20명). 순위·정렬 없이 물어본 사람만 돌려준다 */
export default defineEventHandler(async (event) => {
  if (!kvPersistent()) return { ok: false as const, reason: 'unavailable' as const }
  const raw = String(getQuery(event).ids ?? '')
  const ids = [...new Set(raw.split(',').filter((id) => PEOPLE[id]))].slice(0, 20)
  if (!ids.length) return { ok: false as const, reason: 'invalid' as const }
  try {
    return { ok: true as const, counts: await readGratitude(ids) }
  } catch (err) {
    console.error('[thanks] read failed', err)
    return { ok: false as const, reason: 'unavailable' as const }
  }
})
