import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MATERIALS } from '../shared/data/materials'
import { buildTimeline, quizFor, quizzesOf } from '../shared/journey'
import { dayStats, findLinkCards } from '../shared/logic'

const ids = (n: number) => Array.from({ length: n }, (_, i) => `2026-10-14-1-${i.toString(36).padStart(4, '0')}`)

test('같은 여정 id면 늘 같은 타임라인', () => {
  for (const id of ids(50)) assert.deepEqual(buildTimeline(['coffee', 'banana'], id), buildTimeline(['coffee', 'banana'], id))
})

test('예전 여정 id는 기본 경로·첫 퀴즈·이벤트 없음', () => {
  for (const old of ['2026-10-14-1', '2026-10-14-3abcd']) {
    const t = buildTimeline(['coffee'], old)
    assert.deepEqual(t, buildTimeline(['coffee']))
    assert.ok(t.every((x) => x.type === 'stage' || (x.type === 'quiz' && x.quizIndex === 0)))
  }
})

test('첫 칸은 늘 사람, 출발지 변형이 실제로 나온다', () => {
  const firsts = new Set<string>()
  for (const id of ids(300)) {
    const t = buildTimeline(['coffee'], id)
    assert.equal(t[0]?.type, 'stage')
    if (t[0]?.type === 'stage') firsts.add(t[0].personId)
  }
  assert.deepEqual([...firsts].sort(), ['br-coffee-farmer', 'co-coffee-farmer', 'coffee-picker', 'vn-coffee-farmer'])
})

test('퀴즈 변형: 타임라인의 퀴즈와 quizFor가 같고, 여러 변형이 나온다', () => {
  const seen = new Set<string>()
  for (const id of ids(200)) {
    const q = quizFor(['coffee'], id, 'coffee')!
    assert.ok(quizzesOf(MATERIALS.coffee!).includes(q))
    seen.add(q.q)
  }
  assert.equal(seen.size, quizzesOf(MATERIALS.coffee!).length)
})

test('통계·연결 카드는 그 여정의 실제 경로로 센다', () => {
  const id = ids(300).find((x) => buildTimeline(['coffee'], x)[0]?.type === 'stage' && (buildTimeline(['coffee'], x)[0] as { personId: string }).personId === 'co-coffee-farmer')!
  assert.ok(dayStats([{ materialIds: ['coffee'], id }]).countries.includes('콜롬비아'))
  assert.ok(!dayStats([{ materialIds: ['coffee'] }]).countries.includes('콜롬비아'))
  assert.ok(findLinkCards([{ materialIds: ['cobalt', 'lithium'] }]).includes('link-cn-refinery'))
})
