import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { NICKNAME_MAX, normalizeNickname, randomNickname } from '../shared/nickname'
import { emptySave, mergeSaves, sanitizeSave, type Journey, type Save } from '../shared/progress'
import { CODE_WORDS, generateRecoveryCode, normalizeRecoveryCode } from '../shared/recovery'
import { isValidVoiceTemplate, renderVoice } from '../shared/voice'

const TODAY = '2026-10-14'
const journey = (id: string, step: number, done = false): Journey => ({
  id, name: '라면', source: 'pick', materialIds: ['wheat'], step, quiz: {}, newCards: [], done,
})

test('병합: 카드·물건은 합집합, 먼저 얻은 날을 남긴다', () => {
  const [p1, p2, p3] = PEOPLE_LIST.map((p) => p.id)
  const a: Save = { ...emptySave(), cards: { [p1!]: '2026-10-10', [p2!]: '2026-10-12' }, items: { 라면: '2026-10-12' } }
  const b: Save = { ...emptySave(), cards: { [p2!]: '2026-10-11', [p3!]: '2026-10-13' }, items: { 김밥: '2026-10-13' } }
  const m = mergeSaves(a, b, TODAY)
  assert.deepEqual(m.cards, { [p1!]: '2026-10-10', [p2!]: '2026-10-11', [p3!]: '2026-10-13' })
  assert.deepEqual(Object.keys(m.items).sort(), ['김밥', '라면'])
})

test('병합: 날짜별 기록은 최근 30일만, 같은 여정은 더 많이 진행한 쪽', () => {
  const a: Save = { ...emptySave(), days: {
    '2026-09-14': { journeys: [journey('2026-09-14-1aaaa', 1)], linkCards: [] },
    '2026-09-15': { journeys: [journey('2026-09-15-1aaaa', 1)], linkCards: [] },
    [TODAY]: { journeys: [journey(`${TODAY}-1aaaa`, 2)], linkCards: [] },
  } }
  const b: Save = { ...emptySave(), days: {
    [TODAY]: { journeys: [journey(`${TODAY}-1aaaa`, 5, true), journey(`${TODAY}-1bbbb`, 1)], linkCards: ['x'] },
  } }
  const m = mergeSaves(a, b, TODAY)
  assert.deepEqual(Object.keys(m.days).sort(), ['2026-09-15', TODAY]) // 09-14는 31일 전
  const today = m.days[TODAY]!
  assert.equal(today.journeys.length, 2)
  assert.equal(today.journeys.find((j) => j.id === `${TODAY}-1aaaa`)?.done, true)
})

test('병합: 닉네임은 더 최근에 바꾼 쪽, 연속 기록은 더 최근 날', () => {
  const a: Save = { ...emptySave(), nickname: { value: '기본', updatedAt: 0 }, streak: { last: '2026-10-13', count: 4 } }
  const b: Save = { ...emptySave(), nickname: { value: '바꾼 이름', updatedAt: 100 }, streak: { last: TODAY, count: 1 } }
  const m = mergeSaves(a, b, TODAY)
  assert.equal(m.nickname?.value, '바꾼 이름')
  assert.deepEqual(m.streak, { last: TODAY, count: 1 })
  assert.deepEqual(mergeSaves(a, a, TODAY), mergeSaves(a, a, TODAY)) // 같은 걸 합쳐도 그대로
})

test('검사: 모르는 카드와 잘못된 값은 버린다', () => {
  const s = sanitizeSave({ cards: { nobody: TODAY, [PEOPLE_LIST[0]!.id]: TODAY }, days: { 'bad-key': {}, [TODAY]: { journeys: [{ id: 'x' }, journey(`${TODAY}-1aaaa`, 1)] } }, nickname: { value: '{name}', updatedAt: 1 } }, TODAY)
  assert.deepEqual(Object.keys(s.cards), [PEOPLE_LIST[0]!.id])
  assert.deepEqual(Object.keys(s.days), [TODAY])
  assert.equal(s.days[TODAY]!.journeys.length, 1)
  assert.equal(s.nickname, undefined)
})

test('고마움: 합집합으로 합치고 먼저 전한 날을 남긴다. 예전 기록(thanks 없음)과도 합쳐진다', () => {
  const [p1, p2] = PEOPLE_LIST.map((p) => p.id)
  const a: Save = { ...emptySave(), cards: { [p1!]: '2026-10-01', [p2!]: '2026-10-01' }, thanks: { [p1!]: '2026-10-12' } }
  const b: Save = { ...emptySave(), cards: { [p1!]: '2026-10-01', [p2!]: '2026-10-01' }, thanks: { [p1!]: '2026-10-10', [p2!]: '2026-10-13' } }
  assert.deepEqual(mergeSaves(a, b, TODAY).thanks, { [p1!]: '2026-10-10', [p2!]: '2026-10-13' })
  const old = { ...emptySave(), cards: { [p1!]: '2026-10-01' } } as Partial<Save>
  delete old.thanks
  assert.deepEqual(mergeSaves(old as Save, a, TODAY).thanks, { [p1!]: '2026-10-12' })
})

