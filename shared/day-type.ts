/**
 * 나의 하루 유형 (10초 테스트). 판정 규칙은 docs/day-types.md의 기준표를 그대로 따른다.
 * shared/data(PRODUCTS, MATERIALS, PEOPLE, PLACES, TRANSPORT)만으로 계산하고 AI는 쓰지 않는다.
 * 출발지 변형(origins)은 쓰지 않고 기본 경로(stages)만 쓴다: 같은 선택이면 늘 같은 결과라야 공유가 성립한다.
 * 성격을 맞히는 테스트가 아니다. "당신은 이런 사람"이 아니라 "당신의 하루는 이런 하루"라고만 말한다.
 */
import { MATERIALS, PRODUCTS } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { TRANSPORT } from './data/transport'
import { greatCircleKm } from './distance'
import type { Continent } from './types'

/** 1. 테스트 물건 18개 (3열 × 6줄, 이 순서로 보여 준다) */
export const TEST_ITEMS = [
  'americano', 'choco-bar', 'banana', 'smartphone', 'tuna-can', 'samgak',
  'salmon-sushi', 'ramen', 'burger', 'samgyeopsal', 'banana-milk', 'kimchi',
  'apple', 'notebook', 'tshirt', 'tofu', 'chopsticks', 'fried-chicken',
] as const
export const PICK_MIN = 3
export const PICK_MAX = 5

/** 2. 재료 분류. 새 재료가 생기면 여기에 넣어야 한다(tests/day-type.test.ts가 빠진 재료를 잡는다) */
export type MaterialClass = 'tropic' | 'sea' | 'under' | 'tech' | 'plain' | 'ranch' | 'home' | 'forest'
export const MATERIAL_CLASS: Record<MaterialClass, string[]> = {
  tropic: ['coffee', 'cacao', 'banana', 'palm-oil', 'rubber', 'sugar', 'orange'],
  sea: ['tuna', 'squid', 'salmon', 'shrimp', 'laver'],
  under: ['cobalt', 'lithium', 'aluminum', 'steel', 'plastic'],
  tech: ['chip', 'assembly', 'polyester', 'switch', 'pcb', 'panel', 'cpu', 'memory', 'sensor', 'app', 'song', 'internet'],
  plain: ['wheat', 'corn', 'soybean', 'cotton'],
  ranch: ['milk', 'beef', 'pork', 'chicken', 'egg'],
  home: ['rice', 'cabbage', 'chili', 'apple', 'grape', 'tomato', 'potato', 'sweet-potato', 'radish', 'buckwheat', 'barley', 'red-bean', 'tea', 'glass'],
  forest: ['pulp', 'wood', 'publishing'],
}
export const CLASS_OF: Record<string, MaterialClass> = Object.fromEntries(
  (Object.entries(MATERIAL_CLASS) as Array<[MaterialClass, string[]]>).flatMap(([c, ids]) => ids.map((id) => [id, c])),
)

/** 4. 유형 9개. 같은 점수면 이 순서로 앞의 것 */
export type DayTypeId = 'world' | 'sky' | 'under' | 'sea' | 'tropic' | 'ranch' | 'plain' | 'forest' | 'home'
export const TYPE_ORDER: DayTypeId[] = ['world', 'sky', 'under', 'sea', 'tropic', 'ranch', 'plain', 'forest', 'home']

export interface DayType {
  id: DayTypeId
  name: string
  desc: string
  /** 대표 주민 */
  resident: string
  /** 흰 글씨와 4.5:1 이상 (tests/day-type.test.ts) */
  bg: string
  /** 3~5개를 고르는 모든 조합에서 드물게 나오는 유형 (기준표 6) */
  rare?: true
}

