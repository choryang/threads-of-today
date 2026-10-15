import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { emptySave, type Save } from '../shared/progress'
import { UNLOCK_STEPS, conditionMet, isOpen, openSteps, pendingNotices, silentSeen, unlockStats, type UnlockStats } from '../shared/unlocks'

const TODAY = '2026-10-15'
const stage = PEOPLE_LIST.filter((p) => p.kind === 'stage').map((p) => p.id)
const stats = (residents: number, journeys = 1, bestFriend = false): UnlockStats => ({ residents, journeys, bestFriend })
/** 주민 n명, 마친 여정 j개인 진행 상황 */
function saveWith(n: number, j = 1): Save {
  const cards = Object.fromEntries(stage.slice(0, n).map((id) => [id, TODAY]))
  const journeys = Array.from({ length: j }, (_, i) => ({ id: `${TODAY}-${i + 1}-ab`, name: '커피', source: 'pick' as const, materialIds: ['coffee'], step: 0, quiz: {}, newCards: [], done: true }))
  return { ...emptySave(), cards, days: { [TODAY]: { journeys, linkCards: [] } } }
}

test('열림 표: 문서 순서 그대로, 첫날만 알림이 없다', () => {
  assert.deepEqual(UNLOCK_STEPS.map((s) => s.id), ['day1', 'second-journey', 'residents-5', 'residents-10', 'residents-15', 'residents-20', 'first-best'])
  assert.equal(UNLOCK_STEPS.filter((s) => !s.notice).map((s) => s.id).join(), 'day1')
  // 기능 하나는 한 단계에만
  const features = UNLOCK_STEPS.flatMap((s) => s.features)
  assert.equal(new Set(features).size, features.length)
})

test('조건 판정: 주민 수·마친 여정 수·첫 단짝', () => {
  assert.ok(isOpen('journey', stats(0, 0)))
  assert.ok(isOpen('thanks', stats(0, 0)))
  assert.ok(!isOpen('journey-extras', stats(3, 0)))
  assert.ok(isOpen('journey-extras', stats(3, 1)))
  assert.ok(!isOpen('friendship', stats(4)))
  assert.ok(isOpen('friendship', stats(5)) && isOpen('dex', stats(5)))
  assert.ok(!isOpen('invite', stats(9)) && isOpen('invite', stats(10)) && isOpen('flowers', stats(10)) && isOpen('today-count', stats(10)))
  // 사람 카드: 다른 사람들의 고마움도 모두의 오늘과 같이 주민 10명
  assert.ok(!isOpen('others-thanks', stats(9)) && isOpen('others-thanks', stats(10)))
  assert.ok(!isOpen('mystery', stats(14)) && isOpen('mystery', stats(15)))
  assert.ok(!isOpen('records', stats(19)) && isOpen('records', stats(20)) && isOpen('sets', stats(20)))
  assert.ok(!isOpen('intro', stats(200)) && isOpen('intro', stats(1, 1, true)) && isOpen('workplace', stats(1, 1, true)))
  assert.ok(conditionMet({}, stats(0, 0)))
  assert.deepEqual(openSteps(stats(12)), ['day1', 'second-journey', 'residents-5', 'residents-10'])
})

test('진행 상황에서 숫자: 연결 카드는 주민이 아니고, 30일 넘은 여정은 처음 떠난 물건 수로 센다', () => {
  const s = saveWith(6, 2)
  s.cards['link-sea-crew'] = TODAY
  assert.deepEqual(unlockStats(s), { residents: 6, journeys: 2, bestFriend: false })
  // 여정 기록이 지워진 오래된 사용자: 처음 떠난 물건 3개 → 적어도 2개는 마쳤다
  assert.equal(unlockStats({ ...emptySave(), cards: { [stage[0]!]: TODAY }, items: { 커피: '2026-01-01', 라면: '2026-01-02', 사과: '2026-01-03' } }).journeys, 2)
  // 첫 단짝: 퀴즈까지 맞혀 100%
  const best = saveWith(1)
  best.people = { [stage[0]!]: { metItems: ['a', 'b', 'c'], gratitudeDays: ['2026-10-01', '2026-10-02', '2026-10-03'], quizCorrect: true } }
  assert.equal(unlockStats(best).bestFriend, true)
})

test('알림: 새로 열린 것만 표 순서로, 본 것은 다시 안 띄운다', () => {
  assert.deepEqual(pendingNotices(stats(0, 0), []), [])
  assert.deepEqual(pendingNotices(stats(10, 1), []).map((s) => s.id), ['second-journey', 'residents-5', 'residents-10'])
  assert.deepEqual(pendingNotices(stats(10, 1), ['second-journey', 'residents-5']).map((s) => s.id), ['residents-10'])
  assert.deepEqual(pendingNotices(stats(10, 1), ['second-journey', 'residents-5', 'residents-10']), [])
})

test('기존 사용자는 조용히 열고, 새 사용자는 빈 목록에서 시작한다', () => {
  assert.deepEqual(silentSeen(emptySave()), [])
  assert.deepEqual(silentSeen(saveWith(12, 3)), ['day1', 'second-journey', 'residents-5', 'residents-10'])
  // 조용히 연 뒤에는 그 다음 단계부터 알림
  assert.deepEqual(pendingNotices(stats(15, 3), silentSeen(saveWith(12, 3))).map((s) => s.id), ['residents-15'])
})
