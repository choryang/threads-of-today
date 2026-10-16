import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KEY_STORIES } from '../shared/data/stories'
import { SHARE_KINDS, createShares, isShareKind, isToken, threadHeader, threadQuote, threadShareTitle, threadWho, withEuro, type ShareStore } from '../shared/share'

function memoryStore() {
  const data = new Map<string, string>()
  const store: ShareStore = {
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => { data.set(k, v) },
    del: async (k) => { data.delete(k) },
  }
  return { store, data }
}

const THREAD = { date: '2026-10-15', mood: 'wronged', personId: 'coffee-picker', episode: 2, item: '라면' }

test('공유: 발급·조회. 관리 키·소유자는 내보내지 않는다', async () => {
  const { store, data } = memoryStore()
  const shares = createShares(store, () => 1_000)
  const made = (await shares.issue('thread', THREAD))!
  assert.ok(isToken(made.token))
  assert.equal(made.expiresAt, 1_000 + SHARE_KINDS.thread.ttl * 1000)
  const seen = (await shares.lookup(made.token))!
  assert.deepEqual(seen, { kind: 'thread', payload: THREAD, expiresAt: made.expiresAt })
  assert.ok(!JSON.stringify(seen).includes(made.manage))
  // 저장된 값에도 관리 키 원문은 없다 (해시만)
  assert.ok(![...data.values()].some((v) => v.includes(made.manage)))
})

test('공유: 같은 관리 키로 다시 만들면 이전 링크는 열리지 않는다', async () => {
  const { store } = memoryStore()
  const shares = createShares(store)
  const first = (await shares.issue('thread', THREAD))!
  const second = (await shares.issue('thread', { ...THREAD, item: '우유' }, first.manage))!
  assert.equal(second.manage, first.manage)
  assert.notEqual(second.token, first.token)
  assert.equal(await shares.lookup(first.token), null)
  assert.equal(((await shares.lookup(second.token))!.payload as { item: string }).item, '우유')
})

test('공유: 만료된 링크·모르는 토큰·예전 종류', async () => {
  const { store } = memoryStore()
  let now = 0
  const shares = createShares(store, () => now)
  assert.ok(!isShareKind('day') && !isShareKind('village') && isShareKind('thread'))
  const made = (await shares.issue('thread', THREAD))!
  now = made.expiresAt + 1
  assert.equal(await shares.lookup(made.token), null)
  assert.equal(await shares.lookup('../../etc'), null)
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
  // 연재 한 화는 여러 문단: 인용은 첫 문단의 첫 문장만
  const text = KEY_STORIES['coffee-picker']!.episodes![2]!.text
  const quote = threadQuote({ personId: 'coffee-picker', episode: 2 })
  assert.ok(text.startsWith(quote) && /[.?!]$/.test(quote) && !quote.includes('\n') && quote.length < text.length)
  assert.equal(threadWho({ personId: 'coffee-picker' }), '에티오피아 시다마의 알마즈')
  assert.equal(withEuro('라면'), '라면으로')
  assert.equal(withEuro('아이스 아메리카노'), '아이스 아메리카노로')
  assert.equal(withEuro('물'), '물로')
  assert.equal(threadShareTitle({ date: '2026-10-15', mood: 'wronged', personId: 'coffee-picker', episode: 2, item: '라면' }), '오늘 나와 같은 하루를 보낸 사람, 에티오피아 시다마의 알마즈')
})

test('오늘의 실 카드 머리말: 다음 편으로 만난 사람이면 "오늘 내 하루에 닿은 사람"', () => {
  assert.equal(threadHeader({ how: 'next' }), '오늘 내 하루에 닿은 사람')
  assert.equal(threadHeader({ how: 'mood' }), '오늘 나와 같은 하루를 보낸 사람')
  assert.equal(threadHeader({ how: 'cell' }), '오늘 나와 같은 하루를 보낸 사람')
  assert.equal(threadHeader({}), '오늘 나와 같은 하루를 보낸 사람')
  assert.equal(threadShareTitle({ date: '2026-10-15', mood: 'lonely', personId: 'sea-crew', episode: 0, item: '운동화', how: 'next' }), '오늘 내 하루에 닿은 사람, 바다 위의 로널드')
})
