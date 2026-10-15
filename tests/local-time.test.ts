import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  SKY,
  clockAt,
  clockLabel,
  dayInfo,
  doingBucket,
  doingLine,
  holidayLine,
  localDay,
  orbAt,
  parseClock,
  seoulDiffText,
  shiftToLocal,
  shiftToLocalDate,
  skyPhase,
  utcOffsetMinutes,
} from '../shared/local-time'
import { PLACES } from '../shared/data/places'

// 2026-10-15 09:05 UTC = 서울 18:05 = 시다마 12:05
const NOW = new Date(Date.UTC(2026, 9, 15, 9, 5))

test('그곳의 지금 시각과 서울과의 차이', () => {
  const tz = PLACES['et-sidama']!.tz
  assert.deepEqual(clockAt(tz, NOW), { h: 12, m: 5 })
  assert.equal(clockLabel(clockAt(tz, NOW)), '오후 12:05')
  assert.equal(clockLabel(clockAt('Asia/Seoul', NOW)), '오후 6:05')
  assert.equal(seoulDiffText(tz, NOW), '6시간 늦어요')
  assert.equal(seoulDiffText('Asia/Seoul', NOW), '같은 시각')
  assert.equal(seoulDiffText('Asia/Kolkata', NOW), '3시간 30분 늦어요')
  assert.equal(seoulDiffText('Pacific/Auckland', NOW), '4시간 빨라요') // 10월은 뉴질랜드 서머타임(UTC+13)
})

test('날짜가 바뀌는 곳도 UTC 차이를 바로 잰다', () => {
  // 서울 18:05일 때 시카고는 전날이 아니라 같은 날 04:05 (서머타임 UTC−5)
  assert.equal(utcOffsetMinutes('America/Chicago', NOW), -300)
  assert.deepEqual(clockAt('America/Chicago', NOW), { h: 4, m: 5 })
  assert.equal(seoulDiffText('America/Chicago', NOW), '14시간 늦어요')
  // 서울 새벽 1시면 시카고는 전날 11시
  const late = new Date(Date.UTC(2026, 9, 14, 16, 0))
  assert.deepEqual(clockAt('America/Chicago', late), { h: 11, m: 0 })
  assert.equal(utcOffsetMinutes('Asia/Seoul', late), 540)
})

test('오전·오후 표기 (자정과 정오)', () => {
  assert.equal(clockLabel({ h: 0, m: 0 }), '오전 12:00')
  assert.equal(clockLabel({ h: 6, m: 5 }), '오전 6:05')
  assert.equal(clockLabel({ h: 12, m: 30 }), '오후 12:30')
  assert.equal(clockLabel({ h: 23, m: 59 }), '오후 11:59')
})

test('하늘은 가이드 표의 시간대를 따른다', () => {
  const at = (h: number) => skyPhase(h)
  assert.deepEqual([0, 4, 5, 6, 7, 16, 17, 18, 19, 20, 23].map(at), ['night', 'night', 'dawn', 'dawn', 'day', 'day', 'sunset', 'sunset', 'evening', 'night', 'night'])
  assert.equal(SKY.day.overlay, undefined)
  assert.deepEqual(SKY.night.overlay, { color: '#1B2440', blend: 'multiply', opacity: 0.75 })
  assert.deepEqual(SKY.sunset.overlay, { color: '#F2A97B', blend: 'soft-light', opacity: 0.6 })
  assert.equal(SKY.evening.stars, 1)
  assert.ok(SKY.night.stars > 1)
})

test('해는 새벽에 낮게 떠서 한낮에 가장 높고, 밤엔 달', () => {
  const dawn = orbAt({ h: 6, m: 0 })
  const noon = orbAt({ h: 12, m: 0 })
  const dusk = orbAt({ h: 18, m: 0 })
  const night = orbAt({ h: 0, m: 0 })
  assert.equal(dawn.kind, 'sun')
  assert.equal(noon.kind, 'sun')
  assert.equal(dusk.kind, 'sun')
  assert.equal(night.kind, 'moon')
  assert.ok(dawn.x < noon.x && noon.x < dusk.x)
  assert.ok(noon.lift > 0.99)
  assert.ok(dawn.lift < 0.5 && dusk.lift < 0.5)
  assert.equal(orbAt({ h: 19, m: 0 }).kind, 'moon')
  assert.equal(orbAt({ h: 19, m: 0 }).x, 0)
  assert.ok(orbAt({ h: 4, m: 59 }).x > 0.99)
})

test('지금은 아마 …: 일 7~18시, 저녁 18~22시, 그 밖엔 잠', () => {
  assert.deepEqual([6, 7, 17, 18, 21, 22, 3].map((h) => doingBucket(h)), ['sleep', 'work', 'work', 'eve', 'eve', 'sleep', 'sleep'])
  assert.equal(doingLine('coffee-picker', 12), '지금은 아마 커피 밭에서 열매를 따고 있을 거예요')
  assert.equal(doingLine('coffee-picker', 19), '지금은 아마 집에서 저녁을 먹고 있을 거예요')
  assert.equal(doingLine('sea-crew', 2), '지금은 아마 선실에서 자고 있을 거예요')
  assert.equal(doingLine('busan-crane', 20), '지금은 아마 교대하고 퇴근하는 길일 거예요')
  // 그 사람 저녁 문구가 없으면 일반 문구, 없는 사람도 일반 문구
  assert.equal(doingLine('roaster', 20), '지금은 아마 일을 마치고 저녁을 먹고 있을 거예요')
  assert.equal(doingLine('nobody', 10), '지금은 아마 일하고 있을 거예요')
})

