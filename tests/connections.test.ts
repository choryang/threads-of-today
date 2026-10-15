import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CENTER, NEAR_RADIUS, bearingDistance, positionOf, radiusOf, strandCount, strandOpacity, strandsOf } from '../shared/connections'

test('서울 기준 방위각·대권 거리와 반지름 식', () => {
  // 시다마: 남서쪽, 약 9,600km
  const sidama = bearingDistance(6.75, 38.45)
  assert.ok(sidama.km > 9000 && sidama.km < 10300, String(sidama.km))
  assert.ok(sidama.bearing < 0 && sidama.bearing > -Math.PI, '서쪽')
  assert.equal(radiusOf(0), 26)
  assert.ok(Math.abs(radiusOf(12000) - 150) < 1e-9)
  assert.ok(radiusOf(1000) < radiusOf(5000) && radiusOf(5000) < radiusOf(10000))
})

test('한국 안 사람은 가운데 가까이(반지름 22) 고정 각도, 바다 위는 북위 5°·동경 85°', () => {
  const near = positionOf('courier')!
  assert.ok(near.near)
  assert.ok(Math.abs(Math.hypot(near.x - CENTER, near.y - CENTER) - NEAR_RADIUS) < 1e-9)
  assert.deepEqual(positionOf('courier'), near)
  const sea = positionOf('bulk-crew')!
  const expect = bearingDistance(5, 85)
  assert.ok(Math.abs(Math.hypot(sea.x - CENTER, sea.y - CENTER) - radiusOf(expect.km)) < 1e-9)
  // 미국 대평원: 동쪽(오른쪽)
  assert.ok(positionOf('wheat-farmer')!.x > CENTER)
  assert.equal(positionOf('nobody'), null)
})

test('실: 최근 것부터, 마음 색, 오래될수록 흐리게', () => {
  const strands = strandsOf({
    '2026-10-11': { mood: 'tired', item: '라면', personId: 'courier', episode: 0 },
    '2026-10-15': { mood: 'wronged', item: '아이스 아메리카노', personId: 'coffee-picker', episode: 2, reply: 0 },
  })
  assert.deepEqual(strands.map((s) => s.date), ['2026-10-15', '2026-10-11'])
  assert.equal(strands[0]!.color, '#E0528A')
  assert.equal(strands[0]!.opacity, 1)
  assert.equal(strands[1]!.opacity, 0.8)
  assert.ok(strands[0]!.path.startsWith(`M${CENTER} ${CENTER} Q`))
  assert.equal(strandOpacity(10), 0.35)
  assert.equal(strandCount(5), '다섯 가닥')
  assert.equal(strandCount(12), '12가닥')
})

test('이름표가 판 밖으로 나가면 안쪽으로', () => {
  const [s] = strandsOf({ '2026-10-15': { mood: 'wronged', item: '아이스 아메리카노', personId: 'coffee-picker', episode: 2 } })
  // 시다마는 왼쪽 끝 가까이: 이름을 왼쪽에 쓰면 잘리므로 오른쪽(start)
  assert.ok(s!.x < 80)
  assert.equal(s!.label.anchor, 'start')
})
