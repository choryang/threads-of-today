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

test('다음 여정 예고를 따라 떠난 여정: teaser는 아는 사람 id만 남고, 병합해도 유지된다', () => {
  const j = { ...journey(`${TODAY}-1-abcd`, 1), teaser: 'sea-crew' }
  const bad = { ...journey(`${TODAY}-2-abcd`, 1), teaser: 'nobody' }
  const s = sanitizeSave({ days: { [TODAY]: { journeys: [j, bad] } } }, TODAY)
  assert.equal(s.days[TODAY]!.journeys[0]!.teaser, 'sea-crew')
  assert.equal('teaser' in s.days[TODAY]!.journeys[1]!, false)
  const a: Save = { ...emptySave(), days: { [TODAY]: { journeys: [j], linkCards: [] } } }
  const b: Save = { ...emptySave(), days: { [TODAY]: { journeys: [{ ...journey(j.id, 2) }], linkCards: [] } } }
  // 더 많이 진행한 쪽(b)에 teaser가 없어도 남는다
  for (const merged of [mergeSaves(a, b, TODAY), mergeSaves(b, a, TODAY)]) {
    assert.equal(merged.days[TODAY]!.journeys[0]!.step, 2)
    assert.equal(merged.days[TODAY]!.journeys[0]!.teaser, 'sea-crew')
  }
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

test('사람별 기록(친해진 정도): 목록은 합집합, quizCorrect는 OR, 기록 없는 카드는 만남 1곳', () => {
  const [p1, p2] = PEOPLE_LIST.map((p) => p.id)
  const a: Save = { ...emptySave(), cards: { [p1!]: '2026-10-01', [p2!]: '2026-10-01' }, people: { [p1!]: { metItems: ['2026-10-01-1-a'], gratitudeDays: ['2026-10-02'] } } }
  const b: Save = { ...emptySave(), cards: { [p1!]: '2026-10-01' }, people: { [p1!]: { metItems: ['2026-10-05-1-b'], gratitudeDays: [], quizCorrect: true } } }
  const m = mergeSaves(a, b, TODAY)
  assert.deepEqual(m.people[p1!], { metItems: ['2026-10-01-1-a', '2026-10-05-1-b'], gratitudeDays: ['2026-10-02'], quizCorrect: true })
  assert.deepEqual(m.people[p2!], { metItems: [`legacy:${p2}`], gratitudeDays: [] })
})

test('오고 있는 물건: 여정 id로 합치고, 한 기기에서 연 물건은 연 것으로 남는다', () => {
  const inc = { journeyId: `${TODAY}-1-abcd-r`, departAt: 1, arriveAt: 2, personId: 'sea-crew' }
  const a: Save = { ...emptySave(), incoming: [inc] }
  const b: Save = { ...emptySave(), incoming: [{ ...inc, openedAt: 3 }] }
  assert.deepEqual(mergeSaves(a, b, '1970-01-02').incoming, [{ ...inc, openedAt: 3 }])
  const old = { ...emptySave() } as Partial<Save>
  delete old.incoming
  assert.deepEqual(mergeSaves(old as Save, a, TODAY).incoming, [inc])
})

test('내 마을 링크·다녀온 마을: 링크는 나중에 바꾼 쪽, 본 시각은 큰 쪽, 다녀온 마을은 토큰으로 합친다', () => {
  const link = { token: 'abcdefghjk', manage: 'a'.repeat(32), open: true, seenAt: 5, updatedAt: 10 }
  const a: Save = { ...emptySave(), village: link, visitedVillages: [{ token: 'mnpqrstuvw', nickname: '세운', at: 1 }] }
  const b: Save = { ...emptySave(), village: { ...link, open: false, seenAt: 3, updatedAt: 20 }, visitedVillages: [{ token: 'mnpqrstuvw', nickname: '세운', at: 7 }, { token: 'xyzABCDEFG', nickname: '옥희', at: 2 }] }
  const m = mergeSaves(a, b, TODAY)
  assert.deepEqual(m.village, { ...link, open: false, seenAt: 5, updatedAt: 20 })
  assert.deepEqual(m.visitedVillages.map((v) => [v.token, v.at]), [['mnpqrstuvw', 7], ['xyzABCDEFG', 2]])
  const s = sanitizeSave({ village: { ...link, token: 'bad' }, visitedVillages: [{ token: 'mnpqrstuvw', nickname: '{name}', at: 1 }, { token: 'xyzABCDEFG', nickname: '옥희', at: 2 }] }, TODAY)
  assert.equal(s.village, undefined)
  assert.deepEqual(s.visitedVillages, [{ token: 'xyzABCDEFG', nickname: '옥희', at: 2 }])
})

test('단짝 연출을 본 주민(bestSeen): 합집합, 모르는 사람·연결 카드는 버린다', () => {
  const a: Save = { ...emptySave(), bestSeen: ['barista'] }
  const b: Save = { ...emptySave(), bestSeen: ['sea-crew', 'barista'] }
  assert.deepEqual(mergeSaves(a, b, TODAY).bestSeen.sort(), ['barista', 'sea-crew'])
  // 예전 기록에는 없다
  const old = { ...emptySave() } as Partial<Save>
  delete old.bestSeen
  assert.deepEqual(mergeSaves(old as Save, b, TODAY).bestSeen.sort(), ['barista', 'sea-crew'])
  assert.deepEqual(sanitizeSave({ bestSeen: ['barista', 'nobody', 'link-sea-crew', 3, 'barista'] }, TODAY).bestSeen, ['barista'])
  assert.deepEqual(sanitizeSave({}, TODAY).bestSeen, [])
})

test('하루 여정 횟수 제한이 없어서 하루 여정 20개도 동기화에서 버리지 않는다 (상한 60)', () => {
  const journeys = Array.from({ length: 20 }, (_, i) => ({ id: `${TODAY}-${i + 1}-ab`, name: '커피', source: 'pick', materialIds: ['coffee'], step: 0, quiz: {}, newCards: [], done: false }))
  assert.equal(sanitizeSave({ days: { [TODAY]: { journeys, linkCards: [] } } }, TODAY).days[TODAY]!.journeys.length, 20)
  const many = Array.from({ length: 80 }, (_, i) => ({ ...journeys[0]!, id: `${TODAY}-${i + 1}-ab` }))
  assert.equal(sanitizeSave({ days: { [TODAY]: { journeys: many, linkCards: [] } } }, TODAY).days[TODAY]!.journeys.length, 60)
})

test('본 알림(unlockSeen) 동기화: 합집합, 둘 다 없으면 없는 채로, 모르는 id는 버린다', () => {
  const a: Save = { ...emptySave(), unlockSeen: ['journeys-3'] }
  const b: Save = { ...emptySave(), unlockSeen: ['second-journey', 'journeys-3'] }
  assert.deepEqual(mergeSaves(a, b, TODAY).unlockSeen?.sort(), ['journeys-3', 'second-journey'])
  assert.deepEqual(mergeSaves(emptySave(), b, TODAY).unlockSeen?.sort(), ['journeys-3', 'second-journey'])
  assert.equal(mergeSaves(emptySave(), emptySave(), TODAY).unlockSeen, undefined)
  assert.equal('unlockSeen' in mergeSaves(emptySave(), emptySave(), TODAY), false)
  assert.deepEqual(sanitizeSave({ unlockSeen: ['journeys-3', 'nope', 3, 'journeys-3'] }, TODAY).unlockSeen, ['journeys-3'])
  assert.equal(sanitizeSave({}, TODAY).unlockSeen, undefined)
})

test('기능을 연 날짜(unlockedOn) 동기화: 단계마다 이른 날짜, 둘 다 없으면 없는 채로, 모르는 단계·날짜 아닌 값은 버린다', () => {
  const a: Save = { ...emptySave(), unlockedOn: { 'second-journey': '2026-10-14', 'journeys-3': '2026-10-16' } }
  const b: Save = { ...emptySave(), unlockedOn: { 'journeys-3': '2026-10-15' } }
  assert.deepEqual(mergeSaves(a, b, TODAY).unlockedOn, { 'second-journey': '2026-10-14', 'journeys-3': '2026-10-15' })
  assert.deepEqual(mergeSaves(emptySave(), b, TODAY).unlockedOn, { 'journeys-3': '2026-10-15' })
  assert.equal('unlockedOn' in mergeSaves(emptySave(), emptySave(), TODAY), false)
  assert.deepEqual(sanitizeSave({ unlockedOn: { 'journeys-3': '2026-10-15', nope: '2026-10-15', 'journeys-5': 'tomorrow', 'journeys-7': 7 } }, TODAY).unlockedOn, { 'journeys-3': '2026-10-15' })
  assert.equal(sanitizeSave({}, TODAY).unlockedOn, undefined)
})

test('핵심 자리에서 만난 횟수(keyMeets) 동기화: 사람마다 큰 값, 둘 다 없으면 없는 채로, 모르는 사람·이상한 값은 버린다', () => {
  const a: Save = { ...emptySave(), keyMeets: { 'sea-crew': 3, barista: 1 } }
  const b: Save = { ...emptySave(), keyMeets: { 'sea-crew': 2, 'busan-crane': 4 } }
  assert.deepEqual(mergeSaves(a, b, TODAY).keyMeets, { 'sea-crew': 3, barista: 1, 'busan-crane': 4 })
  assert.deepEqual(mergeSaves(emptySave(), b, TODAY).keyMeets, b.keyMeets)
  assert.equal('keyMeets' in mergeSaves(emptySave(), emptySave(), TODAY), false)
  const clean = sanitizeSave({ ...emptySave(), keyMeets: { 'sea-crew': 2, nobody: 5, barista: -1, roaster: 1.5, 'busan-crane': '3' } }, TODAY)
  assert.deepEqual(clean?.keyMeets, { 'sea-crew': 2 })
})

test('긴 여정 id(핵심 인물·거꾸로·두 번째 꼬리)도 잘리지 않고 남는다', () => {
  const id = `${TODAY}-12-abcdef-r-k-second`
  const s = sanitizeSave({ days: { [TODAY]: { journeys: [{ ...journey(id, 1) }] } }, incoming: [{ journeyId: id, departAt: 1, arriveAt: 2, personId: PEOPLE_LIST[0]!.id }] }, TODAY)
  assert.equal(s?.days[TODAY]?.journeys[0]?.id, id)
})

test('여정마다 보여 준 이야기 편(keyEpisodes)은 여정과 함께 남고, 모르는 사람·이상한 값은 버린다', () => {
  const id = `${TODAY}-1-abcd-r-k`
  const s = sanitizeSave({ days: { [TODAY]: { journeys: [{ ...journey(id, 2), keyEpisodes: { 'sea-crew': 3, nobody: 1, barista: -1, 'busan-crane': 1.5 } }] } } }, TODAY)
  assert.deepEqual(s?.days[TODAY]?.journeys[0]?.keyEpisodes, { 'sea-crew': 3 })
})

test('오늘 흐름 하루 기록(todays): 날짜마다 하나, 한마디를 건넨 쪽, 이상한 값은 버리고 한 줄·직접 쓴 말은 없다', () => {
  const a: Save = { ...emptySave(), todays: { [TODAY]: { mood: 'wronged', item: '아이스 아메리카노', personId: 'coffee-picker', episode: 2 } } }
  const b: Save = { ...emptySave(), todays: { [TODAY]: { mood: 'wronged', item: '아이스 아메리카노', personId: 'coffee-picker', episode: 2, reply: 0 }, '2026-10-10': { mood: 'tired', item: '라면', personId: 'rice-farmer', episode: null, reply: 'own' } } }
  const merged = mergeSaves(a, b, TODAY).todays!
  assert.equal(merged[TODAY]!.reply, 0)
  assert.equal(merged['2026-10-10']!.reply, 'own')
  assert.equal('todays' in mergeSaves(emptySave(), emptySave(), TODAY), false)
  const clean = sanitizeSave({
    ...emptySave(),
    todays: {
      [TODAY]: { mood: 'glad', item: '라면', personId: 'barista', episode: 1, reply: 2, note: '비밀', ownText: '비밀' },
      'bad-date': { mood: 'glad', item: '라면', personId: 'barista', episode: 1 },
      '2026-10-13': { mood: 'happy', item: '라면', personId: 'barista', episode: 1 },
      '2026-10-12': { mood: 'glad', item: '라면', personId: 'nobody', episode: 1 },
      '2026-10-11': { mood: 'glad', item: '라면', personId: 'barista', episode: -1 },
    },
  }, TODAY)
  assert.deepEqual(clean?.todays, { [TODAY]: { mood: 'glad', item: '라면', personId: 'barista', episode: 1, reply: 2 } })
})
