import { holidayOf, isWeekend } from './data/calendar'
import { DEFAULT_HOURS, DOING, DOING_DEFAULT, EVE_HOURS, type DoingBucket } from './data/doing'
import { withJosa } from './logic'

/**
 * 지금 그곳의 시각 (여정 화면 위쪽 하늘). 시간대는 shared/data/places.ts의 tz.
 * 시간대 표(하늘색·덧씌우는 색·섞는 방식)는 문서 '여정 장면 스타일 가이드'를 그대로 옮겼다.
 */

export const SEOUL_TZ = 'Asia/Seoul'

export interface Clock {
  h: number
  m: number
}

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(tz: string) {
  let f = formatters.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })
    formatters.set(tz, f)
  }
  return f
}

function partsAt(tz: string, now: Date) {
  const out = { y: 0, mo: 0, d: 0, h: 0, m: 0 }
  for (const p of formatter(tz).formatToParts(now)) {
    if (p.type === 'year') out.y = Number(p.value)
    else if (p.type === 'month') out.mo = Number(p.value)
    else if (p.type === 'day') out.d = Number(p.value)
    else if (p.type === 'hour') out.h = Number(p.value) % 24
    else if (p.type === 'minute') out.m = Number(p.value)
  }
  return out
}

/** 그곳의 오늘 날짜('YYYY-MM-DD')와 요일(0 일요일 ~ 6 토요일) */
export function localDay(tz: string, now: Date): { ymd: string; weekday: number } {
  const p = partsAt(tz, now)
  const ymd = `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
  return { ymd, weekday: new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay() }
}

export interface DayInfo {
  /** 그 나라의 공휴일 이름 */
  holiday?: string
  weekend: boolean
}

/** 그곳의 오늘이 공휴일·주말인지 (나라가 없는 바다는 둘 다 아님) */
export function dayInfo(country: string, tz: string, now: Date): DayInfo {
  const { ymd, weekday } = localDay(tz, now)
  return { holiday: holidayOf(country, ymd), weekend: isWeekend(country, weekday) }
}

/** 시계 상자 한 줄: '오늘은 메스켈이에요' */
export function holidayLine(holiday: string): string {
  return `오늘은 ${withJosa(holiday, '이에요', '예요')}`
}

/** 그 시간대의 지금 시각 */
export function clockAt(tz: string, now: Date): Clock {
  const p = partsAt(tz, now)
  return { h: p.h, m: p.m }
}

/** UTC와의 차이(분). 서머타임도 그날 기준으로 */
export function utcOffsetMinutes(tz: string, now: Date): number {
  const p = partsAt(tz, now)
  const local = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.m)
  const utc = Math.floor(now.getTime() / 60000) * 60000
  return Math.round((local - utc) / 60000)
}

/** '오전 6:05' · '오후 12:05' · '오전 12:00'(자정) */
export function clockLabel(c: Clock): string {
  const hh = c.h % 12 === 0 ? 12 : c.h % 12
  return `${c.h < 12 ? '오전' : '오후'} ${hh}:${String(c.m).padStart(2, '0')}`
}

/** 그곳이 서울보다 몇 시간 빠르고 늦은지: '같은 시각' · '6시간 늦어요' · '3시간 30분 늦어요' */
export function seoulDiffText(tz: string, now: Date): string {
  const d = utcOffsetMinutes(tz, now) - utcOffsetMinutes(SEOUL_TZ, now)
  if (d === 0) return '같은 시각'
  const a = Math.abs(d)
  const h = Math.floor(a / 60)
  const m = a % 60
  const span = [h ? `${h}시간` : '', m ? `${m}분` : ''].filter(Boolean).join(' ')
  return `${span} ${d > 0 ? '빨라요' : '늦어요'}`
}

// ── 하늘: 가이드의 시간대 표 ──

export type SkyPhase = 'night' | 'dawn' | 'day' | 'sunset' | 'evening'

export interface SkyLook {
  /** 이름 (가이드 표의 시간대) */
  label: string
  /** 그림이 없을 때의 단색 하늘 */
  sky: string
  /** 그림 위에 덧씌우는 색. 낮은 없음 */
  overlay?: { color: string; blend: 'multiply' | 'soft-light'; opacity: number }
  /** 별 개수 (밤 여러 개, 저녁 첫 별 하나) */
  stars: number
}

/** 밤 20~5시 · 새벽 5~7시 · 낮 7~17시 · 노을 17~19시 · 저녁 19~20시 */
export const SKY: Record<SkyPhase, SkyLook> = {
  night: { label: '밤', sky: '#1B2440', overlay: { color: '#1B2440', blend: 'multiply', opacity: 0.75 }, stars: 5 },
  dawn: { label: '새벽', sky: '#6B5B95', overlay: { color: '#6B5B95', blend: 'multiply', opacity: 0.45 }, stars: 0 },
  day: { label: '낮', sky: '#9ED3EE', stars: 0 },
  sunset: { label: '노을', sky: '#F2A97B', overlay: { color: '#F2A97B', blend: 'soft-light', opacity: 0.6 }, stars: 0 },
  evening: { label: '저녁', sky: '#3E4A7A', overlay: { color: '#3E4A7A', blend: 'multiply', opacity: 0.55 }, stars: 1 },
}

export function skyPhase(h: number): SkyPhase {
  if (h < 5 || h >= 20) return 'night'
  if (h < 7) return 'dawn'
  if (h < 17) return 'day'
  if (h < 19) return 'sunset'
  return 'evening'
}

/**
 * 해·달의 자리. 해는 새벽 5시에 왼쪽에서 떠서 19시에 오른쪽으로 지고(새벽·노을엔 낮게), 그 밖엔 달이 같은 길을 간다.
 * x는 왼쪽 끝 0 ~ 오른쪽 끝 1, lift는 가장 높을 때 1 (지평선 0)
 */
export function orbAt(c: Clock): { kind: 'sun' | 'moon'; x: number; lift: number } {
  const t = c.h + c.m / 60
  const sun = t >= 5 && t < 19
  const f = sun ? (t - 5) / 14 : (((t - 19) + 24) % 24) / 10
  return { kind: sun ? 'sun' : 'moon', x: f, lift: Math.sin(Math.PI * f) }
}

// ── 지금은 아마 …: 일하는 시간(사람마다, 기본 7~18시), 끝나고 4시간은 저녁·쉬는 시간, 그 밖은 잠 ──

/** h가 [start, end) 안인지. end가 start보다 작으면 자정을 넘긴다 */
function within(h: number, start: number, end: number): boolean {
  return start <= end ? h >= start && h < end : h >= start || h < end
}

export function doingBucket(h: number, hours: [number, number] = DEFAULT_HOURS): DoingBucket {
  const [start, end] = hours
  if (within(h, start, end)) return 'work'
  if (within(h, end, (end + EVE_HOURS) % 24)) return 'eve'
  return 'sleep'
}

/**
 * '지금은 아마 커피 밭에서 열매를 따고 있을 거예요'. 그 사람 문구가 없으면 일반 문구.
 * 평일에만 일하는 사람이 공휴일·주말의 일하는 시간이면 쉬는 문구
 */
export function doingLine(personId: string, h: number, day?: DayInfo): string {
  const d = DOING[personId]
  const b = doingBucket(h, d?.hours)
  if (b === 'work' && d?.days === 'weekdays' && day) {
    if (day.holiday) return `오늘은 ${withJosa(day.holiday, '이라', '라')} 아마 쉬고 있을 거예요`
    if (day.weekend) return DOING_DEFAULT.off
  }
  return `지금은 아마 ${d?.[b] ?? DOING_DEFAULT[b]}`
}

/** 개발용: 그곳 시각이 hh:mm이 되도록 옮긴 지금 (?clock=05:30) */
export function shiftToLocal(now: Date, tz: string, target: Clock): Date {
  const c = clockAt(tz, now)
  return new Date(now.getTime() + ((target.h * 60 + target.m) - (c.h * 60 + c.m)) * 60000)
}

/** 개발용: 그곳 날짜가 ymd가 되도록 날 수만큼 옮긴 지금 (?date=2026-09-27). 형식이 틀리면 그대로 */
export function shiftToLocalDate(now: Date, tz: string, ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return now
  const [y, mo, d] = localDay(tz, now).ymd.split('-').map(Number)
  const days = Math.round((Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - Date.UTC(y!, mo! - 1, d!)) / 86_400_000)
  return new Date(now.getTime() + days * 86_400_000)
}

/** '05:30' · '5:30' · '17' → 시각. 아니면 undefined */
export function parseClock(s: string | undefined | null): Clock | undefined {
  const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(s ?? '')
  if (!m) return undefined
  const h = Number(m[1])
  const min = Number(m[2] ?? 0)
  return h < 24 && min < 60 ? { h, m: min } : undefined
}
