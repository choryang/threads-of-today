import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dateOfKey, daysBefore, expiredDatedKey } from '../shared/cleanup'
import { compactDate, moodCountFor, snapshotMinutes, snapshotStale } from '../shared/today'

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

test('날짜 키: YYYYMMDD', () => {
  assert.equal(compactDate('2026-10-15'), '20261015')
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

test('모두의 오늘 마음 수: 스냅샷 + 스냅샷 뒤에 내가 묶었으면 1, 날짜가 다르면 스냅샷을 쓰지 않는다', () => {
  const snap = { date: '2026-10-15', at: 1000, counts: {}, moods: { wronged: 12 } }
  assert.equal(moodCountFor(snap, 'wronged', '2026-10-15'), 12)
  assert.equal(moodCountFor(snap, 'wronged', '2026-10-15', 500), 12) // 이미 들어 있다
  assert.equal(moodCountFor(snap, 'wronged', '2026-10-15', 2000), 13)
  assert.equal(moodCountFor(snap, 'glad', '2026-10-15'), 0)
  assert.equal(moodCountFor(snap, 'glad', '2026-10-15', 2000), 1)
  assert.equal(moodCountFor(snap, 'wronged', '2026-10-16'), undefined)
  assert.equal(moodCountFor(null, 'wronged', '2026-10-16', 2000), 1)
  // 예전 스냅샷(마음 수 없음)
  assert.equal(moodCountFor({ date: '2026-10-15', at: 1000, counts: {} }, 'wronged', '2026-10-15'), 0)
})

test('마음 키도 이틀 지나면 청소한다', () => {
  assert.equal(dateOfKey('mood:wronged:20261013'), '2026-10-13')
  assert.ok(expiredDatedKey('mood:wronged:20261013', '2026-10-15'))
  assert.ok(!expiredDatedKey('mood:wronged:20261014', '2026-10-15'))
})
