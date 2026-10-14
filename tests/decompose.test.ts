import assert from 'node:assert/strict'
import { test } from 'node:test'
import { seoulDateKey } from '../shared/logic'
import { createMatcher, productEntries } from '../shared/match'
import { TOOL_NAME, cleanMissing, parseToolResponse } from '../server/utils/decompose'

const reply = (input: Record<string, unknown>) => ({ content: [{ type: 'tool_use', name: TOOL_NAME, input }] })
const base = { recognized: true, item_name: '망고주스', twist: '', voice: '' }

test('missing_ingredients: 목록에 없는 주재료만 남기고 목록에 있는 재료·숫자·중복은 버린다', () => {
  assert.deepEqual(cleanMissing(['망고', '설탕', '망고', '100% 과즙', 'mango', '패션후르츠']), ['망고', '패션후르츠'])
  assert.deepEqual(cleanMissing('망고'), [])
})

test('재료가 일부만 있으면 그대로 여정을 떠나고 missing을 함께 돌려준다', () => {
  const r = parseToolResponse(reply({ ...base, material_ids: ['sugar', 'plastic'], missing_ingredients: ['망고'] }))
  assert.ok(r.ok)
  assert.deepEqual(r.materialIds, ['sugar', 'plastic'])
  assert.deepEqual(r.missing, ['망고'])
})

test('재료가 하나도 없어도 missing이 있으면 성공으로 돌려준다 (화면에서 준비 중 안내)', () => {
  const r = parseToolResponse(reply({ ...base, item_name: '둥굴레차', material_ids: [], missing_ingredients: ['둥굴레'] }))
  assert.ok(r.ok)
  assert.deepEqual(r.materialIds, [])
  assert.deepEqual(r.missing, ['둥굴레'])
})

test('재료도 missing도 없으면 실패', () => {
  const r = parseToolResponse(reply({ ...base, material_ids: [], missing_ingredients: [] }))
  assert.equal(r.ok, false)
})

test('사전 항목의 missing이 매칭 결과에 실리고, 재료 없는 항목은 합성어로 잡히지 않는다', () => {
  const m = createMatcher([
    ...productEntries(),
    { key: '둥굴레차', name: '둥굴레차', aliases: [], materialIds: [], missing: ['둥굴레'] },
  ])
  const r = m.match('둥굴레차')
  assert.ok(r)
  assert.deepEqual(r.materialIds, [])
  assert.deepEqual(r.missing, ['둥굴레'])
  assert.equal(m.match('둥굴레차둥굴레차'), null)
})

test('하루 한도의 날짜는 한국 자정에 바뀐다', () => {
  // UTC 14:59 = 한국 23:59, UTC 15:00 = 한국 다음 날 00:00
  assert.equal(seoulDateKey(Date.UTC(2026, 9, 14, 14, 59)), '2026-10-14')
  assert.equal(seoulDateKey(Date.UTC(2026, 9, 14, 15, 0)), '2026-10-15')
  assert.equal(seoulDateKey(Date.UTC(2026, 11, 31, 15, 0)), '2027-01-01')
})
