import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MATERIALS } from '../shared/data/materials'
import { buildTimeline, closingPeople, forwardTimeline, optionOrder, quizFor, quizzesOf } from '../shared/journey'
import { closingKind } from '../shared/data/shops'
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

test('마지막 장면: 물건 종류에 맞는 가게 사람이 여정 맨 끝에 나온다', () => {
  assert.equal(closingKind('아이스 아메리카노', ['coffee', 'plastic']), 'cafe')
  assert.equal(closingKind('카페라떼', ['coffee', 'milk', 'pulp']), 'cafe')
  assert.equal(closingKind('커피우유', ['milk', 'coffee', 'sugar']), 'cvs')
  assert.equal(closingKind('참치마요 삼각김밥', ['rice', 'laver', 'tuna', 'plastic']), 'cvs')
  assert.equal(closingKind('스마트폰', ['cobalt', 'lithium', 'chip', 'assembly', 'plastic']), 'electronics')
  assert.equal(closingKind('면 티셔츠', ['cotton']), 'clothes')
  assert.equal(closingKind('고무장갑', ['rubber']), 'goods')
  assert.equal(closingKind('후라이드 치킨', ['chicken', 'wheat', 'soybean']), 'delivery')
  assert.equal(closingKind('사과', ['apple']), 'mart')
  assert.equal(closingKind('나무 책상', ['wood', 'steel']), 'goods')

  const id = '2026-10-15-1-abcd'
  const t = buildTimeline(['coffee'], id, '아이스 아메리카노')
  const last = t[t.length - 1]
  assert.equal(last?.type === 'stage' && last.personId, 'barista')
  // 커피는 수입 재료라 가게 사람 앞에 무역회사 직원이 나온다
  assert.deepEqual(closingPeople('아이스 아메리카노', ['coffee'], id, true), ['trade-clerk', 'barista'])
  // 물건 이름이 없거나 예전 여정 id면 그대로
  assert.deepEqual(buildTimeline(['coffee'], id).length, t.length - 2)
  assert.deepEqual(buildTimeline(['coffee'], '2026-10-14-1', '아메리카노'), buildTimeline(['coffee']))
})

test('퀴즈 보기: 같은 여정이면 같은 순서, 정답 자리는 고르게', () => {
  const journeys = ids(1000)
  for (const id of journeys.slice(0, 50)) {
    const order = optionOrder(id, 'coffee', 3)
    assert.deepEqual(order, optionOrder(id, 'coffee', 3))
    assert.deepEqual([...order].sort(), [0, 1, 2])
  }
  assert.deepEqual(optionOrder(undefined, 'coffee', 3), [0, 1, 2])
  // 정답이 화면 몇 번째 칸에 놓이는지 센다 (여정 1,000개 × 재료마다 이번 여정에 나온 퀴즈)
  const counts = [0, 0, 0]
  for (const id of journeys) {
    for (const mid of Object.keys(MATERIALS)) {
      const q = quizFor([mid], id, mid)
      if (!q || q.options.length !== 3) continue
      counts[optionOrder(id, mid, 3).indexOf(q.answer)]!++
    }
  }
  const total = counts.reduce((a, b) => a + b, 0)
  for (const c of counts) assert.ok(Math.abs(c / total - 1 / 3) < 0.02, `정답 자리 비율 ${counts.map((x) => (x / total).toFixed(3))}`)
})

test('서울 봉제 공장 길은 옷 이름일 때만 나온다 (반창고·운동화의 면·폴리에스터에는 없다)', () => {
  const sewnIn = (name: string, ids: string[]) =>
    Array.from({ length: 60 }, (_, i) => forwardTimeline(ids, `2026-10-16-1-${i.toString(36)}s`, name)).filter((t) => t.some((x) => x.type === 'stage' && x.personId === 'seoul-sewer')).length
  assert.ok(sewnIn('면 티셔츠', ['cotton']) > 10)
  assert.ok(sewnIn('패딩', ['polyester']) > 10)
  assert.equal(sewnIn('반창고', ['plastic', 'cotton', 'rubber']), 0)
  assert.equal(sewnIn('운동화', ['rubber', 'polyester']), 0)
})
