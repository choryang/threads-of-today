/**
 * 내 하루 마을의 자리 배정 (순수 함수). 지도·구역·자리 데이터는 data/village.ts.
 *
 * 자리는 사람 id로 정해진다: 사람마다 구역 자리 목록에서 hash(id) 번째부터 차례로 빈자리를 찾는다.
 * 먼저 만난 사람부터 자리를 잡아서(만난 순서 키) 새 주민이 와도 원래 주민의 자리는 바뀌지 않는다.
 * 구역 자리가 다 차면 그 구역의 빈 땅(overflow)에서 다른 사람과 떨어진 곳을 고르고, 그것도 없으면 겹쳐 선다.
 */
import { PEOPLE, PEOPLE_LIST } from './data/people'
import { PLACES } from './data/places'
import { ZONES, ZONE_BY_ID, type ZoneId } from './data/village'
import type { PersonLog } from './progress'
import { hash } from './random'
import { hintProductOf } from './visit'
import type { Product } from './types'

export interface Placed {
  id: string
  zone: ZoneId
  /** 발끝 (지도 좌표) */
  x: number
  y: number
}

/** 사람끼리 떨어져야 하는 거리: 가로 또는 세로 중 하나만 넘으면 된다 */
export const SLOT_GAP: [number, number] = [90, 130]
export const OVERFLOW_GAP: [number, number] = [60, 90]

const apart = (a: { x: number; y: number }, b: { x: number; y: number }, [dx, dy]: [number, number]) =>
  Math.abs(a.x - b.x) >= dx || Math.abs(a.y - b.y) >= dy

/** 마을 주민: 가진 카드에서 연결 카드는 뺀다(연결 카드는 이미 사는 원래 사람이다) */
export function villagers(cards: Record<string, string>): string[] {
  return Object.keys(cards).filter((id) => PEOPLE[id] && PEOPLE[id]!.kind !== 'link')
}

/** 자리를 잡는 순서 키: 처음 만난 여정 id(날짜-번호), 없으면 카드를 얻은 날. 같으면 id */
export function arrivalKey(id: string, cards: Record<string, string>, log?: PersonLog): string {
  const met = log?.metItems.find((x) => !x.startsWith('legacy:'))
  return `${met ?? cards[id] ?? '9999'}|${id}`
}

/**
 * 주어진 순서대로 자리를 잡는다. 앞 사람이 먼저 잡으므로, 같은 앞부분이면 결과도 같다.
 * ids: 자리를 잡을 사람 (주민 → 도착 예정 → 빈 집터 순으로 넘긴다)
 */
export function placeAll(ids: string[]): Placed[] {
  const out: Placed[] = []
  const takenSlot = new Set<string>()
  const overflowCount: Partial<Record<ZoneId, number>> = {}
  for (const id of ids) {
    const person = PEOPLE[id]
    if (!person) continue
    const zone = ZONE_BY_ID[person.zone]
    const n = zone.slots.length
    const start = hash(`slot:${id}`) % n
    let placed: Placed | null = null
    for (let k = 0; k < n && !placed; k++) {
      const i = (start + k) % n
      if (takenSlot.has(`${zone.id}:${i}`)) continue
      takenSlot.add(`${zone.id}:${i}`)
      const [x, y] = zone.slots[i]!
      placed = { id, zone: zone.id, x, y }
    }
    if (!placed) {
      const spot = zone.overflow.find(([x, y]) => out.every((p) => apart(p, { x, y }, OVERFLOW_GAP)))
      if (spot) placed = { id, zone: zone.id, x: spot[0], y: spot[1] }
    }
    if (!placed) {
      // 빈 땅도 다 찼다: 구역 자리 앞에 조금씩 비켜 겹쳐 선다
      const c = (overflowCount[zone.id] = (overflowCount[zone.id] ?? 0) + 1)
      const [bx, by] = zone.slots[(start + c) % n]!
      placed = { id, zone: zone.id, x: bx + ((c % 5) - 2) * 28, y: by + 16 + Math.floor(c / 5) * 12 }
    }
    out.push(placed)
  }
  return out
}

/** 구역마다 아직 못 만난 사람 1~2명의 자리(빈 집터). 사람 id 해시 순이라 만날 때까지 같은 사람이다 */
export function emptyLots(exclude: Set<string>, perZone = 2): string[] {
  return ZONES.flatMap((zone) =>
    PEOPLE_LIST.filter((p) => p.zone === zone.id && p.kind !== 'link' && !exclude.has(p.id))
      .map((p) => ({ id: p.id, h: hash(`lot:${p.id}`) }))
      .sort((a, b) => a.h - b.h)
      .slice(0, perZone)
      .map((x) => x.id),
  )
}

export interface VillageLayout {
  residents: Placed[]
  /** 오고 있는 물건이 데려올 사람 (점선 실루엣) */
  arriving: Placed[]
  /** 빈 집터 (점선 '?') */
  lots: Placed[]
}

/**
 * 마을 배치. 주민은 만난 순서대로, 그다음 도착 예정인 사람, 마지막에 빈 집터가 자리를 잡는다.
 * arrivingIds: 아직 도착하지 않은(또는 열지 않은) 물건이 데려올 사람
 */
export function villageLayout(cards: Record<string, string>, people: Record<string, PersonLog>, arrivingIds: string[] = []): VillageLayout {
  const residents = villagers(cards).sort((a, b) => arrivalKey(a, cards, people[a]).localeCompare(arrivalKey(b, cards, people[b])))
  const arriving = [...new Set(arrivingIds)].filter((id) => PEOPLE[id] && !cards[id])
  const lots = emptyLots(new Set([...Object.keys(cards), ...arriving]))
  const placed = placeAll([...residents, ...arriving, ...lots])
  const at = new Map(placed.map((p) => [p.id, p]))
  return {
    residents: residents.map((id) => at.get(id)!),
    arriving: arriving.map((id) => at.get(id)!),
    lots: lots.map((id) => at.get(id)!),
  }
}

/** "주민 23명 · 9개 나라에서 왔어요"의 나라 수 (바다 위 사람은 나라가 없다) */
export function countriesOf(ids: string[]): string[] {
  return [...new Set(ids.map((id) => PLACES[PEOPLE[id]?.placeId ?? '']?.country).filter((c): c is string => !!c))]
}

/** 마을에 살 수 있는 사람 수 (연결 카드는 이미 사는 원래 사람이라 뺀다). "마을 주민 n / 이 수" */
export const VILLAGE_CAPACITY = PEOPLE_LIST.filter((p) => p.kind !== 'link').length

/**
 * "다음 주민은 {물건} 속에 있어요": 아직 못 만난 여정 사람(stage) 중 하나와, 그 사람이 나오는 대표 물건.
 * 오늘 날짜(서울)와 사용자 id로 정해서 하루 동안 바뀌지 않는다. 대표 물건에 나오지 않는 사람은 고르지 않는다.
 * 모두 만났으면 null
 */
export function nextResident(owned: Iterable<string>, seoulDate: string, seed: string): { personId: string; product: Product } | null {
  const have = new Set(owned)
  let best: { personId: string; product: Product; h: number } | null = null
  for (const p of PEOPLE_LIST) {
    if (p.kind !== 'stage' || have.has(p.id)) continue
    const product = hintProductOf(p.id)
    if (!product) continue
    const h = hash(`next-resident:${seoulDate}:${seed}:${p.id}`)
    if (!best || h < best.h || (h === best.h && p.id < best.personId)) best = { personId: p.id, product, h }
  }
  return best ? { personId: best.personId, product: best.product } : null
}
