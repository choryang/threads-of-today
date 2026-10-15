import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE } from '../shared/data/people'
import { ON_THE_WAY } from '../shared/data/transport'
import {
  MAX_INCOMING, arrivalLabel, arrivalShort, arrivalTime, createIncoming, daysFrom, departureLine, incomingChipText, itemPeople, progressOf, transportOf,
  waypointsOf, wayText,
} from '../shared/incoming'
import { forwardTimeline } from '../shared/journey'
import { seoulDateKey } from '../shared/logic'
import { emptySave, mergeSaves, sanitizeSave, type Incoming, type Save } from '../shared/progress'

const KST = (y: number, m: number, d: number, h: number, min = 0) => Date.UTC(y, m - 1, d, h - 9, min)

test('서울 날짜 키: 서울 자정에 바뀐다', () => {
  assert.equal(seoulDateKey(KST(2026, 10, 15, 23, 59)), '2026-10-15')
  assert.equal(seoulDateKey(KST(2026, 10, 16, 0, 0)), '2026-10-16')
})

test('도착: 출발한 다음 날 아침 6시(서울)로 고정, 진행은 흐른 시간 비율', () => {
  assert.equal(arrivalTime(KST(2026, 10, 15, 20)), KST(2026, 10, 16, 6))
  assert.equal(arrivalTime(KST(2026, 10, 15, 0, 10)), KST(2026, 10, 16, 6))
  assert.equal(arrivalTime(KST(2026, 10, 15, 23, 59)), KST(2026, 10, 16, 6))
  // 서울 새벽 1시 = UTC 전날 오후 4시: 서울 날짜 기준이라 그다음 날 아침
  assert.equal(arrivalTime(KST(2026, 10, 16, 1)), KST(2026, 10, 17, 6))
  const inc = { departAt: KST(2026, 10, 15, 20), arriveAt: KST(2026, 10, 16, 6) }
  assert.equal(progressOf(inc, KST(2026, 10, 15, 20)), 0)
  assert.equal(progressOf(inc, KST(2026, 10, 16, 1)), 0.5)
  assert.equal(progressOf(inc, KST(2026, 10, 16, 9)), 1)
  assert.equal(progressOf(inc, KST(2026, 10, 15, 10)), 0)
})

test('도착 문구: 서울 날짜로 내일·모레', () => {
  const now = KST(2026, 10, 15, 22)
  assert.equal(daysFrom(now, KST(2026, 10, 16, 6)), 1)
  assert.equal(arrivalLabel(KST(2026, 10, 16, 6), now), '내일 아침')
  assert.equal(arrivalShort(KST(2026, 10, 17, 6), now), '모레 도착')
  assert.equal(arrivalShort(KST(2026, 10, 16, 6), KST(2026, 10, 16, 7)), '오늘 도착')
})

const coffee = (n: number) => ({ id: `2026-10-15-${n}-abcd-r`, name: '아이스 아메리카노', materialIds: ['coffee'] })
const metIn = (j: { id: string; name: string; materialIds: string[] }) =>
  new Set(forwardTimeline(j.materialIds, j.id, j.name).flatMap((t) => (t.type === 'stage' || t.type === 'hidden' ? [t.personId] : [])))

test('생기는 조건: 운송 구간이 있고 아직 못 만난 평범한 사람이 남아 있을 때, 동시에 3개까지', () => {
  const j = coffee(1)
  const now = KST(2026, 10, 15, 20)
  const inc = createIncoming(j, metIn(j), [], now)!
  assert.ok(inc)
  assert.equal(inc.arriveAt, KST(2026, 10, 16, 6))
  assert.ok(!metIn(j).has(inc.personId))
  assert.equal(PEOPLE[inc.personId]!.kind, 'stage')
  assert.deepEqual(createIncoming(j, metIn(j), [], now), inc) // 여정 id로 정해진다
  // 같은 여정은 한 번, 데려오기로 한 사람은 다른 물건이 또 데려오지 않는다
  assert.equal(createIncoming(j, metIn(j), [inc], now), null)
  const j2 = coffee(2)
  const inc2 = createIncoming(j2, metIn(j2), [inc], now)
  assert.notEqual(inc2?.personId, inc.personId)
  // 꽉 차 있으면 생기지 않는다 (열어 본 물건은 세지 않는다)
  const full: Incoming[] = Array.from({ length: MAX_INCOMING }, (_, i) => ({ ...inc, journeyId: `x${i}`, personId: `p${i}` }))
  assert.equal(createIncoming(coffee(3), metIn(coffee(3)), full, now), null)
  assert.ok(createIncoming(coffee(3), metIn(coffee(3)), full.map((x) => ({ ...x, openedAt: now })), now))
  // 운송 구간이 없는 물건(국산 사과), 못 만난 사람이 없는 물건
  assert.equal(createIncoming({ id: '2026-10-15-4-abcd-r', name: '사과', materialIds: ['apple'] }, new Set(), [], now), null)
  assert.equal(createIncoming(j, new Set(itemPeople(j.materialIds, j.name)), [], now), null)
})

