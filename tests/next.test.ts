import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LINK_RULES, MATERIALS, PRODUCTS } from '../shared/data/materials'
import { FIRST_SUFFIX, SECOND_SUFFIX, buildTimeline, isFirstJourney, isSecondJourney, journeyOrderSuffix, quizFor, secondJourneyGift, timelinePeople } from '../shared/journey'
import { findLinkCards } from '../shared/logic'
import { LINEUP_MAX, alwaysMeets, lineupOf, pickTeaser } from '../shared/next'

const ids = (n: number, tail = '') => Array.from({ length: n }, (_, i) => `2026-10-15-1-${i.toString(36).padStart(4, '0')}${tail}`)

test('끝 장면: 8명 이하면 그대로, 넘으면 8명만 만난 순서대로, 첫·마지막 사람 포함', () => {
  const few = ['a', 'b', 'c']
  assert.deepEqual(lineupOf(few), few)
  const americano = timelinePeople(['coffee', 'plastic', 'milk'], '2026-10-15-1-abcd', '카페라떼').map((x) => x.personId)
  const people = [...new Set(americano)]
  assert.ok(people.length > LINEUP_MAX)
  const line = lineupOf(people)
  assert.equal(line.length, LINEUP_MAX)
  assert.equal(line[0], people[0])
  assert.equal(line[line.length - 1], people[people.length - 1])
  assert.deepEqual([...line].sort((a, b) => people.indexOf(a) - people.indexOf(b)), line)
  assert.equal(new Set(line).size, line.length)
})

test('첫 여정 id: 꼬리 뒤 -first만 첫 여정으로 본다', () => {
  assert.ok(isFirstJourney(`2026-10-15-1-k3x9${FIRST_SUFFIX}`))
  assert.ok(!isFirstJourney('2026-10-15-1-k3x9'))
  assert.ok(!isFirstJourney('2026-10-15-1-first'))
})

test('두 번째 여정 id: 꼬리 뒤 -second, 남은 여정이 첫 여정 하나뿐일 때만', () => {
  assert.ok(isSecondJourney(`2026-10-15-2-k3x9-r${SECOND_SUFFIX}`))
  assert.ok(!isSecondJourney(`2026-10-15-2-k3x9-r${FIRST_SUFFIX}`))
  assert.ok(!isFirstJourney(`2026-10-15-2-k3x9-r${SECOND_SUFFIX}`))
  assert.equal(journeyOrderSuffix(true, []), FIRST_SUFFIX)
  assert.equal(journeyOrderSuffix(false, [`2026-10-15-1-abcd-r${FIRST_SUFFIX}`]), SECOND_SUFFIX)
  assert.equal(journeyOrderSuffix(false, [`2026-10-15-1-abcd-r${FIRST_SUFFIX}`, `2026-10-15-2-efgh-r${SECOND_SUFFIX}`]), '')
  // 예전 사용자(첫 여정 꼬리가 없는 기록)는 두 번째 여정 선물을 받지 않는다
  assert.equal(journeyOrderSuffix(false, ['2026-10-15-1-abcd-r']), '')
})

test('첫 여정은 사람 카드만: 퀴즈·이야기·숨은 만남·같은 길이 없다', () => {
  for (const id of [...ids(200, FIRST_SUFFIX), ...ids(200, `-r${FIRST_SUFFIX}`)]) {
    for (const m of [['coffee', 'plastic'], ['cobalt', 'lithium', 'chip', 'assembly', 'plastic'], ['apple']]) {
      const t = buildTimeline(m, id, '물건')
      assert.ok(t.every((x) => x.type === 'stage'), `${id} ${m}`)
    }
  }
  // 같은 사람이 두 번 나오지 않는다 (거꾸로 가는 여정에서 같은 길 칸 대신 건너뛴다)
  const t = buildTimeline(['cobalt', 'lithium', 'chip', 'assembly', 'plastic'], `2026-10-15-1-abcd-r${FIRST_SUFFIX}`, '스마트폰')
  const people = t.flatMap((x) => (x.type === 'stage' ? [x.personId] : []))
  assert.equal(new Set(people).size, people.length)
})

test('두 번째 여정: 숨은 만남이 나올 자리가 있으면 늘 하나 나온다, 그 밖의 여정은 원래 확률', () => {
  for (const id of ids(200, SECOND_SUFFIX)) {
    const t = buildTimeline(['coffee', 'plastic'], id, '아이스 아메리카노')
    assert.equal(t.filter((x) => x.type === 'hidden').length, 1, id)
    assert.ok(!secondJourneyGift(['coffee', 'plastic'], id))
  }
  const plain = ids(200).filter((id) => buildTimeline(['coffee', 'plastic'], id).some((x) => x.type === 'hidden')).length
  assert.ok(plain < 40, `${plain}`)
})

test('두 번째 여정: 숨은 만남이 나올 자리가 없는 경로면 퀴즈 선물 (예전 첫 여정 선물)', () => {
  const id = `2026-10-15-2-abcd${SECOND_SUFFIX}`
  assert.ok(!buildTimeline(['apple'], id).some((x) => x.type === 'hidden'))
  assert.ok(quizFor(['apple'], id, 'apple'))
  assert.ok(secondJourneyGift(['apple'], id))
  assert.ok(!secondJourneyGift(['apple'], '2026-10-15-1-abcd'))
  assert.ok(!secondJourneyGift(['apple'], `2026-10-15-1-abcd${FIRST_SUFFIX}`))
})

test('다음 여정 예고: 이미 가진 연결 카드의 사람은 고르지 않는다', () => {
  const j = { id: '2026-10-15-1-abcd', name: '아이스 아메리카노', materialIds: ['coffee', 'plastic'] }
  const t = pickTeaser(j, new Set())
  assert.ok(t)
  const owned = new Set(LINK_RULES.map((r) => r.cardId).filter((c) => c !== t!.cardId))
  const only = pickTeaser(j, owned)
  assert.equal(only?.personId, t!.personId)
  assert.equal(pickTeaser(j, new Set([...owned, t!.cardId])), null)
})

test('다음 여정 예고: 추천 물건 2개를 같은 날 마치면 그 사람의 연결 카드가 나온다', () => {
  let checked = 0
  for (const p of PRODUCTS) {
    for (const id of ids(20)) {
      const j = { id, name: p.name, materialIds: p.materialIds }
      const t = pickTeaser(j, new Set())
      if (!t) continue
      assert.ok(t.products.length >= 1 && t.products.length <= 2)
      assert.ok(timelinePeople(j.materialIds, j.id, j.name).some((x) => x.personId === t.personId))
      for (const next of t.products) {
        assert.notEqual(next.name, p.name)
        const follow = { id: `${id.slice(0, 13)}zz${id.slice(13)}`, name: next.name, materialIds: next.materialIds }
        assert.ok(findLinkCards([j, follow]).includes(t.cardId), `${p.id} → ${next.id} (${t.personId})`)
        checked++
      }
    }
  }
  assert.ok(checked > 100, `${checked}`)
})

test('alwaysMeets: 출발지 변형과 상관없이 지나는 사람만', () => {
  for (const m of Object.values(MATERIALS)) {
    for (const pid of new Set(m.stages)) {
      if (!alwaysMeets(m, pid)) continue
      for (const id of ids(10)) assert.ok(buildTimeline([m.id], id).some((x) => x.type === 'stage' && x.personId === pid), `${m.id} ${pid}`)
    }
  }
})
