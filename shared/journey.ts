/**
 * 여정 타임라인. 출발지 변형·여정 이벤트·숨은 만남·퀴즈 변형을 데이터와 확률로만 정한다.
 * 무작위는 여정 id를 시드로 써서, 새로고침하거나 다른 기기에서 열어도 같은 여정이 나온다.
 * 새 여정 id는 '2026-10-14-1-k3x9'처럼 무작위 꼬리가 붙는다. 꼬리가 없는 예전 id(2026-10-14-1, 2026-10-14-1abcd)는
 * 기본 경로 그대로 둬서, 이 기능이 들어가기 전에 시작한 여정이 중간에 바뀌지 않게 한다.
 * 사용자의 첫 여정은 id 끝에 '-first'를 붙인다(FIRST_SUFFIX). 첫 여정은 사람 카드만 나온다: 퀴즈·경유지 맞히기·이야기·같은 길·숨은 만남이
 * 없다(docs/screen-cleanup.md "첫날 보이는 것"). 난수는 그대로 굴려서 출발지·가게 사람은 같은 규칙으로 정해진다.
 * 두 번째 여정은 '-second'(SECOND_SUFFIX). 예전에 첫 여정에서 주던 선물을 여기로 옮겼다: 숨은 만남이 반드시 하나 나오고,
 * 숨은 만남이 나올 자리가 없는 경로면 퀴즈를 틀려도 보상 카드를 준다(secondJourneyGift). 그래서 처음 두 여정의 카드 수는 그대로다.
 * 물건 이름을 넘기면 여정 맨 끝에 손에 닿기 직전의 가게·사무실 사람을 붙인다(shared/data/shops.ts). 끝에만 붙어서
 * 이미 진행 중인 여정의 앞부분은 바뀌지 않는다.
 *
 * 거꾸로 가는 여정: id에 '-r'(REVERSE_SUFFIX)이 붙은 여정은 내 손에 가장 가까운 사람(가게)부터 원산지로 거슬러 올라간다.
 * 순서만 뒤집는다. 위의 정방향 타임라인을 같은 난수로 만든 뒤 재배치하므로 출발지·이야기·숨은 만남·퀴즈 변형은 정방향과 같다.
 * 재료는 하나씩 끝까지 거슬러 올라간 뒤 다음 재료로 가고, 그 재료의 퀴즈는 원산지를 만난 뒤에 나온다.
 * 앞 재료에서 이미 만난 사람(물류센터·항구)이 이어지는 구간은 '같은 길' 한 칸(pass)으로 줄인다.
 * '-r'이 없는 여정(이 기능 전에 시작한 여정)은 예전 순서 그대로 끝난다.
 */
import { EVENTS, HIDDEN_RULES } from './data/journey-extras'
import { MATERIALS } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { CLOSINGS, IMPORT_OFFICE, closingKind } from './data/shops'
import { hash, mix32, seeded } from './random'
import type { Material, Origin, Quiz } from './types'

/** 사람과 사람 사이마다 이야기가 끼어들 확률 */
export const EVENT_CHANCE = 0.04
export const MAX_EVENTS = 2
export const MAX_HIDDEN = 1

export type TimelineItem =
  /** closing: 여정 끝(거꾸로 가는 여정에서는 처음)의 가게·사무실 사람 */
  | { type: 'stage'; materialId: string; personId: string; closing?: true }
  | { type: 'hidden'; materialId: string; personId: string }
  | { type: 'event'; materialId: string; eventId: string }
  | { type: 'quiz'; materialId: string; quizIndex: number }
  /** 거꾸로 가는 여정에서 앞 재료와 같은 길(이미 만난 사람들)을 한 칸으로 줄인 것 */
  | { type: 'pass'; materialId: string; personIds: string[] }

const NEW_ID = /^\d{4}-\d{2}-\d{2}-\d+-[0-9a-z]+(-r)?(-k)?(-first|-second)?$/
/** 사용자의 첫 여정 id 꼬리 */
export const FIRST_SUFFIX = '-first'
/** 사용자의 두 번째 여정 id 꼬리 */
export const SECOND_SUFFIX = '-second'
/** 거꾸로 가는 여정 id 꼬리. 첫 여정이면 '-r-first' */
export const REVERSE_SUFFIX = '-r'
/**
 * 핵심 인물 여정 id 꼬리('-r-k', '-r-k-first'). 이 꼬리가 붙은 여정은 타임라인 칸 대신 화면 목록(journeyScreens)을 한 칸씩 간다:
 * 시작 화면 → 핵심 인물 세 사람 → 그 사이 사람들은 묶음 칸 하나. 여정 이벤트는 없다. 이 꼬리가 없는 예전 여정은 예전 칸 그대로
 */
