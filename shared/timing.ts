/**
 * 여정 시계. 여정은 실제 시간이 흐르면 저절로 나아간다. 계산은 모두 브라우저에서 하고 서버 타이머는 없다.
 *
 *  지금 게임 날수 = anchorDays + (지금 - anchorAt) / (MS_PER_DAY / 배속)
 *
 * 타임라인 칸마다 머무는 날수가 있고(shared/data/durations.ts), 그 합이 여정 길이다.
 * 아직 답하지 않은 퀴즈에 닿으면 시간이 멈춘다. 답하는 순간 기준점(anchorAt, anchorDays)을 새로 찍는다.
 * 배속을 바꿀 때도 진행 중인 여정의 기준점을 새로 찍어서 진행이 튀거나 뒤로 가지 않게 한다.
 */
import { EVENT_DAYS, HIDDEN_DAYS, personDays } from './data/durations'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { buildTimeline, type TimelineItem } from './journey'
import { hash } from './random'

/** 게임 속 하루가 실제로 몇 ms인지 (1배 기준). 진행 속도는 여기 한 곳에서 바꾼다 */
export const MS_PER_DAY = 60_000

export const SPEEDS = [1, 3, 6] as const
export type Speed = (typeof SPEEDS)[number]
export const DEFAULT_SPEED: Speed = 1

/** 여정 길이(게임 날수)를 이 범위로 늘이거나 줄인다. 1배로 30~58분, 6배로 5~10분 */
export const MIN_JOURNEY_DAYS = 30
export const MAX_JOURNEY_DAYS = 58

export const isSpeed = (v: unknown): v is Speed => SPEEDS.includes(v as Speed)

/** 시계 계산에 필요한 여정 필드 (progress.ts의 Journey와 같은 모양) */
export interface TimedJourney {
  id: string
  name: string
  materialIds: string[]
  step: number
  quiz: Record<string, number>
  done: boolean
  /** 기준 시각(ms). 없으면 이 기능 전에 시작한 여정: 지금 칸에 멈춰 있는 것으로 본다 */
  anchorAt?: number
  /** 기준 시각까지 흐른 게임 날수 */
  anchorDays?: number
}

export interface Schedule {
  timeline: TimelineItem[]
  /** 칸마다 머무는 날수 */
  days: number[]
  /** 칸마다 시작하는 날 */
  starts: number[]
  total: number
}

function rawDays(item: TimelineItem, journeyId: string, i: number): number {
  if (item.type === 'quiz') return 0
  if (item.type === 'event') return EVENT_DAYS
  if (item.type === 'hidden') return HIDDEN_DAYS
  const d = personDays(item.personId)
  if (typeof d === 'number') return d
  const [lo, hi] = d
  return lo + (hash(`days:${journeyId}:${i}`) % (hi - lo + 1))
}

export function scheduleOf(timeline: TimelineItem[], journeyId: string): Schedule {
  const raw = timeline.map((item, i) => rawDays(item, journeyId, i))
  const sum = raw.reduce((a, b) => a + b, 0)
  const scale = sum > 0 ? Math.min(MAX_JOURNEY_DAYS, Math.max(MIN_JOURNEY_DAYS, sum)) / sum : 1
  const days = raw.map((d) => d * scale)
  const starts: number[] = []
  let at = 0
  for (const d of days) {
    starts.push(at)
    at += d
  }
  return { timeline, days, starts, total: at }
}

const cache = new Map<string, Schedule>()

/** 여정의 타임라인과 칸별 날수. 같은 여정은 늘 같다 (여정 id 시드) */
export function journeySchedule(j: Pick<TimedJourney, 'id' | 'name' | 'materialIds'>): Schedule {
  const key = `${j.id}|${j.name}|${j.materialIds.join(',')}`
  let s = cache.get(key)
  if (!s) {
    if (cache.size > 200) cache.clear()
    s = scheduleOf(buildTimeline(j.materialIds, j.id, j.name), j.id)
    cache.set(key, s)
  }
  return s
}

