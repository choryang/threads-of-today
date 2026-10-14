/**
 * 진행 상황(Save)의 모양과 기기 사이 병합 규칙. 브라우저(localStorage)와 서버(Upstash)가 같은 함수를 쓴다.
 *
 * 병합 규칙
 *  - 카드·물건·고마움: 합집합. 같은 id면 먼저 얻은(전한) 날을 남긴다.
 *  - 날짜별 기록(days, mystery): 합친 뒤 오늘 기준 최근 30일만 남긴다.
 *    같은 날의 여정은 id로 짝짓고, 지금 시각에 더 많이 진행된 쪽(여정 시계 기준)을 남긴다.
 *  - 배속(speed): updatedAt이 더 최근인 쪽. 진 쪽 기기의 여정은 이긴 배속으로 바뀐 시각에 기준점을 새로 찍은 뒤 비교한다.
 *  - 연속 기록: 마지막 날이 더 최근인 쪽. 같으면 큰 값.
 *  - 닉네임: updatedAt이 더 최근인 쪽.
 *  - 재료별 누적(threads): 같은 재료는 떠난 횟수가 큰 쪽, 처음 떠난 날은 이른 쪽.
 *  - 본 감사 장면(seenScenes): 합집합. 한 기기에서 본 장면은 다른 기기에서 다시 띄우지 않는다.
 */
import { MATERIALS, SETS } from './data/materials'
import { PEOPLE } from './data/people'
import { normalizeNickname } from './nickname'
import { DEFAULT_SPEED, isSpeed, journeyClock, reanchor, type Speed } from './timing'

export type JourneySource = 'text' | 'photo' | 'pick' | 'mystery'