export const KEY_SUFFIX = '-k'

export function isFirstJourney(journeyId?: string): boolean {
  return !!journeyId && /^\d{4}-\d{2}-\d{2}-\d+-[0-9a-z]+(-r)?(-k)?-first$/.test(journeyId)
}

export function isSecondJourney(journeyId?: string): boolean {
  return !!journeyId && /^\d{4}-\d{2}-\d{2}-\d+-[0-9a-z]+(-r)?(-k)?-second$/.test(journeyId)
}

export function isReverseJourney(journeyId?: string): boolean {
  return !!journeyId && /^\d{4}-\d{2}-\d{2}-\d+-[0-9a-z]+-r(-k)?(-first|-second)?$/.test(journeyId)
}

export function isKeyJourney(journeyId?: string): boolean {
  return !!journeyId && /^\d{4}-\d{2}-\d{2}-\d+-[0-9a-z]+(-r)?-k(-first|-second)?$/.test(journeyId)
}

/**
 * 새 여정 id의 꼬리. firstVisit(카드 0장)이면 첫 여정, 남아 있는 여정이 첫 여정 하나뿐이면 두 번째 여정.
 * (여정 기록은 30일만 남는다. 첫 여정이 지워질 만큼 오래 한 사용자는 두 번째 여정 선물을 받지 않는다)
 */
export function journeyOrderSuffix(firstVisit: boolean, previousIds: string[]): string {
  if (firstVisit) return FIRST_SUFFIX
  return previousIds.length === 1 && isFirstJourney(previousIds[0]) ? SECOND_SUFFIX : ''
}

/** 여정 id에서 난수를 만든다. 예전 id나 id가 없으면 null(기본 경로) */
export function journeyRandom(journeyId?: string): (() => number) | null {
  if (!journeyId || !NEW_ID.test(journeyId)) return null
  return seeded(mix32(hash(`journey:${journeyId}`)))
}

export function quizzesOf(m: Material): Quiz[] {
  return m.quiz ? [m.quiz, ...(m.extraQuizzes ?? [])] : []
}

function pickWeighted<T extends { weight: number }>(list: T[], rand: () => number): T {
  const total = list.reduce((sum, x) => sum + x.weight, 0)
  let r = rand() * total
  for (const x of list) {
    r -= x.weight
    if (r < 0) return x
  }
  return list[list.length - 1]!
}

/** 이 재료가 이번 여정에서 지나는 사람들과 출발지 */
export function resolveStages(m: Material, rand: (() => number) | null): { stages: string[]; origin?: Origin } {
  if (!rand || !m.origins?.length) return { stages: m.stages, origin: m.origins?.[0] }
  const origin = pickWeighted(m.origins, rand)
  return { stages: [...origin.head, ...m.stages.slice(m.originHead ?? 0)], origin }
}

const isSea = (personId: string) => PLACES[PEOPLE[personId]?.placeId ?? '']?.continent === 'sea'

/** 여정 끝의 가게·사무실 사람. 사무실 사람(있으면) 다음 가게 사람 */
export function closingPeople(itemName: string, materialIds: string[], journeyId: string, imported: boolean): string[] {
  const closing = CLOSINGS[closingKind(itemName, materialIds)]
  const offices = imported ? [IMPORT_OFFICE, ...closing.office] : closing.office
  const pick = (list: string[], salt: string) => list[hash(`closing:${salt}:${journeyId}`) % list.length]!
  return [...(offices.length ? [pick(offices, 'office')] : []), pick(closing.shop, 'shop')]
}

const isAbroad = (personId: string) => {
  const place = PLACES[PEOPLE[personId]?.placeId ?? '']
  return !!place?.country && place.country !== '대한민국'
}

/** 여정 id에 맞는 순서의 타임라인. 거꾸로 가는 여정이면 reverseTimeline */
export function buildTimeline(materialIds: string[], journeyId?: string, itemName?: string): TimelineItem[] {
  return isReverseJourney(journeyId) ? reverseTimeline(materialIds, journeyId, itemName) : forwardTimeline(materialIds, journeyId, itemName)
}

