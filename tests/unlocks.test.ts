import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { emptySave, type Save } from '../shared/progress'
import {
  UNLOCK_STEPS, conditionMet, isOpen, nextUnlock, openSteps, pendingNotices, silentUnlocks, unlockStats,
  type UnlockStats, type UnlockStepId, type UnlockedOn,
} from '../shared/unlocks'

const TODAY = '2026-10-15'
const stage = PEOPLE_LIST.filter((p) => p.kind === 'stage').map((p) => p.id)
const stats = (journeys: number, bestFriend = false): UnlockStats => ({ journeys, bestFriend })
/** 주민 n명, 마친 여정 j개인 진행 상황 */
function saveWith(n: number, j = 1): Save {
  const cards = Object.fromEntries(stage.slice(0, n).map((id) => [id, TODAY]))
  const journeys = Array.from({ length: j }, (_, i) => ({ id: `${TODAY}-${i + 1}-ab`, name: '커피', source: 'pick' as const, materialIds: ['coffee'], step: 0, quiz: {}, newCards: [], done: true }))
  return { ...emptySave(), cards, days: { [TODAY]: { journeys, linkCards: [] } } }
}
/** 서울 날짜 n일 뒤 */
const dayAfter = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
/** 그날 열 단계를 적어 가며 하루씩 넘긴다 (앱의 감시가 하는 일) */
function advance(s: UnlockStats, unlockedOn: UnlockedOn, today: string): UnlockedOn {
  const id = nextUnlock(s, unlockedOn, today)
  return id ? { ...unlockedOn, [id]: today } : unlockedOn
}

test('열림 표: 문서 순서 그대로, 첫날만 알림이 없다', () => {
  assert.deepEqual(UNLOCK_STEPS.map((s) => s.id), ['day1', 'second-journey', 'journeys-3', 'journeys-5', 'journeys-7', 'journeys-10', 'first-best'])
  assert.equal(UNLOCK_STEPS.filter((s) => !s.notice).map((s) => s.id).join(), 'day1')
  const features = UNLOCK_STEPS.flatMap((s) => s.features)
  assert.equal(new Set(features).size, features.length)
})

test('조건 판정: 마친 여정 수와 첫 단짝 (하루 하나 규칙과 따로)', () => {
  assert.ok(conditionMet({}, stats(0)))
  assert.ok(!conditionMet(UNLOCK_STEPS[1]!.when, stats(1)) && conditionMet(UNLOCK_STEPS[1]!.when, stats(2)))
  const step = (id: UnlockStepId) => UNLOCK_STEPS.find((s) => s.id === id)!
  for (const [id, n] of [['journeys-3', 3], ['journeys-5', 5], ['journeys-7', 7], ['journeys-10', 10]] as const) {
    assert.ok(!conditionMet(step(id).when, stats(n - 1)) && conditionMet(step(id).when, stats(n)), id)
  }
  assert.ok(!conditionMet(step('first-best').when, stats(200)) && conditionMet(step('first-best').when, stats(0, true)))
})

test('기능: 열린 단계의 기능만 (첫날 기능은 늘)', () => {
  const open = openSteps(stats(3), { 'second-journey': '2026-10-14' }, TODAY)
  assert.deepEqual(open, ['day1', 'second-journey', 'journeys-3'])
  assert.ok(isOpen('journey', ['day1']) && isOpen('thanks', ['day1']))
  for (const f of ['friendship', 'dex', 'rarity-badge', 'work-fact'] as const) assert.ok(isOpen(f, open), f)
  for (const f of ['invite', 'flowers', 'others-thanks', 'today-count', 'mystery', 'records', 'sets', 'intro', 'workplace'] as const) assert.ok(!isOpen(f, open), f)
})

test('첫날: 첫 여정 뒤 열림 0개, 두 번째 여정 뒤 1개', () => {
  assert.deepEqual(openSteps(stats(1), {}, TODAY), ['day1'])
  assert.deepEqual(openSteps(stats(2), {}, TODAY), ['day1', 'second-journey'])
  assert.deepEqual(pendingNotices(openSteps(stats(1), {}, TODAY), []), [])
  assert.deepEqual(pendingNotices(openSteps(stats(2), {}, TODAY), []).map((s) => s.id), ['second-journey'])
})

