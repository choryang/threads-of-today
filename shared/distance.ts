/**
 * 거리 계산기. 단계 사이를 대권 거리(지구 표면의 최단 거리)로 이어 누적한다. 좌표는 data/places.ts의 대표 지점.
 * - 지나가는 바다(좌표 없음)는 건너뛰어서, 바다 위 단계는 앞뒤 항구 사이 거리로 잰다.
 * - 숨은 만남은 물건을 나르지 않으니 넣지 않는다.
 * - 재료가 여럿이면 재료마다 가게·사무실 사람(내 손 가까이)에서 원산지까지 따로 거슬러 올라가 더한다.
 * 화면에는 100km 단위로 반올림해서 보여 준다(roundKm).
 */
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import type { TimelineItem } from './journey'

const EARTH_KM = 6371

interface Point { lat: number; lng: number }

export function greatCircleKm(a: Point, b: Point): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

function pointOf(personId: string): Point | null {
  const place = PLACES[PEOPLE[personId]?.placeId ?? '']
  return place?.lat !== undefined && place.lng !== undefined ? { lat: place.lat, lng: place.lng } : null
}

/**
 * 내 손에서 거슬러 올라간 거리(km). reversed는 내 손 → 원산지 순서의 타임라인(reverseTimeline).
 * at[i]: i번째 칸까지 왔을 때의 누적 거리 / total: 여정 전체
 */
export function reverseDistances(reversed: TimelineItem[]): { at: number[]; total: number } {
  const at: number[] = []
  let km = 0
  let prev: Point | null = null
  /** 가게·사무실 사람 중 마지막(원산지 쪽) 지점. 재료마다 여기서 다시 출발한다 */
  let anchor: Point | null = null
  let material = ''
  const visit = (personId: string) => {
    const p = pointOf(personId)
    if (!p) return
    if (prev) km += greatCircleKm(prev, p)
    prev = p
  }
  for (const t of reversed) {
    if (t.type === 'stage' && t.closing) {
      visit(t.personId)
      anchor = prev
    } else if (t.type === 'stage' || t.type === 'pass') {
      if (t.materialId !== material) {
        material = t.materialId
        prev = anchor
      }
      for (const id of t.type === 'stage' ? [t.personId] : t.personIds) visit(id)
    }
    at.push(km)
  }
  return { at, total: km }
}

/** 100km 단위로 반올림. 50km보다 짧으면 0 (화면에 거리 줄을 띄우지 않는다) */
export function roundKm(km: number): number {
  return km < 50 ? 0 : Math.max(100, Math.round(km / 100) * 100)
}

export function formatKm(km: number): string {
  return roundKm(km).toLocaleString('ko-KR')
}
