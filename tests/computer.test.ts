import assert from 'node:assert/strict'
import { test } from 'node:test'
import { closingKind } from '../shared/data/shops'
import { formChanges, walkLegs, walkPath } from '../shared/walk'
import { matchLocal } from '../app/utils/local-match'

const id = (i: number) => `2026-10-16-1-w${i.toString(36).padStart(5, '0')}`

test('컴퓨터·주변기기: 물건마다 부품 길로 나뉜다', () => {
  assert.deepEqual(matchLocal('키보드')?.materialIds, ['switch', 'pcb', 'plastic'])
  assert.deepEqual(matchLocal('마우스')?.materialIds, ['sensor', 'pcb', 'plastic'])
  assert.deepEqual(matchLocal('모니터')?.materialIds, ['panel', 'pcb', 'plastic'])
  assert.deepEqual(matchLocal('컴퓨터')?.materialIds, ['cpu', 'memory', 'pcb', 'chip', 'aluminum'])
  // 노트북·휴대폰은 그대로
  assert.ok(!matchLocal('노트북')?.materialIds.includes('cpu'))
})

test('컴퓨터는 용산 조립 PC 기사가, 주변기기는 택배로 건넨다', () => {
  assert.equal(closingKind('컴퓨터', ['cpu', 'memory', 'pcb', 'chip', 'aluminum']), 'computer')
  assert.equal(walkPath(['cpu', 'memory', 'pcb', 'chip', 'aluminum'], id(1), '컴퓨터').hand.at(-1), 'pc-builder')
  assert.equal(walkPath(['switch', 'pcb', 'plastic'], id(1), '키보드').hand.at(-1), 'courier')
})

test('회로기판 길: 칠레 구리가 바다를 건너 울산에서 녹고, 판이 되어 간다', () => {
  const stops = walkPath(['pcb'], id(1), '회로기판').branches[0]!.stops
  assert.equal(stops[0], 'copper-hauler')
  assert.equal(walkLegs(stops)[0]!.mode, 'sea')
  const changes = formChanges('pcb', stops).filter(Boolean).map((c) => `${c!.from} → ${c!.to}`)
  assert.deepEqual(changes, ['구리 광석 → 구리판', '구리판 → 동박적층판', '동박적층판 → 빈 회로기판', '빈 회로기판 → 부품 붙은 기판'])
})
