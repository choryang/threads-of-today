import { computed, effectScope, reactive, ref, watch } from 'vue'
import { SETS } from '../../shared/data/materials'
import { PEOPLE } from '../../shared/data/people'
import {
  DAILY_LIMIT, completedSets, dateKey, findLinkCards, mysteryOptions, mysteryProduct, previousDateKey,
  type Decomposed,
} from '../../shared/logic'
import { mysteryHints } from '../../shared/mystery'
import { normalizeNickname, randomNickname } from '../../shared/nickname'
import { FIRST_SUFFIX, buildTimeline, firstJourneyGift, quizFor } from '../../shared/journey'
import {
  DEFAULT_SPEED, MS_PER_DAY, anchorAtQuiz, ensureAnchor, journeyClock, journeySchedule, reanchor, type JourneyClock, type Speed,
} from '../../shared/timing'
import { addJourneyToThreads, backfillThreads } from '../../shared/threads'
import { everyoneThanked, sceneKey, thanksReply, unseenScenes, type ThanksScene } from '../../shared/thanks'
import { emptySave, type DayLog, type Journey, type JourneySource, type MysteryLog, type Save } from '../../shared/progress'

export type { DayLog, Journey, JourneySource, MysteryLog, Save } from '../../shared/progress'

export type { TimelineItem } from '../../shared/journey'

const KEY = 'my-day-people:v1'
/** 이 기기에서 여정 화면을 마지막으로 본 칸과 게임 날수. "자리를 비운 사이" 요약에 쓴다 (기기마다 따로, 동기화하지 않음) */
const SEEN_KEY = 'my-day-people:seen'
/** 여정 시계를 다시 계산하는 간격 */
const TICK_MS = Math.min(1000, MS_PER_DAY / 24)

function load(): Save {
  if (typeof window === 'undefined') return emptySave()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptySave()
    const parsed = JSON.parse(raw)
    if (parsed?.v !== 1) return emptySave()
    const save: Save = { ...emptySave(), ...parsed }
    // 실타래 기능 전의 기록: 남은 30일 기록과 분해해 본 물건으로 재료별 누적을 채운다
    if (!parsed.threads) save.threads = backfillThreads(save)
    return save
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
  s.seenScenes = next.seenScenes ?? []
  s.threads = next.threads ?? {}
  if (next.nickname) s.nickname = next.nickname
  if (next.speed) s.speed = next.speed
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

/** 화면이 따라 바뀌는 지금 시각. startClock이 TICK_MS마다 갱신한다 */
const now = ref(Date.now())

interface Seen { step: number; day: number }

function loadSeen(): Record<string, Seen> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

let seenCache: Record<string, Seen> | null = null
function seenMap(): Record<string, Seen> {
  if (!seenCache) seenCache = typeof window === 'undefined' ? {} : loadSeen()
  return seenCache
}

function writeSeen(id: string, value: Seen) {
  const map = seenMap()
  const old = map[id]
  if (old && old.step === value.step && Math.floor(old.day) === Math.floor(value.day)) return
  map[id] = value
  // 30일이 지난 여정은 지운다 (id 앞 10글자가 날짜)
  const cutoff = new Date(Date.now() - 31 * 86_400_000).toISOString().slice(0, 10)
  for (const k of Object.keys(map)) if (k.slice(0, 10) < cutoff) delete map[k]
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(map))
  } catch {
    // 저장 공간이 막힌 환경에서는 이번 방문 동안만 유지
  }
}

let clockTimer: ReturnType<typeof setInterval> | null = null

/**
 * 여정 시계를 돌린다. 앱을 열 때 그사이 지난 칸을 한꺼번에 처리하고, 그 뒤로는 TICK_MS마다 처리한다.
 * 다른 탭에 있다가 돌아오면 바로 한 번 더 처리한다.
 */
