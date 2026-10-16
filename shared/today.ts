/**
 * 모두의 오늘: 서울 날짜별로 "오늘 이 마음으로 실을 묶은 사용자 수" (server/utils/meet.ts, HyperLogLog).
 * 순위·비교 없이 그 마음의 수만 말한다.
 */

/** 서울 날짜 키에서 YYYYMMDD (Redis 키) */
export const compactDate = (seoulDate: string) => seoulDate.replace(/-/g, '')

/**
 * 오늘 마음별 수를 한 번에 센 스냅샷 (server/api/today-snapshot). 화면은 이것만 읽는다. at은 센 시각(ms).
 * counts(예전 기획의 사람별 수)는 더 세지 않아 늘 비어 있다(예전 스냅샷과 모양을 맞춘다).
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
