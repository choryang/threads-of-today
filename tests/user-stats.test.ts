import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptySave, type TodayRecord } from '../shared/progress'
import { summarize } from '../scripts/user-stats-summary'

const rec = { mood: 'tired', item: '라면', personId: 'barista', episode: null, how: 'none' } as unknown as TodayRecord
const todays = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`2026-10-${String(1 + i).padStart(2, '0')}`, rec]))

test('사용자 현황 집계: 숫자만, 날짜별·하루 기록 날 수 구간·공유 링크 종류별', () => {
  const s = summarize(
    [
      { createdAt: '2026-10-14', save: emptySave() },
      { createdAt: '2026-10-15', save: { ...emptySave(), todays: todays(1) } },
      { createdAt: '2026-10-15', save: { ...emptySave(), todays: todays(3) } },
      { createdAt: '2026-10-15', save: { ...emptySave(), todays: todays(9) } },
      { save: undefined },
      null,
    ],
    [{ kind: 'thread' }, { kind: 'thread' }, { kind: 'day' }, { kind: 'village' }, null],
  )
  assert.equal(s.users, 5)
  assert.deepEqual(s.byDate, [['(날짜 없음)', 1], ['2026-10-14', 1], ['2026-10-15', 3]])
  assert.equal(s.recorded, 3)
  assert.deepEqual(s.days, { '0일': 2, '1일': 1, '2~6일': 1, '7일 이상': 1 })
  assert.deepEqual(s.shares, { thread: 2, old: 2 })
  // 결과에는 숫자와 날짜만 (사용자 정보가 섞이지 않는다)
  assert.ok(!JSON.stringify(s).includes('u_'))
})