export function startClock() {
  if (clockTimer || typeof window === 'undefined') return
  const game = useGame()
  const tick = () => {
    now.value = Date.now()
    game.advanceAll(now.value)
  }
  tick()
  clockTimer = setInterval(tick, TICK_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick()
  })
}

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
  const speed = computed<Speed>(() => s.speed?.value ?? DEFAULT_SPEED)
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

  /** 아직 카드가 한 장도 없는 사람 (첫 여정 전) */
  const firstVisit = computed(() => ownedCount.value === 0)

  /** teaser: 지난 여정의 '다음 여정 추천'을 따라 떠날 때, 말을 건 사람 id */
  function startJourney(item: Decomposed, source: JourneySource, opts: { teaser?: string } = {}): Journey | null {
    const day = ensureToday()
    if (source !== 'mystery' && regularCount.value >= DAILY_LIMIT) return null
    const journey: Journey = {
      // 여러 기기의 기록을 합칠 때 겹치지 않게 무작위 꼬리를 붙인다 (앞 10글자는 날짜, '-꼬리'가 있으면 새 여정 규칙을 쓴다)
      // 첫 여정에는 '-first'를 더 붙여 숨은 만남(또는 퀴즈 보상)을 보장한다 (shared/journey.ts)
      id: `${todayKey}-${day.journeys.length + 1}-${Math.random().toString(36).slice(2, 6)}${firstVisit.value ? FIRST_SUFFIX : ''}`,
      name: item.name,
      twist: item.twist,
      voice: item.voice,
      source,
      materialIds: item.materialIds,
      step: 0,
      quiz: {},
      newCards: [],
      done: false,
      anchorAt: Date.now(),
      anchorDays: 0,
      ...(opts.teaser && PEOPLE[opts.teaser] ? { teaser: opts.teaser } : {}),
    }
    day.journeys.push(journey)
    // 연속 기록은 여정을 떠날 때 올라간다 (밤에 떠나 다음 날 도착해도 떠난 날 기준)
    if (s.streak.last !== todayKey) {
      s.streak.count = s.streak.last === previousDateKey(todayKey) ? s.streak.count + 1 : 1
      s.streak.last = todayKey
    }
    if (!s.items[item.name]) s.items[item.name] = todayKey
    const saved = day.journeys[day.journeys.length - 1]!
    // 첫 번째 사람은 여정을 시작하자마자 만난다
    const first = buildTimeline(saved.materialIds, saved.id, saved.name)[0]
    if (first?.type === 'stage') saved.newCards.push(...collect(first.personId))
    writeSeen(saved.id, { step: 0, day: 0 })
    return saved
  }

  function findJourney(id: string): Journey | undefined {
    for (const day of Object.values(s.days)) {
      const found = day.journeys.find((j) => j.id === id)
      if (found) return found
    }
    return undefined
  }

  /** 진행 중인 모든 여정 (떠난 날과 상관없이) */
  function ongoingJourneys(): Journey[] {
    return Object.values(s.days).flatMap((day) => day.journeys.filter((j) => !j.done))
  }

  function clockOf(journey: Journey, at = now.value): JourneyClock {
    return journeyClock(journey, at, speed.value)
  }

  /**
   * 여정 시계가 가리키는 칸까지 펼친다. 그사이 지난 사람 칸의 카드를 한꺼번에 주고, 마지막 칸을 지나면 여정을 마친다.
   * 답하지 않은 퀴즈가 있으면 그 칸에서 멈춘다.
   */
  function advanceJourney(journey: Journey, at = Date.now()) {
    if (journey.done) return
    ensureAnchor(journey, at)
    const { timeline } = journeySchedule(journey)
    const clock = clockOf(journey, at)
    while (journey.step < clock.index) {
      journey.step++
      const item = timeline[journey.step]
      if (item?.type === 'stage' || item?.type === 'hidden') journey.newCards.push(...collect(item.personId))
    }
    if (clock.arrived) finishJourney(journey)
  }

  function advanceAll(at = Date.now()) {
    for (const j of ongoingJourneys()) advanceJourney(j, at)
  }

  /** 배속을 바꾼다. 바꾸는 순간 진행 중인 모든 여정의 기준점을 새로 찍어 진행이 튀지 않게 한다 */
  function setSpeed(value: Speed) {
    if (value === speed.value) return
    const at = Date.now()
    for (const j of ongoingJourneys()) {
      ensureAnchor(j, at)
      reanchor(j, at, speed.value)
    }
    s.speed = { value, updatedAt: at }
    now.value = at
  }

  /** 여정 화면을 마지막으로 본 뒤 흐른 날수와 새로 만난 사람. 처음 보는 여정(다른 기기에서 떠난 여정)은 null */
  function awaySummary(journey: Journey): { days: number; people: string[] } | null {
    const seen = seenMap()[journey.id]
    if (!seen) return null
    const { timeline } = journeySchedule(journey)
    const people = timeline
      .slice(seen.step + 1, journey.step + 1)
      .flatMap((t) => (t.type === 'stage' || t.type === 'hidden' ? [t.personId] : []))
    return { days: Math.max(0, Math.floor(clockOf(journey).day - seen.day)), people }
  }

  /** 여정 화면에서 지금 칸을 본 것으로 기록한다 */
  function markSeen(journey: Journey) {
    writeSeen(journey.id, { step: journey.step, day: clockOf(journey).day })
  }

  function answerQuiz(journey: Journey, materialId: string, choice: number): { correct: boolean; gained: string[] } {
    const quiz = quizFor(journey.materialIds, journey.id, materialId)
    if (!quiz || journey.quiz[materialId] !== undefined) return { correct: false, gained: [] }
    journey.quiz[materialId] = choice
    // 퀴즈에서 멈춰 있던 시간이 답하는 순간부터 다시 흐른다
    anchorAtQuiz(journey, materialId, Date.now())
    now.value = Date.now()
    const correct = choice === quiz.answer
    // 첫 여정에 숨은 만남이 나올 자리가 없으면, 처음 답한 퀴즈의 보상은 틀려도 준다
    const gift = !correct && firstJourneyGift(journey.materialIds, journey.id) && !journey.newCards.some((id) => PEOPLE[id]?.kind === 'quiz')
    const gained = correct || gift ? collect(quiz.rewardId) : []
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
    if (!s.threads) s.threads = {}
    addJourneyToThreads(s.threads, journey.materialIds, dayKey)
    for (const listener of finishListeners) listener()
    return gained
  }

  // ── 오늘의 미스터리 ──
  const mysteryAnswer = mysteryProduct(todayKey)
  const mysteryHintList = mysteryHints(mysteryAnswer, mysteryOptions(todayKey).filter((p) => p.id !== mysteryAnswer.id))
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

  /** 열렸지만 아직 못 본 감사 장면(세트·엔딩)을 띄우고 본 것으로 기록한다. 다른 기기와 합쳐져 완성된 세트도 여기서 나온다 */
  function showUnseenScenes() {
    if (!s.seenScenes) s.seenScenes = []
    const scenes = unseenScenes(new Set(Object.keys(s.thanks)), s.seenScenes)
    s.seenScenes.push(...scenes.map(sceneKey))
    sceneQueue.value.push(...scenes)
  }

  /** 만난 사람에게 고마움을 전한다. 이미 전했거나 아직 못 만났으면 아무것도 하지 않는다. 답을 돌려준다 */
  function thank(cardId: string): string | null {
    if (!s.cards[cardId] || s.thanks[cardId]) return null
    s.thanks[cardId] = todayKey
    showUnseenScenes()
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
    firstVisit,
    itemCount,
    knowsItem,
    streak,
    owns,
    startJourney,
    findJourney,
    now,
    speed,
    setSpeed,
    clockOf,
    advanceJourney,
    advanceAll,
    awaySummary,
    markSeen,
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
    showUnseenScenes,
  }
}
