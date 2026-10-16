import assert from 'node:assert/strict'
import { test } from 'node:test'
import { closingPeople } from '../shared/journey'
import { formChanges, walkPath } from '../shared/walk'
import { matchLocal } from '../app/utils/local-match'

const id = (i: number) => `2026-10-16-1-w${i.toString(36).padStart(5, '0')}`

test('앱·노래: 만드는 길 + 인터넷. 화면 이름은 회사 이름 없이', () => {
  assert.deepEqual(matchLocal('카톡')?.materialIds, ['app', 'internet'])
  assert.equal(matchLocal('카톡')?.name, '앱')
  assert.deepEqual(matchLocal('노래')?.materialIds, ['song', 'internet'])
  assert.deepEqual(matchLocal('음악')?.materialIds, ['song', 'internet'])
})

test('앱은 고객센터 상담원이 건네고, 노래는 건네주는 사람 없이 바로 나에게', () => {
  assert.deepEqual(walkPath(['app', 'internet'], id(1), '앱').hand, ['cs-agent'])
  // 노르웨이 작곡가가 있어도 수입 사무실은 나오지 않는다
  assert.deepEqual(closingPeople('노래', ['song', 'internet'], id(1), true), [])
  assert.deepEqual(walkPath(['song', 'internet'], id(1), '노래').hand, [])
})

test('노래는 비트에서 등록된 음원까지 바뀌어 간다', () => {
  const stops = walkPath(['song'], id(1), '노래').branches[0]!.stops
  const last = formChanges('song', stops).filter(Boolean).at(-1)!
  assert.equal(`${last.from} → ${last.to}`, '마스터 음원 → 등록된 음원')
})

test('영화는 극장 영사 담당이, 드라마는 인터넷을 지나 바로 나에게', () => {
  assert.deepEqual(matchLocal('영화')?.materialIds, ['film'])
  assert.deepEqual(matchLocal('넷플릭스')?.materialIds, ['drama', 'internet'])
  assert.equal(matchLocal('넷플릭스')?.name, '드라마')
  assert.deepEqual(walkPath(['film'], id(1), '영화').hand, ['projectionist'])
  assert.deepEqual(walkPath(['drama', 'internet'], id(1), '드라마').hand, [])
  // 로케이션 매니저·VFX·사운드 믹싱은 두 길에 같이 선다
  const film = walkPath(['film'], id(1), '영화').branches[0]!.stops
  const drama = walkPath(['drama'], id(1), '드라마').branches[0]!.stops
  for (const shared of ['location-manager', 'vfx-artist', 'sound-mixer']) assert.ok(film.includes(shared) && drama.includes(shared), shared)
})