/** 원산지 → 내 손 순서의 타임라인 (예전 여정의 순서, 되감기 엔딩과 거리 계산의 기준) */
export function forwardTimeline(materialIds: string[], journeyId?: string, itemName?: string): TimelineItem[] {
  const rand = journeyRandom(journeyId)
  // 첫 여정은 사람 카드만 (난수는 그대로 굴려 다른 칸의 결과가 같은 규칙으로 정해지게 한다)
  const plain = isFirstJourney(journeyId)
  const items: TimelineItem[] = []
  let events = 0
  let hidden = 0
  const usedEvents = new Set<string>()

  materialIds.forEach((materialId, mi) => {
    const m = MATERIALS[materialId]
    if (!m) return
    const { stages } = resolveStages(m, rand)
    stages.forEach((personId, si) => {
      items.push({ type: 'stage', materialId, personId })
      if (!rand) return
      // 숨은 만남: 이 사람 다음에, 규칙마다 따로 확률을 굴린다
      if (hidden < MAX_HIDDEN) {
        for (const rule of HIDDEN_RULES) {
          if (!rule.afterPersonIds.includes(personId)) continue
          if (rule.materialIds && !rule.materialIds.includes(materialId)) continue
          if (rand() < rule.chance) {
            if (!plain) {
              items.push({ type: 'hidden', materialId, personId: rule.cardId })
              hidden++
            }
            break
          }
        }
      }
      // 여정 이벤트: 여정의 맨 끝이 아닌 단계 사이에만
      const lastOfJourney = mi === materialIds.length - 1 && si === stages.length - 1 && !m.quiz
      if (events < MAX_EVENTS && !lastOfJourney && rand() < EVENT_CHANCE) {
        const where = isSea(personId) ? 'sea' : 'land'
        const pool = EVENTS.filter((e) => (e.where === 'any' || e.where === where) && !usedEvents.has(e.id))
        if (pool.length) {
          const event = pool[Math.floor(rand() * pool.length)]!
          if (!plain) {
            usedEvents.add(event.id)
            items.push({ type: 'event', materialId, eventId: event.id })
            events++
          }
        }
      }
    })
    const quizzes = quizzesOf(m)
    if (quizzes.length) {
      const quizIndex = rand ? Math.floor(rand() * quizzes.length) : 0
      if (!plain) items.push({ type: 'quiz', materialId, quizIndex })
    }
  })

  // 두 번째 여정: 확률에서 숨은 만남이 안 나왔으면, 나올 수 있는 자리 중 하나에 넣는다 (위의 난수 흐름은 그대로 둔다)
  if (rand && hidden === 0 && isSecondJourney(journeyId)) {
    const spots = items.flatMap((t, i) => {
      if (t.type !== 'stage') return []
      const rule = HIDDEN_RULES.find((r) => r.afterPersonIds.includes(t.personId) && (!r.materialIds || r.materialIds.includes(t.materialId)))
      return rule ? [{ i, materialId: t.materialId, cardId: rule.cardId }] : []
    })
    if (spots.length) {
      const spot = spots[hash(`second-hidden:${journeyId}`) % spots.length]!
      items.splice(spot.i + 1, 0, { type: 'hidden', materialId: spot.materialId, personId: spot.cardId })
    }
  }

  const known = materialIds.filter((id) => MATERIALS[id])
  const lastMaterial = known[known.length - 1]
  if (rand && itemName && journeyId && lastMaterial) {
    const imported = items.some((t) => t.type === 'stage' && isAbroad(t.personId))
    for (const personId of closingPeople(itemName, materialIds, journeyId, imported)) items.push({ type: 'stage', materialId: lastMaterial, personId, closing: true })
  }
  return items
}

/** 내 손 → 원산지 순서. 정방향 타임라인을 재배치만 한다 */
export function reverseTimeline(materialIds: string[], journeyId?: string, itemName?: string): TimelineItem[] {
  const forward = forwardTimeline(materialIds, journeyId, itemName)
  const closing = forward.filter((t) => t.type === 'stage' && t.closing)
  const out: TimelineItem[] = closing.reverse()
  const seen = new Set(out.flatMap((t) => (t.type === 'stage' ? [t.personId] : [])))
  for (const materialId of [...new Set(materialIds)]) {
    const own = forward.filter((t) => t.materialId === materialId && !(t.type === 'stage' && t.closing))
    const body = own.filter((t) => t.type !== 'quiz').reverse()
    // 앞에서 이미 지나온 사람이 이어지는 구간은 '같은 길' 한 칸으로 줄인다. 첫 여정은 그 칸 없이 건너뛴다
    let pass: Extract<TimelineItem, { type: 'pass' }> | null = null
    for (const t of body) {
      if (t.type === 'stage' && seen.has(t.personId)) {
        if (isFirstJourney(journeyId)) continue
        if (pass) pass.personIds.push(t.personId)
        else out.push((pass = { type: 'pass', materialId, personIds: [t.personId] }))
        continue
      }
      pass = null
      out.push(t)
      if (t.type === 'stage' || t.type === 'hidden') seen.add(t.personId)
    }
    out.push(...own.filter((t) => t.type === 'quiz'))
  }
  return out
}

