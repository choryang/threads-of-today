import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emptySave, mergeSaves, sanitizeSave, type Journey, type Save } from '../shared/progress'
import {
  MAX_JOURNEY_DAYS, MIN_JOURNEY_DAYS, MS_PER_DAY, anchorAtQuiz, ensureAnchor, journeyClock, journeySchedule, reanchor, type Speed,
} from '../shared/timing'

const TODAY = '2026-10-14'
const T0 = 1_800_000_000_000

/** 커피 한 잔: 새 여정 id라 퀴즈·가게 사람까지 붙는다 */
const make = (over: Partial<Journey> = {}): Journey => ({
  id: `${TODAY}-1-k3x9`, name: '아메리카노', source: 'pick', materialIds: ['coffee'],
  step: 0, quiz: {}, newCards: [], done: false, anchorAt: T0, anchorDays: 0, ...over,
})
const at = (days: number, speed: Speed = 1) => T0 + (days * MS_PER_DAY) / speed
const quizIndex = (j: Journey) => journeySchedule(j).timeline.findIndex((t) => t.type === 'quiz')

test('시계: 1배는 MS_PER_DAY마다 하루, 배속이면 그만큼 빨리', () => {
  const j = make()
  assert.equal(journeyClock(j, at(2), 1).day, 2)
  assert.equal(journeyClock(j, at(2), 6).day, 12)
  assert.equal(journeyClock(j, T0 - 5000, 1).day, 0) // 기준 시각보다 앞선 시계는 0
})

test('여정 길이는 MIN~MAX 날수 안이고, 같은 여정은 늘 같다', () => {
  for (const materialIds of [['coffee'], ['wheat', 'palm-oil', 'sugar', 'plastic', 'chili'], ['rice']]) {
    const s = journeySchedule({ id: `${TODAY}-2-ab12`, name: '시험', materialIds })
    assert.ok(s.total >= MIN_JOURNEY_DAYS - 1e-9 && s.total <= MAX_JOURNEY_DAYS + 1e-9, `${materialIds}: ${s.total}`)
    assert.deepEqual(journeySchedule({ id: `${TODAY}-2-ab12`, name: '시험', materialIds: [...materialIds] }).days, s.days)
  }
})

test('퀴즈: 답하기 전에는 퀴즈 칸에서 멈추고, 답하면 그 순간부터 다시 흐른다', () => {
  const j = make()
  const qi = quizIndex(j)
  assert.ok(qi > 0)
  const s = journeySchedule(j)
  const far = journeyClock(j, at(s.total + 100), 1)
  assert.equal(far.index, qi)
  assert.equal(far.waitingQuiz, true)
  assert.equal(far.day, s.starts[qi])
  assert.equal(far.arrived, false)

  const answerAt = at(s.total + 100)
  j.quiz.coffee = 0
  anchorAtQuiz(j, 'coffee', answerAt)
  const right = journeyClock(j, answerAt, 1)
  assert.equal(right.day, s.starts[qi]) // 답한 순간 튀지 않는다
  assert.equal(right.waitingQuiz, false)
  assert.ok(right.index > qi) // 퀴즈 칸은 머무는 날이 없다
  assert.equal(journeyClock(j, answerAt + MS_PER_DAY / 2, 1).day, Math.min(s.starts[qi]! + 0.5, s.total))
  assert.equal(journeyClock(j, answerAt + s.total * MS_PER_DAY, 1).arrived, true)
})

test('배속 바꾸기: 바꾸는 순간 진행이 그대로고, 그 뒤로 새 배속으로 흐른다 (1배→6배→1배)', () => {
  const j = make()
  let speed: Speed = 1
  const change = (t: number, next: Speed) => {
    const before = journeyClock(j, t, speed).day
    reanchor(j, t, speed)
    speed = next
    assert.ok(Math.abs(journeyClock(j, t, speed).day - before) < 1e-9, `${next}배로 바꾼 순간 튀지 않음`)
  }
  const t1 = T0 + 3 * MS_PER_DAY
  change(t1, 6)
  const t2 = t1 + MS_PER_DAY // 6배로 1일치 실제 시간 → 게임 6일
  assert.ok(Math.abs(journeyClock(j, t2, speed).day - 9) < 1e-9)
  change(t2, 1)
  assert.ok(Math.abs(journeyClock(j, t2 + MS_PER_DAY, speed).day - 10) < 1e-9)
  // 시간이 흐르는 동안 진행은 늘 앞으로만
  let last = -1
  for (let t = T0; t < t2 + 5 * MS_PER_DAY; t += MS_PER_DAY / 7) {
    const d = journeyClock(j, t, speed).day
    if (t >= t2) assert.ok(d >= last)
    last = d
  }
})

