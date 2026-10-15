import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TodayRecord } from '../shared/progress'
import { historyOf, lastMeeting, memoryFor, recordHow, replyText } from '../shared/today-log'
import { emptySave, sanitizeSave } from '../shared/progress'

const todays: Record<string, TodayRecord> = {
  '2026-10-13': { mood: 'wronged', item: '아이스 아메리카노', personId: 'coffee-picker', episode: 2, reply: 0, rev: 2 },
  '2026-10-11': { mood: 'tired', item: '라면', personId: 'rice-farmer', episode: null },
  '2026-10-14': { mood: 'glad', item: '아이스 아메리카노', personId: 'coffee-picker', episode: 4, reply: 'own', rev: 2 },
}

test('지난 만남은 날짜순, 오늘은 빼고', () => {
  assert.deepEqual(historyOf(todays, '2026-10-14'), [
    { personId: 'rice-farmer', episode: null, covers: [] },
    { personId: 'coffee-picker', episode: 2, covers: [2] },
  ])
  assert.deepEqual(historyOf(undefined), [])
})

test('같은 사람을 다시 만나면 지난번 마음과 건넨 말', () => {
  assert.equal(lastMeeting(todays, 'coffee-picker', '2026-10-15')?.date, '2026-10-14')
  assert.equal(lastMeeting(todays, 'coffee-picker', '2026-10-14')?.date, '2026-10-13')
  assert.equal(memoryFor(todays, 'coffee-picker', '2026-10-14'), '지난번엔 당신도 억울했다고 했죠. (당신이 건넨 말: 저도 오늘 그랬어요)')
  // 직접 쓴 말은 이 기기에 남아 있을 때만
  assert.equal(memoryFor(todays, 'coffee-picker', '2026-10-15'), '지난번엔 당신도 기뻤다고 했죠.')
  assert.equal(memoryFor(todays, 'coffee-picker', '2026-10-15', () => '오늘 고마웠어요'), '지난번엔 당신도 기뻤다고 했죠. (당신이 건넨 말: 오늘 고마웠어요)')
  // 처음 만나는 사람
  assert.equal(memoryFor(todays, 'barista', '2026-10-15'), undefined)
  // 한마디를 안 건넨 날
  assert.equal(replyText(todays['2026-10-11']!), undefined)
  // 좋은 마음의 보기
  assert.equal(replyText({ ...todays['2026-10-14']!, reply: 1 }), '축하해요')
})

test('고른 방식(how)은 기록에 남고, 예전 기록은 카드 문구면 none·아니면 mood', () => {
  assert.equal(recordHow({ mood: 'lonely', item: '운동화', personId: 'sea-crew', episode: 0, how: 'next' }), 'next')
  assert.equal(recordHow({ mood: 'lonely', item: '운동화', personId: 'sea-crew', episode: 0 }), 'mood')
  assert.equal(recordHow({ mood: 'lonely', item: '라면', personId: 'rice-farmer', episode: null }), 'none')
  const s = sanitizeSave({ ...emptySave(), todays: { '2026-10-15': { mood: 'lonely', item: '운동화', personId: 'sea-crew', episode: 0, how: 'cell' }, '2026-10-14': { mood: 'lonely', item: '운동화', personId: 'sea-crew', episode: 0, how: 'weird' } } }, '2026-10-15')
  assert.equal(s?.todays?.['2026-10-15']?.how, 'cell')
  assert.equal(s?.todays?.['2026-10-14']?.how, undefined)
})
