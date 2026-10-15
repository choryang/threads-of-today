import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  LOG_CAP, addGratitude, addMeeting, factOf, friendshipOf, friendshipParts, legacyMeeting, mergePersonLog, migratePeople, nextUnlockHint, quizOf,
} from '../shared/friendship'
import { forwardTimeline } from '../shared/journey'
import { emptySave, mergeSaves, sanitizeSave, type Journey, type PersonLog, type Save } from '../shared/progress'

const TODAY = '2026-10-15'
const log = (met: number, days: number, quiz = false): PersonLog => ({
  metItems: Array.from({ length: met }, (_, i) => `2026-10-0${i + 1}-1-abcd`),
  gratitudeDays: Array.from({ length: days }, (_, i) => `2026-10-1${i}`),
  ...(quiz ? { quizCorrect: true as const } : {}),
})

test('친해진 정도: 만나기 25%씩 최대 75, 고마워요 5%씩 최대 15, 퀴즈 10, 합계 최대 100', () => {
  assert.equal(friendshipOf(undefined).percent, 0)
  assert.equal(friendshipOf(log(1, 0)).percent, 25)
  assert.equal(friendshipOf(log(2, 2)).percent, 60)
  assert.deepEqual(friendshipOf(log(5, 0)), { percent: 75, meet: 75, thanks: 0, quiz: 0, meetCount: 5, thankDays: 0 })
  assert.equal(friendshipOf(log(0, 7)).thanks, 15)
  assert.equal(friendshipOf(log(3, 3, true)).percent, 100)
  assert.equal(friendshipOf(log(8, 8, true)).percent, 100)
  assert.deepEqual(friendshipParts(friendshipOf(log(2, 2))), ['물건 2곳에서 만나기 50%', '고마워요 2일 10%'])
})

test('기록: 같은 여정·같은 날은 한 번만, 목록은 이른 것부터 상한까지', () => {
  let l = addMeeting(undefined, '2026-10-15-1-abcd', '라면')
  l = addMeeting(l, '2026-10-15-1-abcd', '라면')
  assert.deepEqual(l.metItems, ['2026-10-15-1-abcd'])
  assert.deepEqual(l.metNames, ['라면'])
  l = addGratitude(addGratitude(l, TODAY), TODAY)
  assert.deepEqual(l.gratitudeDays, [TODAY])
  for (let i = 0; i < 20; i++) l = addMeeting(l, `2026-09-${String(i + 1).padStart(2, '0')}-1-abcd`, `물건${i}`)
  assert.equal(l.metItems.length, LOG_CAP)
  assert.equal(l.metItems[0], '2026-09-01-1-abcd')
})

test('병합: 목록은 합집합, quizCorrect는 OR', () => {
  const a: PersonLog = { metItems: ['2026-10-01-1-a'], gratitudeDays: ['2026-10-02'], metNames: ['커피'] }
  const b: PersonLog = { metItems: ['2026-10-03-1-b', '2026-10-01-1-a'], gratitudeDays: ['2026-10-04'], quizCorrect: true, metNames: ['라면'] }
  const m = mergePersonLog(a, b)
  assert.deepEqual(m, { metItems: ['2026-10-01-1-a', '2026-10-03-1-b'], gratitudeDays: ['2026-10-02', '2026-10-04'], quizCorrect: true, metNames: ['커피', '라면'] })
  assert.deepEqual(mergePersonLog(b, a).metItems, m.metItems)
})

test('마이그레이션: 남은 여정에서 만난 사람, 기록이 없는 카드는 만남 1곳, 예전 고마워요는 1일', () => {
  const id = `${TODAY}-1-abcd`
  const journey: Journey = { id, name: '라면', source: 'pick', materialIds: ['wheat'], step: 5, quiz: {}, newCards: [], done: true }
  const people = forwardTimeline(['wheat'], id, '라면').flatMap((t) => (t.type === 'stage' ? [t.personId] : []))
  const cards: Record<string, string> = Object.fromEntries([...people, 'cupper'].map((p) => [p, '2026-09-01']))
  const migrated = migratePeople({ cards, days: { [TODAY]: { journeys: [journey], linkCards: [] } }, thanks: { cupper: '2026-09-02', [people[0]!]: '2026-10-01' } })
  assert.deepEqual(migrated[people[0]!]!.metItems, [id])
  assert.deepEqual(migrated[people[0]!]!.metNames, ['라면'])
  assert.deepEqual(migrated[people[0]!]!.gratitudeDays, ['2026-10-01'])
  assert.deepEqual(migrated.cupper, { metItems: [legacyMeeting('cupper')], gratitudeDays: ['2026-09-02'] })
  assert.equal(friendshipOf(migrated.cupper).percent, 30)
  // 가진 카드만, 이미 있는 기록은 건드리지 않는다
  assert.equal(migrated['sea-crew'], undefined)
  const again = migratePeople({ cards, days: {}, thanks: {}, people: { cupper: log(2, 0) } })
  assert.deepEqual(again.cupper, log(2, 0))
})

test('저장: 병합 때 기록 없는 카드는 legacy, 검사는 가진 카드만 남긴다', () => {
  const a: Save = { ...emptySave(), cards: { cupper: '2026-10-01', barista: '2026-10-01' }, people: { barista: log(1, 1) } }
  const b: Save = { ...emptySave(), cards: { barista: '2026-10-01' }, people: { barista: { metItems: ['2026-10-09-1-z'], gratitudeDays: [], quizCorrect: true } } }
  const m = mergeSaves(a, b, TODAY)
  assert.deepEqual(m.people.cupper, { metItems: [legacyMeeting('cupper')], gratitudeDays: [] })
  assert.equal(m.people.barista!.quizCorrect, true)
  assert.equal(m.people.barista!.metItems.length, 2)
  const s = sanitizeSave({ cards: { barista: TODAY }, people: { barista: { metItems: ['x', 'x', 5], gratitudeDays: ['bad', TODAY], quizCorrect: 'yes' }, nobody: log(1, 1) } }, TODAY)
  assert.deepEqual(s.people, { barista: { metItems: ['x'], gratitudeDays: [TODAY] } })
})

test('사실·퀴즈: 출처 있는 것만. 한 재료에만 나오는 사람만 퀴즈가 있다', () => {
  assert.equal(quizOf('coffee-picker')?.materialId, 'coffee')
  assert.equal(quizOf('cupper')?.materialId, 'coffee')
  assert.equal(quizOf('warehouse'), undefined)
  assert.equal(quizOf('sea-crew'), undefined)
  assert.ok(factOf('busan-crane')?.source.url)
  assert.equal(factOf('cupper'), undefined)
  assert.equal(nextUnlockHint('coffee-picker', 60), '75%가 되면 퀴즈와 이 분을 만난 물건 목록이 열려요')
  assert.equal(nextUnlockHint('warehouse', 60), '75%가 되면 이 분을 만난 물건 목록이 열려요')
  assert.equal(nextUnlockHint('busan-crane', 25), '50%가 되면 이 분이 하는 일의 크기가 열려요')
  assert.equal(nextUnlockHint('coffee-picker', 100), '')
})