export const DAY_TYPES: Record<DayTypeId, DayType> = {
  world: { id: 'world', name: '지구 한 바퀴 하루', desc: '다섯 대륙의 손을 거쳐 오늘 아침 당신에게 닿았어요', resident: 'sea-crew', bg: '#1F5A73' },
  sky: { id: 'sky', name: '하늘길로 온 하루', desc: '비행기를 타고 서둘러 당신에게 온 하루예요', resident: 'air-cargo', bg: '#3E5C8A', rare: true },
  under: { id: 'under', name: '땅속에서 온 하루', desc: '깊은 땅속에서 캐낸 것들이 당신 하루를 움직여요', resident: 'cobalt-miner', bg: '#5A4A3E' },
  sea: { id: 'sea', name: '바다에서 건진 하루', desc: '먼바다와 바닷가 사람들이 당신 하루를 채웠어요', resident: 'tuna-fisher', bg: '#2E6E8E' },
  tropic: { id: 'tropic', name: '적도에서 온 하루', desc: '적도 근처 뜨거운 땅에서 시작해 당신에게 닿았어요', resident: 'coffee-picker', bg: '#A0522D' },
  ranch: { id: 'ranch', name: '목장에서 온 하루', desc: '새벽 목장 사람들이 당신 하루를 든든하게 했어요', resident: 'dairy-farmer', bg: '#7A6A3A' },
  // 기준표 #8A7A2E(흰 글씨 4.28:1)·#6F9A5C(3.25:1)는 모자라서, 같은 색을 고르게 어둡게 해 화면 글씨색(#F3F1EA)과도 4.5:1을 넘겼다
  plain: { id: 'plain', name: '넓은 들판의 하루', desc: '끝없는 들판에서 자란 것들이 당신 하루가 됐어요', resident: 'wheat-farmer', bg: '#7C6E29' },
  forest: { id: 'forest', name: '숲에서 온 하루', desc: '멀리 숲에서 온 나무가 당신 손에 있어요', resident: 'eucalyptus', bg: '#3E6B3A', rare: true },
  home: { id: 'home', name: '우리 땅에서 자란 하루', desc: '가까운 들과 밭 사람들이 당신 하루를 지었어요', resident: 'rice-farmer', bg: '#557747' },
}

const OTHER_WEIGHT = 0.5
/** 첫 재료가 아닌 포장재 */
const PACKAGING: Record<string, number> = { plastic: 0.2, pulp: 0.2 }
const TECH_TO_UNDER = 0.8
const WORLD_SCORE = 0.34
const SKY_SCORE = 0.6
const SKY_MIN_ITEMS = 2
const WORLD_CONTINENTS: Continent[] = ['africa', 'asia', 'europe', 'oceania', 'americas']

const productOf = (id: string) => PRODUCTS.find((p) => p.id === id)
const stagesOf = (materialId: string) => MATERIALS[materialId]?.stages ?? []

/** 이 물건의 재료들이 지나는 사람 (기본 경로) */
function productPeople(productId: string): string[] {
  return [...new Set((productOf(productId)?.materialIds ?? []).flatMap(stagesOf))]
}

export interface DayScores {
  /** 분류별 비율 (tech는 under에 0.8배로 더한 뒤) */
  ratio: Record<Exclude<MaterialClass, 'tech'>, number>
  world: number
  sky: number
  scores: Record<DayTypeId, number>
}

/** 3. 판정 점수 */
export function dayScores(productIds: string[]): DayScores {
  const w: Record<MaterialClass, number> = { tropic: 0, sea: 0, under: 0, tech: 0, plain: 0, ranch: 0, home: 0, forest: 0 }
  for (const id of productIds) {
    const mats = productOf(id)?.materialIds ?? []
    mats.forEach((m, i) => {
      const cls = CLASS_OF[m]
      if (!cls) throw new Error(`분류가 없는 재료: ${m} (docs/day-types.md 2번 표에 넣어 주세요)`)
      w[cls] += i === 0 ? 1 : (PACKAGING[m] ?? OTHER_WEIGHT)
    })
  }
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1
  const ratio = {
    tropic: w.tropic / total, sea: w.sea / total, under: (w.under + w.tech * TECH_TO_UNDER) / total, plain: w.plain / total,
    ranch: w.ranch / total, home: w.home / total, forest: w.forest / total,
  }
  const continents = new Set(productIds.flatMap(productPeople).map((p) => PLACES[PEOPLE[p]?.placeId ?? '']?.continent))
  const world = WORLD_CONTINENTS.every((c) => continents.has(c)) ? WORLD_SCORE : 0
  const airItems = productIds.filter((id) => productPeople(id).some((p) => TRANSPORT[p] === 'air')).length
  const sky = airItems >= SKY_MIN_ITEMS ? SKY_SCORE : 0
  return { ratio, world, sky, scores: { world, sky, ...ratio } }
}

