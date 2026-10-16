/**
 * 오늘의 미스터리 힌트 5개. 틀릴 때마다 하나씩 열리고, 막연한 것에서 구체적인 것 순서다.
 *   1. 쓰임새 한 줄(data/mystery.ts)  2. 분류  3. 여정 중간의 사람  4. 거쳐 오는 나라(국내만이면 지역)  5. 출발지 사람과 재료 이름
 * 3·4번이 보기에 있는 다른 물건과 똑같아지면 겹치지 않는 사람·출발지를 고른다.
 */
import { MYSTERY_INFO, MYSTERY_KIND_LABEL } from './data/mystery'
import { MATERIALS } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { CLOSINGS, closingKind } from './data/shops'
import { withJosa } from './logic'
import { hash } from './random'
import type { Product } from './types'

export const MYSTERY_HINT_COUNT = 5

/** 재료마다 고른 출발지 번호 */
type Choice = Record<string, number>

/** 정답이 드러나는 낱말: 물건 이름·별칭, 재료 이름·별칭 (2글자 이상) */
export function revealingWords(p: Product): string[] {
  const words = [p.name, ...p.aliases, ...p.materialIds.flatMap((id) => [MATERIALS[id]!.name, ...MATERIALS[id]!.aliases])]
  return [...new Set(words.flatMap((w) => [w, ...w.split(' ')]).filter((w) => w.length >= 2))]
}

const shopOf = (p: Product): string | undefined => CLOSINGS[closingKind(p.name, p.materialIds)].shop[0]

/** 고른 출발지로 이어 붙인 여정의 사람들 (마지막 가게 사람 포함) */
function pathOf(p: Product, choice: Choice): string[] {
  const people = p.materialIds.flatMap((id) => {
    const m = MATERIALS[id]!
    if (!m.origins?.length) return m.stages
    return [...m.origins[choice[id] ?? 0]!.head, ...m.stages.slice(m.originHead ?? 0)]
  })
  const shop = shopOf(p)
  return shop ? [...people, shop] : people
}

/** 출발지 조합 전부. 첫 번째가 기본 출발지 */
function choicesOf(p: Product): Choice[] {
  let choices: Choice[] = [{}]
  for (const id of p.materialIds) {
    const n = MATERIALS[id]!.origins?.length ?? 0
    if (n < 2) continue
    choices = choices.flatMap((c) => Array.from({ length: n }, (_, i) => ({ ...c, [id]: i })))
  }
  return choices
}

/** 출발지 사람: 재료의 첫 사람과 모든 출발지 변형의 앞부분 */
function startPeople(p: Product): Set<string> {
  return new Set(p.materialIds.flatMap((id) => {
    const m = MATERIALS[id]!
    return [m.stages[0]!, ...m.stages.slice(0, m.originHead ?? 0), ...(m.origins ?? []).flatMap((o) => o.head)]
  }))
}

/** 힌트 3 후보: 출발지 사람이 아니고, 직업에 정답이 드러나는 낱말이 없는 여정 중간의 사람 */
export function middleCandidates(p: Product): string[] {
  const starts = startPeople(p)
  const words = revealingWords(p)
  return [...new Set(pathOf(p, {}))].filter((id) => !starts.has(id) && !words.some((w) => PEOPLE[id]!.job.includes(w)))
}

const allPeople = (p: Product) => new Set(choicesOf(p).flatMap((c) => pathOf(p, c)))

/** '서울의 커피 로스터'. 직업에 이미 장소 낱말이 있으면('인천항 하역 노동자') 장소를 다시 붙이지 않는다 */
function whoAt(personId: string): string {
  const person = PEOPLE[personId]!
  const place = PLACES[person.placeId]!.name
  return place.split(' ').some((w) => w.length >= 2 && person.job.includes(w)) ? person.job : `${place}의 ${person.job}`
}

function middleHint(personId: string): string {
  return `여정에서 ${withJosa(whoAt(personId), '을', '를')} 만나요.`
}

function placesHint(p: Product, choice: Choice): string {
  const places = pathOf(p, choice).map((id) => PLACES[PEOPLE[id]!.placeId]!)
  const countries = [...new Set(places.map((pl) => pl.country).filter(Boolean))]
  if (countries.some((c) => c !== '대한민국')) return `${withJosa(countries.join(', '), '을', '를')} 거쳐 와요.`
  // 국내에서만 오면 나라 이름이 모두 같아지니 지역 이름으로
  const regions = [...new Set(places.map((pl) => pl.name).filter((n) => n !== '대한민국' && n !== '우리 동네'))].slice(0, 3)
  return regions.length ? `나라 밖으로 나가지 않고 ${withJosa(regions.join(', '), '을', '를')} 거쳐 와요.` : '나라 밖으로 나가지 않고 우리나라 안에서만 와요.'
}

function startHint(p: Product, choice: Choice): string {
  const materials = p.materialIds.map((id) => MATERIALS[id]!.name).join(', ')
  return `시작은 ${withJosa(whoAt(pathOf(p, choice)[0]!), '이에요', '예요')}. 재료는 ${withJosa(materials, '이에요', '예요')}.`
}

/** 힌트 5개. others는 같은 날 보기에 있는 다른 물건들(3·4번이 겹치지 않게) */
export function mysteryHints(product: Product, others: Product[] = []): string[] {
  const info = MYSTERY_INFO[product.id]
  const hints: string[] = []
  hints.push(info?.use ?? '')
  hints.push(info ? `${withJosa(MYSTERY_KIND_LABEL[info.kind], '이에요', '예요')}.` : '')

  // 3. 다른 보기의 여정에 나오지 않는 중간 사람을 먼저 고른다
  const candidates = middleCandidates(product)
  const taken = new Set(others.flatMap((o) => [...allPeople(o)]))
  const free = candidates.filter((id) => !taken.has(id))
  const pool = free.length ? free : candidates
  hints.push(pool.length ? middleHint(pool[hash(`mystery-middle:${product.id}`) % pool.length]!) : '')

  // 4·5. 다른 보기의 기본 나라 힌트와 같으면 다른 출발지 조합을 써 본다
  const otherPlaces = new Set(others.map((o) => placesHint(o, {})))
  const choice = choicesOf(product).find((c) => !otherPlaces.has(placesHint(product, c))) ?? {}
  hints.push(placesHint(product, choice))
  hints.push(startHint(product, choice))
  return hints
}
