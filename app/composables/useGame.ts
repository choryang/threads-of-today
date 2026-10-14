import { computed, effectScope, reactive, watch } from 'vue'
import { MATERIALS, SETS } from '../../shared/data/materials'
import { PEOPLE } from '../../shared/data/people'
import {
  DAILY_LIMIT, completedSets, dateKey, findLinkCards, mysteryHints, mysteryProduct, previousDateKey,
  type Decomposed,
} from '../../shared/logic'

export type JourneySource = 'text' | 'photo' | 'pick' | 'mystery'

export type TimelineItem =
  | { type: 'stage'; materialId: string; personId: string }
  | { type: 'quiz'; materialId: string }

export interface Journey {
  id: string
  name: string
  source: JourneySource
  materialIds: string[]
  /** 지금까지 펼친 타임라인 칸 수 */
  step: number
  /** 재료 id → 고른 보기 번호 */
  quiz: Record<string, number>
  newCards: string[]
  done: boolean
}

export interface DayLog {
  journeys: Journey[]
  linkCards: string[]
}

export interface MysteryLog {
  revealed: number
  guesses: string[]
  solved: boolean
  finished: boolean
}

interface Save {
  v: 1
  cards: Record<string, string>
  days: Record<string, DayLog>
  streak: { last: string; count: number }
  mystery: Record<string, MysteryLog>
}

const KEY = 'my-day-people:v1'

function emptySave(): Save {
  return { v: 1, cards: {}, days: {}, streak: { last: '', count: 0 }, mystery: {} }
}

function load(): Save {
  if (typeof window === 'undefined') return emptySave()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptySave()
    const parsed = JSON.parse(raw)
    return parsed?.v === 1 ? { ...emptySave(), ...parsed } : emptySave()
  } catch {
    return emptySave()
  }
}

let state: Save | null = null

function getState(): Save {
  if (state) return state
  state = reactive(load()) as Save
  // 페이지가 바뀌어도 저장이 멈추지 않도록 컴포넌트와 분리된 범위에서 감시한다
  effectScope(true).run(() => {
    watch(
      () => state,
      (value) => {
        try {
          window.localStorage.setItem(KEY, JSON.stringify(value))
        } catch {
          // 저장 공간이 막힌 환경(시크릿 모드 등)에서는 이번 방문 동안만 유지
        }
      },
      { deep: true },
    )
  })
  return state
}

export function buildTimeline(materialIds: string[]): TimelineItem[] {
  const items: TimelineItem[] = []
  for (const materialId of materialIds) {
    const m = MATERIALS[materialId]
    if (!m) continue
    for (const personId of m.stages) items.push({ type: 'stage', materialId, personId })
    if (m.quiz) items.push({ type: 'quiz', materialId })
  }
  return items
}

