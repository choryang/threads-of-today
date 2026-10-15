/**
 * 하는 일 (docs/redesign/README.md "하는 일 묻기"). 결말에서 "당신 같은 ○○"이 만든 것이 이야기 속 사람의 하루에 닿는 장면에 쓴다.
 * 서버에는 id만 간다. 결말의 반전은 화면에서 미리 말하지 않는다.
 * 만드는 일은 넷으로 나눈다: 제조(공장) · 농사·어업 · 공예(손으로 하나씩) · 창작(글·그림·음악·영상).
 * 예전의 '만들기'(make)는 제조로 옮긴다(LEGACY_JOBS).
 */
export const JOBS = [
  { id: 'office', label: '사무' },
  { id: 'dev', label: '개발' },
  { id: 'sales', label: '판매' },
  { id: 'teach', label: '가르치기' },
  { id: 'care', label: '돌봄' },
  { id: 'medical', label: '의료' },
  { id: 'transport', label: '운송' },
  { id: 'manufacture', label: '제조' },
  { id: 'farm', label: '농사·어업' },
  { id: 'craft', label: '공예' },
  { id: 'cook', label: '요리' },
  { id: 'create', label: '창작' },
  { id: 'study', label: '공부 중' },
  { id: 'rest', label: '쉬는 중' },
] as const

export type JobId = (typeof JOBS)[number]['id']
export const JOB_IDS = JOBS.map((j) => j.id) as JobId[]

export function isJobId(v: unknown): v is JobId {
  return typeof v === 'string' && (JOB_IDS as string[]).includes(v)
}

/** 예전 id → 지금 id. '만들기'(make)는 제조로 */
export const LEGACY_JOBS: Record<string, JobId> = { make: 'manufacture' }

/** 저장값의 일 id를 지금 id로 (모르는 값이면 undefined) */
export function normalizeJobId(v: unknown): JobId | undefined {
  if (isJobId(v)) return v
  return typeof v === 'string' ? LEGACY_JOBS[v] : undefined
}

export function jobLabel(id: JobId): string {
  return JOBS.find((j) => j.id === id)?.label ?? ''
}
