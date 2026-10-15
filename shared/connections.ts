import { MOODS } from './data/moods'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import type { TodayRecord } from './progress'
import { hash } from './random'

/**
 * 나와 이어진 사람들 (docs/redesign/README.md, 시안 V2Map). 나(서울)를 가운데 두고 실제 방향·거리로 놓은 별자리.
 * - 서울(37.57, 126.98) 기준 방위각·대권 거리. 반지름 = 26 + 124 × log(1 + d/300) / log(1 + 12000/300).
 * - 서울·한국 안 사람은 가운데 가까이(반지름 22) 사람마다 정해진 각도로. 바다 위(sea)는 북위 5°, 동경 85°.
 * - 실 색 = 그날의 마음 색, 오래된 실일수록 흐리게.
 */
export const HOME = { lat: 37.57, lng: 126.98 }
export const SEA_POINT = { lat: 5, lng: 85 }
export const NEAR_RADIUS = 22
/** 동심원 거리 (km) */
export const RINGS = [1000, 5000, 10000]
/** 판 가운데 (342×342) */
export const CENTER = 171

const rad = (d: number) => (d * Math.PI) / 180

/** 서울에서 본 방위각(라디안, 북쪽 0·시계 방향)과 대권 거리(km) */
export function bearingDistance(lat: number, lng: number): { bearing: number; km: number } {
  const f1 = rad(HOME.lat)
  const f2 = rad(lat)
  const dl = rad(lng - HOME.lng)
  const bearing = Math.atan2(Math.sin(dl) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl))
  const a = Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2
  return { bearing, km: 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) }
}

export function radiusOf(km: number): number {
  return 26 + (124 * Math.log(1 + km / 300)) / Math.log(1 + 12000 / 300)
}

/** 판 위 자리. 한국 안 사람은 같은 자리에 겹치지 않게 사람 id로 각도를 정한다 */
export function positionOf(personId: string): { x: number; y: number; km: number; near: boolean } | null {
  const place = PLACES[PEOPLE[personId]?.placeId ?? '']
  if (!place) return null
  if (place.country === '대한민국') {
    const bearing = ((hash(`near:${personId}`) % 360) * Math.PI) / 180
    return { x: CENTER + NEAR_RADIUS * Math.sin(bearing), y: CENTER - NEAR_RADIUS * Math.cos(bearing), km: 0, near: true }
  }
  const at = place.continent === 'sea' && place.lat === undefined ? SEA_POINT : { lat: place.lat ?? SEA_POINT.lat, lng: place.lng ?? SEA_POINT.lng }
  const { bearing, km } = bearingDistance(at.lat, at.lng)
  const r = radiusOf(km)
  return { x: CENTER + r * Math.sin(bearing), y: CENTER - r * Math.cos(bearing), km, near: false }
}

/** 오래된 실일수록 흐리게: 가장 최근 1, 그다음 0.8 · 0.65 · 0.55 · 0.45, 그 뒤로 0.35 */
export function strandOpacity(rank: number): number {
  return [1, 0.8, 0.65, 0.55, 0.45][rank] ?? 0.35
}

export interface Strand {
  date: string
  personId: string
  color: string
  opacity: number
  x: number
  y: number
  /** 가운데(나)에서 그 사람까지 살짝 휜 실 */
  path: string
  /** 이름표 자리와 정렬 */
  label: { x: number; y: number; anchor: 'start' | 'end' }
}

/** 하루 기록 → 실 (최근 것부터) */
export function strandsOf(todays: Record<string, TodayRecord> | undefined): Strand[] {
  return Object.entries(todays ?? {})
    .sort(([a], [b]) => b.localeCompare(a))
    .flatMap(([date, r], rank) => {
      const p = positionOf(r.personId)
      if (!p) return []
      const mx = (CENTER + p.x) / 2 - (p.y - CENTER) * 0.12
      const my = (CENTER + p.y) / 2 + (p.x - CENTER) * 0.12
      // 이름표는 바깥쪽에. 판(342) 밖으로 나가면 안쪽으로 (글자 하나 약 12px)
      const nameWidth = ((PEOPLE[r.personId]?.name ?? PEOPLE[r.personId]?.job ?? '').length * 12) + 4
      let right = p.x >= CENTER
      if (right && p.x + 12 + nameWidth > 2 * CENTER) right = false
      else if (!right && p.x - 12 - nameWidth < 0) right = true
      const f = (n: number) => n.toFixed(1)
      return [{
        date,
        personId: r.personId,
        color: MOODS[r.mood].color,
        opacity: strandOpacity(rank),
        x: p.x,
        y: p.y,
        path: `M${CENTER} ${CENTER} Q ${f(mx)} ${f(my)} ${f(p.x)} ${f(p.y)}`,
        label: { x: p.x + (right ? 12 : -12), y: p.y + 4, anchor: right ? 'start' : 'end' },
      }]
    })
}

const NATIVE = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열']
/** '다섯 가닥' · '열두 가닥'은 숫자로('12가닥') */
export function strandCount(n: number): string {
  return n >= 1 && n <= 10 ? `${NATIVE[n]} 가닥` : `${n.toLocaleString('ko-KR')}가닥`
}
