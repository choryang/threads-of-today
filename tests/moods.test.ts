import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MOODS, MOOD_LIST, isGoodMood, isMoodId, sameCell } from '../shared/data/moods'
import { KEY_STORIES } from '../shared/data/stories'

test('마음 8개: 네 칸에 둘씩, 점은 342×342 안, 칸마다 색 하나', () => {
  assert.equal(MOOD_LIST.length, 8)
  const cells = new Map<string, string[]>()
  for (const m of MOOD_LIST) {
    const key = `${m.cell.energy}-${m.cell.ease}`
    cells.set(key, [...(cells.get(key) ?? []), m.id])
    assert.ok(m.dot.x > 0 && m.dot.x < 342 && m.dot.y > 0 && m.dot.y < 342)
    // 점은 자기 칸 안에 (위 = 에너지 높음, 오른쪽 = 편안)
    assert.equal(m.dot.y < 171, m.cell.energy === 'high', m.id)
    assert.equal(m.dot.x > 171, m.cell.ease === 'ease', m.id)
  }
  assert.deepEqual([...cells.values()].map((v) => v.length), [2, 2, 2, 2])
  for (const ids of cells.values()) assert.equal(MOODS[ids[0] as 'glad'].color, MOODS[ids[1] as 'glad'].color)
  assert.ok(sameCell('wronged', 'anxious'))
  assert.ok(!sameCell('wronged', 'lonely'))
  assert.deepEqual(MOOD_LIST.filter((m) => isGoodMood(m.id)).map((m) => m.id), ['glad', 'excited', 'proud'])
  assert.equal(MOODS.wronged.past, '억울했던')
  assert.ok(isMoodId('tired') && !isMoodId('happy'))
})

test('이야기 편마다 마음 태그가 하나 이상', () => {
  for (const [id, s] of Object.entries(KEY_STORIES)) for (const e of s.episodes ?? []) assert.ok(e.moods.length && e.moods.every(isMoodId), id)
})
