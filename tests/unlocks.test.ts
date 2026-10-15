import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { emptySave, type Save } from '../shared/progress'
import { UNLOCK_STEPS, conditionMet, isOpen, openSteps, pendingNotices, silentSeen, unlockStats, type UnlockStats } from '../shared/unlocks'

const TODAY = '2026-10-15'
const stage = PEOPLE_LIST.filter((p) => p.kind === 'stage').map((p) => p.id)
const stats = (journeys: number, bestFriend = false): UnlockStats => ({ journeys, bestFriend })
/** 주민 n명, 마친 여정 j개인 진행 상황 */
function saveWith(n: number, j = 1): Save {
  const cards = Object.fromEntries(stage.slice(0, n).map((id) => [id, TODAY]))
  const journeys = Array.from({ length: j }, (_, i) => ({ id: `${TODAY}-${i + 1}-ab`, name: '커피', source: 'pick' as const, materialIds: ['coffee'], step: 0, quiz: {}, newCards: [], done: true }))
  return { ...emptySave(), cards, days: { [TODAY]: { journeys, linkCards: [] } } }
}

test('열림 표: 문서 순서 그대로, 첫날만 알림이 없다', () => {
  assert.deepEqual(UNLOCK_STEPS.map((s) => s.id), ['day1', 'second-journey', 'journeys-3', 'journeys-5', 'journeys-7', 'journeys-10', 'first-best'])
  assert.equal(UNLOCK_STEPS.filter((s) => !s.notice).map((s) => s.id).join(), 'day1')
  // 기능 하나는 한 단계에만
  const features = UNLOCK_STEPS.flatMap((s) => s.features)
  assert.equal(new Set(features).size, features.length)
})

test('조건 판정: 마친 여정 수와 첫 단짝', () => {
  assert.ok(isOpen('journey', stats(0)))
  assert.ok(isOpen('thanks', stats(0)))
  // 첫 여정 뒤에는 아무것도 열리지 않고, 두 번째 여정 뒤에 하나
  assert.deepEqual(openSteps(stats(1)), ['day1'])
  assert.deepEqual(openSteps(stats(2)), ['day1', 'second-journey'])
  for (const f of ['friendship', 'dex', 'rarity-badge', 'work-fact'] as const) assert.ok(!isOpen(f, stats(2)) && isOpen(f, stats(3)), f)
  for (const f of ['invite', 'flowers', 'others-thanks', 'today-count'] as const) assert.ok(!isOpen(f, stats(4)) && isOpen(f, stats(5)), f)
  assert.ok(!isOpen('mystery', stats(6)) && isOpen('mystery', stats(7)))
  assert.ok(!isOpen('records', stats(9)) && isOpen('records', stats(10)) && isOpen('sets', stats(10)))
  assert.ok(!isOpen('intro', stats(200)) && isOpen('intro', stats(1, true)) && isOpen('workplace', stats(1, true)))
  assert.ok(conditionMet({}, stats(0)))
})

test('진행 상황에서 숫자: 마친 여정, 30일 넘은 여정은 처음 떠난 물건 수로 센다, 첫 단짝', () => {
  assert.deepEqual(unlockStats(saveWith(6, 2)), { journeys: 2, bestFriend: false })
  // 여정 기록이 지워진 오래된 사용자: 처음 떠난 물건 3개 → 적어도 2개는 마쳤다
  assert.equal(unlockStats({ ...emptySave(), cards: { [stage[0]!]: TODAY }, items: { 커피: '2026-01-01', 라면: '2026-01-02', 사과: '2026-01-03' } }).journeys, 2)
  // 첫 단짝: 퀴즈까지 맞혀 100%
  const best = saveWith(1)
  best.people = { [stage[0]!]: { metItems: ['a', 'b', 'c'], gratitudeDays: ['2026-10-01', '2026-10-02', '2026-10-03'], quizCorrect: true } }
  assert.equal(unlockStats(best).bestFriend, true)
})

test('알림: 새로 열린 것만 표 순서로, 본 것은 다시 안 띄운다', () => {
  assert.deepEqual(pendingNotices(stats(1), []), [])
  assert.deepEqual(pendingNotices(stats(5), []).map((s) => s.id), ['second-journey', 'journeys-3', 'journeys-5'])
  assert.deepEqual(pendingNotices(stats(5), ['second-journey', 'journeys-3']).map((s) => s.id), ['journeys-5'])
})

test('기존 사용자는 조용히 열고, 새 사용자는 빈 목록에서 시작한다', () => {
  assert.deepEqual(silentSeen(emptySave()), [])
  assert.deepEqual(silentSeen(saveWith(12, 5)), ['day1', 'second-journey', 'journeys-3', 'journeys-5'])
  assert.deepEqual(pendingNotices(stats(7), silentSeen(saveWith(12, 5))).map((s) => s.id), ['journeys-7'])
})