export interface Journey {
  id: string
  name: string
  twist?: string
  /** 물건의 한마디. {name} 자리에 닉네임을 끼워 화면에 보여 준다 */
  voice?: string
  source: JourneySource
  materialIds: string[]
  /** 지금까지 펼친 타임라인 칸 수 */
  step: number
  /** 재료 id → 고른 보기 번호 */
  quiz: Record<string, number>
  newCards: string[]
  done: boolean
  /** 여정 시계의 기준 시각(ms). 없으면 이 기능 전에 시작한 여정 (shared/timing.ts) */
  anchorAt?: number
  /** 기준 시각까지 흐른 게임 날수 */
  anchorDays?: number
  /** 지난 여정의 '다음 여정 추천'을 따라 떠났으면, 그 예고에서 말을 건 사람 id (shared/next.ts) */
  teaser?: string
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

export interface Nickname {
  value: string
  /** 마지막으로 바꾼 시각(ms). 병합할 때 더 최근 것을 남긴다 */
  updatedAt: number
}

/** 재료 하나의 누적 기록 ('나의 실타래'의 실 한 가닥) */
export interface ThreadStat {
  /** 이 재료가 들어간 여정을 마친 횟수 */
  count: number
  /** 처음 마친 날 */
  first: string
}

export interface SpeedSetting {
  value: Speed
  /** 마지막으로 바꾼 시각(ms). 병합할 때 더 최근 것을 남긴다 */
  updatedAt: number
}

export interface Save {
  v: 1
  cards: Record<string, string>
  days: Record<string, DayLog>
  streak: { last: string; count: number }
  mystery: Record<string, MysteryLog>
  /** 분해해 본 물건 이름 → 처음 분해한 날 */
  items: Record<string, string>
  /** 고마움을 전한 카드 id → 전한 날. 만난 사람(cards)에게만, 한 사람에게 한 번 */
  thanks: Record<string, string>
  /** 이미 보여 준 감사 장면: 세트 id 또는 'ending'. 다른 기기와 합쳐져 세트가 완성되면 도감을 열 때 못 본 장면을 띄운다 */
  seenScenes: string[]
  /** 재료 id → 누적 기록. 날짜별 기록(days)은 30일만 남아서 실타래는 이걸로 그린다 */
  threads: Record<string, ThreadStat>
  nickname?: Nickname
  /** 여정 배속. 없으면 1배 */
  speed?: SpeedSetting
}

export const KEEP_DAYS = 30
const LIMITS = { items: 2000, journeysPerDay: 12, name: 40, voice: 80, guesses: 10 }
const DATE = /^\d{4}-\d{2}-\d{2}$/

export function emptySave(): Save {
  return { v: 1, cards: {}, days: {}, streak: { last: '', count: 0 }, mystery: {}, items: {}, thanks: {}, seenScenes: [], threads: {} }
}

/** todayKey를 포함해 최근 days일의 날짜 키인지 */
function isRecent(key: string, todayKey: string, days = KEEP_DAYS): boolean {
  const [y, m, d] = todayKey.split('-').map(Number)
  const cutoff = new Date(y!, m! - 1, d! - (days - 1))
  const c = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`
  return key >= c
}

const earlier = (a: string | undefined, b: string | undefined) => (!a ? b! : !b ? a : a < b ? a : b)
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])]

function mergeThreads(a: Record<string, ThreadStat>, b: Record<string, ThreadStat>): Record<string, ThreadStat> {
  const out: Record<string, ThreadStat> = { ...a }
  for (const [id, t] of Object.entries(b)) {
    const x = out[id]
    out[id] = x ? { count: Math.max(x.count, t.count), first: earlier(x.first, t.first) } : { ...t }
  }
  return out
}

function mergeRecordOfDates(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = earlier(out[k], v)
  return out
}

/** 마친 여정 > 지금 게임 날수 > 답한 퀴즈 수 > 펼친 칸 수 */
function progressOf(j: Journey, now: number, speed: Speed): number[] {
  return [j.done ? 1 : 0, journeyClock(j, now, speed).day, Object.keys(j.quiz).length, j.step]
}

function moreProgressed(a: Journey, b: Journey, now: number, speed: Speed): boolean {
  const pa = progressOf(a, now, speed)
  const pb = progressOf(b, now, speed)
  for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return pa[i]! > pb[i]!
  return true
}

function mergeJourney(a: Journey, b: Journey, now: number, speed: Speed): Journey {
  const [main, other] = moreProgressed(a, b, now, speed) ? [a, b] : [b, a]
  const teaser = main.teaser ?? other.teaser
  return { ...main, quiz: { ...other.quiz, ...main.quiz }, newCards: union(main.newCards, other.newCards), ...(teaser ? { teaser } : {}) }
}

function mergeDay(a: DayLog | undefined, b: DayLog | undefined, now: number, speed: Speed): DayLog {
  if (!a) return b!
  if (!b) return a
  const journeys = [...a.journeys]
  for (const j of b.journeys) {
    const i = journeys.findIndex((x) => x.id === j.id)
    if (i < 0) journeys.push(j)
    else journeys[i] = mergeJourney(journeys[i]!, j, now, speed)
  }
  return { journeys, linkCards: union(a.linkCards, b.linkCards) }
}

function mergeMystery(a: MysteryLog | undefined, b: MysteryLog | undefined): MysteryLog {
  if (!a) return b!
  if (!b) return a
  return {
    revealed: Math.max(a.revealed, b.revealed),
    guesses: union(a.guesses, b.guesses),
    solved: a.solved || b.solved,
    finished: a.finished || b.finished,
  }
}

function pickRecent<T>(records: Record<string, T>, todayKey: string): Record<string, T> {
  return Object.fromEntries(Object.entries(records).filter(([k]) => isRecent(k, todayKey)))
}

/** 배속에서 진 쪽의 여정: 이긴 배속으로 바뀐 시각에, 진 쪽 배속으로 기준점을 새로 찍은 복사본 */
function reanchoredDays(save: Save, at: number, speed: Speed): Record<string, DayLog> {
  const days: Record<string, DayLog> = {}
  for (const [k, day] of Object.entries(save.days)) {
    days[k] = {
      ...day,
      journeys: day.journeys.map((j) => {
        const copy = { ...j }
        reanchor(copy, at, speed)
        return copy
      }),
    }
  }
  return days
}

/** now: 같은 여정의 진행을 비교할 시각 (여정 시계 기준) */
export function mergeSaves(a: Save, b: Save, todayKey: string, now = Date.now()): Save {
  const speedA = a.speed ?? { value: DEFAULT_SPEED, updatedAt: 0 }
  const speedB = b.speed ?? { value: DEFAULT_SPEED, updatedAt: 0 }
  const speedWin = speedA.updatedAt >= speedB.updatedAt ? speedA : speedB
  const daysA = speedWin === speedA || speedA.value === speedWin.value ? a.days : reanchoredDays(a, speedWin.updatedAt, speedA.value)
  const daysB = speedWin === speedB || speedB.value === speedWin.value ? b.days : reanchoredDays(b, speedWin.updatedAt, speedB.value)

  const days: Record<string, DayLog> = {}
  for (const k of new Set([...Object.keys(daysA), ...Object.keys(daysB)])) days[k] = mergeDay(daysA[k], daysB[k], now, speedWin.value)
  const mystery: Record<string, MysteryLog> = {}
  for (const k of new Set([...Object.keys(a.mystery), ...Object.keys(b.mystery)])) mystery[k] = mergeMystery(a.mystery[k], b.mystery[k])

  const streak =
    a.streak.last === b.streak.last
      ? { last: a.streak.last, count: Math.max(a.streak.count, b.streak.count) }
      : a.streak.last > b.streak.last ? { ...a.streak } : { ...b.streak }

  const nickname =
    !a.nickname ? b.nickname : !b.nickname ? a.nickname : a.nickname.updatedAt >= b.nickname.updatedAt ? a.nickname : b.nickname

  return {
    v: 1,
    cards: mergeRecordOfDates(a.cards, b.cards),
    items: mergeRecordOfDates(a.items, b.items),
    // 예전 기록에는 thanks가 없을 수 있다
    thanks: mergeRecordOfDates(a.thanks ?? {}, b.thanks ?? {}),
    seenScenes: union(a.seenScenes ?? [], b.seenScenes ?? []),
    threads: mergeThreads(a.threads ?? {}, b.threads ?? {}),
    days: pickRecent(days, todayKey),
    mystery: pickRecent(mystery, todayKey),
    streak,
    ...(nickname ? { nickname: { ...nickname } } : {}),
    ...(a.speed || b.speed ? { speed: { ...speedWin } } : {}),
  }
}

// ── 서버로 들어온 값 검사 ──
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const strList = (v: unknown, max: number, len = 40) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, len)))].slice(0, max) : []
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)

function sanitizeJourney(v: unknown): Journey | null {
  if (!isObj(v) || typeof v.id !== 'string' || !DATE.test(v.id.slice(0, 10))) return null
  const quiz: Record<string, number> = {}
  if (isObj(v.quiz)) for (const [k, n] of Object.entries(v.quiz)) if (Number.isInteger(n) && (n as number) >= 0 && (n as number) < 10) quiz[k.slice(0, 20)] = n as number
  const source = (['text', 'photo', 'pick', 'mystery'] as const).find((s) => s === v.source) ?? 'text'
  return {
    id: v.id.slice(0, 30),
    name: str(v.name, LIMITS.name),
    ...(v.twist ? { twist: str(v.twist, LIMITS.voice) } : {}),
    ...(v.voice ? { voice: str(v.voice, LIMITS.voice) } : {}),
    source,
    materialIds: strList(v.materialIds, 5, 20),
    step: Number.isInteger(v.step) && v.step >= 0 && v.step < 100 ? v.step : 0,
    quiz,
    newCards: strList(v.newCards, 60).filter((id) => PEOPLE[id]),
    done: v.done === true,
    ...(Number.isFinite(v.anchorAt) && v.anchorAt >= 0 && Number.isFinite(v.anchorDays) && v.anchorDays >= 0 && v.anchorDays <= 1000
      ? { anchorAt: v.anchorAt as number, anchorDays: v.anchorDays as number }
      : {}),
    ...(typeof v.teaser === 'string' && PEOPLE[v.teaser] ? { teaser: v.teaser } : {}),
  }
}

/**
 * 믿을 수 없는 입력(다른 기기에서 온 값)을 Save 모양으로 다듬는다. 모르는 카드, 지나치게 긴 목록, 오래된 날짜는 버린다.
 */
export function sanitizeSave(raw: unknown, todayKey: string): Save {
  const s = emptySave()
  if (!isObj(raw)) return s
  if (isObj(raw.cards)) for (const [id, d] of Object.entries(raw.cards)) if (PEOPLE[id] && typeof d === 'string' && DATE.test(d)) s.cards[id] = d
  if (isObj(raw.thanks)) {
    for (const [id, d] of Object.entries(raw.thanks)) if (s.cards[id] && typeof d === 'string' && DATE.test(d)) s.thanks[id] = d
  }
  if (isObj(raw.threads)) {
    for (const [id, t] of Object.entries(raw.threads)) {
      if (!MATERIALS[id] || !isObj(t) || typeof t.first !== 'string' || !DATE.test(t.first)) continue
      if (!Number.isInteger(t.count) || t.count < 1) continue
      s.threads[id] = { count: Math.min(t.count, 1_000_000), first: t.first }
    }
  }
  s.seenScenes = strList(raw.seenScenes, SETS.length + 1).filter((id) => id === 'ending' || SETS.some((set) => set.id === id))
  if (isObj(raw.items)) {
    for (const [name, d] of Object.entries(raw.items).slice(0, LIMITS.items)) {
      if (typeof d === 'string' && DATE.test(d) && name.length <= LIMITS.name) s.items[name] = d
    }
  }
  if (isObj(raw.days)) {
    for (const [k, day] of Object.entries(raw.days)) {
      if (!DATE.test(k) || !isRecent(k, todayKey) || !isObj(day)) continue
      const journeys = (Array.isArray(day.journeys) ? day.journeys : []).slice(0, LIMITS.journeysPerDay).map(sanitizeJourney).filter((j): j is Journey => !!j)
      s.days[k] = { journeys, linkCards: strList(day.linkCards, 20).filter((id) => PEOPLE[id]) }
    }
  }
  if (isObj(raw.mystery)) {
    for (const [k, m] of Object.entries(raw.mystery)) {
      if (!DATE.test(k) || !isRecent(k, todayKey) || !isObj(m)) continue
      s.mystery[k] = {
        revealed: Number.isInteger(m.revealed) ? Math.min(Math.max(m.revealed, 1), 10) : 1,
        guesses: strList(m.guesses, LIMITS.guesses),
        solved: m.solved === true,
        finished: m.finished === true,
      }
    }
  }
  if (isObj(raw.streak) && typeof raw.streak.last === 'string' && (raw.streak.last === '' || DATE.test(raw.streak.last))) {
    s.streak = { last: raw.streak.last, count: Number.isInteger(raw.streak.count) ? Math.min(Math.max(raw.streak.count, 0), 10000) : 0 }
  }
  if (isObj(raw.nickname)) {
    const value = normalizeNickname(raw.nickname.value)
    const updatedAt = Number(raw.nickname.updatedAt)
    if (value && Number.isFinite(updatedAt)) s.nickname = { value, updatedAt }
  }
  if (isObj(raw.speed) && isSpeed(raw.speed.value) && Number.isFinite(raw.speed.updatedAt)) {
    s.speed = { value: raw.speed.value, updatedAt: raw.speed.updatedAt }
  }
  return s
}
