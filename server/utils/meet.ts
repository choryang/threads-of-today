import { PEOPLE_LIST } from '../../shared/data/people'
import { MOOD_IDS, type MoodId } from '../../shared/data/moods'
import { seoulDateKey } from '../../shared/logic'
import { compactDate, snapshotMinutes, snapshotStale, type MeetSnapshot } from '../../shared/today'
import { hllAdd, hllCount, kv, setIfAbsent } from './kv'

/**
 * 모두의 오늘: meet:{사람}:{YYYYMMDD} HyperLogLog에 익명 사용자 id의 해시를 더한다(Redis에서는 mdp: 아래).
 * 새 기획: mood:{마음}:{YYYYMMDD}에는 그날 그 마음으로 실을 묶은 사람을 더한다(마음 id별 숫자만, 사람·물건은 넣지 않는다).
 * 같은 사용자가 여러 번 만나도 한 번으로 센다. 기간은 걸지 않고 날짜 키 청소(api/cron/cleanup)가 이틀 뒤 지운다.
 *
 * 읽기는 사용자 요청마다 세지 않는다: 사람 전체 수를 한 번에 센 스냅샷 하나(meet-snapshot)를 MEET_SNAPSHOT_MINUTES(기본 30분)마다 다시 만든다.
 */
const key = (personId: string, date: string) => `meet:${personId}:${compactDate(date)}`
/** 오늘 그 마음으로 실을 묶은 사람 (새 기획 5번 화면). 사람 키와 같은 방식, 같은 청소 */
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

export async function recordMeets(personIds: string[], who: string, now = Date.now()): Promise<void> {
  await hllAdd(personIds.map((id) => key(id, seoulDateKey(now))), who)
}

/** 이 서버 인스턴스가 들고 있는 스냅샷 (저장소 GET도 아낀다) */
let memo: MeetSnapshot | null = null

/**
 * 오늘 스냅샷. fresh가 false면 다른 서버가 다시 세는 중이라 예전 것을 돌려준 것(짧게만 캐시한다).
 * 다시 셀 때 명령: SET NX(잠금) 1 + PFCOUNT 사람 수(파이프라인 한 번) + SET 1
 */
export async function todaySnapshot(now = Date.now()): Promise<{ snapshot: MeetSnapshot; fresh: boolean }> {
  const date = seoulDateKey(now)
  const maxAge = snapshotMaxAgeSeconds() * 1000
  if (!snapshotStale(memo, now, date, maxAge)) return { snapshot: memo!, fresh: true }
  const stored = await kv().getItem<MeetSnapshot>(SNAPSHOT_KEY)
  if (!snapshotStale(stored, now, date, maxAge)) return { snapshot: (memo = stored!), fresh: true }
  if (!(await setIfAbsent(LOCK_KEY, '1', LOCK_SECONDS))) return { snapshot: stored ?? { date, at: 0, counts: {} }, fresh: false }
  const ids = PEOPLE_LIST.map((p) => p.id)
  // 사람 수와 마음 수를 파이프라인 한 번에
  const n = await hllCount([...ids.map((id) => key(id, date)), ...MOOD_IDS.map((m) => moodKey(m, date))])
  const counts: Record<string, number> = {}
  ids.forEach((id, i) => {
    if (n[i]) counts[id] = n[i]!
  })
  const moods: Record<string, number> = {}
  MOOD_IDS.forEach((m, i) => {
    const c = n[ids.length + i]
    if (c) moods[m] = c
  })
  memo = { date, at: now, counts, moods }
  await kv().setItem(SNAPSHOT_KEY, memo)
  return { snapshot: memo, fresh: true }
}
