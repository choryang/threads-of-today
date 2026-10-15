/**
 * 기능을 여는 순서 (docs/screen-cleanup.md "기능을 여는 순서" 표 그대로). 화면은 이 표만 보고 보여 줄지 정한다.
 *
 * - 조건은 마친 여정 수와 첫 단짝(친해진 정도 100%) 둘뿐이고, 모두 순수 함수로 판정한다.
 * - 열림은 하루(서울 날짜)에 하나씩만: 조건을 넘은 단계가 여러 개면 오늘은 표에서 가장 앞 단계 하나만 열고,
 *   나머지는 다음 날부터 하루에 하나씩 연다. 연 날짜는 Save.unlockedOn에 적는다(동기화하면 이른 날짜).
 * - 새로 열린 단계는 마을 위에 알림을 한 번만 띄운다. 본 알림은 Save.unlockSeen(동기화 합집합)에 단계 id로 적는다.
 * - 링크로 들어온 화면(/d, /p, /v)은 조건과 상관없이 보여 준다. 열림 조건은 내가 보내는 쪽에만 걸린다.
 * - 이 표가 들어오기 전부터 하던 사용자는 이미 넘은 단계를 알림 없이 한꺼번에 조용히 연다(silentUnlocks).
 * 여정 수 기준은 써 보면서 조정한다.
 */
import { PEOPLE_LIST } from './data/people'
import { friendshipOf } from './friendship'
import type { PersonLog } from './progress'

export type FeatureId =
  // 첫날
  | 'test' | 'journey' | 'village' | 'thanks' | 'incoming'
  // 두 번째 여정: 여정 속 퀴즈·경유지 맞히기·이야기·같은 길 (여정마다 id로 정한다: shared/journey.ts)
  | 'journey-extras'
  // 여정 3번: 친해진 정도 %, 도감 탭, 등급 배지, 일하는 사실
  | 'friendship' | 'dex' | 'rarity-badge' | 'work-fact'
  // 여정 5번: 내 마을 초대, 꽃, 다른 사람들의 고마움, 모두의 오늘
  | 'invite' | 'flowers' | 'others-thanks' | 'today-count'
  // 여정 7번
  | 'mystery'
  // 여정 10번
  | 'records' | 'sets'
  // 첫 단짝
  | 'intro' | 'workplace'

export type UnlockStepId = 'day1' | 'second-journey' | 'journeys-3' | 'journeys-5' | 'journeys-7' | 'journeys-10' | 'first-best'

export interface UnlockCondition {
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
  // 두 번째 여정부터 여정 속 퀴즈가 나온다(여정 id로). 알림은 두 번째 여정을 마친 뒤 마을에서
  { id: 'second-journey', when: { journeys: 2 }, features: ['journey-extras'], notice: '이제 여정 중에 퀴즈가 나와요' },
  { id: 'journeys-3', when: { journeys: 3 }, features: ['friendship', 'dex', 'rarity-badge', 'work-fact'], notice: '주민과 친해질 수 있어요' },
  { id: 'journeys-5', when: { journeys: 5 }, features: ['invite', 'flowers', 'others-thanks', 'today-count'], notice: '친구를 마을에 부를 수 있어요' },
  { id: 'journeys-7', when: { journeys: 7 }, features: ['mystery'], notice: '매일 새 미스터리 물건이 열려요' },
  { id: 'journeys-10', when: { journeys: 10 }, features: ['records', 'sets'], notice: '내 하루가 실로 이어졌어요' },
  { id: 'first-best', when: { bestFriend: true }, features: ['intro', 'workplace'], notice: '단짝을 친구에게 소개할 수 있어요' },
]

export const UNLOCK_STEP_IDS = UNLOCK_STEPS.map((s) => s.id)

export interface UnlockStats {
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

/** 단계 id → 연 날짜(서울) */
export type UnlockedOn = Partial<Record<string, string>>

const villager = new Set(PEOPLE_LIST.filter((p) => p.kind !== 'link').map((p) => p.id))

/**
 * 진행 상황에서 조건에 쓰는 숫자. 여정 기록(days)은 30일만 남아서, 마친 여정 수는 처음 떠나 본 물건 수 - 1과 비교해 큰 쪽으로 본다
 * (물건 하나에 여정 하나, 마지막 하나는 아직 가는 중일 수 있다).
 */
export function unlockStats(save: UnlockSource): UnlockStats {
  const done = Object.values(save.days).reduce((n, d) => n + d.journeys.filter((j) => j.done).length, 0)
  const journeys = Math.max(done, Object.keys(save.items).length - 1)
  const bestFriend = Object.entries(save.people ?? {}).some(([id, log]) => villager.has(id) && !!save.cards[id] && friendshipOf(log).percent >= 100)
  return { journeys, bestFriend }
}

export function conditionMet(when: UnlockCondition, s: UnlockStats): boolean {
  return (when.journeys === undefined || s.journeys >= when.journeys) && (!when.bestFriend || s.bestFriend)
}

/**
 * 오늘 새로 열 단계 하나 (없으면 null). 오늘 이미 하나를 열었으면 null이고, 아니면 조건을 넘었는데 아직 안 연 단계 중
 * 표에서 가장 앞 단계. 첫날 단계는 늘 열려 있어 세지 않는다
 */
export function nextUnlock(s: UnlockStats, unlockedOn: UnlockedOn, today: string): UnlockStepId | null {
  if (Object.values(unlockedOn).includes(today)) return null
  return UNLOCK_STEPS.find((step) => step.id !== 'day1' && !unlockedOn[step.id] && conditionMet(step.when, s))?.id ?? null
}

/** 지금 열린 단계 id (표 순서): 첫날 + 연 날짜가 적힌 단계 + 오늘 새로 열 단계 */
export function openSteps(s: UnlockStats, unlockedOn: UnlockedOn, today: string): UnlockStepId[] {
  const next = nextUnlock(s, unlockedOn, today)
  return UNLOCK_STEPS.filter((step) => step.id === 'day1' || !!unlockedOn[step.id] || step.id === next).map((step) => step.id)
}

/** 이 기능이 열렸는지. 링크로 들어온 화면은 이 함수를 거치지 않는다 */
export function isOpen(feature: FeatureId, open: readonly UnlockStepId[]): boolean {
  const step = UNLOCK_STEPS.find((x) => x.features.includes(feature))
  return !!step && open.includes(step.id)
}

/** 열렸는데 아직 알림을 보지 않은 단계 (표 순서) */
export function pendingNotices(open: readonly UnlockStepId[], seen: readonly string[]): UnlockStep[] {
  return UNLOCK_STEPS.filter((step) => step.notice && open.includes(step.id) && !seen.includes(step.id))
}

/**
 * 본 알림 기록이 없는 진행 상황(이 표 이전부터 하던 사용자, 또는 예전 기기에서 받은 기록)을 처음 열 때:
 * 이미 시작한 사용자는 넘은 단계를 하루 하나 규칙 없이 오늘 한꺼번에, 알림 없이 연다. 아무것도 안 한 새 사용자는 빈 기록.
 */
export function silentUnlocks(save: UnlockSource, today: string): { unlockSeen: UnlockStepId[]; unlockedOn: Record<string, string> } {
  if (!Object.keys(save.cards).length) return { unlockSeen: [], unlockedOn: {} }
  const s = unlockStats(save)
  const met = UNLOCK_STEPS.filter((step) => conditionMet(step.when, s)).map((step) => step.id)
  return { unlockSeen: met, unlockedOn: Object.fromEntries(met.filter((id) => id !== 'day1').map((id) => [id, today])) }
}
