/**
 * 친해진 정도 (0~100%). 퍼센트는 저장하지 않고 사람별 기록(Save.people)에서 계산한다.
 *   만나기: 1곳(여정 하나)마다 25%, 최대 75%
 *   고마워요: 하루 5%, 최대 15% (서울 기준 날짜로 하루 한 번)
 *   퀴즈: 이 사람 퀴즈를 맞히면 10%
 * 희소도(발견하기 어려운 정도)와는 별개이고, 친해진 정도로 사람 순위를 매기지 않는다.
 *
 * 열리는 것: 25% 이름·하는 일 / 50% 일하는 사실 / 75% 퀴즈·만난 물건 목록 / 100% 마을의 일터 자리.
 * 사실과 퀴즈는 shared/data에 출처가 있는 것만 쓴다: 사실은 people.ts의 workFact, 퀴즈는 work-quizzes.ts.
 * 퀴즈는 그 사람이 한 재료의 여정에만 나올 때 그 재료의 일의 크기 퀴즈다. 여러 재료를 지나는 사람(선원·물류센터 등)은
 * 맞는 퀴즈를 고를 수 없어 퀴즈 단계를 건너뛴다(그래서 지금은 90%까지).
 */
import { LINK_RULES, MATERIAL_LIST } from './data/materials'
import { PEOPLE } from './data/people'
import { HIDDEN_RULES } from './data/journey-extras'
import { WORK_QUIZZES, type WorkQuiz } from './data/work-quizzes'
import type { DayLog, PersonLog, Save } from './progress'
import { forwardTimeline, quizzesOf } from './journey'
import type { FactSource } from './types'

export const FRIEND = { meetEach: 25, meetMax: 75, thankEach: 5, thankMax: 15, quiz: 10 } as const
/** 이 퍼센트가 되면 열린다 */
export const UNLOCK = { name: 25, fact: 50, quiz: 75, items: 75, workplace: 100 } as const
/** 기록 목록 길이 상한. 퍼센트에는 앞의 몇 개만 쓰여서 오래 해도 저장 크기가 커지지 않게 자른다(이른 것부터 남긴다) */
export const LOG_CAP = 8

export interface Friendship {
  percent: number
  /** 만나기로 채운 % */
  meet: number
  /** 고마워요로 채운 % */
  thanks: number
  /** 퀴즈로 채운 % */
  quiz: number
  meetCount: number
  thankDays: number
}

export function friendshipOf(log?: PersonLog): Friendship {
  const meetCount = log?.metItems.length ?? 0
  const thankDays = log?.gratitudeDays.length ?? 0
  const meet = Math.min(FRIEND.meetMax, meetCount * FRIEND.meetEach)
  const thanks = Math.min(FRIEND.thankMax, thankDays * FRIEND.thankEach)
  const quiz = log?.quizCorrect ? FRIEND.quiz : 0
  return { percent: Math.min(100, meet + thanks + quiz), meet, thanks, quiz, meetCount, thankDays }
}

/** "물건 2곳에서 만나기 50% · 고마워요 2일 10% · 퀴즈 10%" (채운 것만) */
export function friendshipParts(f: Friendship): string[] {
  return [
    f.meet ? `물건 ${f.meetCount}곳에서 만나기 ${f.meet}%` : '',
    f.thanks ? `고마워요 ${f.thankDays}일 ${f.thanks}%` : '',
    f.quiz ? `퀴즈 ${f.quiz}%` : '',
  ].filter(Boolean)
}

// ── 사람마다 출처 있는 사실·퀴즈 ──

/** 이 사람이 나오는 재료들: 여정(기본 경로·출발지 변형), 퀴즈 보상, 숨은 만남 규칙, 연결 카드의 원래 사람 */
export function materialsOfPerson(personId: string): string[] {
  const link = LINK_RULES.find((r) => r.cardId === personId)
  if (link) return materialsOfPerson(link.personId)
  const out = new Set<string>()
  for (const m of MATERIAL_LIST) {
    const routes = [m.stages, ...(m.origins ?? []).map((o) => o.head)]
    if (routes.some((r) => r.includes(personId)) || quizzesOf(m).some((q) => q.rewardId === personId)) out.add(m.id)
  }
  for (const rule of HIDDEN_RULES.filter((r) => r.cardId === personId)) {
    const ids = rule.materialIds ?? MATERIAL_LIST.filter((m) => rule.afterPersonIds.some((a) => m.stages.includes(a))).map((m) => m.id)
    for (const id of ids) out.add(id)
  }
  return [...out]
}

/** 50%에 열리는 일하는 사실 (출처 있는 것만) */
export function factOf(personId: string): { fact: string; source: FactSource } | undefined {
  const p = PEOPLE[personId]
  return p?.workFact && p.workFactSource ? { fact: p.workFact, source: p.workFactSource } : undefined
}

