import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { HOME_POINT, MAP_H, MAP_W, ZONES, ZONE_BY_ID } from '../shared/data/village'
import { buildTimeline, tailMeeting } from '../shared/journey'
import { hintProductOf } from '../shared/visit'
import { OVERFLOW_GAP, VILLAGE_CAPACITY, emptyLots, nextResident, placeAll, villageLayout, villagers } from '../shared/village'
import { FAR_SCALE, HIT_BELOW, fitBox, MAX_SCALE, MIN_HIT_PX, centerOn, clampScale, clampView, hitBox, minScale, zoneLabelScale, zoomAt, type Size } from '../app/utils/pan-zoom'

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

const PHONE: Size = { vw: 390, vh: 844, mw: MAP_W, mh: MAP_H }

test('팬·줌: 최소 배율은 섬 전체가 화면에 다 들어오는 크기, 최대 1.4', () => {
  assert.equal(MAP_W, 2800)
  assert.equal(MAP_H, 4200)
  assert.equal(minScale(PHONE), 390 / 2800)
  assert.equal(clampScale(0.01, PHONE), 390 / 2800)
  assert.equal(clampScale(3, PHONE), MAX_SCALE)
  assert.equal(clampScale(0.6, PHONE), 0.6)
  // 가로가 긴 화면은 세로가 기준
  assert.equal(minScale({ vw: 1600, vh: 900, mw: MAP_W, mh: MAP_H }), 900 / 4200)
  // 섬 전체가 화면 안에 들어온다
  const all = clampView({ x: 0, y: 0, scale: minScale(PHONE) }, PHONE)
  assert.ok(MAP_W * all.scale <= 390 + 1e-9 && MAP_H * all.scale <= 844 + 1e-9)
})

test('팬·줌: 지도가 화면보다 작으면 가운데, 크면 지도 밖 빈 화면이 보이지 않게', () => {
  // 끝까지 축소: 가로는 꽉 차고(0), 세로는 남는 높이의 절반만큼 내려 가운데
  const s = minScale(PHONE)
  const far = clampView({ x: -500, y: 300, scale: s }, PHONE)
  assert.ok(Math.abs(far.x) < 1e-9)
  assert.ok(Math.abs(far.y - (844 - MAP_H * s) / 2) < 1e-9)
  // 가로·세로 모두 작으면 양쪽 모두 가운데
  const tablet: Size = { vw: 1600, vh: 900, mw: MAP_W, mh: MAP_H }
  const t = clampView({ x: 0, y: -100, scale: 0.2 }, tablet)
  assert.ok(Math.abs(t.x - (1600 - MAP_W * t.scale) / 2) < 1e-9)
  assert.ok(Math.abs(t.y - (900 - MAP_H * t.scale) / 2) < 1e-9)
  // 지도가 크면 예전처럼 가장자리에 맞춘다
  assert.deepEqual(clampView({ x: 100, y: 50, scale: 0.6 }, PHONE), { x: 0, y: 0, scale: 0.6 })
  assert.deepEqual(clampView({ x: -5000, y: -5000, scale: 0.6 }, PHONE), { x: 390 - MAP_W * 0.6, y: 844 - MAP_H * 0.6, scale: 0.6 })
  // 가로만 작은 화면(가로로 긴 화면에서 세로는 꽉 찬 배율): 가로는 가운데, 세로는 가장자리에 맞춘다
  const wide: Size = { vw: 1600, vh: 900, mw: MAP_W, mh: MAP_H }
  const w = clampView({ x: 0, y: 99, scale: 0.3 }, wide)
  assert.ok(Math.abs(w.x - (1600 - MAP_W * 0.3) / 2) < 1e-9)
  assert.equal(w.y, 0)
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
  const c = centerOn(1400, 2100, 0.6, PHONE)
  assert.ok(Math.abs(c.x + 1400 * 0.6 - 195) < 1e-9 && Math.abs(c.y + 2100 * 0.6 - 422) < 1e-9)
  // 우리 집은 지도 아래쪽이라 가운데까지 못 오고 지도 끝에 맞춘다
  assert.equal(centerOn(HOME_POINT.x, HOME_POINT.y, HOME_POINT.scale, PHONE).y, 844 - MAP_H * 0.6)
})

test('누르는 영역: 지도 좌표 140×210(발끝 아래 20까지), 화면에서 44px보다 작아지면 44×44px', () => {
  const near = hitBox(1)
  assert.deepEqual(near, { w: 140, h: 210, left: -70, top: -190 })
  assert.equal(near.top + near.h, HIT_BELOW) // 발끝 아래 20까지
  // 배율 0.25: 가로 140 × 0.25 = 35px < 44 → 가로만 176(=44px), 세로 210 × 0.25 = 52.5px라 그대로
  const quarter = hitBox(0.25)
  assert.equal(quarter.w, 176)
  assert.equal(quarter.h, 210)
  assert.equal(quarter.left, -88)
  // 끝까지 축소(0.139): 둘 다 화면 44px, 기본 상자의 가운데(발끝 위 85)는 그대로
  for (const scale of [minScale(PHONE), 0.2, 0.25, 0.4, 1, MAX_SCALE]) {
    const b = hitBox(scale)
    assert.ok(b.w * scale >= MIN_HIT_PX - 1e-9 && b.h * scale >= MIN_HIT_PX - 1e-9, `scale ${scale}`)
    assert.ok(b.w >= 140 && b.h >= 210)
    assert.ok(Math.abs(b.top + b.h / 2 - (HIT_BELOW - 105)) < 1e-9)
    assert.ok(Math.abs(b.left + b.w / 2) < 1e-9)
  }
  assert.ok(Math.abs(hitBox(minScale(PHONE)).w * minScale(PHONE) - 44) < 1e-9)
  // 멀리서는 구역 이름표만 읽히게 키운다
  assert.equal(zoneLabelScale(1), 1)
  assert.ok(30 * minScale(PHONE) * zoneLabelScale(minScale(PHONE)) >= 13 - 1e-9)
  assert.ok(FAR_SCALE > minScale(PHONE))
})

