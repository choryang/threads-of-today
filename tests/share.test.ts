import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SHARE_KINDS, createShares, dayShareTitle, isToken, threadQuote, threadShareTitle, threadWho, withEuro, type ShareStore } from '../shared/share'

function memoryStore() {
  const data = new Map<string, string>()
  const store: ShareStore = {
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => { data.set(k, v) },
    del: async (k) => { data.delete(k) },
  }
  return { store, data }
}

const PICK = { items: ['samgyeopsal', 'banana-milk', 'burger'], type: 'sky', nickname: '노을의 찻잎' }

test('공유: 발급·조회. 유형은 고른 물건으로 다시 계산하고, 관리 키·소유자는 내보내지 않는다', async () => {
  const { store, data } = memoryStore()
  const shares = createShares(store, () => 1_000)
  const made = (await shares.issue('day', PICK))!
  assert.ok(isToken(made.token))
  assert.equal(made.path, `/d/${made.token}`)
  assert.equal(made.expiresAt, 1_000 + SHARE_KINDS.day.ttl * 1000)
  const seen = (await shares.lookup(made.token))!
  assert.deepEqual(seen, { kind: 'day', payload: { items: PICK.items, type: 'ranch', nickname: '노을의 찻잎' }, expiresAt: made.expiresAt })
  assert.ok(!JSON.stringify(seen).includes(made.manage))
  // 저장된 값에도 관리 키 원문은 없다 (해시만)
  assert.ok(![...data.values()].some((v) => v.includes(made.manage)))
  assert.equal(dayShareTitle(seen.payload as typeof PICK & { type: 'ranch' }), "노을의 찻잎님의 하루는 '목장에서 온 하루'예요")
})

test('공유: 같은 관리 키로 다시 만들면 이전 링크는 열리지 않는다', async () => {
  const { store } = memoryStore()
  const shares = createShares(store)
  const first = (await shares.issue('day', PICK))!
  const second = (await shares.issue('day', { ...PICK, items: ['kimchi', 'apple', 'samgak'] }, first.manage))!
  assert.equal(second.manage, first.manage)
  assert.notEqual(second.token, first.token)
  assert.equal(await shares.lookup(first.token), null)
  assert.equal(((await shares.lookup(second.token))!.payload as { type: string }).type, 'home')
})

test('공유: 틀린 내용·아직 없는 종류·만료된 링크·모르는 토큰', async () => {
  const { store } = memoryStore()
  let now = 0
  const shares = createShares(store, () => now)
  assert.equal(await shares.issue('day', { ...PICK, items: ['kimchi'] }), null)
  assert.equal(await shares.issue('day', { ...PICK, nickname: '' }), null)
  assert.equal(await shares.issue('person', { anything: true }), null)
  const made = (await shares.issue('day', PICK))!
  now = made.expiresAt + 1
  assert.equal(await shares.lookup(made.token), null)
  assert.equal(await shares.lookup('../../etc'), null)
})

test('공유: 받은 사람이 보여주기를 누른 답만, 보낸 사람이 관리 키로 읽는다', async () => {
  const { store } = memoryStore()
  const shares = createShares(store, () => 5)
  const made = (await shares.issue('day', PICK))!
  assert.deepEqual((await shares.replies(made.manage))!.replies, [])
  assert.ok(await shares.reply(made.token, { items: ['kimchi', 'apple', 'samgak'], nickname: '바다의 연필' }))
  assert.ok(!(await shares.reply(made.token, { items: ['kimchi'], nickname: '바다의 연필' })))
  const got = (await shares.replies(made.manage))!
  assert.deepEqual(got.replies, [{ items: ['kimchi', 'apple', 'samgak'], type: 'home', nickname: '바다의 연필', at: 5 }])
  assert.equal(await shares.replies('x'.repeat(32)), null)
})

