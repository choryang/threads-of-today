/**
 * 진행 상황(Save)의 모양과 기기 사이 병합 규칙. 브라우저(localStorage)와 서버(Upstash)가 같은 함수를 쓴다.
 *
 * 병합 규칙
 *  - 카드·물건·고마움: 합집합. 같은 id면 먼저 얻은(전한) 날을 남긴다.
 *  - 날짜별 기록(days, mystery): 합친 뒤 오늘 기준 최근 30일만 남긴다.
 *    같은 날의 여정은 id로 짝짓고, 더 많이 진행한 쪽을 남긴다.
 *  - 연속 기록: 마지막 날이 더 최근인 쪽. 같으면 큰 값.
 *  - 닉네임: updatedAt이 더 최근인 쪽.
 *  - 본 감사 장면(seenScenes): 합집합. 한 기기에서 본 장면은 다른 기기에서 다시 띄우지 않는다.
 */
import { SETS } from './data/materials'
import { PEOPLE } from './data/people'
import { normalizeNickname } from './nickname'

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
  nickname?: Nickname
}

export const KEEP_DAYS = 30
const LIMITS = { items: 2000, journeysPerDay: 12, name: 40, voice: 80, guesses: 10 }
const DATE = /^\d{4}-\d{2}-\d{2}$/

export function emptySave(): Save {
  return { v: 1, cards: {}, days: {}, streak: { last: '', count: 0 }, mystery: {}, items: {}, thanks: {}, seenScenes: [] }
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

function mergeRecordOfDates(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = earlier(out[k], v)
  return out
}

const progressOf = (j: Journey) => (j.done ? 1_000_000 : 0) + j.step * 100 + Object.keys(j.quiz).length

function mergeJourney(a: Journey, b: Journey): Journey {
  const [main, other] = progressOf(a) >= progressOf(b) ? [a, b] : [b, a]
  return { ...main, quiz: { ...other.quiz, ...main.quiz }, newCards: union(main.newCards, other.newCards) }
}

function mergeDay(a: DayLog | undefined, b: DayLog | undefined): DayLog {
  if (!a) return b!
  if (!b) return a
  const journeys = [...a.journeys]
  for (const j of b.journeys) {
    const i = journeys.findIndex((x) => x.id === j.id)
    if (i < 0) journeys.push(j)
    else journeys[i] = mergeJourney(journeys[i]!, j)
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

export function mergeSaves(a: Save, b: Save, todayKey: string): Save {
  const days: Record<string, DayLog> = {}
  for (const k of new Set([...Object.keys(a.days), ...Object.keys(b.days)])) days[k] = mergeDay(a.days[k], b.days[k])
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
    days: pickRecent(days, todayKey),
    mystery: pickRecent(mystery, todayKey),
    streak,
    ...(nickname ? { nickname: { ...nickname } } : {}),
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
  return s
}
