import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PEOPLE_LIST } from '../shared/data/people'
import { introFactOf, introText, introThanksNotice, tastyItemFor } from '../shared/intro'
import { createShares, isManageKey, isToken, personShareLine, personShareTitle, type ShareStore } from '../shared/share'

const store = (): ShareStore => {
  const data = new Map<string, string>()
  return { get: async (k) => data.get(k) ?? null, set: async (k, v) => { data.set(k, v) }, del: async (k) => { data.delete(k) } }
}

test('소개 문구는 정해진 것뿐, 맛있어서 문구는 먹는 대표 물건만', () => {
  assert.equal(introText('tasty', 'americano'), '오늘 아침 아이스 아메리카노가 맛있어서, 이 분을 소개해요')
  assert.equal(introText('tasty', 'kimchi'), '오늘 아침 배추김치가 맛있어서, 이 분을 소개해요')
  assert.equal(introText('in-my-day'), '오늘 제 하루에 이 분이 있었어요')
  assert.equal(introText('thanks-to'), '이 분 덕분에 오늘 하루가 편했어요')
  assert.equal(introText('story'), '이 분 이야기를 알려주고 싶었어요')
  // 그 사람을 만난 여정 이름 중 먹는 대표 물건(마지막에 만난 것부터)
  assert.equal(tastyItemFor(['스마트폰', '아이스 아메리카노'])?.id, 'americano')
  assert.equal(tastyItemFor(['스마트폰']), null)
  assert.equal(tastyItemFor(['내가 지은 이름']), null)
})

test('소개 화면의 일하는 사실은 출처 있는 사람 크기 숫자만', () => {
  assert.ok(introFactOf('busan-crane')?.fact.includes('한 시간에'))
  assert.equal(introFactOf('sea-crew'), null) // 배 한 척의 크기는 사람 크기가 아니다
  assert.equal(introFactOf('cupper'), null) // 사실이 없다
  const human = PEOPLE_LIST.filter((p) => introFactOf(p.id))
  assert.equal(human.length, 7)
  for (const p of human) assert.ok(p.workFactSource?.url)
})

test('보낸 사람 알림: 한 번이면 누군가, 여러 번이면 묶어서', () => {
  assert.equal(introThanksNotice([], '옥희'), '')
  assert.equal(introThanksNotice([{ personId: 'coffee-picker', fresh: 1 }], '옥희'), '누군가 옥희님의 소개로 커피 체리 수확자에게 고마워했어요')
  assert.equal(introThanksNotice([{ personId: 'coffee-picker', fresh: 2 }, { personId: 'coffee-picker', fresh: 1 }], '옥희'), '3명이 옥희님의 소개로 커피 체리 수확자에게 고마워했어요')
  assert.equal(introThanksNotice([{ personId: 'coffee-picker', fresh: 1 }, { personId: 'barista', fresh: 1 }, { personId: 'sea-crew', fresh: 0 }], '옥희'), '2명이 옥희님의 소개로 커피 체리 수확자 외 1명에게 고마워했어요')
})

test('소개 링크: 사람·닉네임·문구 id·물건 id만, 틀린 값은 받지 않는다. 제목과 첫 줄', async () => {
  const shares = createShares(store())
  assert.equal(await shares.issue('person', { personId: 'coffee-picker', nickname: '옥희', phraseId: 'free text' }), null)
  assert.equal(await shares.issue('person', { personId: 'nobody', nickname: '옥희', phraseId: 'story' }), null)
  assert.equal(await shares.issue('person', { personId: 'coffee-picker', nickname: '옥희', phraseId: 'tasty', itemId: 'smartphone' }), null)
  const made = (await shares.issue('person', { personId: 'coffee-picker', nickname: '옥희', phraseId: 'tasty', itemId: 'americano', note: '자유 글' }))!
  assert.equal(made.path, `/p/${made.token}`)
  const p = (await shares.lookup(made.token))!.payload as Parameters<typeof personShareTitle>[0]
  assert.deepEqual(p, { personId: 'coffee-picker', nickname: '옥희', phraseId: 'tasty', itemId: 'americano' })
  assert.equal(personShareTitle(p), '옥희님이 커피 체리 수확자를 소개해요')
  assert.equal(personShareLine(p), '옥희님이 소개해요 · 오늘 아침 아이스 아메리카노가 맛있어서, 이 분을 소개해요')
  assert.equal(await shares.tokenOf(made.manage), made.token)
})

test('토큰 검증: 공유 전용 모양만 (사용자 id·복구 코드 모양은 토큰이 아니다)', () => {
  assert.ok(isToken('abcdefghjk'))
  assert.ok(!isToken('u_abcdefghijklmnopqrstuvwx'))
  assert.ok(!isToken('바다-연필-4827'))
  assert.ok(!isToken('abcdefghjkl'))
  assert.ok(!isToken('../etc/pas'))
  assert.ok(isManageKey('a'.repeat(32)))
  assert.ok(!isManageKey('a'.repeat(31)))
})