test('하루에 하나씩: 오늘 이미 열었으면 내일, 여러 개를 넘었으면 앞 단계부터 하루에 하나씩 (서울 날짜)', () => {
  // 하루에 여정 10번을 마쳐도 오늘은 두 번째 여정 단계 하나만
  let on: UnlockedOn = advance(stats(10), {}, TODAY)
  assert.deepEqual(on, { 'second-journey': TODAY })
  assert.equal(nextUnlock(stats(10), on, TODAY), null)
  assert.deepEqual(openSteps(stats(10), on, TODAY), ['day1', 'second-journey'])
  // 다음 날부터 하나씩
  const order: string[] = []
  for (let d = 1; d <= 6; d++) {
    const day = dayAfter(TODAY, d)
    const before = on
    on = advance(stats(10), on, day)
    order.push(Object.keys(on).find((k) => !before[k]) ?? '-')
  }
  assert.deepEqual(order, ['journeys-3', 'journeys-5', 'journeys-7', 'journeys-10', '-', '-'])
  // 연 단계는 계속 열려 있다
  assert.deepEqual(openSteps(stats(10), on, dayAfter(TODAY, 6)), ['day1', 'second-journey', 'journeys-3', 'journeys-5', 'journeys-7', 'journeys-10'])
  // 첫 단짝도 같은 줄에 선다 (그날 이미 하나를 열었으면 다음 날)
  assert.equal(nextUnlock(stats(10, true), on, dayAfter(TODAY, 6)), 'first-best')
  assert.equal(nextUnlock(stats(10, true), { ...on, 'journeys-10': dayAfter(TODAY, 6) }, dayAfter(TODAY, 6)), null)
  // 조건을 아직 못 넘었으면 열리지 않는다
  assert.equal(nextUnlock(stats(1), {}, TODAY), null)
})

test('알림: 열린 단계 중 아직 안 본 것만', () => {
  const open: UnlockStepId[] = ['day1', 'second-journey', 'journeys-3']
  assert.deepEqual(pendingNotices(open, ['second-journey']).map((s) => s.id), ['journeys-3'])
  assert.deepEqual(pendingNotices(open, ['second-journey', 'journeys-3']), [])
})

test('진행 상황에서 숫자: 마친 여정, 30일 넘은 여정은 처음 떠난 물건 수로 센다, 첫 단짝', () => {
  assert.deepEqual(unlockStats(saveWith(6, 2)), { journeys: 2, bestFriend: false })
  assert.equal(unlockStats({ ...emptySave(), cards: { [stage[0]!]: TODAY }, items: { 커피: '2026-01-01', 라면: '2026-01-02', 사과: '2026-01-03' } }).journeys, 2)
  const best = saveWith(1)
  best.people = { [stage[0]!]: { metItems: ['a', 'b', 'c'], gratitudeDays: ['2026-10-01', '2026-10-02', '2026-10-03'], quizCorrect: true } }
  assert.equal(unlockStats(best).bestFriend, true)
})

test('기존 사용자는 하루 하나 규칙 없이 오늘 한꺼번에 조용히 연다, 새 사용자는 빈 기록', () => {
  assert.deepEqual(silentUnlocks(emptySave(), TODAY), { unlockSeen: [], unlockedOn: {} })
  const q = silentUnlocks(saveWith(12, 5), TODAY)
  assert.deepEqual(q.unlockSeen, ['day1', 'second-journey', 'journeys-3', 'journeys-5'])
  assert.deepEqual(q.unlockedOn, { 'second-journey': TODAY, 'journeys-3': TODAY, 'journeys-5': TODAY })
  // 조용히 연 단계는 모두 열려 있고 알림은 없다. 다음 단계는 내일부터
  const open = openSteps(stats(7), q.unlockedOn, TODAY)
  assert.deepEqual(open, ['day1', 'second-journey', 'journeys-3', 'journeys-5'])
  assert.deepEqual(pendingNotices(open, q.unlockSeen), [])
  assert.equal(nextUnlock(stats(7), q.unlockedOn, dayAfter(TODAY, 1)), 'journeys-7')
})