export function useGame() {
  const s = getState()
  const todayKey = dateKey()

  const today = computed<DayLog>(() => s.days[todayKey] ?? { journeys: [], linkCards: [] })
  const regularCount = computed(() => today.value.journeys.filter((j) => j.source !== 'mystery').length)
  const remaining = computed(() => Math.max(0, DAILY_LIMIT - regularCount.value))
  const ownedCount = computed(() => Object.keys(s.cards).length)
  const streak = computed(() => {
    if (s.streak.last === todayKey || s.streak.last === previousDateKey(todayKey)) return s.streak.count
    return 0
  })

  function ensureToday(): DayLog {
    if (!s.days[todayKey]) s.days[todayKey] = { journeys: [], linkCards: [] }
    return s.days[todayKey]!
  }

  function owns(cardId: string) {
    return !!s.cards[cardId]
  }

  /** 카드를 얻는다. 세트가 완성되면 보상 카드도 함께. 새로 얻은 id 목록을 돌려준다. */
  function collect(cardId: string): string[] {
    if (!PEOPLE[cardId] || s.cards[cardId]) return []
    s.cards[cardId] = todayKey
    const gained = [cardId]
    const owned = new Set(Object.keys(s.cards))
    for (const set of completedSets(owned)) {
      if (!s.cards[set.rewardId]) {
        s.cards[set.rewardId] = todayKey
        gained.push(set.rewardId)
      }
    }
    return gained
  }

  function startJourney(item: Decomposed, source: JourneySource): Journey | null {
    const day = ensureToday()
    if (source !== 'mystery' && regularCount.value >= DAILY_LIMIT) return null
    const journey: Journey = {
      id: `${todayKey}-${day.journeys.length + 1}`,
      name: item.name,
      source,
      materialIds: item.materialIds,
      step: 0,
      quiz: {},
      newCards: [],
      done: false,
    }
    day.journeys.push(journey)
    const saved = day.journeys[day.journeys.length - 1]!
    // 첫 번째 사람은 여정을 시작하자마자 만난다
    const first = buildTimeline(item.materialIds)[0]
    if (first?.type === 'stage') saved.newCards.push(...collect(first.personId))
    return saved
  }

  function findJourney(id: string): Journey | undefined {
    for (const day of Object.values(s.days)) {
      const found = day.journeys.find((j) => j.id === id)
      if (found) return found
    }
    return undefined
  }

  /** 타임라인 다음 칸을 펼친다. 사람 칸이면 카드를 얻는다. */
  function revealNext(journey: Journey): string[] {
    const timeline = buildTimeline(journey.materialIds)
    const item = timeline[journey.step]
    if (!item) return []
    if (item.type === 'quiz' && journey.quiz[item.materialId] === undefined) return []
    journey.step++
    const next = timeline[journey.step]
    if (next?.type === 'stage') {
      const gained = collect(next.personId)
      journey.newCards.push(...gained)
      return gained
    }
    return []
  }

  function answerQuiz(journey: Journey, materialId: string, choice: number): { correct: boolean; gained: string[] } {
    const quiz = MATERIALS[materialId]?.quiz
    if (!quiz || journey.quiz[materialId] !== undefined) return { correct: false, gained: [] }
    journey.quiz[materialId] = choice
    const correct = choice === quiz.answer
    const gained = correct ? collect(quiz.rewardId) : []
    journey.newCards.push(...gained)
    return { correct, gained }
  }

  /** 여정을 마치고, 오늘 지나온 모든 재료 사이의 연결 카드를 확인한다. */
  function finishJourney(journey: Journey): string[] {
    if (journey.done) return []
    journey.done = true
    // 자정을 넘겨 끝낸 여정도 그 여정이 시작된 날 기준으로 연결을 찾는다
    const dayKey = journey.id.slice(0, 10)
    const day = s.days[dayKey] ?? ensureToday()
    const allMaterials = day.journeys.filter((j) => j.done).flatMap((j) => j.materialIds)
    const gained: string[] = []
    for (const cardId of findLinkCards(allMaterials)) {
      if (!day.linkCards.includes(cardId)) day.linkCards.push(cardId)
      gained.push(...collect(cardId))
    }
    journey.newCards.push(...gained)

    if (s.streak.last !== todayKey) {
      s.streak.count = s.streak.last === previousDateKey(todayKey) ? s.streak.count + 1 : 1
      s.streak.last = todayKey
    }
    return gained
  }

  // ── 오늘의 미스터리 ──
  const mysteryAnswer = mysteryProduct(todayKey)
  const mysteryHintList = mysteryHints(mysteryAnswer)
  const mystery = computed<MysteryLog>(() => s.mystery[todayKey] ?? { revealed: 1, guesses: [], solved: false, finished: false })

  function guessMystery(productId: string) {
    if (!s.mystery[todayKey]) s.mystery[todayKey] = { revealed: 1, guesses: [], solved: false, finished: false }
    const log = s.mystery[todayKey]!
    if (log.finished || log.guesses.includes(productId)) return
    log.guesses.push(productId)
    if (productId === mysteryAnswer.id) {
      log.solved = true
      log.finished = true
    } else if (log.revealed >= mysteryHintList.length) {
      log.finished = true
    } else {
      log.revealed++
    }
  }

  const mysteryJourney = computed(() => today.value.journeys.find((j) => j.source === 'mystery'))

  function setProgress() {
    return SETS.map((set) => ({
      set,
      owned: set.memberIds.filter((id) => s.cards[id]).length,
      complete: !!s.cards[set.rewardId],
    }))
  }

  return {
    state: s,
    todayKey,
    today,
    remaining,
    regularCount,
    ownedCount,
    streak,
    owns,
    startJourney,
    findJourney,
    revealNext,
    answerQuiz,
    finishJourney,
    mysteryAnswer,
    mysteryHintList,
    mystery,
    mysteryJourney,
    guessMystery,
    setProgress,
  }
}
