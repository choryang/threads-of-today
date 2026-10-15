import assert from 'node:assert/strict'
import { test } from 'node:test'
import { KEY_STORIES } from '../shared/data/stories'
import { STORY_REV, coveredEpisodes, currentEpisode } from '../shared/key-story'
import { peekOf } from '../shared/peek'
import { pickPerson, pickRoute } from '../shared/pick'
import { emptySave, mergeSaves, sanitizeSave, type TodayRecord } from '../shared/progress'
import { historyOf, recordEpisode } from '../shared/today-log'

test('1판 기록(rev 없음): 5편이던 사람은 예전 편 번호를 지금 화로 옮겨 읽고, 앞 화까지 본 것으로 친다', () => {
  // 예은: 예전 1·2·3·4편 → 1·3·5·6화, 마지막 5편(결말이 7~10화에 걸침) → 7화
  assert.deepEqual([0, 1, 2, 3, 4].map((e) => currentEpisode('barista', e)), [0, 2, 4, 5, 6])
  assert.deepEqual(coveredEpisodes('barista', 1), [0, 1, 2])
  // 10편이던 사람은 그대로, 2판 기록도 그대로, 카드 문구는 null
  assert.equal(currentEpisode('courier', 3), 3)
  assert.deepEqual(coveredEpisodes('courier', 3), [3])
  assert.equal(currentEpisode('barista', 1, STORY_REV), 1)
  assert.deepEqual(coveredEpisodes('barista', 1, STORY_REV), [1])
  assert.equal(currentEpisode('barista', null), null)
  assert.deepEqual(coveredEpisodes('barista', null), [])
})

test('옮긴 화 번호는 모두 그 사람의 화 안에 있고, 순서가 앞으로만 간다', () => {
  for (const id of ['coffee-picker', 'co-coffee-farmer', 'vn-coffee-farmer', 'br-coffee-farmer', 'sea-crew', 'busan-crane', 'barista']) {
    const n = KEY_STORIES[id]!.episodes!.length
    const mapped = [0, 1, 2, 3, 4].map((e) => currentEpisode(id, e)!)
    assert.equal(mapped[0], 0, id)
    mapped.forEach((m, i) => {
      assert.ok(m >= 0 && m < n, `${id} ${i}`)
      if (i) assert.ok(m > mapped[i - 1]!, `${id} ${i}`)
    })
  }
})

test('예전 기록으로 이어 보기: 예은 예전 2편까지 봤으면 다음은 4화, 들여다보기 지난 이야기도 1~3화', () => {
  const todays: Record<string, TodayRecord> = {
    '2026-10-10': { mood: 'plain', item: '아이스 아메리카노', personId: 'barista', episode: 0 },
    '2026-10-11': { mood: 'wronged', item: '아이스 아메리카노', personId: 'barista', episode: 1 },
  }
  const item = { materialIds: ['coffee', 'plastic'], itemName: '아이스 아메리카노' }
  const history = historyOf(todays)
  assert.deepEqual(history.map((h) => h.episode), [0, 2])
  for (let i = 0; i < 40; i++) {
    const journeyId = `2026-10-16-1-r${i.toString(36)}`
    if (!pickRoute(item.materialIds, journeyId, item.itemName).includes('barista')) continue
    const pick = pickPerson({ ...item, journeyId, mood: 'anxious', history })!
    if (pick.personId === 'barista') assert.equal(pick.episode, 3)
  }
  const texts = KEY_STORIES.barista!.episodes!.map((e) => e.text)
  assert.deepEqual(peekOf(todays, 'barista').seen, texts.slice(0, 3))
  assert.equal(recordEpisode(todays['2026-10-11']!), 2)
})

test('하루 기록의 rev는 서버를 오가도 남는다 (이상한 값은 버린다)', () => {
  const save = { ...emptySave(), todays: { '2026-10-16': { mood: 'plain', item: '라면', personId: 'courier', episode: 0, rev: 2 }, '2026-10-15': { mood: 'plain', item: '라면', personId: 'courier', episode: 0, rev: 'x' } } }
  const clean = sanitizeSave(save, '2026-10-16')
  assert.equal(clean.todays?.['2026-10-16']?.rev, 2)
  assert.equal(clean.todays?.['2026-10-15']?.rev, undefined)
  assert.equal(mergeSaves(clean, emptySave(), '2026-10-16').todays?.['2026-10-16']?.rev, 2)
})
