/*
 * 사용자 현황 집계 (순수 함수). scripts/user-stats.ts가 운영 Upstash에서 읽은 값을 넘긴다. 숫자만 돌려준다.
 */
import { PEOPLE_LIST } from '../shared/data/people'
import type { Save } from '../shared/progress'
import { unlockStats } from '../shared/unlocks'

export interface UserRow {
  createdAt?: string
  save?: Partial<Save>
}

export interface UserSummary {
  users: number
  /** 만든 날짜(YYYY-MM-DD) → 사용자 수, 날짜순 */
  byDate: Array<[string, number]>
  /** 여정을 1번 이상 마친 사용자 */
  journeyed: number
  residents: { '0명': number; '1~9명': number; '10~49명': number; '50명 이상': number }
  shares: { day: number; person: number; village: number }
}

const villager = new Set(PEOPLE_LIST.filter((p) => p.kind !== 'link').map((p) => p.id))

export function summarize(users: Array<UserRow | null>, shares: Array<{ kind?: string } | null>): UserSummary {
  const byDate = new Map<string, number>()
  let journeyed = 0
  const residents = { '0명': 0, '1~9명': 0, '10~49명': 0, '50명 이상': 0 }
  let count = 0
  for (const u of users) {
    if (!u) continue
    count++
    const date = typeof u.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(u.createdAt) ? u.createdAt.slice(0, 10) : '(날짜 없음)'
    byDate.set(date, (byDate.get(date) ?? 0) + 1)
    const save = u.save
    const cards = save?.cards ?? {}
    if (save && unlockStats({ cards, days: save.days ?? {}, items: save.items ?? {}, people: save.people }).journeys >= 1) journeyed++
    const n = Object.keys(cards).filter((id) => villager.has(id)).length
    residents[n === 0 ? '0명' : n < 10 ? '1~9명' : n < 50 ? '10~49명' : '50명 이상']++
  }
  const kinds = { day: 0, person: 0, village: 0 }
  for (const s of shares) if (s?.kind && s.kind in kinds) kinds[s.kind as keyof typeof kinds]++
  return { users: count, byDate: [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])), journeyed, residents, shares: kinds }
}
