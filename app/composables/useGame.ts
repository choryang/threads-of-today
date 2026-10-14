import { computed, effectScope, reactive, ref, watch } from 'vue'
import { SETS } from '../../shared/data/materials'
import { PEOPLE } from '../../shared/data/people'
import {
  DAILY_LIMIT, completedSets, dateKey, findLinkCards, mysteryHints, mysteryProduct, previousDateKey,
  type Decomposed,
} from '../../shared/logic'
import { normalizeNickname, randomNickname } from '../../shared/nickname'
import { buildTimeline, quizFor } from '../../shared/journey'
import { everyoneThanked, newScenes, thanksReply, type ThanksScene } from '../../shared/thanks'
import { emptySave, type DayLog, type Journey, type JourneySource, type MysteryLog, type Save } from '../../shared/progress'

export type { DayLog, Journey, JourneySource, MysteryLog, Save } from '../../shared/progress'

export type { TimelineItem } from '../../shared/journey'

const KEY = 'my-day-people:v1'

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
  const loaded = load()
  // 첫 방문에는 기본 닉네임을 준다. updatedAt 0이라 다른 기기에서 직접 정한 닉네임이 있으면 그쪽이 이긴다
  if (!loaded.nickname) loaded.nickname = { value: randomNickname(), updatedAt: 0 }
  state = reactive(loaded) as Save
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

/** 서버와 합친 진행 상황으로 바꾼다. 반응형 객체는 그대로 두고 내용만 바꿔 화면이 따라 바뀌게 한다 */
export function replaceSave(next: Save) {
  const s = getState()
  s.cards = next.cards
  s.days = next.days
  s.streak = next.streak
  s.mystery = next.mystery
  s.items = next.items
  s.thanks = next.thanks ?? {}
  if (next.nickname) s.nickname = next.nickname
}

/** 지금 진행 상황의 복사본 (서버로 보낼 때) */
export function snapshotSave(): Save {
  return JSON.parse(JSON.stringify(getState()))
}

const finishListeners = new Set<() => void>()
/** 여정을 마칠 때 불린다 (동기화용) */
export function onJourneyFinish(listener: () => void) {
  finishListeners.add(listener)
  return () => finishListeners.delete(listener)
}

export { buildTimeline }

/** 보여 줄 감사 장면(세트 감사·엔딩). 화면 어디서 고마움을 전해도 app.vue의 ThanksScene이 띄운다 */
const sceneQueue = ref<ThanksScene[]>([])

export function useThanksScenes() {
  return {
    current: computed(() => sceneQueue.value[0]),
    dismiss: () => sceneQueue.value.shift(),
  }
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

  const itemCount = computed(() => Object.keys(s.items).length)
  function knowsItem(name: string) {
    return !!s.items[name]
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
      // 여러 기기의 기록을 합칠 때 겹치지 않게 무작위 꼬리를 붙인다 (앞 10글자는 날짜, '-꼬리'가 있으면 새 여정 규칙을 쓴다)
      id: `${todayKey}-${day.journeys.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
      name: item.name,
      twist: item.twist,
      voice: item.voice,
      source,
      materialIds: item.materialIds,
      step: 0,
      quiz: {},
      newCards: [],
      done: false,
    }
    day.journeys.push(journey)
    if (!s.items[item.name]) s.items[item.name] = todayKey
    const saved = day.journeys[day.journeys.length - 1]!
    // 첫 번째 사람은 여정을 시작하자마자 만난다
    const first = buildTimeline(saved.materialIds, saved.id, saved.name)[0]
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
    const timeline = buildTimeline(journey.materialIds, journey.id, journey.name)
    const item = timeline[journey.step]
    if (!item) return []
    if (item.type === 'quiz' && journey.quiz[item.materialId] === undefined) return []
    journey.step++
    const next = timeline[journey.step]
    if (next?.type === 'stage' || next?.type === 'hidden') {
      const gained = collect(next.personId)
      journey.newCards.push(...gained)
      return gained
    }
    return []
  }

  function answerQuiz(journey: Journey, materialId: string, choice: number): { correct: boolean; gained: string[] } {
    const quiz = quizFor(journey.materialIds, journey.id, materialId)
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
    const gained: string[] = []
    for (const cardId of findLinkCards(day.journeys.filter((j) => j.done))) {
      if (!day.linkCards.includes(cardId)) day.linkCards.push(cardId)
      gained.push(...collect(cardId))
    }
    journey.newCards.push(...gained)

    if (s.streak.last !== todayKey) {
      s.streak.count = s.streak.last === previousDateKey(todayKey) ? s.streak.count + 1 : 1
      s.streak.last = todayKey
    }
    for (const listener of finishListeners) listener()
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

  // ── 고마워요 ──
  const thanked = (cardId: string) => !!s.thanks[cardId]
  const allThanked = computed(() => everyoneThanked(new Set(Object.keys(s.thanks))))

  /** 만난 사람에게 고마움을 전한다. 이미 전했거나 아직 못 만났으면 아무것도 하지 않는다. 답을 돌려준다 */
  function thank(cardId: string): string | null {
    if (!s.cards[cardId] || s.thanks[cardId]) return null
    const before = new Set(Object.keys(s.thanks))
    s.thanks[cardId] = todayKey
    sceneQueue.value.push(...newScenes(before, new Set(Object.keys(s.thanks))))
    return thanksReply(cardId)
  }

  /** 도감에서 엔딩을 다시 본다 */
  function replayEnding() {
    if (allThanked.value) sceneQueue.value.push({ type: 'ending' })
  }

  const nickname = computed(() => s.nickname?.value ?? '')
  /** 닉네임을 바꾼다. 1~12자가 아니면 false */
  function setNickname(input: string): boolean {
    const value = normalizeNickname(input)
    if (!value) return false
    s.nickname = { value, updatedAt: Date.now() }
    return true
  }

  return {
    state: s,
    nickname,
    setNickname,
    todayKey,
    today,
    remaining,
    regularCount,
    ownedCount,
    itemCount,
    knowsItem,
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
    thanked,
    thank,
    allThanked,
    replayEnding,
  }
}
