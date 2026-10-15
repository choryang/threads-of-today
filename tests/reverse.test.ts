import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FORMS, formAt } from '../shared/data/forms'
import { greatCircleKm, reverseDistances, roundKm } from '../shared/distance'
import {
  buildTimeline, forwardTimeline, isFirstJourney, isReverseJourney, quizFor, reverseTimeline, timelinePeople, type TimelineItem,
} from '../shared/journey'
import { findLinkCards } from '../shared/logic'
import { formsAlong, replayFrames, reverseKicker, stopQuestion } from '../shared/rewind'

const ids = (n: number, tail = '-r') => Array.from({ length: n }, (_, i) => `2026-10-15-1-${i.toString(36).padStart(4, '0')}${tail}`)
const who = (t?: TimelineItem) => (t?.type === 'stage' || t?.type === 'hidden' ? t.personId : t?.type)

test("'-r' 여정만 거꾸로 간다. 예전 여정은 예전 순서", () => {
  assert.ok(isReverseJourney('2026-10-15-1-k3x9-r'))
  assert.ok(isReverseJourney('2026-10-15-1-k3x9-r-first'))
  assert.ok(!isReverseJourney('2026-10-15-1-k3x9'))
  assert.ok(!isReverseJourney('2026-10-15-1-k3x9-first'))
  assert.ok(isFirstJourney('2026-10-15-1-k3x9-r-first'))
  const old = '2026-10-15-1-k3x9'
  assert.deepEqual(buildTimeline(['coffee'], old, '아메리카노'), forwardTimeline(['coffee'], old, '아메리카노'))
  assert.equal(who(buildTimeline(['coffee'], old, '아메리카노').at(-1)), 'barista')
})

test('거꾸로: 가게 사람부터 원산지로, 재료 하나씩, 퀴즈는 원산지 다음', () => {
  const id = '2026-10-15-1-k3x9-r'
  const t = buildTimeline(['coffee'], id, '아이스 아메리카노')
  // 커피는 수입 재료라 바리스타 → 무역회사 직원 → 물류센터 … → 원산지 농부 → 퀴즈
  assert.deepEqual(t.slice(0, 3).map(who), ['barista', 'trade-clerk', 'warehouse'])
  assert.equal(t.at(-1)?.type, 'quiz')
  const people = t.flatMap((x) => (x.type === 'stage' && !x.closing ? [x.personId] : []))
  const forward = forwardTimeline(['coffee'], id, '아이스 아메리카노').flatMap((x) => (x.type === 'stage' && !x.closing ? [x.personId] : []))
  assert.deepEqual(people, [...forward].reverse())
})

test('거꾸로: 같은 사람·퀴즈·숨은 만남·연결 카드 (순서와 무관)', () => {
  const mats = ['cobalt', 'lithium', 'chip', 'assembly', 'plastic']
  for (const id of ids(200)) {
    const pairs = (list: Array<{ materialId: string; personId: string }>) => [...new Set(list.map((x) => `${x.materialId}:${x.personId}`))].sort()
    const fwd = forwardTimeline(mats, id, '스마트폰').flatMap((x) => (x.type === 'stage' || x.type === 'hidden' ? [x] : []))
    assert.deepEqual(pairs(timelinePeople(mats, id, '스마트폰')), pairs(fwd))
    const quizzes = (list: TimelineItem[]) => list.filter((x) => x.type === 'quiz').map((x) => JSON.stringify(x)).sort()
    assert.deepEqual(quizzes(buildTimeline(mats, id, '스마트폰')), quizzes(forwardTimeline(mats, id, '스마트폰')))
    for (const m of mats) assert.ok(quizFor(mats, id, m))
  }
  // 코발트·리튬 모두 중국 정련 공장을 지난다. 거꾸로 가면 리튬 쪽은 '같은 길'로 줄지만 연결 카드는 그대로
  const id = ids(1)[0]!
  assert.ok(findLinkCards([{ materialIds: ['cobalt', 'lithium'], id, name: '배터리' }]).includes('link-cn-refinery'))
})

test('거꾸로: 앞 재료에서 이미 만난 사람이 이어지면 같은 길 한 칸', () => {
  const t = reverseTimeline(['coffee', 'banana'], '2026-10-15-1-k3x9-r', '바나나 라떼')
  const passes = t.filter((x) => x.type === 'pass')
  assert.ok(passes.length >= 1)
  for (const p of passes) assert.equal(p.materialId, 'banana')
  assert.ok(passes.some((p) => p.type === 'pass' && p.personIds.includes('warehouse')))
})