/** 75%에 열리는 이 사람의 퀴즈: 한 재료에만 나오는 사람의 그 재료 일의 크기 퀴즈 */
export function quizOf(personId: string): (WorkQuiz & { materialId: string }) | undefined {
  const mats = materialsOfPerson(personId)
  if (mats.length !== 1) return undefined
  const q = WORK_QUIZZES[mats[0]!]
  return q ? { ...q, materialId: mats[0]! } : undefined
}

/** 다음으로 열릴 것 안내 (잠긴 단계). 다 열렸으면 '' */
export function nextUnlockHint(personId: string, percent: number): string {
  const hasFact = !!factOf(personId)
  const hasQuiz = !!quizOf(personId)
  if (percent < UNLOCK.fact && hasFact) return '50%가 되면 이 분이 하는 일의 크기가 열려요'
  if (percent < UNLOCK.quiz) return hasQuiz ? '75%가 되면 퀴즈와 이 분을 만난 물건 목록이 열려요' : '75%가 되면 이 분을 만난 물건 목록이 열려요'
  if (percent < UNLOCK.workplace) return '100%가 되면 마을에 이 분의 일터가 생겨요'
  return ''
}

// ── 기록 쌓기 (순수 함수: 새 기록을 돌려준다) ──

const capSorted = (list: string[]) => [...new Set(list)].sort().slice(0, LOG_CAP)

export function emptyLog(): PersonLog {
  return { metItems: [], gratitudeDays: [] }
}

/** 이 여정에서 만났다. 같은 여정은 한 번만 */
export function addMeeting(log: PersonLog | undefined, journeyId: string, itemName: string): PersonLog {
  const base = log ?? emptyLog()
  if (base.metItems.includes(journeyId)) return base
  return {
    ...base,
    metItems: capSorted([...base.metItems, journeyId]),
    metNames: itemName ? [...new Set([...(base.metNames ?? []), itemName])].slice(0, LOG_CAP) : base.metNames,
  }
}

/** 고마워요 (서울 날짜). 하루 한 번만 */
export function addGratitude(log: PersonLog | undefined, seoulDate: string): PersonLog {
  const base = log ?? emptyLog()
  if (base.gratitudeDays.includes(seoulDate)) return base
  return { ...base, gratitudeDays: capSorted([...base.gratitudeDays, seoulDate]) }
}

/** 기기 사이 병합: 목록은 합집합, quizCorrect는 OR */
export function mergePersonLog(a: PersonLog | undefined, b: PersonLog | undefined): PersonLog {
  if (!a) return b!
  if (!b) return a
  const names = [...new Set([...(a.metNames ?? []), ...(b.metNames ?? [])])].slice(0, LOG_CAP)
  return {
    metItems: capSorted([...a.metItems, ...b.metItems]),
    gratitudeDays: capSorted([...a.gratitudeDays, ...b.gratitudeDays]),
    ...(a.quizCorrect || b.quizCorrect ? { quizCorrect: true as const } : {}),
    ...(names.length ? { metNames: names } : {}),
  }
}

/** 예전 기록에서 만난 곳을 알 수 없는 카드의 자리표시 (만남 1곳으로 센다) */
export const legacyMeeting = (personId: string) => `legacy:${personId}`

/**
 * 이 기능 전의 기록을 사람별 기록으로 옮긴다.
 *  - 남아 있는 날짜별 여정(30일)에서 펼친 칸까지 만난 사람 → 그 여정 id, 물건 이름
 *  - 그래도 기록이 없는 가진 카드 → 만남 1곳(legacy). 만난 뒤 25%가 되도록
 *  - 예전 고마워요(thanks: 처음 전한 날) → 고마워요 1일
 * 이미 있는 기록은 그대로 두고 빠진 것만 채운다.
 */
export function migratePeople(save: Pick<Save, 'cards' | 'days' | 'thanks'> & { people?: Record<string, PersonLog> }): Record<string, PersonLog> {
  const people: Record<string, PersonLog> = { ...(save.people ?? {}) }
  const fresh = new Set(Object.keys(PEOPLE).filter((id) => !people[id]))
  const add = (id: string, f: (log: PersonLog | undefined) => PersonLog) => {
    if (fresh.has(id) && save.cards[id]) people[id] = f(people[id])
  }
  for (const day of Object.values(save.days ?? {}) as DayLog[]) {
    for (const j of day.journeys) {
      const timeline = forwardTimeline(j.materialIds, j.id, j.name)
      // 거꾸로 가는 여정도 같은 사람들이다. 끝낸 여정은 전부, 진행 중이면 얻은 카드(newCards)까지만 확실하다
      const met = j.done ? timeline.flatMap((t) => (t.type === 'stage' || t.type === 'hidden' ? [t.personId] : [])) : j.newCards
      for (const id of new Set([...met, ...j.newCards])) add(id, (log) => addMeeting(log, j.id, j.name))
    }
  }
  for (const id of fresh) {
    if (!save.cards[id]) continue
    if (!people[id]) people[id] = { metItems: [legacyMeeting(id)], gratitudeDays: [] }
    const thanked = save.thanks?.[id]
    if (thanked) people[id] = addGratitude(people[id], thanked)
  }
  return people
}
