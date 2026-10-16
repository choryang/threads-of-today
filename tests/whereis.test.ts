import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseToolResponse } from '../server/utils/decompose'
import { cleanQuip, mapsSearchUrl } from '../server/utils/whereis'

const tool = (input: Record<string, unknown>) => ({ content: [{ type: 'tool_use', name: 'report_materials', input }] })
const base = { recognized: true, item_name: '스마트폰', twist: '', voice: '', material_ids: ['chip'], missing_ingredients: [] }

test('고유명사는 재료로 나누지 않고 입력 그대로 지도로 (사람 이름·평범한 낱말은 그대로 물건으로)', () => {
  const game = parseToolResponse(tool({ ...base, proper_noun: 'game' }), '오버워치')
  assert.ok(game.ok && game.proper === 'game' && game.name === '오버워치' && game.materialIds.length === 0)
  const person = parseToolResponse(tool({ ...base, proper_noun: 'person' }), '김철수')
  assert.ok(person.ok && !person.proper && person.materialIds.includes('chip'))
  const plain = parseToolResponse(tool({ ...base, proper_noun: 'none' }), '휴대폰')
  assert.ok(plain.ok && !plain.proper)
  // 나쁜 입력은 고유명사여도 받지 않는다
  assert.equal(parseToolResponse(tool({ ...base, recognized: false, proper_noun: 'company' }), '어딘가').ok, false)
})

test('한마디는 사실처럼 보이면 버리고, 지도는 입력 그대로 검색 링크로', () => {
  assert.equal(cleanQuip('"영웅들은 지도에서도 숨바꼭질 중이에요"'), '영웅들은 지도에서도 숨바꼭질 중이에요')
  assert.equal(cleanQuip('미국에서 만든 게임이에요'), '')
  assert.equal(cleanQuip('{name}, 찾아봐요'), '')
  assert.equal(mapsSearchUrl('네이버'), 'https://www.google.com/maps/search/?api=1&query=%EB%84%A4%EC%9D%B4%EB%B2%84')
})
