import { LINK_RULES, MATERIALS, PRODUCTS, SETS } from './data/materials'
import { timelinePeople } from './journey'
import { hash, seeded } from './random'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import type { CardSet, Product } from './types'


export const DAILY_LIMIT = 3
export const MAX_MATERIALS = 5

export interface Decomposed {
  name: string
  materialIds: string[]
  /** 입력을 어떻게 물건으로 이었는지 한 줄 (물건이 아닌 입력일 때) */
  twist?: string
  /** 물건이 직접 건네는 한마디 */
  voice?: string
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
  for (const j of journeys) for (const s of timelinePeople(j.materialIds, j.id)) people.add(s.personId)
  return { people: [...people], countries: countriesOf(people) }
}

/** 하루 동안 지나온 여정들 사이에서, 서로 다른 재료 2개 이상에 등장한 사람을 찾아 연결 카드 id를 돌려준다. */
export function findLinkCards(journeys: JourneyRef[]): string[] {
  const materialsByPerson = new Map<string, Set<string>>()
  for (const j of journeys) {
    for (const { materialId, personId } of timelinePeople(j.materialIds, j.id)) {
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

/** 점점 구체적으로 드러나는 힌트. 마지막 힌트는 재료 이름. */
export function mysteryHints(product: Product): string[] {
  const stats = dayStats([{ materialIds: product.materialIds }])
  const hints = [`재료 ${product.materialIds.length}가지, ${stats.countries.length}개 나라를 거쳐 와요.`]
  for (const mid of product.materialIds.slice(0, 3)) {
    const first = PEOPLE[MATERIALS[mid]!.stages[0]!]!
    hints.push(`이 물건의 시작에는 ${PLACES[first.placeId]!.name}의 ${withJosa(first.job, '이', '가')} 있어요.`)
  }
  hints.push(`재료: ${product.materialIds.map((id) => MATERIALS[id]!.name).join(', ')}`)
  return hints
}
