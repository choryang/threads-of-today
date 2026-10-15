import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compactDate, formatCount, journeyMeetLine, todayMeetLine, unsentToday } from '../shared/today'

test('숫자 포맷: 천 단위 쉼표', () => {
  assert.equal(formatCount(0), '0')
  assert.equal(formatCount(1203), '1,203')
  assert.equal(formatCount(4512.4), '4,512')
  assert.equal(formatCount(1234567), '1,234,567')
  assert.equal(compactDate('2026-10-15'), '20261015')
})

test('모두의 오늘 문구: 나 말고 아무도 없으면 처음, 아무도 안 만났으면 말하지 않는다', () => {
  assert.equal(todayMeetLine(1203, true), '오늘 1,203명이 이 분을 만났어요')
  assert.equal(todayMeetLine(1, true), '오늘 이 분을 처음 만난 사람이에요')
  assert.equal(todayMeetLine(0, true), '오늘 이 분을 처음 만난 사람이에요')
  assert.equal(todayMeetLine(0, false), '')
  assert.equal(todayMeetLine(3, false), '오늘 3명이 이 분을 만났어요')
  assert.equal(journeyMeetLine(4512), '오늘 당신과 같은 사람을 만난 사람이 모두 4,512명이에요')
  assert.equal(journeyMeetLine(0), '')
})

test('사람마다 서울 날짜로 하루 한 번만 보낸다', () => {
  assert.deepEqual(unsentToday(['a', 'b', 'a'], null, '2026-10-15'), ['a', 'b'])
  assert.deepEqual(unsentToday(['a', 'b'], { date: '2026-10-15', ids: ['a'] }, '2026-10-15'), ['b'])
  // 날짜가 바뀌면 다시 보낸다
  assert.deepEqual(unsentToday(['a'], { date: '2026-10-14', ids: ['a'] }, '2026-10-15'), ['a'])
})
