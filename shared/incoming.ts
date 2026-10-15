/**
 * 오고 있는 물건. 여정을 마치면, 그 물건의 여정에 운송 구간(배·비행기·트럭, data/transport.ts)이 있고
 * 그 물건의 여정에서 아직 못 만난 사람이 남아 있을 때 하나 생긴다(동시에 최대 3개, 꽉 차 있으면 생기지 않는다).
 *
 *  - 도착은 다음 날 아침 6시(서울 기준)로 고정한다. 실제 운항 시간처럼 꾸미지 않는다.
 *  - 진행 막대는 출발부터 도착까지 흐른 시간 비율.
 *  - '○○를 지나는 중'은 그 여정 데이터에 있는 경유지 이름만 쓴다. 없으면 '바다를 건너는 중' 같은 말.
 *  - 도착한 물건은 열 때까지 기다린다. 사라지거나 줄어드는 벌칙은 없다.
 *  - 데려올 사람은 평범한 만남(stage) 사람만: 퀴즈·숨은 만남·연결·세트 카드는 발견하기 어려운 정도(희소도)를 지키려고 뺀다.
 */
import { MATERIALS } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { CLOSINGS, IMPORT_OFFICE, closingKind } from './data/shops'
import { ON_THE_WAY, TRANSPORT, VEHICLE, type TransportKind } from './data/transport'
import { forwardTimeline, type TimelineItem } from './journey'
import { withJosa } from './logic'
import type { Incoming } from './progress'
import { hash } from './random'
import { formsAlong, placeLabel } from './rewind'

export const MAX_INCOMING = 3
const HOUR = 60 * 60 * 1000
const KST = 9 * HOUR

/** 서울 기준 날짜(0시)의 UTC 시각 */
function seoulMidnight(t: number): number {
  const d = new Date(t + KST)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - KST
}

/** 출발한 다음 날 아침 6시(서울) */
export function arrivalTime(departAt: number): number {
  return seoulMidnight(departAt) + 24 * HOUR + 6 * HOUR
}

/** 출발부터 도착까지 흐른 시간 비율 (0~1) */
export function progressOf(inc: Pick<Incoming, 'departAt' | 'arriveAt'>, now: number): number {
  const span = inc.arriveAt - inc.departAt
  return span <= 0 ? 1 : Math.min(1, Math.max(0, (now - inc.departAt) / span))
}

export const isArrived = (inc: Incoming, now: number) => now >= inc.arriveAt
/** 아직 열지 않은 물건 (오고 있거나, 도착해서 기다리는 중) */
export const isWaiting = (inc: Incoming) => !inc.openedAt

/** 서울 날짜로 며칠 뒤인지 (오늘 0, 내일 1) */
export function daysFrom(now: number, t: number): number {
  return Math.round((seoulMidnight(t) - seoulMidnight(now)) / (24 * HOUR))
}

/** '내일 아침', '모레 아침' */
export function arrivalLabel(arriveAt: number, now: number): string {
  const d = daysFrom(now, arriveAt)
  return d <= 0 ? '오늘 아침' : d === 1 ? '내일 아침' : d === 2 ? '모레 아침' : `${d}일 뒤 아침`
}

/** '내일 도착', '모레 도착' */
export function arrivalShort(arriveAt: number, now: number): string {
  const d = daysFrom(now, arriveAt)
  return d <= 0 ? '오늘 도착' : d === 1 ? '내일 도착' : d === 2 ? '모레 도착' : `${d}일 뒤 도착`
}

/** 이 여정의 운송 구간 (정방향 타임라인에서 처음 나오는 운송 사람) */
export function transportOf(timeline: TimelineItem[]): { kind: TransportKind; index: number } | null {
  const index = timeline.findIndex((t) => t.type === 'stage' && TRANSPORT[t.personId])
  const t = timeline[index]
  return t?.type === 'stage' ? { kind: TRANSPORT[t.personId]!, index } : null
}

/** 그 물건의 여정에 나올 수 있는 평범한 사람들 (모든 출발지 변형 + 마지막 장면의 가게·사무실 사람) */
export function itemPeople(materialIds: string[], itemName: string): string[] {
  const out = new Set<string>()
  for (const id of materialIds) {
    const m = MATERIALS[id]
    if (!m) continue
    for (const p of [...m.stages, ...(m.origins ?? []).flatMap((o) => o.head)]) out.add(p)
  }
  const closing = CLOSINGS[closingKind(itemName, materialIds)]
  for (const p of [...closing.shop, ...closing.office, IMPORT_OFFICE]) out.add(p)
  return [...out].filter((p) => PEOPLE[p]?.kind === 'stage')
}

/**
 * 여정을 마쳤을 때 생기는 오고 있는 물건. 조건이 안 맞으면 null.
 * owned: 이 여정까지 만난 사람(가진 카드) / existing: 지금 목록
 */
