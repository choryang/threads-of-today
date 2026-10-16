import assert from 'node:assert/strict'
import { test } from 'node:test'
import { closingKind } from '../shared/data/shops'
import { pickRoute } from '../shared/pick'
import { formChanges, walkPath } from '../shared/walk'
import { matchLocal } from '../app/utils/local-match'

const id = (i: number) => `2026-10-16-1-w${i.toString(36).padStart(5, '0')}`

test('책: 출판 + 종이로 나뉘고, 서점 직원이 건네준다', () => {
  for (const name of ['책', '소설', '만화책', '교과서']) assert.deepEqual(matchLocal(name)?.materialIds, ['publishing', 'pulp'], name)
  // 이름에 '책'이 들어도 출판 재료가 없으면 서점이 아니다
  assert.notEqual(closingKind('책상', ['wood', 'steel']), 'books')
  assert.equal(closingKind('소설', ['publishing', 'pulp']), 'books')
  const walk = walkPath(['publishing', 'pulp'], id(1), '책')
  assert.deepEqual(walk.branches.map((b) => b.materialId), ['publishing', 'pulp'])
  assert.equal(walk.hand.at(-1), 'bookseller')
  // 오늘 한 사람은 출판 길(+ 가게 사람)에서
  assert.ok(pickRoute(['publishing', 'pulp'], id(1), '책').includes('book-editor'))
})

test('책: 가끔 번역한 책의 길이 나오고, 원고가 책이 되기까지 바뀐다', () => {
  const heads = new Set(Array.from({ length: 60 }, (_, i) => walkPath(['publishing'], id(i), '책').branches[0]!.stops[0]))
  assert.deepEqual([...heads].sort(), ['book-translator', 'book-writer'])
  const stops = walkPath(['publishing'], id(1), '책').branches[0]!.stops
  const changes = formChanges('publishing', stops).filter(Boolean).map((c) => `${c!.from} → ${c!.to}`)
  assert.deepEqual(changes, ['원고 → 다듬은 원고', '다듬은 원고 → 교정지', '교정지 → 인쇄용 파일', '인쇄용 파일 → 인쇄된 종이', '인쇄된 종이 → 책'])
})
