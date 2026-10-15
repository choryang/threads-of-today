import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergeJob, sanitizeJob, shouldAskJob } from '../shared/job'
import { emptySave, mergeSaves, sanitizeSave, type Save, type TodayRecord } from '../shared/progress'

const rec = (reply?: number): TodayRecord => ({ mood: 'tired', item: '라면', personId: 'courier', episode: 0, ...(reply !== undefined ? { reply } : {}) })
const days = (n: number, todayReply = true): Record<string, TodayRecord> =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [`2026-10-${String(10 + i).padStart(2, '0')}`, rec(i === n - 1 && !todayReply ? undefined : 0)]))
const dayOf = (n: number) => `2026-10-${String(9 + n).padStart(2, '0')}`

test('하는 일은 하루 기록이 3일째 쌓인 날, 한마디를 건넨 뒤에 한 번만 묻는다', () => {
  assert.equal(shouldAskJob(days(1), undefined, dayOf(1)), false, '첫날')
  assert.equal(shouldAskJob(days(2), undefined, dayOf(2)), false, '둘째 날')
  assert.equal(shouldAskJob(days(3), undefined, dayOf(3)), true, '셋째 날')
  assert.equal(shouldAskJob(days(3, false), undefined, dayOf(3)), false, '한마디를 건네기 전')
  assert.equal(shouldAskJob(days(3), undefined, '2026-10-20'), false, '오늘 기록이 없는 날')
  // 한 번 정하면(고르든 말하지 않든) 다시 묻지 않는다
  assert.equal(shouldAskJob(days(3), { value: 'dev', at: 1 }, dayOf(3)), false)
  assert.equal(shouldAskJob(days(4), { value: 'declined', at: 1 }, dayOf(4)), false)
  assert.equal(shouldAskJob(days(9), { value: 'declined', at: 1 }, dayOf(9)), false)
})

test('하는 일 합치기: 고른 일이 declined보다 우선, 둘 다 일이면 나중 것. 검사는 id만', () => {
  assert.deepEqual(mergeJob({ value: 'declined', at: 9 }, { value: 'dev', at: 1 }), { value: 'dev', at: 1 })
  assert.deepEqual(mergeJob({ value: 'cook', at: 1 }, { value: 'declined', at: 9 }), { value: 'cook', at: 1 })
  assert.deepEqual(mergeJob({ value: 'cook', at: 1 }, { value: 'dev', at: 2 }), { value: 'dev', at: 2 })
  assert.deepEqual(mergeJob({ value: 'cook', at: 3 }, { value: 'dev', at: 2 }), { value: 'cook', at: 3 })
  assert.equal(mergeJob(undefined, undefined), undefined)
  const a: Save = { ...emptySave(), job: { value: 'declined', at: 5 } }
  const b: Save = { ...emptySave(), job: { value: 'teach', at: 1 } }
  assert.deepEqual(mergeSaves(a, b, '2026-10-15').job, { value: 'teach', at: 1 })
  assert.equal('job' in mergeSaves(emptySave(), emptySave(), '2026-10-15'), false)
  assert.equal(sanitizeJob({ value: 'astronaut', at: 1 }), undefined)
  assert.equal(sanitizeJob({ value: 'dev' }), undefined)
  assert.deepEqual(sanitizeSave({ ...emptySave(), job: { value: 'declined', at: 3, note: 'x' } }, '2026-10-15')?.job, { value: 'declined', at: 3 })
})
