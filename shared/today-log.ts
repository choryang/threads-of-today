import { repliesFor } from './data/replies'
import type { Met, PickHow } from './pick'
import type { TodayRecord } from './progress'
import { memoryLine } from './today-text'

/**
 * 오늘 흐름의 하루 기록(Save.todays)에서 읽는 것들 (docs/redesign/README.md "저장").
 */

/** 그 사람을 고른 방식. 예전 기록(how 없음)은 카드 문구면 'none', 아니면 'mood' */
export function recordHow(r: TodayRecord): PickHow {
  return r.how ?? (r.episode === null ? 'none' : 'mood')
}

/** 날짜순(오래된 것부터) 지난 만남. 한 사람 고르기(shared/pick.ts)의 본 편·만난 횟수 */
export function historyOf(todays: Record<string, TodayRecord> | undefined, exceptDate?: string): Met[] {
  return Object.entries(todays ?? {})
    .filter(([date]) => date !== exceptDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, r]) => ({ personId: r.personId, episode: r.episode }))
}

/** 그 사람을 그날보다 전에 마지막으로 만난 기록 */
export function lastMeeting(todays: Record<string, TodayRecord> | undefined, personId: string, beforeDate: string): { date: string; record: TodayRecord } | undefined {
  const found = Object.entries(todays ?? {})
    .filter(([date, r]) => r.personId === personId && date < beforeDate)
    .sort(([a], [b]) => b.localeCompare(a))[0]
  return found ? { date: found[0], record: found[1] } : undefined
}

/** 그날 건넨 한마디의 글. 직접 쓴 말은 기기에 남은 것(ownText)이 있을 때만 */
export function replyText(record: TodayRecord, ownText?: string): string | undefined {
  if (record.reply === undefined) return undefined
  if (record.reply === 'own') return ownText?.trim() || undefined
  return repliesFor(record.mood)[record.reply]
}

/**
 * 같은 사람을 다시 만났을 때 이야기 위 한 줄: '지난번엔 당신도 억울했다고 했죠. (당신이 건넨 말: 저도 오늘 그랬어요)'.
 * 처음 만나면 undefined
 */
export function memoryFor(
  todays: Record<string, TodayRecord> | undefined,
  personId: string,
  date: string,
  ownTextOf: (date: string) => string | undefined = () => undefined,
): string | undefined {
  const last = lastMeeting(todays, personId, date)
  if (!last) return undefined
  const said = replyText(last.record, ownTextOf(last.date))
  return said ? `${memoryLine(last.record.mood)} (당신이 건넨 말: ${said})` : memoryLine(last.record.mood)
}
