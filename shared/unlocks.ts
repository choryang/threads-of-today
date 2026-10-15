/**
 * 기능을 여는 순서 (docs/screen-cleanup.md "기능을 여는 순서" 표 그대로). 화면은 이 표만 보고 보여 줄지 정한다.
 *
 * - 조건은 마을 주민 수·마친 여정 수·첫 단짝(친해진 정도 100%) 셋뿐이고, 모두 순수 함수로 판정한다.
 * - 새로 열린 단계는 마을 위에 알림을 한 번만 띄운다. 본 알림은 Save.unlockSeen(동기화 합집합)에 단계 id로 적는다.
 * - 링크로 들어온 화면(/d, /p, /v)은 조건과 상관없이 보여 준다. 열림 조건은 내가 보내는 쪽에만 걸린다.
 * - 이 표가 들어오기 전부터 하던 사용자는 이미 넘은 단계를 알림 없이 조용히 연다(silentSeen).
 * 주민 수 기준은 써 보면서 조정한다.
 */
import { PEOPLE_LIST } from './data/people'
import { friendshipOf } from './friendship'
import type { PersonLog } from './progress'

export type FeatureId =
  // 첫날
  | 'test' | 'journey' | 'village' | 'thanks' | 'incoming'
  // 두 번째 여정: 여정 속 퀴즈·경유지 맞히기·이야기·같은 길 (여정마다 id로 정한다: shared/journey.ts)
  | 'journey-extras'
  // 주민 5명
  | 'friendship' | 'dex'
  // 주민 10명 ('others-thanks': 사람 카드의 다른 사람들의 고마움. 표의 '모두의 오늘 숫자'와 같이 연다)
  | 'invite' | 'flowers' | 'today-count' | 'others-thanks'
  // 주민 15명
  | 'mystery'
  // 주민 20명
  | 'records' | 'sets'
  // 첫 단짝
  | 'intro' | 'workplace'

export type UnlockStepId = 'day1' | 'second-journey' | 'residents-5' | 'residents-10' | 'residents-15' | 'residents-20' | 'first-best'

export interface UnlockCondition {
  /** 마을 주민 수 이상 */
  residents?: number
  /** 마친 여정 수 이상 */
  journeys?: number
  /** 단짝(친해진 정도 100%)이 한 명이라도 */
  bestFriend?: true
}

export interface UnlockStep {
  id: UnlockStepId
  when: UnlockCondition
  features: FeatureId[]
  /** 새로 열릴 때 마을 위에 한 번 띄우는 알림. 첫날은 없다 */
  notice?: string
}

export const UNLOCK_STEPS: UnlockStep[] = [
  { id: 'day1', when: {}, features: ['test', 'journey', 'village', 'thanks', 'incoming'] },
  { id: 'second-journey', when: { journeys: 1 }, features: ['journey-extras'], notice: '이제 여정 중에 퀴즈가 나와요' },
  { id: 'residents-5', when: { residents: 5 }, features: ['friendship', 'dex'], notice: '주민과 친해질 수 있어요' },
  { id: 'residents-10', when: { residents: 10 }, features: ['invite', 'flowers', 'today-count', 'others-thanks'], notice: '친구를 마을에 부를 수 있어요' },
  { id: 'residents-15', when: { residents: 15 }, features: ['mystery'], notice: '매일 새 미스터리 물건이 열려요' },
  { id: 'residents-20', when: { residents: 20 }, features: ['records', 'sets'], notice: '내 하루가 실로 이어졌어요' },
  { id: 'first-best', when: { bestFriend: true }, features: ['intro', 'workplace'], notice: '단짝을 친구에게 소개할 수 있어요' },
]

export const UNLOCK_STEP_IDS = UNLOCK_STEPS.map((s) => s.id)

export interface UnlockStats {
  residents: number
  journeys: number
  bestFriend: boolean
}

/** 판정에 쓰는 진행 상황 (Save의 일부) */
export interface UnlockSource {
  cards: Record<string, string>
  days: Record<string, { journeys: Array<{ done: boolean }> }>
  items: Record<string, string>
  people?: Record<string, PersonLog>
}

const villager = new Set(PEOPLE_LIST.filter((p) => p.kind !== 'link').map((p) => p.id))

/**
 * 진행 상황에서 조건에 쓰는 숫자. 여정 기록(days)은 30일만 남아서, 마친 여정 수는 처음 떠나 본 물건 수 - 1과 비교해 큰 쪽으로 본다
 * (물건 하나에 여정 하나, 마지막 하나는 아직 가는 중일 수 있다).
 */
export function unlockStats(save: UnlockSource): UnlockStats {
  const residents = Object.keys(save.cards).filter((id) => villager.has(id)).length
  const done = Object.values(save.days).reduce((n, d) => n + d.journeys.filter((j) => j.done).length, 0)
  const journeys = Math.max(done, Object.keys(save.items).length - 1)
  const bestFriend = Object.entries(save.people ?? {}).some(([id, log]) => villager.has(id) && !!save.cards[id] && friendshipOf(log).percent >= 100)
  return { residents, journeys, bestFriend }
}

export function conditionMet(when: UnlockCondition, s: UnlockStats): boolean {
  return (when.residents === undefined || s.residents >= when.residents)
    && (when.journeys === undefined || s.journeys >= when.journeys)
    && (!when.bestFriend || s.bestFriend)
}

/** 지금 열린 단계 id (표 순서) */
export function openSteps(s: UnlockStats): UnlockStepId[] {
  return UNLOCK_STEPS.filter((step) => conditionMet(step.when, s)).map((step) => step.id)
}

/** 이 기능이 열렸는지. 링크로 들어온 화면은 이 함수를 거치지 않는다 */
export function isOpen(feature: FeatureId, s: UnlockStats): boolean {
  const step = UNLOCK_STEPS.find((x) => x.features.includes(feature))
  return !!step && conditionMet(step.when, s)
}

/** 새로 열렸는데 아직 알림을 보지 않은 단계 (표 순서). 하나씩 차례로 띄운다 */
export function pendingNotices(s: UnlockStats, seen: readonly string[]): UnlockStep[] {
  return UNLOCK_STEPS.filter((step) => step.notice && conditionMet(step.when, s) && !seen.includes(step.id))
}

/**
 * 본 알림 기록이 없는 진행 상황(이 표 이전부터 하던 사용자, 또는 예전 기기에서 받은 기록)을 처음 열 때:
 * 이미 시작한 사용자는 넘은 단계를 모두 본 것으로(알림 없이 조용히), 아무것도 안 한 새 사용자는 빈 목록.
 */
export function silentSeen(save: UnlockSource): UnlockStepId[] {
  if (!Object.keys(save.cards).length) return []
  return openSteps(unlockStats(save))
}
