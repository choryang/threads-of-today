import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { seoulDateKey } from '../shared/logic'
import { FLOWER_COLORS, canLeaveFlower, dateLabel, flowerColor, flowerLabel, hintProductOf, newFlowerNotice, type Flower } from '../shared/visit'

const f = (nickname: string, personId: string, at: number, date = '2026-10-15'): Flower => ({ nickname, personId, date, at })

test('꽃: 같은 방문자는 같은 마을에 서울 날짜로 하루 한 송이', () => {
  assert.ok(canLeaveFlower([], '2026-10-15'))
  assert.ok(!canLeaveFlower(['2026-10-15'], '2026-10-15'))
  assert.ok(canLeaveFlower(['2026-10-14'], '2026-10-15'))
  // 서울 자정에 날짜가 바뀐다
  assert.equal(seoulDateKey(Date.UTC(2026, 9, 15, 14, 59)), '2026-10-15')
  assert.equal(seoulDateKey(Date.UTC(2026, 9, 15, 15, 0)), '2026-10-16')
})

test('꽃 색은 주민 구역별, 꽃 글은 정해진 문구', () => {
  assert.equal(flowerColor('coffee-picker'), FLOWER_COLORS.farm)
  assert.equal(flowerColor('cobalt-miner'), FLOWER_COLORS.mine)
  assert.equal(flowerColor('barista'), FLOWER_COLORS.town)
  assert.equal(dateLabel('2026-10-05'), '10월 5일')
  assert.equal(flowerLabel(f('세운', 'coffee-picker', 1)), '세운님 · 10월 15일 · 커피 체리 수확자에게 고마워요')
})

test('새 꽃 알림: 본 뒤의 꽃만, 한 사람이면 누구에게, 여러 사람이면 묶어서', () => {
  assert.equal(newFlowerNotice([f('세운', 'coffee-picker', 5)], 10), null)
  assert.equal(newFlowerNotice([f('세운', 'coffee-picker', 20)], 10)!.text, '세운님이 다녀갔어요 · 커피 체리 수확자에게 고마워요를 남겼어요')
  const two = newFlowerNotice([f('세운', 'coffee-picker', 20), f('세운', 'barista', 30)], 10)!
  assert.equal(two.text, '세운님이 다녀갔어요 · 바리스타·커피 체리 수확자에게 고마워요를 남겼어요')
  const many = newFlowerNotice([f('세운', 'coffee-picker', 20), f('옥희', 'barista', 30), f('봄비', 'barista', 40), f('세운', 'barista', 5)], 10)!
  assert.equal(many.text, '3명이 다녀갔어요')
  assert.deepEqual(many.flowers.map((x) => x.at), [40, 30, 20]) // 새것부터, 본 뒤의 꽃만
})

test('힌트 물건: 그 사람이 나오는 여정의 물건 (재료가 앞에 있고 적은 것부터)', () => {
  assert.equal(hintProductOf('banana-farmer')?.id, 'banana')
  assert.equal(hintProductOf('coffee-picker')?.id, 'americano')
  assert.equal(hintProductOf('barista')?.name, '아이스 아메리카노') // 가게 사람은 마지막 장면에 나오는 물건
  assert.ok(hintProductOf('trade-clerk'))
  assert.ok(hintProductOf('link-sea-crew')) // 연결 카드는 원래 사람의 물건
  // 세트 보상(전설) 사람은 여정에 나오지 않아 힌트가 없다
  const none = PEOPLE_LIST.filter((p) => !hintProductOf(p.id))
  assert.ok(none.every((p) => p.kind === 'set'), none.map((p) => p.id).join(', '))
})