test('지나는 곳: 여정 데이터에 있는 경유지 이름만, 없으면 일반 문구', () => {
  const j = coffee(1)
  const t = forwardTimeline(j.materialIds, j.id, j.name)
  const wps = waypointsOf(t)
  assert.ok(wps.length >= 2)
  assert.ok(wps.at(-1) === '부산항')
  assert.equal(wayText(t, 0.99), '부산항을 지나는 중')
  assert.equal(transportOf(t)?.kind, 'ship')
  // 마지막 장면의 택배 트럭만 있는 물건은 경유지가 없다
  const goods = forwardTimeline(['rubber'], '2026-10-15-5-abcd-r', '고무장갑')
  const g = transportOf(goods)
  if (g && !waypointsOf(goods).length) assert.equal(wayText(goods, 0.5), ON_THE_WAY[g.kind])
})

test('저장: 여정 id로 합치고, 연 기록은 남기며, 연 지 30일 지난 것은 버린다', () => {
  const base: Incoming = { journeyId: '2026-10-15-1-abcd-r', departAt: KST(2026, 10, 15, 20), arriveAt: KST(2026, 10, 16, 6), personId: 'co-coffee-farmer' }
  const opened = { ...base, openedAt: KST(2026, 10, 16, 8) }
  const a: Save = { ...emptySave(), incoming: [base] }
  const b: Save = { ...emptySave(), incoming: [opened] }
  assert.deepEqual(mergeSaves(a, b, '2026-10-16').incoming, [opened])
  assert.deepEqual(mergeSaves(b, a, '2026-10-16').incoming, [opened])
  assert.deepEqual(mergeSaves(b, a, '2026-12-01').incoming, [])
  // 열지 않은 물건은 오래돼도 기다린다
  assert.deepEqual(mergeSaves(a, a, '2026-12-01').incoming, [base])
  const s = sanitizeSave({ incoming: [base, { ...base }, { ...base, journeyId: '2026-10-15-2-x', personId: 'nobody' }, { ...base, journeyId: '2026-10-15-3-x', arriveAt: 1 }] }, '2026-10-16')
  assert.deepEqual(s.incoming, [base])
})

test('오고 있는 물건 칩: 하나면 물건·언제, 여러 개면 개수, 도착했으면 열어 보기', () => {
  const now = Date.UTC(2026, 9, 15, 5)
  const a = arrivalTime(now)
  assert.equal(incomingChipText([], now), '')
  assert.equal(incomingChipText([{ cargo: '생두 자루', arriveAt: a }], now), '생두 자루가 오고 있어요 · 내일 아침')
  assert.equal(incomingChipText([{ cargo: '원당', arriveAt: a }], now), '원당이 오고 있어요 · 내일 아침')
  assert.equal(incomingChipText([{ cargo: '생두 자루', arriveAt: a }, { cargo: '원당', arriveAt: a }], now), '물건 2개가 오고 있어요')
  assert.equal(incomingChipText([{ cargo: '생두 자루', arriveAt: now - 1 }], now), '생두 자루가 도착했어요 · 열어 보기')
  assert.equal(incomingChipText([{ cargo: '생두 자루', arriveAt: now - 1 }, { cargo: '원당', arriveAt: a }], now), '물건 2개 중 1개가 도착했어요')
})

test('여정 도착 화면의 출발 한 줄: 실은 것·탈것·도착 때', () => {
  const now = Date.UTC(2026, 9, 15, 5)
  const a = arrivalTime(now)
  assert.equal(departureLine('생두 자루', 'ship', a, now), '생두 자루를 실은 배가 출발했어요 · 내일 아침 도착')
  assert.equal(departureLine('반도체', 'air', a, now), '반도체를 실은 비행기가 출발했어요 · 내일 아침 도착')
  assert.equal(departureLine('배추', 'truck', a, now), '배추를 실은 트럭이 출발했어요 · 내일 아침 도착')
})