test('두 번째 여정은 거꾸로 가도 숨은 만남(또는 퀴즈 보상)을 보장하고, 첫 여정은 경유지 맞히기도 없다', () => {
  let withHidden = 0
  for (const id of ids(100, '-r-second')) if (buildTimeline(['coffee', 'banana'], id, '바나나 라떼').some((x) => x.type === 'hidden')) withHidden++
  assert.equal(withHidden, 100)
  for (const id of ids(50, '-r-first')) {
    const t = buildTimeline(['coffee', 'banana'], id, '바나나 라떼')
    assert.ok(t.every((_, i) => stopQuestion(t, i, id) === null), id)
  }
  // 같은 경로의 첫 여정이 아니면 경유지 질문이 나오는 칸이 있다
  const asked = ids(50, '-r').filter((id) => {
    const t = buildTimeline(['coffee', 'banana'], id, '바나나 라떼')
    return t.some((_, i) => stopQuestion(t, i, id) !== null)
  }).length
  assert.ok(asked > 0)
})

test('되감기 변신: 거꾸로 가면 완성품 → 가공품 → 원재료', () => {
  const id = '2026-10-15-1-k3x9-r'
  const t = buildTimeline(['coffee'], id, '아이스 아메리카노')
  const forms = formsAlong(t, ['coffee'], id, '아이스 아메리카노')
  assert.equal(forms[0]?.name, '아이스 아메리카노')
  assert.equal(forms[0]?.product, true)
  assert.equal(forms[2]?.icon, 'roasted-coffee-beans')
  const names = [...new Set(forms.slice(2).map((f) => f.name))]
  const order = FORMS.coffee!.map((f) => f.name)
  // 형태가 가공 순서의 거꾸로만 바뀐다
  for (let i = 1; i < names.length; i++) assert.ok(order.indexOf(names[i]!) < order.indexOf(names[i - 1]!))
  assert.equal(reverseKicker(t, forms, 0), '내 손에 닿기 바로 전')
  assert.equal(reverseKicker(t, forms, 2), '이 볶은 원두는 어디서 왔을까요?')
  assert.equal(reverseKicker(t, forms, 3), '그 전에는…')
  // 되감기 엔딩은 원산지 → 내 손 순서
  const frames = replayFrames(['coffee'], id, '아이스 아메리카노')
  assert.equal(frames.at(-1)?.personId, 'barista')
  assert.equal(frames.at(-1)?.form.name, '아이스 아메리카노')
  assert.equal(formAt('coffee', ['coffee-picker', 'washing-station'], 'coffee-picker')?.name, '커피 체리')
})

test('거리: 대권 거리, 바다 위 단계는 앞뒤 항구 사이, 100km 단위 반올림', () => {
  const seoulBusan = greatCircleKm({ lat: 37.57, lng: 126.98 }, { lat: 35.1, lng: 129.04 })
  assert.ok(seoulBusan > 300 && seoulBusan < 350)
  assert.equal(roundKm(30), 0)
  assert.equal(roundKm(60), 100)
  assert.equal(roundKm(4249), 4200)
  assert.equal(roundKm(4250), 4300)
  const id = '2026-10-15-1-k3x9-r'
  const t = reverseTimeline(['coffee'], id, '아메리카노')
  const { at, total } = reverseDistances(t)
  assert.equal(at.length, t.length)
  for (let i = 1; i < at.length; i++) assert.ok(at[i]! >= at[i - 1]!)
  // 바다 위 선원 칸에서는 거리가 늘지 않는다 (부산항 → 바다 → 수출항을 수출항에 닿을 때 한 번에 잰다)
  const sea = t.findIndex((x) => x.type === 'stage' && x.personId === 'sea-crew')
  assert.equal(at[sea], at[sea - 1])
  // 이 시드는 베트남 출발 (호찌민 → 부산 약 3,600km)
  assert.ok(total > 3000)
})

test('다음 정거장 맞히기: 같은 여정이면 같은 보기, 정답은 원산지 쪽 장소, 연달아 묻지 않는다', () => {
  for (const id of ids(50)) {
    const t = buildTimeline(['coffee', 'banana'], id, '바나나 라떼')
    let prevAsked = false
    t.forEach((_, i) => {
      const q = stopQuestion(t, i, id)
      assert.deepEqual(q, stopQuestion(t, i, id))
      if (q) {
        assert.notEqual(q.options[0], q.options[1])
        assert.ok(!prevAsked)
      }
      prevAsked = !!q
    })
  }
  const id = '2026-10-15-1-k3x9-r'
  const t = buildTimeline(['coffee'], id, '아메리카노')
  const busan = t.findIndex((x) => x.type === 'stage' && x.personId === 'busan-crane')
  const q = stopQuestion(t, busan, id)!
  assert.ok(q)
  assert.ok(q.options[q.answer].includes('항구'))
})
