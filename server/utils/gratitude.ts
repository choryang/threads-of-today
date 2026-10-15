import { seoulDateKey } from '../../shared/logic'
import { incrementCounter, incrementScores, readCounters, readScoresOf, setIfAbsent } from './kv'

/**
 * 다른 사람들의 고마움 (모든 사용자를 합친 수). 순위는 만들지 않는다: 사람 한 명씩만 읽는다.
 *
 * 저장 키 (날짜는 서울 기준)
 *   thanks:seen:{날짜}:{누가}:{사람}  같은 기기가 같은 날 같은 사람에게 두 번 세지지 않게 (2일 뒤 만료)
 *   thanks:day:{날짜}:{사람}         그날 고마워한 사람 수 (3일 뒤 만료)
 *   thanks:total                    사람 id → 지금까지 고마워한 횟수 (정렬 집합, 하루 한 번씩 쌓인다)
 * '누가'는 익명 사용자 id가 있으면 그것, 없으면 소금 친 IP 해시. 닉네임 같은 사용자 정보는 받지 않는다.
 */
const DAY = 24 * 60 * 60
export const TOTAL_KEY = 'thanks:total'
const dayKey = (date: string, personId: string) => `thanks:day:${date}:${personId}`

/** 고마움 한 번을 센다. 오늘 이미 센 사람이면 false */
export async function recordGratitude(personId: string, who: string, now = Date.now()): Promise<boolean> {
  const date = seoulDateKey(now)
  if (!(await setIfAbsent(`thanks:seen:${date}:${who}:${personId}`, '1', 2 * DAY))) return false
  await Promise.all([incrementCounter(dayKey(date, personId), 3 * DAY), incrementScores(TOTAL_KEY, [personId])])
  return true
}

export interface GratitudeCount {
  /** 오늘 고마워한 사람 수 */
  today: number
  /** 지금까지 고마워한 횟수 */
  total: number
}

export async function readGratitude(personIds: string[], now = Date.now()): Promise<Record<string, GratitudeCount>> {
  const date = seoulDateKey(now)
  const [today, total] = await Promise.all([readCounters(personIds.map((id) => dayKey(date, id))), readScoresOf(TOTAL_KEY, personIds)])
  return Object.fromEntries(personIds.map((id, i) => [id, { today: today[i] ?? 0, total: total[i] ?? 0 }]))
}
