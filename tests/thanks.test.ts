import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SETS } from '../shared/data/materials'
import { PEOPLE_LIST } from '../shared/data/people'
import { endingLines, everyoneThanked, thanksRepliesOf, thanksReply, unseenScenes } from '../shared/thanks'

test('고마워요 답: 카드마다 늘 같은 답이고, 그 사람의 답 목록 안에서 고른다', () => {
  for (const p of PEOPLE_LIST) {
    const reply = thanksReply(p.id)
    assert.equal(reply, thanksReply(p.id))
    assert.ok(thanksRepliesOf(p.id).includes(reply), p.id)
  }
})

test('세트 감사 장면: 멤버와 보상 카드까지 모두 고마워하면 열리고, 본 장면은 다시 나오지 않는다', () => {
  const set = SETS[0]!
  const members = [...set.memberIds, set.rewardId]
  assert.deepEqual(unseenScenes(new Set(members.slice(0, -1)), []), [])
  assert.deepEqual(unseenScenes(new Set(members), []), [{ type: 'set', setId: set.id }])
  assert.deepEqual(unseenScenes(new Set(members), [set.id]), [])
})

test('엔딩: 모든 사람에게 고마움을 전하면 열리고, 닉네임을 넣는다', () => {
  const all = PEOPLE_LIST.map((p) => p.id)
  assert.equal(everyoneThanked(new Set(all.slice(1))), false)
  const seenSets = SETS.map((s) => s.id)
  assert.deepEqual(unseenScenes(new Set(all), seenSets), [{ type: 'ending' }])
  assert.deepEqual(unseenScenes(new Set(all), [...seenSets, 'ending']), [])
  assert.equal(endingLines('커피 체리')[1], '커피 체리의 하루도, 그 하루에 닿은 모든 사람의 하루도.')
})