test('개발용 시각 바꾸기', () => {
  assert.deepEqual(parseClock('05:30'), { h: 5, m: 30 })
  assert.deepEqual(parseClock('17'), { h: 17, m: 0 })
  assert.equal(parseClock('25:00'), undefined)
  assert.equal(parseClock('abc'), undefined)
  assert.equal(parseClock(undefined), undefined)
  const tz = PLACES['et-sidama']!.tz
  assert.deepEqual(clockAt(tz, shiftToLocal(NOW, tz, { h: 5, m: 30 })), { h: 5, m: 30 })
  assert.deepEqual(clockAt(tz, shiftToLocal(NOW, tz, { h: 23, m: 0 })), { h: 23, m: 0 })
  assert.equal(localDay(tz, shiftToLocalDate(NOW, tz, '2026-09-27')).ymd, '2026-09-27')
  assert.equal(shiftToLocalDate(NOW, tz, 'nope'), NOW)
})

test('사람마다 일하는 시간: 밤에 일하는 사람은 밤이 일, 낮이 잠', () => {
  // 경매사 22~7시: 새벽 3시엔 경매, 아침 9시엔 정리, 오후 3시엔 잠
  assert.equal(doingBucket(3, [22, 7]), 'work')
  assert.equal(doingBucket(22, [22, 7]), 'work')
  assert.equal(doingBucket(9, [22, 7]), 'eve')
  assert.equal(doingBucket(15, [22, 7]), 'sleep')
  assert.equal(doingLine('garak-auctioneer', 2), '지금은 아마 경매장에서 손짓으로 값을 부르고 있을 거예요')
  assert.equal(doingLine('garak-auctioneer', 14), '지금은 아마 밤 경매를 앞두고 자고 있을 거예요')
  // 치킨집 14~2시: 자정 넘어도 일, 새벽 3시엔 정리
  assert.equal(doingLine('chicken-shop', 1), '지금은 아마 치킨을 튀기고 있을 거예요')
  assert.equal(doingLine('chicken-shop', 3), '지금은 아마 가게 문을 닫고 정리하고 있을 거예요')
})

test('그곳의 오늘: 공휴일과 주말', () => {
  const tz = PLACES['et-sidama']!.tz
  // 2026-09-27 에티오피아 메스켈 (서울 기준 같은 날 낮)
  const meskel = new Date(Date.UTC(2026, 8, 27, 9, 0))
  assert.deepEqual(localDay(tz, meskel), { ymd: '2026-09-27', weekday: 0 })
  assert.equal(dayInfo('에티오피아', tz, meskel).holiday, '메스켈')
  assert.equal(holidayLine('메스켈'), '오늘은 메스켈이에요')
  assert.equal(holidayLine('설날'), '오늘은 설날이에요')
  assert.equal(holidayLine('부활절 월요일'), '오늘은 부활절 월요일이에요')
  // 한국 추석 연휴는 사흘
  assert.equal(dayInfo('대한민국', 'Asia/Seoul', new Date(Date.UTC(2026, 8, 23, 3))).holiday, '추석 연휴')
  assert.equal(dayInfo('대한민국', 'Asia/Seoul', new Date(Date.UTC(2026, 8, 24, 3))).holiday, '추석')
  // 2026-10-16은 금요일: 사우디아라비아는 주말, 대한민국은 평일
  const fri = new Date(Date.UTC(2026, 9, 16, 9))
  assert.equal(dayInfo('사우디아라비아', 'Asia/Riyadh', fri).weekend, true)
  assert.equal(dayInfo('대한민국', 'Asia/Seoul', fri).weekend, false)
  // 바다 위는 나라가 없어 쉬는 날도 없다
  assert.deepEqual(dayInfo('', 'Indian/Maldives', meskel), { holiday: undefined, weekend: false })
})

test('평일에만 일하는 사람은 공휴일·주말 일하는 시간에 쉰다', () => {
  const holiday = { holiday: '추석', weekend: false }
  const weekend = { weekend: true }
  assert.equal(doingLine('trade-clerk', 10, holiday), '오늘은 추석이라 아마 쉬고 있을 거예요')
  assert.equal(doingLine('trade-clerk', 10, weekend), '오늘은 쉬는 날이라 아마 집에서 쉬고 있을 거예요')
  assert.equal(doingLine('trade-clerk', 10, { weekend: false }), '지금은 아마 수입 서류를 맞추고 있을 거예요')
  // 일하는 시간이 아니면 그대로, 날마다 일하는 사람(농부·선원)도 그대로
  assert.equal(doingLine('trade-clerk', 23, holiday), '지금은 아마 자고 있을 거예요')
  assert.equal(doingLine('coffee-picker', 10, holiday), '지금은 아마 커피 밭에서 열매를 따고 있을 거예요')
})
