/**
 * 여정을 마친 뒤의 끝 장면과 다음 여정 예고(열린 고리).
 * 이번 여정에서 만난 사람 중 다른 재료에도 늘 등장하는 사람(선원·항만처럼 연결 카드가 있는 사람)을 하나 골라,
 * 그 사람이 등장하는 다른 재료가 든 대표 물건 2개를 추천한다. 같은 날 추천 물건으로 여정을 마치면 연결 카드가 나온다.
 * 무작위는 여정 id 시드로.
 */
import { LINK_RULES, MATERIALS, PRODUCTS } from './data/materials'
import { PEOPLE } from './data/people'
import { timelinePeople } from './journey'
import { hash } from './random'
import type { Material, Product } from './types'

/** 끝 장면에 한 줄로 세우는 최대 인원 */
export const LINEUP_MAX = 8

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 } as const

/**
 * 끝 장면에 세울 사람들. max명이 넘으면 숨은 만남·희귀한 사람을 먼저 남기고, 나머지는 여정 전체에서 고르게 뽑는다.
 * 순서는 만난 순서 그대로.
 */
export function lineupOf(people: string[], max = LINEUP_MAX): string[] {
  if (people.length <= max) return people
  const keep = new Set<number>()
  const special = people
    .map((id, i) => ({ i, rank: RARITY_ORDER[PEOPLE[id]?.rarity ?? 'common'] }))
    .filter((x) => x.rank < RARITY_ORDER.common || PEOPLE[people[x.i]!]?.kind === 'hidden')
    .sort((a, b) => a.rank - b.rank)
  for (const x of special.slice(0, Math.floor(max / 2))) keep.add(x.i)
  // 첫 사람과 마지막 사람은 늘 세운다
  keep.add(0)
  keep.add(people.length - 1)
  const slots = max - keep.size
  for (let k = 0; k < slots; k++) {
    let i = Math.round(((k + 1) * (people.length - 1)) / (slots + 1))
    while (keep.has(i) && i < people.length - 1) i++
    keep.add(i)
  }
  return [...keep].sort((a, b) => a - b).slice(0, max).map((i) => people[i]!)
}

/** 이 재료의 여정이 출발지 변형과 상관없이 늘 이 사람을 지나는지 */
export function alwaysMeets(m: Material, personId: string): boolean {
  if (!m.origins?.length) return m.stages.includes(personId)
  return m.stages.slice(m.originHead ?? 0).includes(personId) || m.origins.every((o) => o.head.includes(personId))
}

export interface Teaser {
  /** 말풍선을 띄울 사람 */
  personId: string
  /** 그 사람을 다시 만나면 얻는 연결 카드 */
  cardId: string
  /** 다음 여정 추천 (대표 물건 2개) */
  products: Product[]
}

/**
 * 다음 여정 예고. 이미 연결 카드를 얻은 사람은 고르지 않는다. 고를 사람이 없으면 null.
 * journey: 방금 마친 여정 / owned: 가진 카드 id
 */
export function pickTeaser(journey: { id: string; name: string; materialIds: string[] }, owned: Set<string>, count = 2): Teaser | null {
  const met = timelinePeople(journey.materialIds, journey.id, journey.name)
  const candidates: Teaser[] = []
  for (const rule of LINK_RULES) {
    if (owned.has(rule.cardId)) continue
    const here = new Set(met.filter((x) => x.personId === rule.personId).map((x) => x.materialId))
    if (!here.size) continue
    // 이번 여정에서 이 사람을 지나지 않은 재료 중, 늘 이 사람을 지나는 재료
    const others = Object.values(MATERIALS).filter((m) => !here.has(m.id) && alwaysMeets(m, rule.personId)).map((m) => m.id)
    const products = PRODUCTS.filter((p) => p.name !== journey.name && p.materialIds.some((id) => others.includes(id)))
    if (!products.length) continue
    const picked = products
      .map((p) => ({ p, r: hash(`next:${journey.id}:${rule.personId}:${p.id}`) }))
      .sort((a, b) => a.r - b.r)
      .slice(0, count)
      .map((x) => x.p)
    candidates.push({ personId: rule.personId, cardId: rule.cardId, products: picked })
  }
  if (!candidates.length) return null
  return candidates[hash(`teaser:${journey.id}`) % candidates.length]!
}

/** 이 연결 카드를 주는 사람 */
export function linkPersonOf(cardId: string): string | undefined {
  return LINK_RULES.find((r) => r.cardId === cardId)?.personId
}
