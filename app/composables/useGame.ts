import { computed, effectScope, reactive, ref, watch } from 'vue'
import { LINK_RULES, SETS } from '../../shared/data/materials'
import { PEOPLE } from '../../shared/data/people'
import {
  completedSets, dateKey, findLinkCards, mysteryOptions, mysteryProduct, seoulDateKey,
  type Decomposed,
} from '../../shared/logic'
import { addGratitude, addMeeting, friendshipOf, migratePeople, quizOf, UNLOCK } from '../../shared/friendship'
import { createIncoming } from '../../shared/incoming'
import { mysteryHints } from '../../shared/mystery'
import { normalizeNickname, randomNickname } from '../../shared/nickname'
import { REVERSE_SUFFIX, buildTimeline, journeyOrderSuffix, quizFor, secondJourneyGift, tailMeeting, timelinePeople } from '../../shared/journey'
import { addJourneyToThreads, backfillThreads } from '../../shared/threads'
import { everyoneThanked, sceneKey, thanksReply, unseenScenes, type ThanksScene } from '../../shared/thanks'
import { emptySave, type DayLog, type Journey, type JourneySource, type MysteryLog, type Save } from '../../shared/progress'
import { isOpen, nextLocked, nextUnlock, openSteps, pendingNotices, silentUnlocks, stepState, unlockStats, type FeatureId, type UnlockStepId } from '../../shared/unlocks'

export type { DayLog, Journey, JourneySource, MysteryLog, Save } from '../../shared/progress'

export type { TimelineItem } from '../../shared/journey'

const KEY = 'my-day-people:v1'

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
    // 친해진 정도 기능 전의 기록: 남은 여정·가진 카드·고마워요로 사람별 기록을 채운다
    if (!parsed.people) save.people = migratePeople(save)
    return save
  } catch {
    return emptySave()
  }
}

let state: Save | null = null

function getState(): Save {
  if (state) return state
  const loaded = load()
  // 열림 알림 기록이 없으면(새 사용자 또는 이 기능 전의 기록) 이미 넘은 단계는 조용히 연다
  if (!loaded.unlockSeen) Object.assign(loaded, quietUnlocks(loaded))
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
    // 기능 열림: 오늘 새로 열 단계가 생기면 연 날짜(서울)를 적는다. 하루에 하나씩이라 다음 단계는 내일 적힌다
    watch(
      () => nextUnlock(unlockStats(state!), state!.unlockedOn ?? {}, seoulDateKey()),
      (id) => {
        if (!id) return
        if (!state!.unlockedOn) state!.unlockedOn = {}
        state!.unlockedOn[id] = seoulDateKey()
      },
      { immediate: true },
    )
  })
  return state
}

/** 알림 기록이 없는 진행 상황: 이미 시작한 사용자는 넘은 단계를 오늘 한꺼번에 조용히 연다 (shared/unlocks.ts) */
function quietUnlocks(save: Save): Pick<Save, 'unlockSeen' | 'unlockedOn'> {
  const q = silentUnlocks(save, seoulDateKey())
  return { unlockSeen: q.unlockSeen, unlockedOn: { ...q.unlockedOn, ...save.unlockedOn } }
}

