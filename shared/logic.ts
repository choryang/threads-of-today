import { LINK_RULES, MATERIALS, MATERIAL_LIST, PRODUCTS, SETS } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import type { CardSet, Product } from './types'

export const DAILY_LIMIT = 3
export const MAX_MATERIALS = 5

export interface Decomposed {
  name: string
  materialIds: string[]
}

/** 받침 유무에 따라 조사를 붙인다. withJosa('광부', '이', '가') → '광부가' */
export function withJosa(word: string, withBatchim: string, withoutBatchim: string): string {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return word + withoutBatchim
  return word + ((last - 0xac00) % 28 ? withBatchim : withoutBatchim)
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '')

export function sanitizeMaterialIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const out: string[] = []
  for (const id of ids) {
    if (typeof id === 'string' && MATERIALS[id] && !out.includes(id)) out.push(id)
  }
  return out.slice(0, MAX_MATERIALS)
}

/** 대표 물건 이름과 정확히 겹치면 그 물건의 재료를 돌려준다. */
export function matchProduct(text: string): Decomposed | null {
  const t = norm(text)
  if (!t) return null
  let best: { product: Product; len: number } | null = null
  for (const product of PRODUCTS) {
    for (const alias of [product.name, ...product.aliases]) {
      const a = norm(alias)
      if (t.includes(a) && (!best || a.length > best.len)) best = { product, len: a.length }
    }
  }
  return best ? { name: best.product.name, materialIds: [...best.product.materialIds] } : null
}

/** API 없이 동작하는 키워드 매칭. 대표 물건 → 재료 별칭 순서로 찾는다. */
export function matchLocal(text: string): Decomposed | null {
  const product = matchProduct(text)
  if (product) return product
  const t = norm(text)
  if (!t) return null
  const ids: string[] = []
  for (const m of MATERIAL_LIST) {
    if ([m.name, ...m.aliases].some((a) => t.includes(norm(a)))) ids.push(m.id)
  }
  if (!ids.length) return null
  return { name: text.trim().slice(0, 20), materialIds: ids.slice(0, MAX_MATERIALS) }
}

export interface StageRef {
  materialId: string
  personId: string
}

export function journeyStages(materialIds: string[]): StageRef[] {
  return materialIds.flatMap((materialId) =>
    (MATERIALS[materialId]?.stages ?? []).map((personId) => ({ materialId, personId })),
  )
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

export function dayStats(materialIdLists: string[][]) {
  const people = new Set<string>()
  for (const ids of materialIdLists) for (const s of journeyStages(ids)) people.add(s.personId)
  return { people: [...people], countries: countriesOf(people) }
}

/** 하루 동안 지나온 재료들 사이에서 겹치는 사람을 찾아 연결 카드 id를 돌려준다. */
export function findLinkCards(materialIds: string[]): string[] {
  const unique = [...new Set(materialIds)]
  return LINK_RULES.filter((rule) => {
    const hits = unique.filter((mid) => MATERIALS[mid]?.stages.includes(rule.personId))
    return hits.length >= 2
  }).map((rule) => rule.cardId)
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

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seeded(seed: number) {
  let x = seed || 1
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 0) / 4294967296
  }
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
  const stats = dayStats([product.materialIds])
  const hints = [`재료 ${product.materialIds.length}가지, ${stats.countries.length}개 나라를 거쳐 와요.`]
  for (const mid of product.materialIds.slice(0, 3)) {
    const first = PEOPLE[MATERIALS[mid]!.stages[0]!]!
    hints.push(`이 물건의 시작에는 ${PLACES[first.placeId]!.name}의 ${withJosa(first.job, '이', '가')} 있어요.`)
  }
  hints.push(`재료: ${product.materialIds.map((id) => MATERIALS[id]!.name).join(', ')}`)
  return hints
}
