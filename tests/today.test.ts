import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dateOfKey, daysBefore, expiredDatedKey } from '../shared/cleanup'
import { compactDate, formatCount, journeyMeetLine, meetCountFor, snapshotMinutes, snapshotStale, todayMeetLine, unsentToday } from '../shared/today'

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

test('스냅샷: 없거나 날짜가 바뀌었거나 간격(기본 30분)이 지났을 때만 다시 센다', () => {
  const t = Date.UTC(2026, 9, 15, 3, 0)
  const snap = { date: '2026-10-15', at: t, counts: { a: 3 } }
  assert.ok(snapshotStale(null, t, '2026-10-15'))
  assert.ok(!snapshotStale(snap, t + 29 * 60_000, '2026-10-15'))
  assert.ok(snapshotStale(snap, t + 30 * 60_000, '2026-10-15'))
  assert.ok(snapshotStale(snap, t + 10 * 60_000, '2026-10-15', 10 * 60_000))
  assert.ok(snapshotStale(snap, t + 60_000, '2026-10-16'))
})

test('MEET_SNAPSHOT_MINUTES: 기본 30분, 숫자가 아니면 기본값, 1분~하루로 자른다', () => {
  assert.equal(snapshotMinutes(undefined), 30)
  assert.equal(snapshotMinutes(''), 30)
  assert.equal(snapshotMinutes('abc'), 30)
  assert.equal(snapshotMinutes('10'), 10)
  assert.equal(snapshotMinutes(' 15 '), 15)
  assert.equal(snapshotMinutes('0'), 1)
  assert.equal(snapshotMinutes('-5'), 1)
  assert.equal(snapshotMinutes('99999'), 1440)
})

test('화면의 오늘 수: 스냅샷 뒤에 내가 보냈으면 나를 더하고, 어제 스냅샷은 0으로 본다', () => {
  const snap = { date: '2026-10-15', at: 1000, counts: { a: 3 } }
  assert.equal(meetCountFor(snap, 'a', '2026-10-15'), 3)
  assert.equal(meetCountFor(snap, 'b', '2026-10-15'), 0)
  assert.equal(meetCountFor(snap, 'a', '2026-10-15', 500), 3) // 이미 스냅샷에 들어 있다
  assert.equal(meetCountFor(snap, 'a', '2026-10-15', 2000), 4)
  assert.equal(meetCountFor(snap, 'a', '2026-10-16'), 0)
  assert.equal(meetCountFor(snap, 'a', '2026-10-16', 2000), 1)
  assert.equal(meetCountFor(null, 'a', '2026-10-15'), undefined)
  assert.equal(meetCountFor(null, 'a', '2026-10-15', 2000), 1)
})

test('날짜 키 청소: 오늘·어제 키는 남기고 그 전 것만, 날짜 키가 아니면 건드리지 않는다', () => {
  assert.equal(daysBefore('2026-10-01', 1), '2026-09-30')
  assert.equal(daysBefore('2026-01-01', 2), '2025-12-30')
  assert.equal(dateOfKey('meet:coffee-picker:20261013'), '2026-10-13')
  assert.equal(dateOfKey('thanks:day:2026-10-13:coffee-picker'), '2026-10-13')
  assert.equal(dateOfKey('thanks:total'), null)
  assert.equal(dateOfKey('meet-snapshot'), null)
  assert.ok(expiredDatedKey('meet:coffee-picker:20261013', '2026-10-15'))
  assert.ok(!expiredDatedKey('meet:coffee-picker:20261014', '2026-10-15'))
  assert.ok(!expiredDatedKey('meet:coffee-picker:20261015', '2026-10-15'))
  assert.ok(expiredDatedKey('thanks:day:2026-10-13:barista', '2026-10-15'))
  assert.ok(!expiredDatedKey('thanks:day:2026-10-14:barista', '2026-10-15'))
  assert.ok(!expiredDatedKey('thanks:seen:2026-10-01:abc:barista', '2026-10-15')) // 기간이 걸린 키는 건드리지 않는다
})
