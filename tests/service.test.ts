import assert from 'node:assert/strict'
import { test } from 'node:test'
import { closingPeople } from '../shared/journey'
import { formChanges, walkPath } from '../shared/walk'
import { matchLocal } from '../app/utils/local-match'

const id = (i: number) => `2026-10-16-1-w${i.toString(36).padStart(5, '0')}`

test('앱·노래: 만드는 길 + 인터넷. 화면 이름은 회사 이름 없이', () => {
  assert.deepEqual(matchLocal('메신저')?.materialIds, ['app', 'internet'])
  assert.equal(matchLocal('메신저')?.name, '앱')
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
  assert.deepEqual(matchLocal('미드')?.materialIds, ['drama', 'internet'])
  assert.equal(matchLocal('미드')?.name, '드라마')
  assert.deepEqual(walkPath(['film'], id(1), '영화').hand, ['projectionist'])
  assert.deepEqual(walkPath(['drama', 'internet'], id(1), '드라마').hand, [])
  // 로케이션 매니저·VFX·사운드 믹싱은 두 길에 같이 선다
  const film = walkPath(['film'], id(1), '영화').branches[0]!.stops
  const drama = walkPath(['drama'], id(1), '드라마').branches[0]!.stops
  for (const shared of ['location-manager', 'vfx-artist', 'sound-mixer']) assert.ok(film.includes(shared) && drama.includes(shared), shared)
})

test('애니메이션: 일본 길은 서울·마닐라를 거쳐 도쿄로 돌아오고, 한국 3D 길과 따로 간다', () => {
  assert.deepEqual(matchLocal('애니')?.materialIds, ['anime-jp', 'internet'])
  assert.deepEqual(matchLocal('만화영화')?.materialIds, ['anime-kr', 'internet'])
  const jp = walkPath(['anime-jp', 'internet'], id(1), '애니메이션')
  assert.deepEqual(jp.hand, [])
  const stops = jp.branches[0]!.stops
  assert.ok(stops.indexOf('inbetweener') > stops.indexOf('key-animator'))
  assert.ok(stops.indexOf('ink-painter') < stops.indexOf('compositor-jp'))
  assert.equal(walkPath(['anime-kr'], id(1), '어린이 애니메이션').branches[0]!.stops[0], 'kids-anime-pd')
})

test('게임: 하노이 그래픽 스튜디오를 거쳐 라이브 운영까지, 인터넷으로 바로 나에게', () => {
  assert.deepEqual(matchLocal('모바일 게임')?.materialIds, ['game', 'internet'])
  assert.notDeepEqual(matchLocal('롤케이크')?.materialIds, ['game', 'internet'])
  const walk = walkPath(['game', 'internet'], id(1), '게임')
  assert.deepEqual(walk.hand, [])
  assert.equal(walk.branches[0]!.stops.at(-1), 'live-ops')
})
