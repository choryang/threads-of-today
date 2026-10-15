import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KEY_STORIES } from '../shared/data/stories'
import { pickPerson, pickRoute, type Met } from '../shared/pick'

const AMERICANO = { materialIds: ['coffee', 'plastic'], itemName: '아이스 아메리카노' }
/** 첫 사람이 그 사람인 여정 id (출발지 변형은 여정 id 시드로 정해진다) */
function idStartingWith(personId: string, item = AMERICANO): string {
  for (let i = 0; i < 400; i++) {
    const id = `2026-10-15-1-p${i.toString(36)}`
    if (pickRoute(item.materialIds, id, item.itemName)[0] === personId) return id
  }
  throw new Error(`${personId}로 시작하는 여정을 못 찾음`)
}
const seen = (personId: string, ...episodes: number[]): Met[] => episodes.map((episode) => ({ personId, episode }))
const tagsOf = (personId: string, i: number) => KEY_STORIES[personId]!.episodes![i]!.moods
const ID = idStartingWith('coffee-picker')

test('경로: 첫 재료의 출발지부터, 끝에 가게 사람', () => {
  const route = pickRoute(AMERICANO.materialIds, ID, AMERICANO.itemName)
  assert.equal(route[0], 'coffee-picker')
  assert.equal(route.at(-1), 'barista')
})

test('커피 + 억울: 알마즈의 다음 편이 억울한 편이면 알마즈', () => {
  // 알마즈 1·2편을 봤으면 다음 편은 3편(억울)
  assert.ok(tagsOf('coffee-picker', 2).includes('wronged'))
  const pick = pickPerson({ ...AMERICANO, journeyId: ID, mood: 'wronged', history: seen('coffee-picker', 0, 1) })!
  assert.equal(pick.personId, 'coffee-picker')
  assert.equal(pick.episode, 2)
  assert.equal(pick.how, 'mood')
  assert.ok(pick.hands.length > pick.route.length)
})

test('순서를 건너뛰지 않는다: 억울한 편이 뒤에 있어도 다음 편(가장 앞의 안 본 편)만 본다', () => {
  // 처음 만나는 사람: 알마즈의 3편이 억울한 편이지만 1편을 건너뛰지 않는다
  const first = pickPerson({ ...AMERICANO, journeyId: ID, mood: 'wronged', history: [] })!
  assert.equal(first.episode, 0)
  assert.ok(!(first.personId === 'coffee-picker' && first.episode === 2))
  // 어떤 마음이든, 어떤 기록이든 고른 편은 그 사람의 가장 앞의 안 본 편
  const history = [...seen('coffee-picker', 0), ...seen('barista', 0, 1), ...seen('sea-crew', 0)]
  for (const mood of ['glad', 'excited', 'proud', 'plain', 'wronged', 'anxious', 'lonely', 'tired'] as const) {
    const pick = pickPerson({ ...AMERICANO, journeyId: ID, mood, history })!
    const mine = new Set(history.filter((h) => h.personId === pick.personId).map((h) => h.episode))
    const next = KEY_STORIES[pick.personId]!.episodes!.findIndex((_, i) => !mine.has(i))
    assert.equal(pick.episode, next, `${mood}: ${pick.personId}`)
  }
})

test('다음 편이 같은 마음인 사람이 여럿이면 덜 만난 사람, 그다음 출발지에 가까운 사람', () => {
  // 처음엔 모두 첫 편이 '그냥 그랬어요': 출발지에 가까운 알마즈
  const a = pickPerson({ ...AMERICANO, journeyId: ID, mood: 'plain', history: [] })!
  assert.equal(a.personId, 'coffee-picker')
  // 알마즈를 한 번 만났으면 (다음 편이 같은 마음인) 덜 만난 사람 중 출발지에 가까운 사람
  const b = pickPerson({ ...AMERICANO, journeyId: ID, mood: 'plain', history: seen('coffee-picker', 0) })!
  assert.notEqual(b.personId, 'coffee-picker')
  assert.equal(b.episode, 0)
  assert.ok(tagsOf(b.personId, 0).includes('plain'))
})

test('다음 편에 같은 마음이 없으면 같은 칸, 그래도 없으면 아무나의 다음 편', () => {
  // 알마즈 1편을 봤으면 다음 편(2편)은 불안: 억울과 같은 칸
  assert.ok(tagsOf('coffee-picker', 1).includes('anxious'))
  const cell = pickPerson({ ...AMERICANO, journeyId: ID, mood: 'wronged', history: seen('coffee-picker', 0) })!
  assert.equal(cell.how, 'cell')
  assert.equal(cell.personId, 'coffee-picker')
  assert.equal(cell.episode, 1)
  // 아무도 다음 편이 억울·불안이 아니면 아무나의 다음 편
  const any = pickPerson({ ...AMERICANO, journeyId: ID, mood: 'wronged', history: [] })!
  if (any.how === 'next') assert.equal(any.personId, 'coffee-picker')
})

test('다 본 사람은 고르지 않는다', () => {
  const all = KEY_STORIES['coffee-picker']!.episodes!.map((_, i) => i)
  const pick = pickPerson({ ...AMERICANO, journeyId: ID, mood: 'wronged', history: seen('coffee-picker', ...all) })!
  assert.notEqual(pick.personId, 'coffee-picker')
})

test('경로에 이야기가 있는 사람이 없는 물건: 시작한 손을 카드 문구로 (마음 제목 없음)', () => {
  // 삼각김밥: 첫 재료 쌀(국내)과 편의점 사람, 모두 이야기가 아직 없다
  const item = { materialIds: ['rice', 'laver', 'tuna', 'plastic'], itemName: '참치마요 삼각김밥' }
  const pick = pickPerson({ ...item, journeyId: '2026-10-15-1-abcd', mood: 'tired', history: [] })!
  assert.equal(pick.how, 'none')
  assert.equal(pick.episode, null)
  assert.equal(pick.personId, 'rice-farmer')
  assert.ok(pick.route.every((id) => !KEY_STORIES[id]))
})

test('재료를 모르면 고르지 않는다', () => {
  assert.equal(pickPerson({ materialIds: ['nothing'], itemName: '무언가', journeyId: '2026-10-15-1-abcd', mood: 'glad', history: [] }), null)
})
