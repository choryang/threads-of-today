import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { emptySave } from '../shared/progress'
import { summarize } from '../scripts/user-stats-summary'

const stage = PEOPLE_LIST.filter((p) => p.kind === 'stage').map((p) => p.id)
const cards = (n: number) => Object.fromEntries(stage.slice(0, n).map((id) => [id, '2026-10-15']))
const done = { '2026-10-15': { journeys: [{ id: '2026-10-15-1-ab', name: '커피', source: 'pick' as const, materialIds: ['coffee'], step: 0, quiz: {}, newCards: [], done: true }], linkCards: [] } }

test('사용자 현황 집계: 숫자만, 날짜별·여정 마친 수·주민 수 구간·공유 링크 종류별', () => {
  const s = summarize(
    [
      { createdAt: '2026-10-14', save: emptySave() },
      { createdAt: '2026-10-15', save: { ...emptySave(), cards: cards(3), days: done } },
      { createdAt: '2026-10-15', save: { ...emptySave(), cards: { ...cards(12), 'link-sea-crew': '2026-10-15' } } },
      { createdAt: '2026-10-15', save: { ...emptySave(), cards: cards(60), days: done } },
      { save: undefined },
      null,
    ],
    [{ kind: 'day' }, { kind: 'day' }, { kind: 'village' }, { kind: 'person' }, { kind: 'other' }, null],
  )
  assert.equal(s.users, 5)
  assert.deepEqual(s.byDate, [['(날짜 없음)', 1], ['2026-10-14', 1], ['2026-10-15', 3]])
  assert.equal(s.journeyed, 2)
  // 연결 카드는 주민이 아니다
  assert.deepEqual(s.residents, { '0명': 2, '1~9명': 1, '10~49명': 1, '50명 이상': 1 })
  assert.deepEqual(s.shares, { day: 2, person: 1, village: 1 })
  // 결과에는 숫자와 날짜만 (사용자 정보가 섞이지 않는다)
  assert.ok(!JSON.stringify(s).includes('u_'))
})