test('재료별 누적: 같은 재료는 횟수 큰 쪽·처음 날짜는 이른 쪽, 예전 기록과도 합쳐진다', () => {
  const a: Save = { ...emptySave(), threads: { coffee: { count: 5, first: '2026-09-01' }, rice: { count: 1, first: '2026-10-10' } } }
  const b: Save = { ...emptySave(), threads: { coffee: { count: 3, first: '2026-08-20' }, milk: { count: 2, first: '2026-10-01' } } }
  assert.deepEqual(mergeSaves(a, b, TODAY).threads, {
    coffee: { count: 5, first: '2026-08-20' },
    rice: { count: 1, first: '2026-10-10' },
    milk: { count: 2, first: '2026-10-01' },
  })
  const old = { ...emptySave() } as Partial<Save>
  delete old.threads
  assert.deepEqual(mergeSaves(old as Save, a, TODAY).threads, a.threads)
})

test('검사: 재료별 누적은 아는 재료·양의 정수·날짜 형식만', () => {
  const s = sanitizeSave({ threads: { coffee: { count: 2, first: TODAY }, nope: { count: 1, first: TODAY }, rice: { count: 0, first: TODAY }, milk: { count: 1.5, first: TODAY }, egg: { count: 1, first: 'x' } } }, TODAY)
  assert.deepEqual(s.threads, { coffee: { count: 2, first: TODAY } })
})

test('본 감사 장면: 합집합, 모르는 장면 id는 버린다', () => {
  const a: Save = { ...emptySave(), seenScenes: ['set-sea'] }
  const b: Save = { ...emptySave(), seenScenes: ['set-soil', 'set-sea'] }
  assert.deepEqual(mergeSaves(a, b, TODAY).seenScenes.sort(), ['set-sea', 'set-soil'])
  assert.deepEqual(sanitizeSave({ seenScenes: ['set-sea', 'ending', 'nope', 3] }, TODAY).seenScenes, ['set-sea', 'ending'])
})

test('검사: 고마움은 만난 카드에만, 날짜 형식이 맞을 때만 남긴다', () => {
  const [p1, p2] = PEOPLE_LIST.map((p) => p.id)
  const s = sanitizeSave({ cards: { [p1!]: TODAY }, thanks: { [p1!]: TODAY, [p2!]: TODAY, nobody: TODAY, [`${p1}x`]: 'bad' } }, TODAY)
  assert.deepEqual(s.thanks, { [p1!]: TODAY })
  assert.deepEqual(sanitizeSave({ cards: { [p1!]: TODAY } }, TODAY).thanks, {})
})

test('닉네임: 기본값은 12자 이하, 직접 정한 값은 앞뒤 공백 제거·1~12자', () => {
  for (let i = 0; i < 300; i++) assert.ok(Array.from(randomNickname()).length <= NICKNAME_MAX)
  assert.match(randomNickname(() => 0), /^.+의 .+$/)
  assert.equal(normalizeNickname('  커피 체리  '), '커피 체리')
  assert.equal(normalizeNickname('   '), null)
  assert.equal(normalizeNickname('가'.repeat(13)), null)
  assert.equal(normalizeNickname('가'.repeat(12)), '가'.repeat(12))
  assert.equal(normalizeNickname('{name}'), null)
})

test('복구 코드: 낱말-낱말-숫자4, 0과 1 없음, 입력 형식이 달라도 알아본다', () => {
  for (let i = 0; i < 200; i++) {
    const code = generateRecoveryCode()
    assert.match(code, /^[가-힣]{2}-[가-힣]{2}-[2-9]{4}$/)
    assert.equal(normalizeRecoveryCode(code), code)
  }
  const [w1, w2] = CODE_WORDS
  assert.equal(normalizeRecoveryCode(` ${w1} ${w2} 2345 `), `${w1}-${w2}-2345`)
  assert.equal(normalizeRecoveryCode(`${w1}${w2}2345`), `${w1}-${w2}-2345`)
  assert.equal(normalizeRecoveryCode(`${w1}-${w2}-2301`), null)
  assert.equal(normalizeRecoveryCode('없는말-연필-2345'), null)
  assert.equal(new Set(CODE_WORDS).size, CODE_WORDS.length)
})

test('대사 자리표시자: 부르는 말로만 쓰고 화면에서 닉네임을 끼운다', () => {
  assert.ok(isValidVoiceTemplate('{name}, 오늘도 수고했어요'))
  assert.ok(isValidVoiceTemplate('{name}님 안녕하세요!'))
  assert.ok(isValidVoiceTemplate('천천히 마셔요'))
  assert.ok(!isValidVoiceTemplate('{name}이 좋아요'))
  assert.ok(!isValidVoiceTemplate('안녕 {user}'))
  assert.equal(renderVoice('{name}, 오늘도 수고했어요', '커피 체리'), '커피 체리, 오늘도 수고했어요')
  assert.equal(renderVoice('{name}, 오늘도 수고했어요', ''), '오늘도 수고했어요')
  assert.equal(renderVoice(undefined, '커피 체리'), '')
})