test('마을 초대: 닉네임·주민·방문 받기만, 내용을 고쳐도 링크는 그대로, 새로 만들면 이전 링크는 닫힌다', async () => {
  const { store } = memoryStore()
  let now = 0
  const shares = createShares(store, () => now)
  const made = (await shares.issue('village', { nickname: '세운', residents: ['barista', 'link-sea-crew', 'nobody', 'barista'], open: true, secret: 'x' }))!
  assert.equal(made.path, `/v/${made.token}`)
  assert.deepEqual((await shares.lookup(made.token))!.payload, { nickname: '세운', residents: ['barista'], open: true, bestFriends: [] })
  now = 1000
  // 단짝은 주민 중에서만, id만 (퍼센트 같은 다른 값은 버린다)
  const updated = (await shares.update(made.manage, { nickname: '세운', residents: ['barista', 'sea-crew'], open: false, bestFriends: ['sea-crew', 'cupper', 'sea-crew', 7], percent: { 'sea-crew': 100 } }))!
  assert.equal(updated.token, made.token)
  assert.equal(updated.expiresAt, 1000 + SHARE_KINDS.village.ttl * 1000)
  assert.deepEqual((await shares.lookup(made.token))!.payload, { nickname: '세운', residents: ['barista', 'sea-crew'], open: false, bestFriends: ['sea-crew'] })
  assert.ok(await shares.ownerOf(made.token))
  assert.equal(await shares.update('y'.repeat(32), { nickname: '세운', residents: [], open: true }), null)
  const again = (await shares.issue('village', { nickname: '세운', residents: [], open: true }, made.manage))!
  assert.notEqual(again.token, made.token)
  assert.equal(await shares.lookup(made.token), null)
  assert.equal(await shares.ownerOf(made.token), null)
})

test('오늘의 실 공유: 날짜·마음·사람·편·물건만, 한 줄·직접 쓴 말은 담지 않는다. 카드 그림은 만든 기기만', async () => {
  const { store, data } = memoryStore()
  const shares = createShares(store, () => 1_000)
  const payload = { date: '2026-10-15', mood: 'wronged', personId: 'coffee-picker', episode: 2, item: '아이스 아메리카노', note: '비밀', own: '비밀' }
  const made = (await shares.issue('thread', payload))!
  assert.equal(made.path, `/t/${made.token}`)
  const seen = (await shares.lookup(made.token))!
  assert.deepEqual(seen.payload, { date: '2026-10-15', mood: 'wronged', personId: 'coffee-picker', episode: 2, item: '아이스 아메리카노' })
  assert.ok(![...data.values()].some((v) => v.includes('비밀')))
  // 틀린 값
  assert.equal(await shares.issue('thread', { ...payload, mood: 'happy' }), null)
  assert.equal(await shares.issue('thread', { ...payload, personId: 'nobody' }), null)
  assert.equal(await shares.issue('thread', { ...payload, episode: 99 }), null)
  assert.equal(await shares.issue('thread', { ...payload, item: ' ' }), null)
  assert.ok(await shares.issue('thread', { ...payload, personId: 'rice-farmer', episode: null }))
  // 관리 키
  assert.ok(await shares.manages(made.token, made.manage))
  assert.equal(await shares.manages(made.token, 'x'.repeat(32)), null)
})

test('오늘의 실 문구: 인용은 그 편의 첫 문장, 이름은 장소와 함께, 으로/로', () => {
  assert.equal(threadQuote({ personId: 'coffee-picker', episode: 2 }), '알마즈는 끝까지 익은 것만 골랐어요.')
  assert.equal(threadWho({ personId: 'coffee-picker' }), '에티오피아 시다마의 알마즈')
  assert.equal(withEuro('라면'), '라면으로')
  assert.equal(withEuro('아이스 아메리카노'), '아이스 아메리카노로')
  assert.equal(withEuro('물'), '물로')
  assert.equal(threadShareTitle({ date: '2026-10-15', mood: 'wronged', personId: 'coffee-picker', episode: 2, item: '라면' }), '오늘 나와 같은 하루를 보낸 사람, 에티오피아 시다마의 알마즈')
})