/** 이번 여정에서 이 재료가 지나는 사람들 (가공 순서, 가게·사무실 사람 제외). 형태 변화(formAt)의 기준 */
export function materialRoute(materialIds: string[], journeyId: string | undefined, materialId: string): string[] {
  return forwardTimeline(materialIds, journeyId).flatMap((t) => (t.type === 'stage' && t.materialId === materialId ? [t.personId] : []))
}

/** 이 여정에서 나오는 퀴즈 (재료당 하나) */
export function quizFor(materialIds: string[], journeyId: string | undefined, materialId: string): Quiz | undefined {
  const item = buildTimeline(materialIds, journeyId).find((t) => t.type === 'quiz' && t.materialId === materialId)
  const m = MATERIALS[materialId]
  return item?.type === 'quiz' && m ? quizzesOf(m)[item.quizIndex] : undefined
}

/**
 * 퀴즈 보기를 화면에 놓을 순서(데이터 인덱스 목록). 데이터의 보기는 작은 수부터 정렬해 두고, 정답 자리가 한쪽에 몰리지 않게
 * 화면에서만 여정 id 시드로 섞는다. 저장하는 답은 데이터 인덱스 그대로라 지난 기록의 정답 판정은 바뀌지 않는다.
 */
export function optionOrder(journeyId: string | undefined, materialId: string, count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i)
  if (!journeyId) return order
  const rand = seeded(mix32(hash(`options:${journeyId}:${materialId}`)))
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order
}

/**
 * 여정에서 만나는 사람(단계 + 숨은 만남). 정방향 타임라인으로 센다: 거꾸로 가는 여정이 '같은 길'로 줄이거나
 * (첫 여정에서) 건너뛴 사람도 이 재료가 지나온 사람이라, 연결 카드 판정이 순서와 무관하게 같다
 */
export function timelinePeople(materialIds: string[], journeyId?: string, itemName?: string): Array<{ materialId: string; personId: string }> {
  return forwardTimeline(materialIds, journeyId, itemName).flatMap((t) =>
    t.type === 'stage' || t.type === 'hidden' ? [{ materialId: t.materialId, personId: t.personId }] : [],
  )
}

/** 두 번째 여정인데 숨은 만남이 나올 자리가 없으면, 퀴즈를 틀려도 보상 카드를 준다 (예전 첫 여정 선물) */
export function secondJourneyGift(materialIds: string[], journeyId: string): boolean {
  return isSecondJourney(journeyId) && !buildTimeline(materialIds, journeyId).some((t) => t.type === 'hidden')
}

/**
 * 이 사람이 반드시 나오는 여정 id 꼬리 ("다음 주민은 {물건} 속에 있어요"를 눌러 떠날 때).
 * 출발지·가게 사람은 여정 id 시드로 정해지므로, 사람 id로 만든 후보 꼬리를 차례로 넣어 보고 그 사람이 나오는 첫 꼬리를 고른다.
 * idOf: 꼬리 → 여정 id 전체(날짜·번호·'-r'·첫/두 번째 꼬리까지). salt: 기기마다 다른 값(다른 기기의 같은 여정 id와 겹치지 않게).
 * 못 찾으면 null(그때는 무작위 꼬리로 떠난다)
 */
export function tailMeeting(idOf: (tail: string) => string, materialIds: string[], itemName: string, personId: string, salt = '', tries = 400): string | null {
  for (let i = 0; i < tries; i++) {
    const tail = mix32(hash(`meet:${personId}:${salt}:${i}`)).toString(36).padStart(4, '0').slice(0, 6)
    if (timelinePeople(materialIds, idOf(tail), itemName).some((p) => p.personId === personId)) return tail
  }
  return null
}

