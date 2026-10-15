import { LINK_RULES, MATERIALS, PRODUCTS, SETS } from './data/materials'
import { timelinePeople } from './journey'
import { hash, seeded } from './random'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import type { CardSet, Product } from './types'


export const MAX_MATERIALS = 5

export interface Decomposed {
  name: string
  materialIds: string[]
  /** 입력을 어떻게 물건으로 이었는지 한 줄 (물건이 아닌 입력일 때) */
  twist?: string
  /** 물건이 직접 건네는 한마디 */
  voice?: string
  /** 주재료인데 아직 여정이 없는 재료 이름 ('망고'). 있으면 "○○의 여정은 아직 준비 중이에요"를 보여 준다. materialIds가 비어 있으면 여정을 떠날 수 없다. */
  missing?: string[]
}

/** 포장재 재료. 주재료가 준비 중인데 이것만 남으면 여정을 떠나지 않는다 */
export const PACKAGING_IDS = ['plastic', 'pulp', 'glass']

/**
 * 주재료가 준비 중(missing)이고 남은 재료가 포장재뿐이면 재료를 비운다 → "여정을 떠날 수 없음".
 * 보리차가 페트병 여정만 떠나는 일을 막는다. 생수·비닐봉지처럼 준비 중 재료가 없는 포장재 물건은 그대로 둔다.
 */
export function journeyMaterialIds(materialIds: string[], missing: string[] | undefined): string[] {
  if (missing?.length && materialIds.every((id) => PACKAGING_IDS.includes(id))) return []
  return materialIds
}

/** 받침 유무에 따라 조사를 붙인다. withJosa('광부', '이', '가') → '광부가' */
export function withJosa(word: string, withBatchim: string, withoutBatchim: string): string {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return word + withoutBatchim
  return word + ((last - 0xac00) % 28 ? withBatchim : withoutBatchim)
}

export function sanitizeMaterialIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const out: string[] = []
  for (const id of ids) {
    if (typeof id === 'string' && MATERIALS[id] && !out.includes(id)) out.push(id)
  }
  return out.slice(0, MAX_MATERIALS)
}

/** 통계를 낼 여정. id가 있으면 그 여정에서 실제로 지나는 경로(출발지 변형·숨은 만남 포함)로 센다 */
export interface JourneyRef {
  materialIds: string[]
  id?: string
  /** 물건 이름. 있으면 여정 끝의 가게·사무실 사람까지 센다 */
  name?: string
}

export function countriesOf(personIds: Iterable<string>): string[] {
  const set = new Set<string>()
  for (const id of personIds) {
    const person = PEOPLE[id]
    const country = person && PLACES[person.placeId]?.country
    if (country) set.add(country)
  }
  return [...set]
}

export function dayStats(journeys: JourneyRef[]) {
  const people = new Set<string>()
  for (const j of journeys) for (const s of timelinePeople(j.materialIds, j.id, j.name)) people.add(s.personId)
  return { people: [...people], countries: countriesOf(people) }
}

/** 하루 동안 지나온 여정들 사이에서, 서로 다른 재료 2개 이상에 등장한 사람을 찾아 연결 카드 id를 돌려준다. */
export function findLinkCards(journeys: JourneyRef[]): string[] {
  const materialsByPerson = new Map<string, Set<string>>()
  for (const j of journeys) {
    for (const { materialId, personId } of timelinePeople(j.materialIds, j.id, j.name)) {
      const set = materialsByPerson.get(personId) ?? new Set<string>()
      set.add(materialId)
      materialsByPerson.set(personId, set)
    }
  }
  return LINK_RULES.filter((rule) => (materialsByPerson.get(rule.personId)?.size ?? 0) >= 2).map((rule) => rule.cardId)
}

export function completedSets(owned: Set<string>): CardSet[] {
  return SETS.filter((s) => s.memberIds.every((id) => owned.has(id)))
}

export function dateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 한국 시간(Asia/Seoul) 기준 날짜. 서버(Vercel은 UTC)에서 하루 한도를 한국 자정에 바꾸려고 쓴다. 한국은 서머타임이 없어 +9시간 고정 */
export function seoulDateKey(now = Date.now()): string {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y!, m! - 1, d! - 1))
}

export function mysteryProduct(key: string): Product {
  return PRODUCTS[hash(`mystery:${key}`) % PRODUCTS.length]!
}

/** 정답 포함 6개 보기, 날짜마다 같은 순서 */
export function mysteryOptions(key: string): Product[] {
  const answer = mysteryProduct(key)
  const rand = seeded(hash(`options:${key}`))
  const others = PRODUCTS.filter((p) => p.id !== answer.id)
    .map((p) => ({ p, r: rand() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 5)
    .map((x) => x.p)
  return [...others, answer]
    .map((p) => ({ p, r: rand() }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.p)
}

