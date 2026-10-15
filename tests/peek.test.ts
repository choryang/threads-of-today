import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KEY_STORIES } from '../shared/data/stories'
import { nameDoingLine } from '../shared/local-time'
import { peekOf } from '../shared/peek'
import { pickPerson } from '../shared/pick'
import type { TodayRecord } from '../shared/progress'
import { historyOf } from '../shared/today-log'

const eps = KEY_STORIES['vn-coffee-farmer']!.episodes!.map((e) => e.text)
const todays: Record<string, TodayRecord> = {
  '2026-10-12': { mood: 'plain', item: '아이스 아메리카노', personId: 'vn-coffee-farmer', episode: 0, reply: 0, rev: 2 },
  '2026-10-14': { mood: 'wronged', item: '아이스 아메리카노', personId: 'vn-coffee-farmer', episode: 1, reply: 1, rev: 2 },
  '2026-10-13': { mood: 'tired', item: '라면', personId: 'courier', episode: 0, rev: 2 },
}

test('들여다보기는 새 편을 열지 않는다: 본 편만 순서대로, 기록도 그대로', () => {
  const before = JSON.stringify(todays)
  const peek = peekOf(todays, 'vn-coffee-farmer')
  assert.deepEqual(peek.seen, [eps[0], eps[1]])
  assert.deepEqual(peek.last, { date: '2026-10-14', mood: 'wronged' })
  // 여러 번 열어도 같은 것, 기록은 그대로
  for (let i = 0; i < 3; i++) assert.deepEqual(peekOf(todays, 'vn-coffee-farmer'), peek)
  assert.equal(JSON.stringify(todays), before)
  // 다음 만남의 다음 편은 들여다본 뒤에도 그대로 (3편)
  const next = pickPerson({ materialIds: ['coffee'], itemName: '아이스 아메리카노', journeyId: '2026-10-15-1-abcd', mood: 'lonely', history: historyOf(todays) })
  if (next?.personId === 'vn-coffee-farmer') assert.equal(next.episode, 2)
  // 만난 적 없는 사람(걷기에서 처음 본 사람)은 마지막 만남·지난 이야기가 없다
  assert.deepEqual(peekOf(todays, 'sea-crew'), { seen: [] })
})

test('이름을 넣은 지금은 아마: 받침에 따라 은/는, 쉬는 날이면 이름도', () => {
  assert.equal(nameDoingLine('vn-coffee-farmer', '마인', 10), '마인은 아마 커피 나무에 물을 주고 있을 거예요')
  assert.equal(nameDoingLine('courier', '도현', 2), '도현은 아마 아침 배송을 앞두고 자고 있을 거예요')
  assert.equal(nameDoingLine('trade-clerk', '지원', 10, { holiday: '추석', weekend: false }), '오늘은 추석이라 지원도 아마 쉬고 있을 거예요')
  assert.equal(nameDoingLine('trade-clerk', '지원', 10, { weekend: true }), '오늘은 쉬는 날이라 지원도 아마 집에서 쉬고 있을 거예요')
  assert.equal(nameDoingLine('barista', '예은', 10), '예은은 아마 커피를 내리고 있을 거예요')
})
