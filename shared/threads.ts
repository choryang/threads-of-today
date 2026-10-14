/**
 * '나의 실타래': 지금까지 하루에 닿은 재료의 실이 지나온 나라들을 엮은 그림. 순수 함수라 늘 같은 모양이 나온다.
 *
 *  - 가운데 '나(닉네임)', 둘레에 나라 매듭. 실 = 재료 하나(색은 재료마다, 굵기는 떠난 횟수의 로그 스케일).
 *  - 실은 그 재료의 여정에서 만난 사람들의 나라를 여정 순서대로 잇고, 마지막 나라에서 '나' 둘레 고리로 들어온다.
 *    출발지 변형이 여럿이면 출발지마다 가닥이 따로 뻗는다.
 *  - 한국(배송·창고)과 바다 위 구간은 그리지 않고 '나' 둘레의 얇은 고리 하나(재료 색으로 나눠 칠함)로만 표현한다.
 *  - 나라 매듭 크기 = 그 나라에서 만난 사람 수(재료 여정의 사람만). 퀴즈 보상·연결·숨은 만남·고마워요는 그리지 않는다(도감에서 본다).
 *  - 나라 위치: 대륙별로 원을 나눠 같은 대륙끼리 모으고, 출발지일수록 바깥 원에 둔다. 작은 흔들림은 나라 이름 시드.
 */
import { MATERIALS, MATERIAL_LIST } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { match } from './match'
import type { Save, ThreadStat } from './progress'
import { hash } from './random'

// ── 누적 기록 채우기 ──

/**
 * 이 기능 전부터 하던 사용자: 남아 있는 30일 기록(마친 여정)과, 그보다 오래된 분해해 본 물건(items)을
 * 대표 물건·재료 별칭으로 다시 매칭해 재료별 누적을 최대한 채운다.
 */
export function backfillThreads(save: Pick<Save, 'days' | 'items'>): Record<string, ThreadStat> {
  const out: Record<string, ThreadStat> = {}
  const add = (id: string, date: string) => {
    if (!MATERIALS[id]) return
    const t = out[id]
    out[id] = t ? { count: t.count + 1, first: date < t.first ? date : t.first } : { count: 1, first: date }
  }
  const dayKeys = Object.keys(save.days ?? {}).sort()
  for (const key of dayKeys) {
    for (const j of save.days[key]!.journeys) if (j.done) for (const id of new Set(j.materialIds)) add(id, key)
  }
  // 날짜별 기록이 남아 있지 않은 예전 물건만 더한다(겹쳐 세지 않게)
  const oldest = dayKeys[0] ?? '9999-99-99'
  for (const [name, date] of Object.entries(save.items ?? {})) {
    if (date >= oldest) continue
    const hit = match(name)
    if (hit) for (const id of new Set(hit.materialIds)) add(id, date)
  }
  return out
}

/** 여정을 마칠 때: 그 여정의 재료마다 1씩 */
export function addJourneyToThreads(threads: Record<string, ThreadStat>, materialIds: string[], dayKey: string) {
  for (const id of new Set(materialIds)) {
    if (!MATERIALS[id]) continue
    const t = threads[id]
    if (t) {
      t.count++
      if (dayKey < t.first) t.first = dayKey
    } else {
      threads[id] = { count: 1, first: dayKey }
    }
  }
}

// ── 배치 ──

export interface TapestryInput {
  threads: Record<string, ThreadStat>
  /** 만난 카드 id → 처음 만난 날 */
  cards: Record<string, string>
  todayKey: string
  /** 오늘 마친 여정의 재료 */
  todayMaterials: string[]
}

export interface TapestryCountry {
  country: string
  x: number
  y: number
  r: number
  /** 중심에서 본 각도(도). 오른쪽이 0, 시계 방향 */
  angle: number
  /** 이 나라에서 만난 사람(재료 여정의 사람만) */
  people: string[]
  /** 이 나라를 지나는 재료 */
  materials: string[]
  /** 오늘 지나온 실이 이 나라를 지나는지 */
  today: boolean
}

export interface TapestryThread {
  materialId: string
  name: string
  width: number
  count: number
  /** 오늘 지나온 실 */
  today: boolean
  /** 오늘 처음 생긴 실 */
  fresh: boolean
  /** 가닥마다 SVG path d (바깥 나라 → '나' 고리) */
  paths: string[]
}