// ── 핵심 인물 (docs/key-people.md): 여정마다 세 사람만 한 화면씩 깊게 만난다 ──

/** 건너온 손 후보: 바다·항구·비행기 사람. 물류센터(warehouse)는 넣지 않는다 */
export const HUBS = ['sea-crew', 'bulk-crew', 'tanker-crew', 'reefer-crew', 'busan-crane', 'incheon-port', 'air-cargo']

/** start: 시작한 손(출발지) · cross: 건너온 손(이어 준 사람) · hand: 건네준 손(내 손에 닿게 한 사람) */
export type KeySlot = 'start' | 'cross' | 'hand'
export interface KeyPerson {
  slot: KeySlot
  personId: string
}

/**
 * 이 여정의 핵심 인물. 첫 재료(물건의 정체를 정하는 재료) 경로에서 고른다.
 * 1. 시작한 손: 첫 재료 경로의 첫 사람 (이번 출발지의 첫 사람)
 * 2. 건너온 손: 경로에 HUBS가 있으면 그중 하나를 여정 id 시드로. 없으면(국내 여정) 창고 바로 앞의 가공하는 사람
 * 3. 건네준 손: 여정 끝 가게 사람. 없으면 마지막 사람
 * 같은 사람이 두 자리에 걸리면 그 자리의 다음 후보. 세 명이 안 되면 있는 만큼만.
 * 정방향은 1 → 2 → 3, 거꾸로 가는 여정은 3 → 2 → 1. timeline은 buildTimeline의 결과(어느 방향이든)
 */
export function keyPeople(timeline: TimelineItem[], journeyId?: string): KeyPerson[] {
  const reverse = isReverseJourney(journeyId)
  // 정방향 순서로 되돌려서 판단한다 (거꾸로 가는 여정은 칸 순서만 뒤집혀 있다)
  const stages = timeline.filter((t): t is Extract<TimelineItem, { type: 'stage' }> => t.type === 'stage')
  const body = stages.filter((t) => !t.closing)
  const closing = stages.filter((t) => t.closing)
  const forwardBody = reverse ? groupForward(body) : body
  const forwardClosing = reverse ? [...closing].reverse() : closing

  const firstMaterial = forwardBody[0]?.materialId
  const route = forwardBody.filter((t) => t.materialId === firstMaterial).map((t) => t.personId)
  if (!route.length) return []

  const hubs = route.filter((id) => HUBS.includes(id))
  // 시드는 방향 꼬리('-r')를 뺀 id: 같은 여정을 어느 방향으로 보든 같은 사람
  const seedId = (journeyId ?? '').replace(/-r(?=(-k)?(-first|-second)?$)/, '')
  const offset = hubs.length ? hash(`key-cross:${seedId}`) % hubs.length : 0
  const rotatedHubs = [...hubs.slice(offset), ...hubs.slice(0, offset)]
  const warehouseAt = route.indexOf('warehouse')
  const processor = warehouseAt > 0 ? route[warehouseAt - 1] : route[route.length - 1]
  const lastPerson = (forwardClosing.length ? forwardClosing : forwardBody).at(-1)?.personId

  const candidates: Record<KeySlot, Array<string | undefined>> = {
    start: route,
    cross: hubs.length ? rotatedHubs : [processor],
    // 가게 사람(맨 끝) → 사무실 사람 → 마지막 사람
    hand: [...[...forwardClosing].reverse().map((t) => t.personId), forwardBody.at(-1)?.personId, lastPerson],
  }
  const used = new Set<string>()
  const picked: KeyPerson[] = []
  for (const slot of ['start', 'cross', 'hand'] as KeySlot[]) {
    const personId = candidates[slot].find((id): id is string => !!id && !used.has(id))
    if (!personId) continue
    used.add(personId)
    picked.push({ slot, personId })
  }
  return reverse ? picked.reverse() : picked
}

/** 거꾸로 가는 여정의 재료별 칸(재료마다 내 손 → 원산지)을 재료 순서는 두고 칸만 정방향으로 */
function groupForward<T extends { materialId: string }>(items: T[]): T[] {
  const order: string[] = []
  const by = new Map<string, T[]>()
  for (const t of items) {
    if (!by.has(t.materialId)) {
      by.set(t.materialId, [])
      order.push(t.materialId)
    }
    by.get(t.materialId)!.push(t)
  }
  return order.flatMap((m) => [...by.get(m)!].reverse())
}