/** 이 여정에 연결 카드의 원래 사람(선원·항구 등)이 나왔는지 */
function journeyHasLink(journey: Journey, cardId: string): boolean {
  const rule = LINK_RULES.find((r) => r.cardId === cardId)
  return !!rule && timelinePeople(journey.materialIds, journey.id, journey.name).some((x) => x.personId === rule.personId)
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
  s.people = next.people ?? {}
  s.incoming = next.incoming ?? []
  s.visitedVillages = next.visitedVillages ?? []
  s.bestSeen = next.bestSeen ?? []
  // 예전 기기에서 받은 기록이면 알림 기록이 없다: 지금 기록 기준으로 조용히 연다
  if (next.unlockSeen) {
    s.unlockSeen = next.unlockSeen
    s.unlockedOn = next.unlockedOn ?? {}
  } else Object.assign(s, quietUnlocks(next))
  if (next.village) s.village = next.village
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

const meetListeners = new Set<(personId: string) => void>()
/** 여정에서 사람을 만날 때마다 불린다 (모두의 오늘 집계용) */
export function onMeet(listener: (personId: string) => void) {
  meetListeners.add(listener)
  return () => meetListeners.delete(listener)
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
  const ownedCount = computed(() => Object.keys(s.cards).length)

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

  /** 이 여정에서 이 사람을 만났다 (친해진 정도). 같은 여정은 한 번만 센다 */
  function meet(cardId: string, journey: { id: string; name: string }) {
    if (!PEOPLE[cardId]) return
    if (!s.people) s.people = {}
    s.people[cardId] = addMeeting(s.people[cardId], journey.id, journey.name)
    for (const listener of meetListeners) listener(cardId)
  }

  /**
   * 카드를 얻는다. 세트가 완성되면 보상 카드도 함께. 새로 얻은 id 목록을 돌려준다.
   * journey를 넘기면 이미 가진 사람이어도 그 여정에서 만난 것으로 적는다.
   */
  function collect(cardId: string, journey?: { id: string; name: string }): string[] {
    if (!PEOPLE[cardId]) return []
    if (journey) meet(cardId, journey)
    if (s.cards[cardId]) return []
    s.cards[cardId] = todayKey
    const gained = [cardId]
    const owned = new Set(Object.keys(s.cards))
    for (const set of completedSets(owned)) {
      if (!s.cards[set.rewardId]) {
        s.cards[set.rewardId] = todayKey
        gained.push(set.rewardId)
        if (journey) meet(set.rewardId, journey)
      }
    }
    return gained
  }

  /** 아직 카드가 한 장도 없는 사람 (첫 여정 전) */
  const firstVisit = computed(() => ownedCount.value === 0)

  /**
   * 여정을 떠난다. 하루 횟수 제한은 없다(물건 고르기는 로컬 데이터라 비용이 없다). AI를 부르는 직접 쓰기·사진만
   * 서버가 IP별 하루 한도(NUXT_AI_DAILY_LIMIT)로 막는다.
   * teaser: 지난 여정의 '다음 여정 추천'을 따라 떠날 때, 말을 건 사람 id
   * meet: 이 사람이 반드시 나오게 여정 id 꼬리를 고른다 ('다음 주민은 {물건} 속에 있어요'를 눌러 떠날 때)
   */
  function startJourney(item: Decomposed, source: JourneySource, opts: { teaser?: string; meet?: string } = {}): Journey {
    const day = ensureToday()
    const head = `${todayKey}-${day.journeys.length + 1}-`
    const tailEnd = `${REVERSE_SUFFIX}${journeyOrderSuffix(firstVisit.value, Object.values(s.days).flatMap((d) => d.journeys.map((j) => j.id)))}`
    const salt = Math.random().toString(36).slice(2, 6)
    const meetTail = opts.meet ? tailMeeting((tail) => `${head}${tail}${tailEnd}`, item.materialIds, item.name, opts.meet, salt) : null
    const journey: Journey = {
      // 여러 기기의 기록을 합칠 때 겹치지 않게 무작위 꼬리를 붙인다 (앞 10글자는 날짜, '-꼬리'가 있으면 새 여정 규칙을 쓴다)
      // '-r': 내 손에서 원산지로 거슬러 올라가는 여정. 이 꼬리가 없는 예전 여정은 예전 순서 그대로 끝난다
      // 첫 여정에는 '-first'(사람 카드만), 두 번째 여정에는 '-second'(숨은 만남 또는 퀴즈 보상 보장)를 더 붙인다 (shared/journey.ts)
      id: `${head}${meetTail ?? salt}${tailEnd}`,
      name: item.name,
      twist: item.twist,
      voice: item.voice,
      source,
      materialIds: item.materialIds,
      step: 0,
      quiz: {},
      newCards: [],
      done: false,
      ...(opts.teaser && PEOPLE[opts.teaser] ? { teaser: opts.teaser } : {}),
    }
    day.journeys.push(journey)
    if (!s.items[item.name]) s.items[item.name] = todayKey
    const saved = day.journeys[day.journeys.length - 1]!
    // 첫 번째 사람은 여정을 시작하자마자 만난다
    const first = buildTimeline(saved.materialIds, saved.id, saved.name)[0]
    if (first?.type === 'stage') saved.newCards.push(...collect(first.personId, saved))
    return saved
  }

  function findJourney(id: string): Journey | undefined {
    for (const day of Object.values(s.days)) {
      const found = day.journeys.find((j) => j.id === id)
      if (found) return found
    }
    return undefined
  }

  /** 타임라인 다음 칸을 펼친다. 사람 칸이면 카드를 얻는다. 답하지 않은 퀴즈 칸에서는 넘어가지 않는다 */
  function revealNext(journey: Journey): string[] {
    const timeline = buildTimeline(journey.materialIds, journey.id, journey.name)
    const item = timeline[journey.step]
    if (!item) return []
    if (item.type === 'quiz' && journey.quiz[item.materialId] === undefined) return []
    journey.step++
    const next = timeline[journey.step]
    // 같은 길(pass)의 사람은 앞에서 이미 만났지만, 카드가 빠진 기록이어도 얻게 한다
    const ids = next?.type === 'stage' || next?.type === 'hidden' ? [next.personId] : next?.type === 'pass' ? next.personIds : []
    const gained = ids.flatMap((id) => collect(id, journey))
    journey.newCards.push(...gained)
    return gained
  }

  function answerQuiz(journey: Journey, materialId: string, choice: number): { correct: boolean; gained: string[] } {
    const quiz = quizFor(journey.materialIds, journey.id, materialId)
    if (!quiz || journey.quiz[materialId] !== undefined) return { correct: false, gained: [] }
    journey.quiz[materialId] = choice
    const correct = choice === quiz.answer
    // 두 번째 여정에 숨은 만남이 나올 자리가 없으면, 처음 답한 퀴즈의 보상은 틀려도 준다
    const gift = !correct && secondJourneyGift(journey.materialIds, journey.id) && !journey.newCards.some((id) => PEOPLE[id]?.kind === 'quiz')
    const gained = correct || gift ? collect(quiz.rewardId, journey) : []
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
      // 이 여정에서 찾은 연결이면 다시 만난 것으로 센다 (이미 가진 연결 카드도)
      gained.push(...collect(cardId, journeyHasLink(journey, cardId) ? journey : undefined))
    }
    journey.newCards.push(...gained)
    if (!s.threads) s.threads = {}
    addJourneyToThreads(s.threads, journey.materialIds, dayKey)
    // 운송 구간이 있고 아직 못 만난 사람이 남은 물건이면, 밤사이 한 사람을 더 데려오는 물건이 출발한다
    if (!s.incoming) s.incoming = []
    const incoming = createIncoming(journey, new Set(Object.keys(s.cards)), s.incoming, Date.now())
    if (incoming) s.incoming.push(incoming)
    for (const listener of finishListeners) listener()
    return gained
  }

  // ── 오고 있는 물건 ──
  /**
   * 도착한 물건을 연다: 데려온 사람이 새 주민이 된다(카드 + 그 여정에서 만난 기록). 한 번만.
   * 돌려준 사람 id로 마을의 그 자리로 화면을 옮긴다
   */
  function openArrival(journeyId: string, now = Date.now()): string | null {
    const inc = s.incoming?.find((x) => x.journeyId === journeyId)
    if (!inc || inc.openedAt || now < inc.arriveAt) return null
    const journey = findJourney(journeyId)
    collect(inc.personId, { id: journeyId, name: journey?.name ?? '' })
    inc.openedAt = now
    return inc.personId
  }

  // ── 친구 마을 ──
  /** 링크를 연 마을을 '다녀온 마을'에 적는다 (상대에게 알리지 않는다) */
  function visitVillage(token: string, nickname: string) {
    if (!s.visitedVillages) s.visitedVillages = []
    s.visitedVillages = [{ token, nickname, at: Date.now() }, ...s.visitedVillages.filter((v) => v.token !== token)].slice(0, 30)
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
  /** 한 번이라도 고마움을 전했는지 (세트 감사 장면·엔딩 기준) */
  const thanked = (cardId: string) => !!s.thanks[cardId]
  /** 오늘(서울 기준) 고마움을 전했는지. 고마워요는 하루 한 번 */
  const thankedToday = (cardId: string) => !!s.people?.[cardId]?.gratitudeDays.includes(seoulDateKey())
  const allThanked = computed(() => everyoneThanked(new Set(Object.keys(s.thanks))))

  /** 열렸지만 아직 못 본 감사 장면(세트·엔딩)을 띄우고 본 것으로 기록한다. 다른 기기와 합쳐져 완성된 세트도 여기서 나온다 */
  function showUnseenScenes() {
    if (!s.seenScenes) s.seenScenes = []
    const scenes = unseenScenes(new Set(Object.keys(s.thanks)), s.seenScenes)
    s.seenScenes.push(...scenes.map(sceneKey))
    sceneQueue.value.push(...scenes)
  }

  /** 만난 사람에게 고마움을 전한다(하루 한 번). 오늘 이미 전했거나 아직 못 만났으면 아무것도 하지 않는다. 답을 돌려준다 */
  function thank(cardId: string): string | null {
    if (!s.cards[cardId] || thankedToday(cardId)) return null
    if (!s.people) s.people = {}
    s.people[cardId] = addGratitude(s.people[cardId], seoulDateKey())
    if (!s.thanks[cardId]) {
      s.thanks[cardId] = todayKey
      showUnseenScenes()
    }
    return thanksReply(cardId)
  }

  // ── 친해진 정도 ──
  const friendship = (cardId: string) => friendshipOf(s.people?.[cardId])

  /** 75%부터 열리는 그 사람의 퀴즈에 답한다. 맞히면 친해진 정도 +10%. 틀려도 잃는 것 없이 다시 고를 수 있다 */
  function answerFriendQuiz(cardId: string, choice: number): boolean {
    const quiz = quizOf(cardId)
    const log = s.people?.[cardId]
    if (!quiz || !log || friendship(cardId).percent < UNLOCK.quiz) return false
    if (choice !== quiz.answer) return false
    s.people[cardId] = { ...log, quizCorrect: true }
    return true
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

  // ── 기능 열림 (shared/unlocks.ts의 표만 본다. 하루에 하나씩, 연 날짜는 getState의 감시가 적는다) ──
  const unlocks = computed(() => unlockStats(s))
  const openNow = computed(() => openSteps(unlocks.value, s.unlockedOn ?? {}, seoulDateKey()))
  /** 이 기능을 보여 줄지. 링크로 들어온 화면(/d, /p, /v)은 이 함수를 쓰지 않는다 */
  const opens = (feature: FeatureId) => isOpen(feature, openNow.value)
  /** 단계 하나의 지금 상태 (열림 / 여정 n번 더 / 며칠 뒤 / 단짝이 생기면) */
  const unlockState = (id: UnlockStepId) => stepState(id, unlocks.value, s.unlockedOn ?? {}, seoulDateKey())
  /** 아직 안 열린 단계 중 가장 앞 단계 (모두 열렸으면 null) */
  const nextLockedStep = computed(() => nextLocked(unlocks.value, s.unlockedOn ?? {}, seoulDateKey()))
  /** 열렸는데 아직 안 본 알림 하나 (표 순서로 하나씩) */
  const unlockNotice = computed(() => pendingNotices(openNow.value, s.unlockSeen ?? [])[0] ?? null)
  function markUnlockSeen(id: UnlockStepId) {
    if (!s.unlockSeen) s.unlockSeen = []
    if (!s.unlockSeen.includes(id)) s.unlockSeen.push(id)
  }

  return {
    state: s,
    nickname,
    setNickname,
    todayKey,
    today,
    ownedCount,
    firstVisit,
    itemCount,
    knowsItem,
    owns,
    startJourney,
    findJourney,
    revealNext,
    answerQuiz,
    finishJourney,
    openArrival,
    visitVillage,
    mysteryAnswer,
    mysteryHintList,
    mystery,
    mysteryJourney,
    guessMystery,
    setProgress,
    thanked,
    thankedToday,
    thank,
    friendship,
    answerFriendQuiz,
    allThanked,
    replayEnding,
    showUnseenScenes,
    unlocks,
    opens,
    unlockNotice,
    markUnlockSeen,
    unlockState,
    nextLockedStep,
  }
}
