import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MATERIALS, PRODUCTS } from '../shared/data/materials'
import { PEOPLE } from '../shared/data/people'
import {
  CLASS_OF, DAY_TYPES, TEST_ITEMS, TYPE_ORDER, contrast, dayNumbers, dayScores, dayTypeOf, distanceLabel, isValidPick, meetingOf,
} from '../shared/day-type'

// docs/day-types.md 7번 예시
const EXAMPLES: Array<[string[], string, number, number]> = [
  [['kimchi', 'apple', 'samgak'], 'home', 25, 3],
  [['samgyeopsal', 'banana-milk', 'burger'], 'ranch', 26, 5],
  [['notebook', 'chopsticks', 'tshirt'], 'forest', 18, 5],
  [['ramen', 'tofu', 'tshirt'], 'plain', 24, 7],
  [['salmon-sushi', 'smartphone', 'tuna-can'], 'sky', 29, 8],
  [['americano', 'choco-bar', 'smartphone', 'samgyeopsal', 'kimchi'], 'world', 48, 13],
]

for (const [ids, type, people, countries] of EXAMPLES) {
  test(`기준표 예시: ${ids.join(', ')} → ${type} · ${people}명 · ${countries}개 나라`, () => {
    assert.equal(dayTypeOf(ids), type)
    const n = dayNumbers(ids)
    assert.equal(n.people.length, people)
    assert.equal(n.countries.length, countries)
    // 같은 선택이면 늘 같은 결과, 고른 순서와도 무관
    assert.equal(dayTypeOf([...ids].reverse()), type)
  })
}

test('재료 분류: 모든 재료가 분류표에 있다 (새 재료를 넣으면 docs/day-types.md 2번 표에도)', () => {
  const missing = Object.keys(MATERIALS).filter((id) => !CLASS_OF[id])
  assert.deepEqual(missing, [], `분류표에 없는 재료: ${missing.join(', ')}`)
  for (const id of TEST_ITEMS) for (const m of PRODUCTS.find((p) => p.id === id)!.materialIds) assert.ok(CLASS_OF[m], `${id}의 ${m}`)
})

test('분류가 없는 재료가 들어오면 판정이 멈춘다', () => {
  PRODUCTS.push({ id: '__test', name: '시험', aliases: [], materialIds: ['__nothing'] })
  try {
    assert.throws(() => dayScores(['__test']), /분류가 없는 재료/)
  } finally {
    PRODUCTS.pop()
  }
})

test('테스트 물건 18개는 대표 물건이고, 고르기는 3~5개', () => {
  assert.equal(TEST_ITEMS.length, 18)
  for (const id of TEST_ITEMS) assert.ok(PRODUCTS.some((p) => p.id === id), id)
  assert.ok(isValidPick(['kimchi', 'apple', 'samgak']))
  assert.ok(!isValidPick(['kimchi', 'apple']))
  assert.ok(!isValidPick(['kimchi', 'apple', 'apple']))
  assert.ok(!isValidPick(['kimchi', 'apple', 'nobody']))
  assert.ok(!isValidPick(['kimchi', 'apple', 'samgak', 'ramen', 'tofu', 'burger']))
})

test('유형 9개: 대표 주민이 있고, 배경색은 흰 글씨·화면 글씨색과 4.5:1 이상', () => {
  assert.deepEqual(Object.keys(DAY_TYPES).sort(), [...TYPE_ORDER].sort())
  for (const t of Object.values(DAY_TYPES)) {
    assert.ok(PEOPLE[t.resident], t.resident)
    assert.ok(contrast(t.bg, '#FFFFFF') >= 4.5, `${t.id} ${t.bg}`)
    assert.ok(contrast(t.bg, '#F3F1EA') >= 4.5, `${t.id} ${t.bg}`)
    assert.ok(!/궁합|착취|고생/.test(t.name + t.desc))
  }
})

test('거리 문구', () => {
  assert.equal(distanceLabel(3180), '3,200km')
  assert.equal(distanceLabel(40075 * 0.5), '지구 반 바퀴')
  assert.equal(distanceLabel(40075 * 1.05), '지구 한 바퀴')
  assert.equal(distanceLabel(40075 * 1.4), '지구 1.5바퀴')
  assert.equal(distanceLabel(40075 * 2.6), '지구 2.5바퀴')
})

test('두 사람의 하루: 겹치는 사람과 만나는 곳 (운송·항만 사람의 장소, 없으면 첫 번째)', () => {
  const m = meetingOf(['americano', 'banana', 'tshirt'], ['choco-bar', 'tuna-can', 'apple'])
  assert.ok(m.shared.length > 0)
  assert.equal(PEOPLE[m.hub!]!.zone, 'port')
  assert.ok(m.place)
  // 겹친 사람 중 (먼저 고른 사람의 순서로) 첫 운송·항만 사람
  assert.equal(m.hub, m.shared.find((p) => PEOPLE[p]!.zone === 'port'))
  // 운송·항만 사람이 없으면 첫 번째로 겹친 사람 (지금 데이터에 그런 짝이 있으면 확인)
  for (const x of TEST_ITEMS) {
    for (const y of TEST_ITEMS) {
      const mm = meetingOf([x], [y])
      if (mm.shared.length && !mm.shared.some((p) => PEOPLE[p]!.zone === 'port')) assert.equal(mm.hub, mm.shared[0])
      if (!mm.shared.length) assert.deepEqual([mm.hub, mm.place], [null, ''])
    }
  }
  assert.deepEqual(meetingOf(['americano', 'kimchi', 'apple'], ['americano', 'kimchi', 'apple']).shared.length, dayNumbers(['americano', 'kimchi', 'apple']).people.length)
})