test('예전 여정: 기준점이 없으면 지금 칸에 멈춰 있다가, 채우면 지금 칸부터 흐른다', () => {
  const j = make({ id: `${TODAY}-1aaaa`, step: 3 })
  delete j.anchorAt
  delete j.anchorDays
  const s = journeySchedule(j)
  assert.equal(journeyClock(j, T0 + 1e9, 1).index, 3)
  ensureAnchor(j, T0)
  assert.equal(j.anchorDays, s.starts[3])
  assert.equal(journeyClock(j, T0, 1).index, 3)
  assert.ok(journeyClock(j, T0 + 100 * MS_PER_DAY, 1).index > 3)
})

test('병합: 같은 여정은 지금 더 많이 진행된 쪽, 배속은 나중에 바꾼 쪽', () => {
  const now = at(10)
  const ahead = make({ anchorAt: T0, anchorDays: 2, step: 1 })
  const behind = make({ anchorAt: T0, anchorDays: 0, step: 2 })
  const a: Save = { ...emptySave(), days: { [TODAY]: { journeys: [behind], linkCards: [] } }, speed: { value: 1, updatedAt: 5 } }
  const b: Save = { ...emptySave(), days: { [TODAY]: { journeys: [ahead], linkCards: [] } }, speed: { value: 3, updatedAt: 9 } }
  const m = mergeSaves(a, b, TODAY, now)
  assert.equal(m.days[TODAY]!.journeys[0]!.anchorDays, 2)
  assert.deepEqual(m.speed, { value: 3, updatedAt: 9 })
  assert.equal(mergeSaves(emptySave(), emptySave(), TODAY).speed, undefined)
})

test('병합: 배속에서 진 기기의 여정은 이긴 배속으로 바뀐 시각에 기준점을 새로 찍는다', () => {
  // 기기 A는 계속 1배. 기기 B가 T0+4일에 6배로 바꿨다
  const changedAt = at(4)
  const a: Save = { ...emptySave(), days: { [TODAY]: { journeys: [make()], linkCards: [] } }, speed: { value: 1, updatedAt: 0 } }
  const b: Save = { ...emptySave(), speed: { value: 6, updatedAt: changedAt } }
  const now = changedAt + MS_PER_DAY
  const j = mergeSaves(a, b, TODAY, now).days[TODAY]!.journeys[0]!
  assert.equal(j.anchorAt, changedAt)
  assert.equal(j.anchorDays, 4)
  assert.ok(Math.abs(journeyClock(j, now, 6).day - 10) < 1e-9)
  assert.equal(a.days[TODAY]!.journeys[0]!.anchorAt, T0) // 원본은 그대로
})

test('검사: 기준점과 배속은 올바른 값만 남긴다', () => {
  const s = sanitizeSave({
    days: { [TODAY]: { journeys: [make({ anchorAt: T0, anchorDays: 3 }), { ...make({ id: `${TODAY}-2-zz` }), anchorAt: 'x', anchorDays: 3 }] } },
    speed: { value: 6, updatedAt: 10 },
  }, TODAY)
  const [good, bad] = s.days[TODAY]!.journeys
  assert.equal(good!.anchorAt, T0)
  assert.equal(good!.anchorDays, 3)
  assert.equal(bad!.anchorAt, undefined)
  assert.deepEqual(s.speed, { value: 6, updatedAt: 10 })
  assert.equal(sanitizeSave({ speed: { value: 2, updatedAt: 1 } }, TODAY).speed, undefined)
})
