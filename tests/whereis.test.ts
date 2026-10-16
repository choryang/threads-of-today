import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseToolResponse } from '../server/utils/decompose'
import { mapsSearchUrl, searchPlace } from '../server/utils/whereis'

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

test('지도 첫 결과 하나만, 이름·주소·지도 링크', async () => {
  let sent: any = null
  const fake = (async (_url: string, init: any) => {
    sent = JSON.parse(init.body)
    return new Response(JSON.stringify({ places: [{ id: 'p1', displayName: { text: '오버워치 PC방' }, formattedAddress: '서울 어딘가', googleMapsUri: 'https://maps.google.com/?cid=1' }] }))
  }) as typeof fetch
  const place = await searchPlace('오버워치', 'key', fake)
  assert.deepEqual(place, { id: 'p1', name: '오버워치 PC방', address: '서울 어딘가', mapsUri: 'https://maps.google.com/?cid=1' })
  assert.equal(sent.textQuery, '오버워치')
  const none = await searchPlace('없는 이름', 'key', (async () => new Response(JSON.stringify({}))) as typeof fetch)
  assert.equal(none, null)
  assert.equal(mapsSearchUrl('네이버'), 'https://www.google.com/maps/search/?api=1&query=%EB%84%A4%EC%9D%B4%EB%B2%84')
})