export function createIncoming(
  journey: { id: string; name: string; materialIds: string[] },
  owned: Set<string>,
  existing: Incoming[],
  now: number,
): Incoming | null {
  const waiting = existing.filter(isWaiting)
  if (waiting.length >= MAX_INCOMING) return null
  if (existing.some((x) => x.journeyId === journey.id)) return null
  if (!transportOf(forwardTimeline(journey.materialIds, journey.id, journey.name))) return null
  const reserved = new Set(waiting.map((x) => x.personId))
  const pool = itemPeople(journey.materialIds, journey.name).filter((p) => !owned.has(p) && !reserved.has(p))
  if (!pool.length) return null
  const personId = pool.map((p) => ({ p, h: hash(`incoming:${journey.id}:${p}`) })).sort((a, b) => a.h - b.h)[0]!.p
  return { journeyId: journey.id, departAt: now, arriveAt: arrivalTime(now), personId }
}

/** 운송 구간 앞뒤의 경유지 이름 (여정 데이터에 있는 장소만, '바다 위'처럼 이름 없는 곳은 뺀다) */
export function waypointsOf(timeline: TimelineItem[]): string[] {
  const t = transportOf(timeline)
  if (!t) return []
  const stages = timeline.flatMap((x, i) => (x.type === 'stage' && !x.closing ? [{ i, personId: x.personId }] : []))
  const at = stages.findIndex((s) => s.i === t.index)
  // 마지막 장면의 택배 기사처럼 재료 여정 밖의 운송이면 경유지가 없다
  if (at < 0) return []
  // 실어 보낸 바로 앞 사람부터, 운송·항구·바다가 이어지는 데까지(배 → 크레인, 오슬로 공항 → 인천공항).
  // 그 끝이 아직 바다 위 배나 트럭이면 그 운송이 닿은 다음 사람의 장소까지 (카카오 배 → 암스테르담 공장)
  let end = at
  while (end + 1 < stages.length && (TRANSPORT[stages[end + 1]!.personId] || isPortOrSea(stages[end + 1]!.personId))) end++
  const last = stages[end]!.personId
  const stillMoving = TRANSPORT[last] === 'truck' || PLACES[PEOPLE[last]?.placeId ?? '']?.continent === 'sea'
  if (stillMoving && end + 1 < stages.length) end++
  const span = stages.slice(Math.max(0, at - 1), end + 1)
  const names = span.flatMap((s) => {
    const place = PLACES[PEOPLE[s.personId]?.placeId ?? '']
    return place && place.id !== 'sea' ? [placeLabel(place)] : []
  })
  return names.filter((n, i) => names.indexOf(n) === i)
}

function isPortOrSea(personId: string): boolean {
  const place = PLACES[PEOPLE[personId]?.placeId ?? '']
  return !!place && (place.continent === 'sea' || /항(구)?$/.test(place.name) || place.name.includes('공항'))
}

/** '부산항을 지나는 중'. 경유지를 진행 비율에 맞춰 차례로 보여 준다 */
export function wayText(timeline: TimelineItem[], progress: number): string {
  const t = transportOf(timeline)
  if (!t) return ''
  const wps = waypointsOf(timeline)
  if (!wps.length) return ON_THE_WAY[t.kind]
  const name = wps[Math.min(wps.length - 1, Math.floor(progress * wps.length))]!
  return `${withJosa(name, '을', '를')} 지나는 중`
}

/** 실려 오는 것의 이름: 운송 구간에서의 형태(생두 자루), 없으면 물건 이름 */
export function cargoName(journey: { id: string; name: string; materialIds: string[] }): string {
  const timeline = forwardTimeline(journey.materialIds, journey.id, journey.name)
  const t = transportOf(timeline)
  if (!t) return journey.name
  const form = formsAlong(timeline, journey.materialIds, journey.id, journey.name)[t.index]
  return form && !form.product ? form.name : journey.name
}

/** 우리나라에 내린 곳: 운송 구간 경유지의 마지막이 우리나라 장소면 그 이름 (아니면 '': 장소 없이 '도착했어요') */
export function landingPlace(timeline: TimelineItem[]): string {
  const last = waypointsOf(timeline).at(-1)
  const place = Object.values(PLACES).find((p) => placeLabel(p) === last)
  return place?.continent === 'korea' ? last! : ''
}

/**
 * 마을 노란 버튼 위의 오고 있는 물건 칩 한 줄. 축소해도 숨기지 않는다.
 * 하나면 '생두 자루가 오고 있어요 · 내일 아침'(도착했으면 '생두 자루가 도착했어요 · 열어 보기'), 여러 개면 '물건 2개가 오고 있어요'
 */
export function incomingChipText(items: Array<{ cargo: string; arriveAt: number }>, now: number): string {
  if (!items.length) return ''
  if (items.length === 1) {
    const it = items[0]!
    return it.arriveAt <= now ? `${withJosa(it.cargo, '이', '가')} 도착했어요 · 열어 보기` : `${withJosa(it.cargo, '이', '가')} 오고 있어요 · ${arrivalLabel(it.arriveAt, now)}`
  }
  const arrived = items.filter((it) => it.arriveAt <= now).length
  return arrived ? `물건 ${items.length}개 중 ${arrived}개가 도착했어요` : `물건 ${items.length}개가 오고 있어요`
}

/** 여정 도착 화면 '마을로 모시기' 위: '생두 자루를 실은 배가 출발했어요 · 내일 아침 도착' */
export function departureLine(cargo: string, kind: TransportKind, arriveAt: number, now: number): string {
  return `${withJosa(cargo, '을', '를')} 실은 ${withJosa(VEHICLE[kind], '이', '가')} 출발했어요 · ${arrivalLabel(arriveAt, now)} 도착`
}
