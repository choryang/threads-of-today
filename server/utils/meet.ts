import { MOOD_IDS, type MoodId } from '../../shared/data/moods'
import { seoulDateKey } from '../../shared/logic'
import { compactDate, snapshotMinutes, snapshotStale, type MeetSnapshot } from '../../shared/today'
import { hllAdd, hllCount, kv, setIfAbsent } from './kv'

/**
 * 모두의 오늘: mood:{마음}:{YYYYMMDD} HyperLogLog에 그날 그 마음으로 실을 묶은 사람(익명 id 해시)을 더한다(Redis에서는 mdp: 아래).
 * 마음 id별 숫자만, 사람·물건은 넣지 않는다. 같은 사용자는 한 번으로 센다. 기간은 걸지 않고 날짜 키 청소(api/cron/cleanup)가 이틀 뒤 지운다.
 * 예전 기획의 사람별 수(meet:{사람}:{날짜})는 화면에서 빠져 더 세지 않는다(스냅샷마다 사람 수만큼 PFCOUNT가 들던 것).
 *
 * 읽기는 사용자 요청마다 세지 않는다: 마음별 수를 한 번에 센 스냅샷 하나(meet-snapshot)를 MEET_SNAPSHOT_MINUTES(기본 30분)마다 다시 만든다.
 */
/** 오늘 그 마음으로 실을 묶은 사람 (새 기획 5번 화면) */
const moodKey = (mood: string, date: string) => `mood:${mood}:${compactDate(date)}`
const SNAPSHOT_KEY = 'meet-snapshot'
/** 여러 서버가 동시에 다시 세지 않게 (다시 세는 동안만) */
const LOCK_KEY = 'meet-snapshot-lock'
const LOCK_SECONDS = 60

/** 스냅샷 재계산 간격(초). CDN s-maxage도 이 값을 쓴다 */
export const snapshotMaxAgeSeconds = () => snapshotMinutes(process.env.MEET_SNAPSHOT_MINUTES) * 60

export async function recordMood(mood: MoodId, who: string, now = Date.now()): Promise<void> {
  await hllAdd([moodKey(mood, seoulDateKey(now))], who)
}


/** 이 서버 인스턴스가 들고 있는 스냅샷 (저장소 GET도 아낀다) */
let memo: MeetSnapshot | null = null

/**
 * 오늘 스냅샷. fresh가 false면 다른 서버가 다시 세는 중이라 예전 것을 돌려준 것(짧게만 캐시한다).
 * 다시 셀 때 명령: SET NX(잠금) 1 + PFCOUNT 마음 8개(파이프라인 한 번) + SET 1
 */
export async function todaySnapshot(now = Date.now()): Promise<{ snapshot: MeetSnapshot; fresh: boolean }> {
  const date = seoulDateKey(now)
  const maxAge = snapshotMaxAgeSeconds() * 1000
  if (!snapshotStale(memo, now, date, maxAge)) return { snapshot: memo!, fresh: true }
  const stored = await kv().getItem<MeetSnapshot>(SNAPSHOT_KEY)
  if (!snapshotStale(stored, now, date, maxAge)) return { snapshot: (memo = stored!), fresh: true }
  if (!(await setIfAbsent(LOCK_KEY, '1', LOCK_SECONDS))) return { snapshot: stored ?? { date, at: 0, counts: {} }, fresh: false }
  const n = await hllCount(MOOD_IDS.map((m) => moodKey(m, date)))
  const moods: Record<string, number> = {}
  MOOD_IDS.forEach((m, i) => {
    if (n[i]) moods[m] = n[i]!
  })
  memo = { date, at: now, counts: {}, moods }
  await kv().setItem(SNAPSHOT_KEY, memo)
  return { snapshot: memo, fresh: true }
}
