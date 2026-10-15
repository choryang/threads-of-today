/**
 * 모두의 오늘: 사람마다 서울 날짜별로 "오늘 이 사람을 만난 사용자 수" (server/utils/meet.ts, HyperLogLog).
 * 순위·비교 없이 그 사람 한 명의 수, 그리고 이번 여정 사람들의 합만 말한다.
 */

/** 천 단위 쉼표 */
export function formatCount(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString('ko-KR')
}

/** 서울 날짜 키에서 YYYYMMDD (Redis 키) */
export const compactDate = (seoulDate: string) => seoulDate.replace(/-/g, '')

/**
 * 사람 카드의 한 줄. metToday: 나도 오늘 이 사람을 만났는지(이미 셌다).
 *  - 나 말고 아무도 없으면 "오늘 이 분을 처음 만난 사람이에요"
 *  - 오늘 아직 아무도 안 만났고 나도 안 만났으면 아무 말 안 함
 */
export function todayMeetLine(count: number, metToday: boolean): string {
  if (metToday && count <= 1) return '오늘 이 분을 처음 만난 사람이에요'
  if (count <= 0) return ''
  return `오늘 ${formatCount(count)}명이 이 분을 만났어요`
}

/** 여정 끝 화면: 이번 여정 사람들을 오늘 만난 사람 수의 합 */
export function journeyMeetLine(sum: number): string {
  return sum > 0 ? `오늘 당신과 같은 사람을 만난 사람이 모두 ${formatCount(sum)}명이에요` : ''
}

/** 이 기기가 오늘 보낸 사람들 (localStorage). at: 사람마다 보낸 시각 */
export interface SentToday {
  date: string
  ids: string[]
  at?: Record<string, number>
}

/** 오늘(서울 날짜) 아직 보내지 않은 사람만 (사람마다 하루 한 번만 서버에 보낸다) */
export function unsentToday(ids: string[], sent: SentToday | null, seoulDate: string): string[] {
  const already = new Set(sent?.date === seoulDate ? sent.ids : [])
  return [...new Set(ids)].filter((id) => !already.has(id))
}

/**
 * 오늘 모든 사람의 수를 한 번에 센 스냅샷 (server/api/today-snapshot). 화면은 이것만 읽는다.
 * counts에는 0이 아닌 사람만 담는다. at은 센 시각(ms).
 */
export interface MeetSnapshot {
  date: string
  at: number
  counts: Record<string, number>
  /** 오늘 마음 id별로 실을 묶은 사람 수 (새 기획 5번 화면). 예전 스냅샷에는 없다 */
  moods?: Record<string, number>
}

/**
 * 오늘 그 마음으로 실을 묶은 사람 수. 스냅샷 뒤에 내가 묶었으면 나를 1 더한다(myTiedAt: 이 기기가 보낸 시각).
 * 스냅샷이 없으면 내가 묶었을 때만 1, 아니면 undefined
 */
export function moodCountFor(snapshot: MeetSnapshot | null, mood: string, seoulDate: string, myTiedAt?: number): number | undefined {
  const fresh = snapshot?.date === seoulDate ? snapshot : null
  const base = fresh?.moods?.[mood] ?? (fresh ? 0 : undefined)
  const plusMe = myTiedAt !== undefined && (!fresh || myTiedAt > fresh.at) ? 1 : 0
  if (base === undefined) return plusMe ? 1 : undefined
  return base + plusMe
}

/** 스냅샷을 다시 세는 간격 기본값(분). 서버는 MEET_SNAPSHOT_MINUTES로 바꾼다 */
export const SNAPSHOT_DEFAULT_MINUTES = 30

/**
 * MEET_SNAPSHOT_MINUTES 환경 변수 값 → 분. 비었거나 숫자가 아니면 기본 30분, 1분~하루(1,440분) 안으로 자른다.
 * 서버 저장값·CDN 캐시(s-maxage)·기기의 다시 묻기 간격이 모두 이 값을 따른다(기기는 응답의 maxAgeSeconds로 받는다).
 */
export function snapshotMinutes(raw: string | undefined): number {
  const n = Math.round(Number(raw))
  if (!raw?.trim() || !Number.isFinite(n)) return SNAPSHOT_DEFAULT_MINUTES
  return Math.min(1440, Math.max(1, n))
}

/** 다시 세야 하는지: 없거나, 날짜가 바뀌었거나, 간격(기본 30분)이 지났으면 */
export function snapshotStale(s: MeetSnapshot | null | undefined, now: number, seoulDate: string, maxAgeMs = SNAPSHOT_DEFAULT_MINUTES * 60_000): boolean {
  return !s || s.date !== seoulDate || now - s.at >= maxAgeMs
}

/**
 * 화면에 보일 오늘 수. 스냅샷은 재계산 간격만큼 늦을 수 있으니, 내가 스냅샷 뒤에 보냈으면 나를 1 더한다.
 * 어제 스냅샷이면 오늘 수는 0으로 본다. 스냅샷도 없고 나도 안 보냈으면 undefined(아무 말 안 함).
 */
export function meetCountFor(snapshot: MeetSnapshot | null, personId: string, seoulDate: string, mySentAt?: number): number | undefined {
  const mine = mySentAt !== undefined && (!snapshot || snapshot.date !== seoulDate || mySentAt > snapshot.at) ? 1 : 0
  if (!snapshot) return mine ? 1 : undefined
  return (snapshot.date === seoulDate ? snapshot.counts[personId] ?? 0 : 0) + mine
}