/** 가장 높은 점수의 유형. 같으면 TYPE_ORDER에서 앞의 것 */
export function dayTypeOf(productIds: string[]): DayTypeId {
  const { scores } = dayScores(productIds)
  let best: DayTypeId = TYPE_ORDER[0]!
  for (const t of TYPE_ORDER) if (scores[t] > scores[best]) best = t
  return best
}

// ── 5. 결과 카드의 숫자 ──

export const EARTH_ROUND_KM = 40075

export interface DayNumbers {
  /** 닿은 사람: 재료(중복 제거) 기본 경로의 사람 수(중복 제거) */
  people: string[]
  /** 그 사람들의 나라(빈 값 제외) */
  countries: string[]
  /** 재료마다 기본 경로를 대권거리로 이은 합 */
  km: number
}

export function dayNumbers(productIds: string[]): DayNumbers {
  const materials = [...new Set(productIds.flatMap((id) => productOf(id)?.materialIds ?? []))]
  const people = [...new Set(materials.flatMap(stagesOf))]
  const countries = [...new Set(people.map((p) => PLACES[PEOPLE[p]?.placeId ?? '']?.country).filter((c): c is string => !!c))]
  let km = 0
  for (const m of materials) {
    let prev: { lat: number; lng: number } | null = null
    for (const p of stagesOf(m)) {
      const place = PLACES[PEOPLE[p]?.placeId ?? '']
      if (place?.lat === undefined || place.lng === undefined) continue // 지나가는 바다는 앞뒤 항구 사이로
      const here = { lat: place.lat, lng: place.lng }
      if (prev) km += greatCircleKm(prev, here)
      prev = here
    }
  }
  return { people, countries, km }
}

/**
 * "지구 반 바퀴"(0.4~0.6), "지구 한 바퀴"(0.9~1.1), 그 밖은 0.5 단위로 반올림한 "지구 N바퀴", 0.4보다 짧으면 "3,200km".
 * 반올림해서 0.5나 1이 되면(0.6~0.9, 1.1~1.25) '1바퀴'보다 읽기 쉬운 '반 바퀴'·'한 바퀴'로 쓴다
 */
export function distanceLabel(km: number): string {
  const r = km / EARTH_ROUND_KM
  if (r < 0.4) return `${(Math.round(km / 100) * 100).toLocaleString('ko-KR')}km`
  const n = r <= 0.6 ? 0.5 : r >= 0.9 && r <= 1.1 ? 1 : Math.round(r * 2) / 2
  return n === 0.5 ? '지구 반 바퀴' : n === 1 ? '지구 한 바퀴' : `지구 ${n.toLocaleString('ko-KR')}바퀴`
}

/** 결과 한 번에 */
export function dayResult(productIds: string[]) {
  const type = DAY_TYPES[dayTypeOf(productIds)]
  return { type, numbers: dayNumbers(productIds) }
}

/** 고른 물건이 테스트 물건 3~5개인지 (공유 링크로 들어온 값 검사에도 쓴다) */
export function isValidPick(ids: unknown): ids is string[] {
  return Array.isArray(ids) && ids.length >= PICK_MIN && ids.length <= PICK_MAX && new Set(ids).size === ids.length
    && ids.every((id) => typeof id === 'string' && (TEST_ITEMS as readonly string[]).includes(id))
}

/** 상대 휘도 (WCAG) */
function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!
}

/** 두 색의 명암 대비 (WCAG). 결과 화면의 글씨색은 #F3F1EA */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// ── 두 사람의 하루 ──