// ── 핵심 인물 여정의 화면 목록 ──

export type ScreenItem =
  /** 시작 화면: 세 사람의 그곳 시각 */
  | { type: 'intro' }
  /** 핵심 인물 한 사람. index는 화면에 보이는 순서(1부터), total은 핵심 인물 수 */
  | { type: 'key'; materialId: string; personId: string; slot: KeySlot; index: number; total: number }
  /** 그리고 이 사람들도요: 핵심 인물 사이에 있던 사람들 (이 여정에서 처음 나오는 사람만) */
  | { type: 'group'; personIds: string[] }
  | Extract<TimelineItem, { type: 'hidden' | 'quiz' }>

/**
 * 핵심 인물 여정의 화면 목록 (docs/key-people.md). 타임라인 순서(정방향·거꾸로)를 따라가며
 * 핵심 인물 칸 앞에 그 사이 사람들을 묶음 칸 하나로, 그 뒤에 퀴즈·숨은 만남을 둔다. 마지막 핵심 인물 뒤에 남은 사람·퀴즈도 같은 방식.
 * 여정 이벤트는 넣지 않는다. 카드는 칸마다 그 칸의 사람을 받는다(screenPeople): 타임라인의 모든 사람이 어느 칸엔가 들어간다
 */
export function journeyScreens(materialIds: string[], journeyId?: string, itemName?: string): ScreenItem[] {
  const timeline = buildTimeline(materialIds, journeyId, itemName)
  const keys = keyPeople(timeline, journeyId)
  const reverse = isReverseJourney(journeyId)
  const firstMaterial = timeline.find((t) => t.type === 'stage' && !t.closing)?.materialId

  // 핵심 인물이 서는 타임라인 칸
  const keyAt = new Map<number, KeyPerson>()
  for (const k of keys) {
    const spots = timeline.flatMap((t, i) => (t.type === 'stage' && t.personId === k.personId && !keyAt.has(i) ? [i] : []))
    const isClosing = (i: number) => timeline[i]?.type === 'stage' && !!(timeline[i] as { closing?: true }).closing
    let at: number | undefined
    if (k.slot === 'hand') at = spots.find(isClosing) ?? (reverse ? spots[0] : spots.at(-1))
    else at = spots.find((i) => timeline[i]!.materialId === firstMaterial && !isClosing(i)) ?? spots[0]
    if (at !== undefined) keyAt.set(at, k)
  }
  const keyIds = new Set(keys.map((k) => k.personId))

  const out: ScreenItem[] = [{ type: 'intro' }]
  const shown = new Set<string>()
  let people: string[] = []
  let extras: ScreenItem[] = []
  const flush = () => {
    const fresh = people.filter((id) => !keyIds.has(id) && !shown.has(id))
    const unique = [...new Set(fresh)]
    if (unique.length) {
      out.push({ type: 'group', personIds: unique })
      unique.forEach((id) => shown.add(id))
    }
    out.push(...extras)
    people = []
    extras = []
  }
  let index = 0
  timeline.forEach((t, i) => {
    const k = keyAt.get(i)
    if (k && t.type === 'stage') {
      flush()
      out.push({ type: 'key', materialId: t.materialId, personId: k.personId, slot: k.slot, index: ++index, total: keys.length })
      shown.add(k.personId)
      return
    }
    if (t.type === 'stage') people.push(t.personId)
    else if (t.type === 'pass') people.push(...t.personIds)
    else if (t.type === 'hidden' || t.type === 'quiz') extras.push(t)
    // 여정 이벤트(이야기 칩)는 핵심 인물 이야기로 대신한다
  })
  flush()
  return out
}

/** 그 칸에서 만나는(카드를 받는) 사람 */
export function screenPeople(item: ScreenItem | TimelineItem | undefined): string[] {
  if (!item) return []
  if (item.type === 'key' || item.type === 'hidden' || item.type === 'stage') return [item.personId]
  if (item.type === 'group' || item.type === 'pass') return item.personIds
  return []
}

/** 이 여정이 한 칸씩 가는 목록: 핵심 인물 여정은 화면 목록, 예전 여정은 타임라인 */
export function journeySteps(materialIds: string[], journeyId?: string, itemName?: string): Array<ScreenItem | TimelineItem> {
  return isKeyJourney(journeyId) ? journeyScreens(materialIds, journeyId, itemName) : buildTimeline(materialIds, journeyId, itemName)
}
