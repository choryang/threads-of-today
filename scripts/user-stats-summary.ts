/*
 * 사용자 현황 집계 (순수 함수). scripts/user-stats.ts가 운영 Upstash에서 읽은 값을 넘긴다. 숫자만 돌려준다.
 * 새 기획 기준: 하루 기록(todays)을 남긴 날 수 구간과 오늘의 실 공유(/t) 수.
 */
import type { Save } from '../shared/progress'

export interface UserRow {
  createdAt?: string
  save?: Partial<Save>
}

export interface UserSummary {
  users: number
  /** 만든 날짜(YYYY-MM-DD) → 사용자 수, 날짜순 */
  byDate: Array<[string, number]>
  /** 하루 기록을 1번 이상 남긴 사용자 */
  recorded: number
  /** 하루 기록을 남긴 날 수 구간 */
  days: { '0일': number; '1일': number; '2~6일': number; '7일 이상': number }
  /** 살아 있는 공유 링크 (종류별) */
  shares: { thread: number; old: number }
}

export function summarize(users: Array<UserRow | null>, shares: Array<{ kind?: string } | null>): UserSummary {
  const byDate = new Map<string, number>()
  let recorded = 0
  const days = { '0일': 0, '1일': 0, '2~6일': 0, '7일 이상': 0 }
  let count = 0
  for (const u of users) {
    if (!u) continue
    count++
    const date = typeof u.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(u.createdAt) ? u.createdAt.slice(0, 10) : '(날짜 없음)'
    byDate.set(date, (byDate.get(date) ?? 0) + 1)
    const n = Object.keys(u.save?.todays ?? {}).length
    if (n > 0) recorded++
    days[n === 0 ? '0일' : n === 1 ? '1일' : n < 7 ? '2~6일' : '7일 이상']++
  }
  const kinds = { thread: 0, old: 0 }
  for (const s of shares) if (s?.kind) s.kind === 'thread' ? kinds.thread++ : kinds.old++
  return { users: count, byDate: [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])), recorded, days, shares: kinds }
}