export interface Meeting {
  /** 두 사람의 물건에서 겹치는 사람 (먼저 고른 사람의 순서). 화면에는 모두 보여 준다 */
  shared: string[]
  /** 하루가 만나는 사람: 국내 마지막 구간 사람을 뺀 겹친 사람 중 한국에서 가장 먼 곳의 사람. 후보가 없으면 null */
  hub: string | null
  /** 만나는 곳 (그 사람의 장소 이름). hub가 없으면 '' → "같은 손을 거쳐 왔어요" */
  place: string
}

/** 국내 마지막 구간: 우리 동네 구역(가게·택배·배달·사무실)과 물류센터·배차 담당. 만나는 곳 후보에서 뺀다 */
const LAST_MILE = new Set(['warehouse', 'dispatcher'])
export const isLastMile = (personId: string) => PEOPLE[personId]?.zone === 'town' || LAST_MILE.has(personId)

/** 한국에서 잰 거리의 기준점 (우리 동네) */
const HOME = PLACES['kr-town']!

/** 이 사람이 있는 곳까지 한국에서 잰 대권거리. 바다 위처럼 좌표가 없으면 null */
function kmFromKorea(personId: string): number | null {
  const place = PLACES[PEOPLE[personId]?.placeId ?? '']
  if (place?.lat === undefined || place.lng === undefined) return null
  return greatCircleKm({ lat: HOME.lat!, lng: HOME.lng! }, { lat: place.lat, lng: place.lng })
}

/**
 * 포장재로만 지나간 사람: 고른 물건에서 첫 재료가 아닌 plastic·pulp(판정의 포장재 규칙과 같다)로만 닿은 사람.
 * 이런 사람이 만나는 곳이 되면 거의 모든 짝이 플라스틱 원료가 나는 먼 유전에서 만나게 돼서 후보에서 뺀다
 */
function substantivePeople(productIds: string[]): Set<string> {
  const out = new Set<string>()
  for (const id of productIds) {
    ;(productOf(id)?.materialIds ?? []).forEach((m, i) => {
      if (i > 0 && PACKAGING[m] !== undefined) return
      for (const p of stagesOf(m)) out.add(p)
    })
  }
  return out
}

/**
 * 두 사람의 하루가 만나는 곳.
 *  1. 겹친 사람 중 국내 마지막 구간 사람, 두 사람 모두에게 포장재로만 지나간 사람은 장소 후보에서 뺀다
 *     (겹친 사람 목록에는 남긴다)
 *  2. 남은 사람 중 한국에서 가장 먼 곳(대권거리)의 사람. 같으면 먼저 고른 사람의 순서로 앞의 사람
 *     좌표가 있는 후보가 없으면(바다 위뿐) 첫 후보의 장소 이름을 그대로 쓴다
 *  3. 후보가 없으면 hub null, place '' ("두 사람의 하루는 같은 손을 거쳐 왔어요")
 */
export function meetingOf(a: string[], b: string[]): Meeting {
  const theirs = new Set(dayNumbers(b).people)
  const shared = dayNumbers(a).people.filter((p) => theirs.has(p))
  const main = new Set([...substantivePeople(a), ...substantivePeople(b)])
  const candidates = shared.filter((p) => !isLastMile(p) && main.has(p))
  let hub: string | null = null
  let far = -1
  for (const p of candidates) {
    const km = kmFromKorea(p)
    if (km !== null && km > far) {
      far = km
      hub = p
    }
  }
  hub ??= candidates[0] ?? null
  return { shared, hub, place: hub ? placeName(hub) : '' }
}

/** 장소 이름 (나라가 이름에 없으면 앞에 붙인다. 바다 위는 그대로) */
function placeName(personId: string): string {
  const place = PLACES[PEOPLE[personId]?.placeId ?? '']
  if (!place) return ''
  const { name, country, continent } = place
  return continent === 'korea' || !country || name.includes(country) ? name : `${country} ${name}`
}