export interface TapestryLayout {
  size: number
  center: number
  ringRadius: number
  countries: TapestryCountry[]
  threads: TapestryThread[]
  /** '나' 둘레 고리를 재료 색으로 나눈 조각 */
  ring: Array<{ materialId: string; d: string }>
}

export const TAPESTRY_SIZE = 360
const CENTER = TAPESTRY_SIZE / 2
const RING = 28
/** 한국에 가까운 나라(가닥 끝)부터 바깥으로 */
const RADII = [98, 134, 158]
const KOREA = '대한민국'
const CONTINENT_ORDER = ['asia', 'oceania', 'americas', 'europe', 'africa']

const materialOrder = new Map(MATERIAL_LIST.map((m, i) => [m.id, i]))

/** 재료마다 다른 색. 황금각으로 색상을 고루 나눈다 */
export function threadColor(materialId: string, variant: 'dark' | 'paper' = 'dark'): string {
  const i = materialOrder.get(materialId) ?? 0
  const hue = Math.round((i * 137.508 + 18) % 360)
  return variant === 'dark' ? `hsl(${hue} 68% 64%)` : `hsl(${hue} 58% 42%)`
}

/** 떠난 횟수 → 실 굵기. 로그 스케일이라 많이 떠나도 너무 굵어지지 않는다 */
export function threadWidth(count: number): number {
  return Math.min(7, 1.6 + 1.4 * Math.log2(1 + count))
}

/** 재료의 가닥들: 출발지마다 [앞부분..., 공통 구간...] */
function strandsOf(materialId: string): string[][] {
  const m = MATERIALS[materialId]!
  const tail = m.stages.slice(m.originHead ?? 0)
  const heads = m.origins?.length ? m.origins.map((o) => o.head) : [m.stages.slice(0, m.originHead ?? 0)]
  return heads.map((head) => [...head, ...tail])
}

const placeOf = (personId: string) => PLACES[PEOPLE[personId]?.placeId ?? '']
const fmt = (n: number) => n.toFixed(1)

