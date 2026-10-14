import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SETS } from '../shared/data/materials'
import { PEOPLE_LIST } from '../shared/data/people'
import { endingLines, everyoneThanked, newScenes, thanksRepliesOf, thanksReply } from '../shared/thanks'

test('고마워요 답: 카드마다 늘 같은 답이고, 그 사람의 답 목록 안에서 고른다', () => {
  for (const p of PEOPLE_LIST) {
    const reply = thanksReply(p.id)
    assert.equal(reply, thanksReply(p.id))
    assert.ok(thanksRepliesOf(p.id).includes(reply), p.id)
  }
})

test('세트 감사 장면: 멤버와 보상 카드까지 모두 고마워한 순간에 한 번만 열린다', () => {
  const set = SETS[0]!
  const members = [...set.memberIds, set.rewardId]
  const before = new Set(members.slice(0, -1))
  const after = new Set(members)
  assert.deepEqual(newScenes(new Set(), before), [])
  assert.deepEqual(newScenes(before, after), [{ type: 'set', setId: set.id }])
  assert.deepEqual(newScenes(after, new Set([...after, PEOPLE_LIST[0]!.id])), [])
})

test('엔딩: 마지막 한 사람에게 고마움을 전할 때 열리고, 닉네임을 넣는다', () => {
  const all = PEOPLE_LIST.map((p) => p.id)
  const before = new Set(all.slice(1))
  assert.equal(everyoneThanked(before), false)
  const scenes = newScenes(before, new Set(all))
  assert.deepEqual(scenes[scenes.length - 1], { type: 'ending' })
  assert.equal(endingLines('커피 체리')[1], '커피 체리의 하루도, 그 하루에 닿은 모든 사람의 하루도.')
})