export interface JourneyClock {
  /** 지금 게임 날수 (여정 시작 = 0) */
  day: number
  /** 지금 보여 줄 타임라인 칸 */
  index: number
  /** 답하지 않은 퀴즈에서 멈춰 있는지 */
  waitingQuiz: boolean
  arrived: boolean
  /** 도착까지 남은 게임 날수 (앞으로 만날 퀴즈에서 기다리는 시간은 빼고) */
  remainingDays: number
  total: number
}

function rawDay(j: TimedJourney, now: number, speed: Speed, s: Schedule): number {
  if (j.anchorAt === undefined) return s.starts[Math.min(j.step, s.starts.length - 1)] ?? 0
  return (j.anchorDays ?? 0) + (Math.max(0, now - j.anchorAt) * speed) / MS_PER_DAY
}

export function journeyClock(j: TimedJourney, now: number, speed: Speed): JourneyClock {
  const s = journeySchedule(j)
  const n = s.timeline.length
  if (j.done || !n) return { day: s.total, index: Math.max(0, n - 1), waitingQuiz: false, arrived: true, remainingDays: 0, total: s.total }
  const day = Math.min(rawDay(j, now, speed, s), s.total)
  let index = 0
  for (let i = 0; i < n && s.starts[i]! <= day; i++) {
    const t = s.timeline[i]!
    if (t.type === 'quiz' && j.quiz[t.materialId] === undefined) {
      return { day: s.starts[i]!, index: i, waitingQuiz: true, arrived: false, remainingDays: s.total - s.starts[i]!, total: s.total }
    }
    index = i
  }
  return { day, index, waitingQuiz: false, arrived: day >= s.total, remainingDays: s.total - day, total: s.total }
}

/** 지금 배속으로 도착까지 남은 실제 시간(ms) */
export function remainingMs(clock: JourneyClock, speed: Speed): number {
  return (clock.remainingDays * MS_PER_DAY) / speed
}

/**
 * 기준점을 at 시각으로 새로 찍는다. 그 순간의 진행(speed 기준)은 그대로 두고, 이후로는 새 배속으로 흐르게 할 때 쓴다.
 * 기준점이 없는 예전 여정이나 at보다 나중에 찍힌 기준점은 건드리지 않는다.
 */
export function reanchor(j: TimedJourney, at: number, speed: Speed) {
  if (j.done || j.anchorAt === undefined || j.anchorAt >= at) return
  j.anchorDays = journeyClock(j, at, speed).day
  j.anchorAt = at
}

/** 기준점이 없는 예전 여정: 지금 칸의 시작 날에 맞춰 기준점을 채워서 지금부터 시간이 흐르게 한다 */
export function ensureAnchor(j: TimedJourney, now: number) {
  if (j.done || j.anchorAt !== undefined) return
  const s = journeySchedule(j)
  j.anchorDays = s.starts[Math.min(j.step, s.starts.length - 1)] ?? 0
  j.anchorAt = now
}

/** 퀴즈에 답한 순간: 퀴즈 칸의 시작 날부터 다시 흐른다 */
export function anchorAtQuiz(j: TimedJourney, materialId: string, now: number) {
  const s = journeySchedule(j)
  const i = s.timeline.findIndex((t) => t.type === 'quiz' && t.materialId === materialId)
  if (i < 0) return
  j.anchorDays = s.starts[i]!
  j.anchorAt = now
}

/** 타임라인 index 칸에서 물건이 있는 곳: 나라 이름 또는 '바다 위'. 이야기·퀴즈 칸은 바로 앞 사람의 자리 */
export function locationAt(timeline: TimelineItem[], index: number): string {
  for (let i = Math.min(index, timeline.length - 1); i >= 0; i--) {
    const t = timeline[i]!
    if (t.type !== 'stage' && t.type !== 'hidden') continue
    const place = PLACES[PEOPLE[t.personId]?.placeId ?? '']
    if (!place) return ''
    return place.continent === 'sea' ? '바다 위' : place.country
  }
  return ''
}
