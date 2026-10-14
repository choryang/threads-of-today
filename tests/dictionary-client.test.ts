import assert from 'node:assert/strict'
import { test } from 'node:test'
import dictionary from '../shared/data/dictionary.json'
import clientDictionary from '../shared/data/dictionary-client.json'
import { createMatcher, productEntries, type DictEntry } from '../shared/match'
import { slimDictionary } from '../shared/match/slim'

test('앱용 사전은 전체 사전과 같은 항목이다 (어긋나면 npx tsx scripts/build-client-dictionary.ts)', () => {
  assert.deepEqual(clientDictionary, slimDictionary(dictionary as DictEntry[]))
})

test('앱용 사전으로 찾은 결과는 서버와 이름·재료가 같다', () => {
  const server = createMatcher([...productEntries(), ...(dictionary as DictEntry[])])
  const client = createMatcher([...productEntries(), ...(clientDictionary as DictEntry[])])
  for (const text of ['가글', '아메리카노', '라뗴', '김치찌개', '초코우유', '고양이 털', '월요일']) {
    const a = server.match(text)
    const b = client.match(text)
    assert.equal(b?.name, a?.name, text)
    assert.deepEqual(b?.materialIds, a?.materialIds, text)
  }
})
