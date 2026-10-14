/**
 * 여정 타임라인. 출발지 변형·여정 이벤트·숨은 만남·퀴즈 변형을 데이터와 확률로만 정한다.
 * 무작위는 여정 id를 시드로 써서, 새로고침하거나 다른 기기에서 열어도 같은 여정이 나온다.
 * 새 여정 id는 '2026-10-14-1-k3x9'처럼 무작위 꼬리가 붙는다. 꼬리가 없는 예전 id(2026-10-14-1, 2026-10-14-1abcd)는
 * 기본 경로 그대로 둬서, 이 기능이 들어가기 전에 시작한 여정이 중간에 바뀌지 않게 한다.
 * 사용자의 첫 여정은 id 끝에 '-first'를 붙인다(FIRST_SUFFIX). 그 여정에서는 숨은 만남이 반드시 하나 나온다.
 * 숨은 만남이 나올 자리가 없는 경로면 퀴즈 보상을 대신 준다(firstJourneyGift).
 * 물건 이름을 넘기면 여정 맨 끝에 손에 닿기 직전의 가게·사무실 사람을 붙인다(shared/data/shops.ts). 끝에만 붙어서
 * 이미 진행 중인 여정의 앞부분은 바뀌지 않는다.
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
  | { type: 'stage'; materialId: string; personId: string }
  | { type: 'hidden'; materialId: string; personId: string }
  | { type: 'event'; materialId: string; eventId: string }
  | { type: 'quiz'; materialId: string; quizIndex: number }

const NEW_ID = /^\d{4}-\d{2}-\d{2}-\d+-[0-9a-z]+(-first)?$/
/** 사용자의 첫 여정 id 꼬리 */
export const FIRST_SUFFIX = '-first'

export function isFirstJourney(journeyId?: string): boolean {
  return !!journeyId && /^\d{4}-\d{2}-\d{2}-\d+-[0-9a-z]+-first$/.test(journeyId)
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

export function buildTimeline(materialIds: string[], journeyId?: string, itemName?: string): TimelineItem[] {
  const rand = journeyRandom(journeyId)
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
            items.push({ type: 'hidden', materialId, personId: rule.cardId })
            hidden++
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
          usedEvents.add(event.id)
          items.push({ type: 'event', materialId, eventId: event.id })
          events++
        }
      }
    })
    const quizzes = quizzesOf(m)
    if (quizzes.length) items.push({ type: 'quiz', materialId, quizIndex: rand ? Math.floor(rand() * quizzes.length) : 0 })
  })

  // 첫 여정: 확률에서 숨은 만남이 안 나왔으면, 나올 수 있는 자리 중 하나에 넣는다 (위의 난수 흐름은 그대로 둔다)
  if (rand && hidden === 0 && isFirstJourney(journeyId)) {
    const spots = items.flatMap((t, i) => {
      if (t.type !== 'stage') return []
      const rule = HIDDEN_RULES.find((r) => r.afterPersonIds.includes(t.personId) && (!r.materialIds || r.materialIds.includes(t.materialId)))
      return rule ? [{ i, materialId: t.materialId, cardId: rule.cardId }] : []
    })
    if (spots.length) {
      const spot = spots[hash(`first-hidden:${journeyId}`) % spots.length]!
      items.splice(spot.i + 1, 0, { type: 'hidden', materialId: spot.materialId, personId: spot.cardId })
    }
  }

  const known = materialIds.filter((id) => MATERIALS[id])
  const lastMaterial = known[known.length - 1]
  if (rand && itemName && journeyId && lastMaterial) {
    const imported = items.some((t) => t.type === 'stage' && isAbroad(t.personId))
    for (const personId of closingPeople(itemName, materialIds, journeyId, imported)) items.push({ type: 'stage', materialId: lastMaterial, personId })
  }
  return items
}

/** 이 여정에서 나오는 퀴즈 (재료당 하나) */
export function quizFor(materialIds: string[], journeyId: string | undefined, materialId: string): Quiz | undefined {
  const item = buildTimeline(materialIds, journeyId).find((t) => t.type === 'quiz' && t.materialId === materialId)
  const m = MATERIALS[materialId]
  return item?.type === 'quiz' && m ? quizzesOf(m)[item.quizIndex] : undefined
}

/** 여정에서 만나는 사람(단계 + 숨은 만남) */
export function timelinePeople(materialIds: string[], journeyId?: string, itemName?: string): Array<{ materialId: string; personId: string }> {
  return buildTimeline(materialIds, journeyId, itemName).flatMap((t) =>
    t.type === 'stage' || t.type === 'hidden' ? [{ materialId: t.materialId, personId: t.personId }] : [],
  )
}

/** 첫 여정인데 숨은 만남이 나올 자리가 없으면, 퀴즈를 틀려도 보상 카드를 준다 */
export function firstJourneyGift(materialIds: string[], journeyId: string): boolean {
  return isFirstJourney(journeyId) && !buildTimeline(materialIds, journeyId).some((t) => t.type === 'hidden')
}
