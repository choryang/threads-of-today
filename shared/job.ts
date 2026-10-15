import { isJobId, type JobId } from './data/jobs'
import type { TodayRecord } from './progress'

/**
 * 하는 일 묻기 (docs/redesign/README.md): 하루 기록이 3일째 쌓인 날, 5번 화면(실을 묶었어요) 다음에 한 번만. 첫날에는 묻지 않는다.
 * 고르면 id, "말하지 않을래요"나 닫기는 'declined'. 어느 쪽이든 정해지면 다시 묻지 않는다.
 */
export interface JobChoice {
  value: JobId | 'declined'
  /** 고른 시각 (기기 사이 합칠 때 나중 것) */
  at: number
}

/** 이 날 물을지: 한마디를 건넨 오늘 기록이 있고, 기록이 3일 이상 쌓였고, 아직 정하지 않았을 때 */
export const JOB_ASK_DAY = 3
export function shouldAskJob(todays: Record<string, TodayRecord> | undefined, job: JobChoice | undefined, today: string): boolean {
  if (job) return false
  const today_ = todays?.[today]
  if (!today_ || today_.reply === undefined) return false
  return Object.keys(todays ?? {}).length >= JOB_ASK_DAY
}

/** 합치기: 고른 일이 declined보다 우선, 둘 다 일이면 나중 것 */
export function mergeJob(a: JobChoice | undefined, b: JobChoice | undefined): JobChoice | undefined {
  if (!a || !b) return a ?? b
  const ad = a.value === 'declined'
  const bd = b.value === 'declined'
  if (ad !== bd) return ad ? b : a
  return b.at > a.at ? b : a
}

export function sanitizeJob(v: unknown): JobChoice | undefined {
  if (!v || typeof v !== 'object') return undefined
  const r = v as Record<string, unknown>
  const value = r.value === 'declined' ? 'declined' : isJobId(r.value) ? r.value : undefined
  if (!value || typeof r.at !== 'number' || !Number.isFinite(r.at) || r.at < 0) return undefined
  return { value, at: r.at }
}
