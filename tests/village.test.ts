import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { ZONES, ZONE_BY_ID } from '../shared/data/village'
import { OVERFLOW_GAP, emptyLots, placeAll, villageLayout, villagers } from '../shared/village'
import { MAX_SCALE, centerOn, clampScale, clampView, minScale, zoomAt, type Size } from '../app/utils/pan-zoom'

const stage = PEOPLE_LIST.filter((p) => p.kind !== 'link')

test('자리 배정: 사람 id로 정해지고, 나중에 온 주민이 원래 주민의 자리를 바꾸지 않는다', () => {
  const first = stage.slice(0, 40).map((p) => p.id)
  const a = placeAll(first)
  assert.deepEqual(placeAll(first), a)
  const more = placeAll([...first, ...stage.slice(40, 120).map((p) => p.id)])
  assert.deepEqual(more.slice(0, first.length), a)
})

test('자리 배정: 구역 안 자리는 한 사람씩, 넘치면 다른 사람과 떨어진 빈 땅', () => {
  const all = placeAll(stage.map((p) => p.id))
  assert.equal(all.length, stage.length)
  for (const zone of ZONES) {
    const here = all.filter((p) => p.zone === zone.id)
    const onSlots = here.filter((p) => zone.slots.some(([x, y]) => x === p.x && y === p.y))
    assert.equal(new Set(onSlots.map((p) => `${p.x},${p.y}`)).size, onSlots.length, `${zone.id}: 같은 자리에 두 사람`)
    assert.equal(onSlots.length, Math.min(zone.slots.length, here.length))
  }
  // 빈 땅으로 간 사람은 앞 사람들과 간격을 지킨다(빈 땅도 모자라 겹쳐 선 사람 제외)
  const overflow = all.filter((p) => ZONE_BY_ID[p.zone].overflow.some(([x, y]) => x === p.x && y === p.y))
  for (const p of overflow) {
    const before = all.slice(0, all.indexOf(p))
    assert.ok(before.every((q) => Math.abs(q.x - p.x) >= OVERFLOW_GAP[0] || Math.abs(q.y - p.y) >= OVERFLOW_GAP[1]), p.id)
  }
})

test('마을: 연결 카드는 주민이 아니고, 빈 집터는 못 만난 사람 중 구역마다 2명까지', () => {
  assert.deepEqual(villagers({ 'sea-crew': '2026-10-01', 'link-sea-crew': '2026-10-02', nobody: '2026-10-01' }), ['sea-crew'])
  const lots = emptyLots(new Set(['barista']))
  assert.ok(!lots.includes('barista'))
  for (const zone of ZONES) assert.ok(lots.filter((id) => PEOPLE_LIST.find((p) => p.id === id)!.zone === zone.id).length <= 2)
  const layout = villageLayout({ barista: '2026-10-01', 'sea-crew': '2026-10-02' }, {}, ['cupper'])
  assert.deepEqual(layout.residents.map((r) => r.id), ['barista', 'sea-crew'])
  assert.deepEqual(layout.arriving.map((r) => r.id), ['cupper'])
  assert.ok(!layout.lots.some((l) => l.id === 'cupper' || l.id === 'barista'))
  // 먼저 만난 사람이 먼저 자리를 잡는다
  const later = villageLayout({ barista: '2026-10-05', 'sea-crew': '2026-10-02' }, {})
  assert.deepEqual(later.residents.map((r) => r.id), ['sea-crew', 'barista'])
})

const PHONE: Size = { vw: 390, vh: 844, mw: 1400, mh: 2000 }

test('팬·줌: 최소 배율은 지도가 화면을 꽉 채우는 크기, 최대 1.4', () => {
  assert.equal(minScale(PHONE), 844 / 2000)
  assert.equal(clampScale(0.1, PHONE), 844 / 2000)
  assert.equal(clampScale(3, PHONE), MAX_SCALE)
  assert.equal(clampScale(0.6, PHONE), 0.6)
  // 화면이 아주 크면 최소 배율이 1.4보다 커도 꽉 채운다
  assert.equal(clampScale(1, { vw: 3000, vh: 1000, mw: 1400, mh: 2000 }), 3000 / 1400)
})

test('팬·줌: 지도 밖 빈 화면이 보이지 않게 위치를 제한한다', () => {
  assert.deepEqual(clampView({ x: 100, y: 50, scale: 0.6 }, PHONE), { x: 0, y: 0, scale: 0.6 })
  const far = clampView({ x: -5000, y: -5000, scale: 0.6 }, PHONE)
  assert.deepEqual(far, { x: 390 - 1400 * 0.6, y: 844 - 2000 * 0.6, scale: 0.6 })
})

test('팬·줌: 특정 점 기준 확대는 그 점 아래 지도 위치를 그대로 둔다', () => {
  const v = { x: -300, y: -500, scale: 0.6 }
  const px = 200
  const py = 400
  const before = { x: (px - v.x) / v.scale, y: (py - v.y) / v.scale }
  const z = zoomAt(v, px, py, 0.9, PHONE)
  assert.equal(z.scale, 0.9)
  assert.ok(Math.abs((px - z.x) / z.scale - before.x) < 1e-9)
  assert.ok(Math.abs((py - z.y) / z.scale - before.y) < 1e-9)
  const c = centerOn(560, 1000, 0.6, PHONE)
  assert.ok(Math.abs(c.x + 560 * 0.6 - 195) < 1e-9 && Math.abs(c.y + 1000 * 0.6 - 422) < 1e-9)
  // 가장자리 가까운 점은 가운데까지 못 오고 지도 끝에 맞춘다 (우리 집은 지도 아래쪽)
  assert.equal(centerOn(560, 1380, 0.6, PHONE).y, 844 - 2000 * 0.6)
})
