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