test('친구 마을: 링크의 주민 순서로 placeAll하면 주인 마을과 같은 자리에 선다 (도착 예정·빈 집터가 있어도)', () => {
  const cards = Object.fromEntries(stage.slice(0, 60).map((p, i) => [p.id, `2026-10-${String(1 + (i % 28)).padStart(2, '0')}`]))
  const owner = villageLayout(cards, {}, [stage[100]!.id, stage[101]!.id])
  const link = owner.residents.map((r) => r.id) // useVillageLink.payload()가 담는 순서
  assert.deepEqual(placeAll(link), owner.residents)
  // 새 지도에서는 구역 자리가 넉넉해서 모두 자리(slot) 위에 선다
  const all = placeAll(stage.map((p) => p.id))
  for (const p of all) assert.ok(ZONE_BY_ID[p.zone].slots.some(([x, y]) => x === p.x && y === p.y), p.id)
})

test('마을로 모시기: 이번에 만난 사람들 상자가 화면에 다 들어오는 배율(최대 0.6)로 가운데에', () => {
  // 작은 상자는 0.6배 그대로
  const near = fitBox(1000, 2000, 1300, 2300, PHONE)
  assert.equal(near.scale, 0.6)
  // 섬 위아래로 퍼진 사람들은 높이에 맞춰 줄인다
  const wide = fitBox(300, 500, 2400, 3800, PHONE)
  assert.ok(Math.abs(wide.scale - Math.min(390 / 2100, 844 / 3300)) < 1e-9)
  assert.ok(wide.scale * 2100 <= 390 + 1e-9 && wide.scale * 3300 <= 844 + 1e-9)
  // 지도 최소 배율보다는 작아지지 않는다
  assert.ok(fitBox(0, 0, MAP_W * 3, MAP_H * 3, PHONE).scale >= 390 / MAP_W - 1e-12)
})

test('마을 목표: 살 수 있는 사람 수는 연결 카드를 뺀 수, 다음 주민은 하루 동안 같고 못 만난 사람만', () => {
  assert.equal(VILLAGE_CAPACITY, PEOPLE_LIST.filter((p) => p.kind !== 'link').length)
  assert.notEqual(VILLAGE_CAPACITY, PEOPLE_LIST.length)
  const a = nextResident([], '2026-10-15', 'u_a')!
  assert.deepEqual(nextResident([], '2026-10-15', 'u_a'), a)
  // 그 사람이 대표 물건의 재료 여정에 나온다
  assert.ok(PEOPLE_LIST.find((p) => p.id === a.personId)?.kind === 'stage')
  assert.ok(a.product.materialIds.length > 0)
  // 날짜나 사용자가 바뀌면 (대개) 다른 사람
  const others = ['2026-10-16', '2026-10-17', '2026-10-18'].map((d) => nextResident([], d, 'u_a')!.personId)
  assert.ok(others.some((id) => id !== a.personId))
  // 만난 사람은 고르지 않는다
  assert.notEqual(nextResident([a.personId], '2026-10-15', 'u_a')!.personId, a.personId)
  // 모두 만났으면 없음
  assert.equal(nextResident(PEOPLE_LIST.map((p) => p.id), '2026-10-15', 'u_a'), null)
})

test('다음 주민 여정: 고른 사람이 반드시 나오는 여정 id 꼬리가 있다 (첫·두 번째·그 밖의 여정 모두)', () => {
  const candidates = PEOPLE_LIST.filter((p) => p.kind === 'stage' && hintProductOf(p.id))
  assert.ok(candidates.length > 150)
  const missed: string[] = []
  for (const p of candidates) {
    const product = hintProductOf(p.id)!
    for (const end of ['-r', '-r-first', '-r-second']) {
      const idOf = (tail: string) => `2026-10-15-3-${tail}${end}`
      const tail = tailMeeting(idOf, product.materialIds, product.name, p.id, 'ab12')
      if (!tail) { missed.push(`${p.id}${end}`); continue }
      // 화면에 나오는 순서(거꾸로 가는 타임라인)에서도 그 사람이 나온다
      const t = buildTimeline(product.materialIds, idOf(tail), product.name)
      const shown = t.some((x) => ((x.type === 'stage' || x.type === 'hidden') && x.personId === p.id) || (x.type === 'pass' && x.personIds.includes(p.id)))
      if (!shown) missed.push(`${p.id}${end} (화면)`)
    }
  }
  assert.deepEqual(missed, [])
  // 같은 사람·같은 소금이면 같은 꼬리, 소금이 다르면 (대개) 다른 꼬리
  const p = candidates[0]!
  const product = hintProductOf(p.id)!
  const idOf = (tail: string) => `2026-10-15-3-${tail}-r`
  assert.equal(tailMeeting(idOf, product.materialIds, product.name, p.id, 'x'), tailMeeting(idOf, product.materialIds, product.name, p.id, 'x'))
  // 하루 동안 고른 다음 주민도 늘 만날 수 있다
  for (const date of ['2026-10-15', '2026-10-16', '2026-10-17', '2026-11-01']) {
    const n = nextResident([], date, 'u_a')!
    assert.ok(tailMeeting((tail) => `${date}-1-${tail}-r`, n.product.materialIds, n.product.name, n.personId, 'zz'), date)
  }
})