export function buildTapestry(input: TapestryInput): TapestryLayout {
  const owned = (id: string) => !!input.cards[id]
  const materials = Object.keys(input.threads)
    .filter((id) => MATERIALS[id])
    .sort((a, b) => materialOrder.get(a)! - materialOrder.get(b)!)

  // 재료마다 가닥별 나라 순서 (한국·바다 제외, 이어진 같은 나라는 하나로)
  const countryStrands = new Map<string, string[][]>()
  const peopleByCountry = new Map<string, Set<string>>()
  const continentOf = new Map<string, string>()
  for (const mid of materials) {
    const list: string[][] = []
    for (const strand of strandsOf(mid)) {
      const seq: string[] = []
      for (const pid of strand.filter(owned)) {
        const place = placeOf(pid)
        if (!place?.country || place.country === KOREA) continue
        if (!peopleByCountry.has(place.country)) peopleByCountry.set(place.country, new Set())
        peopleByCountry.get(place.country)!.add(pid)
        continentOf.set(place.country, place.continent)
        if (seq[seq.length - 1] !== place.country) seq.push(place.country)
      }
      if (seq.length && !list.some((s) => s.join() === seq.join())) list.push(seq)
    }
    countryStrands.set(mid, list)
  }

  // 바깥쪽 정도: 가닥 끝(한국에 가까운 쪽)에서 몇 번째 나라인지. 여러 가닥이면 가장 바깥 값
  const hop = new Map<string, number>()
  const firstMaterial = new Map<string, number>()
  const throughBy = new Map<string, string[]>()
  for (const [mid, list] of countryStrands) {
    for (const seq of list) seq.forEach((c, i) => hop.set(c, Math.max(hop.get(c) ?? 0, Math.min(seq.length - 1 - i, RADII.length - 1))))
    for (const c of new Set(list.flat())) {
      firstMaterial.set(c, Math.min(firstMaterial.get(c) ?? Infinity, materialOrder.get(mid)!))
      throughBy.set(c, [...(throughBy.get(c) ?? []), mid])
    }
  }

  // 각도: 대륙 순서대로 원을 나누고, 대륙 안에서는 처음 나온 재료 순서. 12시에서 시작해 시계 방향
  const names = [...peopleByCountry.keys()].sort((a, b) =>
    CONTINENT_ORDER.indexOf(continentOf.get(a)!) - CONTINENT_ORDER.indexOf(continentOf.get(b)!)
    || firstMaterial.get(a)! - firstMaterial.get(b)!
    || a.localeCompare(b, 'ko'),
  )
  const todaySet = new Set(input.todayMaterials)
  const countries: TapestryCountry[] = names.map((country, i) => {
    const theta = -Math.PI / 2 + ((i + 0.5) / names.length) * Math.PI * 2
    const radius = RADII[hop.get(country) ?? 0]! + ((hash(`country:${country}`) % 9) - 4)
    const people = [...peopleByCountry.get(country)!].sort()
    const through = throughBy.get(country) ?? []
    return {
      country,
      x: CENTER + Math.cos(theta) * radius,
      y: CENTER + Math.sin(theta) * radius,
      r: Math.min(15, 5 + 2.4 * Math.sqrt(people.length)),
      angle: (theta * 180) / Math.PI,
      people,
      materials: through,
      today: through.some((m) => todaySet.has(m)),
    }
  })
  const at = new Map(countries.map((c) => [c.country, c]))

  // 같은 나라를 지나는 실은 중심 방향과 수직으로 조금씩 비켜 지나며 엇갈린다
  const offsetAt = (country: string, mid: string) => {
    const k = at.get(country)!
    const list = throughBy.get(country) ?? [mid]
    const off = (list.indexOf(mid) - (list.length - 1) / 2) * Math.min(2.6, 12 / list.length)
    const dx = k.x - CENTER
    const dy = k.y - CENTER
    const len = Math.hypot(dx, dy) || 1
    return { x: k.x + (-dy / len) * off, y: k.y + (dx / len) * off }
  }

  const threads: TapestryThread[] = materials.map((mid) => {
    const paths = countryStrands.get(mid)!.map((seq) => {
      const pts = seq.map((c) => offsetAt(c, mid))
      const last = pts[pts.length - 1]!
      const a = Math.atan2(last.y - CENTER, last.x - CENTER)
      const all = [...pts, { x: CENTER + Math.cos(a) * RING, y: CENTER + Math.sin(a) * RING }]
      let d = `M${fmt(all[0]!.x)} ${fmt(all[0]!.y)}`
      for (let i = 1; i < all.length; i++) {
        const p0 = all[i - 1]!
        const p1 = all[i]!
        // 두 점 사이를 중심 쪽으로 살짝 휘게
        const mx = (p0.x + p1.x) / 2
        const my = (p0.y + p1.y) / 2
        d += `Q${fmt(mx + (CENTER - mx) * 0.18)} ${fmt(my + (CENTER - my) * 0.18)} ${fmt(p1.x)} ${fmt(p1.y)}`
      }
      return d
    })
    const t = input.threads[mid]!
    return {
      materialId: mid,
      name: MATERIALS[mid]!.name,
      width: threadWidth(t.count),
      count: t.count,
      today: todaySet.has(mid),
      fresh: t.first === input.todayKey,
      paths,
    }
  })

  // '나' 둘레 고리: 모든 재료가 거쳐 오는 한국·바다 구간. 재료 색으로 고르게 나눠 칠한다
  const gap = materials.length > 1 ? 0.05 : 0
  const ring = materials.map((mid, i) => {
    const a0 = -Math.PI / 2 + (i / materials.length) * Math.PI * 2
    const a1 = -Math.PI / 2 + ((i + 1) / materials.length) * Math.PI * 2 - gap
    const p = (a: number) => `${fmt(CENTER + Math.cos(a) * RING)} ${fmt(CENTER + Math.sin(a) * RING)}`
    const d = materials.length === 1
      ? `M${fmt(CENTER)} ${fmt(CENTER - RING)}A${RING} ${RING} 0 1 1 ${fmt(CENTER - 0.01)} ${fmt(CENTER - RING)}`
      : `M${p(a0)}A${RING} ${RING} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`
    return { materialId: mid, d }
  })

  return { size: TAPESTRY_SIZE, center: CENTER, ringRadius: RING, countries, threads, ring }
}
