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
const tagged = (personId: string, mood: string) =>
  KEY_STORIES[personId]!.episodes!.map((e, i) => (e.moods.includes(mood as never) ? i : -1)).filter((i) => i >= 0)

test('커피 + 억울: 시다마 출발이면 알마즈의 억울한 편', () => {
  const id = idStartingWith('coffee-picker')
  const pick = pickPerson({ ...AMERICANO, journeyId: id, mood: 'wronged', history: [] })!
  assert.equal(pick.personId, 'coffee-picker')
  assert.equal(pick.how, 'mood')
  assert.equal(pick.episode, tagged('coffee-picker', 'wronged')[0])
  assert.equal(pick.route[0], 'coffee-picker')
  // 거쳐 온 손: 커피 경로 + 플라스틱 경로 + 가게 사람까지
  assert.ok(pick.hands.length > pick.route.length)
  // 가게 사람도 경로에 있다
  assert.equal(pick.route.at(-1), 'barista')
})

test('같은 마음 편이 여럿이면 덜 만난 사람, 그다음 출발지에 가까운 사람', () => {
  const id = idStartingWith('coffee-picker')
  // 알마즈를 이미 한 번 만났으면 억울한 편이 있는 바리스타(덜 만남)를 먼저
  const history: Met[] = [{ personId: 'coffee-picker', episode: 0 }]
  const pick = pickPerson({ ...AMERICANO, journeyId: id, mood: 'wronged', history })!
  assert.equal(pick.personId, 'barista')
  assert.equal(pick.episode, tagged('barista', 'wronged')[0])
})

test('다 본 사람은 고르지 않는다: 알마즈 편을 다 봤으면 다른 사람의 억울한 편', () => {
  const id = idStartingWith('coffee-picker')
  const all = KEY_STORIES['coffee-picker']!.episodes!.map((_, i) => ({ personId: 'coffee-picker', episode: i }))
  const pick = pickPerson({ ...AMERICANO, journeyId: id, mood: 'wronged', history: all })!
  assert.notEqual(pick.personId, 'coffee-picker')
  assert.equal(pick.how, 'mood')
  // 본 편은 다시 나오지 않는다
  const again = pickPerson({ ...AMERICANO, journeyId: id, mood: 'wronged', history: [...all, { personId: pick.personId, episode: pick.episode }] })!
  assert.ok(!(again.personId === pick.personId && again.episode === pick.episode))
})

test('같은 마음 편이 없으면 같은 칸, 그래도 없으면 아무나의 다음 편', () => {
  const id = idStartingWith('coffee-picker')
  // 알마즈·바리스타의 억울한 편을 다 봤으면 같은 칸(불안)의 편
  const seenWronged: Met[] = [
    ...tagged('coffee-picker', 'wronged').map((i) => ({ personId: 'coffee-picker', episode: i })),
    ...tagged('barista', 'wronged').map((i) => ({ personId: 'barista', episode: i })),
  ]
  const cell = pickPerson({ ...AMERICANO, journeyId: id, mood: 'wronged', history: seenWronged })!
  assert.equal(cell.how, 'cell')
  assert.ok(KEY_STORIES[cell.personId]!.episodes![cell.episode!]!.moods.some((m) => m === 'wronged' || m === 'anxious'))
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
