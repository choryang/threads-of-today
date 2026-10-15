import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  HUBS,
  buildTimeline,
  forwardTimeline,
  isFirstJourney,
  isKeyJourney,
  isReverseJourney,
  isSecondJourney,
  journeyScreens,
  journeySteps,
  keyPeople,
  screenPeople,
  timelinePeople,
  type TimelineItem,
} from '../shared/journey'
import { MATERIALS } from '../shared/data/materials'
import { PEOPLE } from '../shared/data/people'
import { KEY_STORIES } from '../shared/data/stories'
import { keyJoy, keyStory } from '../shared/key-story'

const shopOf = (timeline: TimelineItem[]) => timeline.filter((t) => t.type === 'stage' && t.closing).map((t) => (t as { personId: string }).personId)

test('커피: 출발지 4곳 모두 시작한 손은 그 출발지의 첫 사람, 건너온 손은 바다·항구 사람, 건네준 손은 가게 사람', () => {
  const coffee = MATERIALS.coffee!
  const heads = new Map(coffee.origins!.map((o) => [o.head[0]!, o.id]))
  const seen = new Set<string>()
  for (let i = 0; i < 200 && seen.size < heads.size; i++) {
    const id = `2026-10-15-1-k${i.toString(36)}`
    const timeline = buildTimeline(['coffee', 'plastic'], id, '아이스 아메리카노')
    const keys = keyPeople(timeline, id)
    assert.deepEqual(keys.map((k) => k.slot), ['start', 'cross', 'hand'])
    const [start, cross, hand] = keys.map((k) => k.personId)
    assert.ok(heads.has(start!), `시작한 손 ${start}`)
    assert.ok(HUBS.includes(cross!), `건너온 손 ${cross}`)
    assert.equal(hand, shopOf(timeline).at(-1))
    // 거꾸로 가는 여정은 같은 여정의 정방향과 같은 사람을 순서만 반대로
    const rid = `${id}-r`
    const reversed = keyPeople(buildTimeline(['coffee', 'plastic'], rid, '아이스 아메리카노'), rid)
    const forward = keyPeople(forwardTimeline(['coffee', 'plastic'], rid, '아이스 아메리카노'), rid.replace(/-r$/, ''))
    assert.deepEqual(reversed.map((k) => k.slot), ['hand', 'cross', 'start'])
    assert.deepEqual(reversed.map((k) => k.personId), forward.map((k) => k.personId).reverse())
    seen.add(start!)
  }
  assert.equal(seen.size, 4, `만난 출발지: ${[...seen].join(', ')}`)
})

test('건너온 손은 여정 id 시드로 정해져 같은 여정이면 늘 같다', () => {
  const id = '2026-10-15-2-abcd'
  const a = keyPeople(buildTimeline(['coffee'], id, '아이스 아메리카노'), id)
  const b = keyPeople(buildTimeline(['coffee'], id, '아이스 아메리카노'), id)
  assert.deepEqual(a, b)
})

test('국내 여정(쌀): 바다·항구 사람이 없으면 창고 바로 앞의 가공하는 사람', () => {
  const id = '2026-10-15-3-rice'
  const timeline = buildTimeline(['rice'], id, '즉석밥')
  const keys = keyPeople(timeline, id)
  assert.deepEqual(keys.map((k) => k.personId), ['rice-farmer', 'rice-mill', shopOf(timeline).at(-1)])
})

test('가게 사람이 없는 물건: 건네준 손은 마지막 사람', () => {
  // 물건 이름이 없으면 가게·사무실 사람이 붙지 않는다
  const id = '2026-10-15-4-none'
  const timeline = buildTimeline(['rice'], id)
  assert.equal(shopOf(timeline).length, 0)
  assert.deepEqual(keyPeople(timeline, id), [
    { slot: 'start', personId: 'rice-farmer' },
    { slot: 'cross', personId: 'rice-mill' },
    { slot: 'hand', personId: 'warehouse' },
  ])
})

test('같은 사람이 두 자리에 걸리면 다음 후보, 모자라면 있는 만큼만', () => {
  // 가공하는 사람 = 마지막 사람인 짧은 경로: 건너온 손이 먼저 가져가고, 건네준 손은 그 앞 사람
  const timeline: TimelineItem[] = [
    { type: 'stage', materialId: 'rice', personId: 'rice-farmer' },
    { type: 'stage', materialId: 'rice', personId: 'rice-mill' },
  ]
  assert.deepEqual(keyPeople(timeline).map((k) => k.personId), ['rice-farmer', 'rice-mill'])
  assert.deepEqual(keyPeople([]), [])
})

test('핵심 인물 여정 화면: 시작 → 핵심 인물 셋, 사이 사람은 묶음 칸, 모든 사람이 어느 칸엔가 나온다', () => {
  for (const [materialIds, name] of [[['coffee', 'plastic'], '아이스 아메리카노'], [['rice', 'laver', 'tuna', 'plastic'], '참치마요 삼각김밥']] as const) {
    for (let i = 0; i < 60; i++) {
      for (const tail of ['-k', '-r-k', '-r-k-first', '-r-k-second']) {
        const id = `2026-10-15-1-s${i.toString(36)}${tail}`
        assert.ok(isKeyJourney(id), id)
        const screens = journeyScreens([...materialIds], id, name)
        assert.equal(screens[0]!.type, 'intro')
        assert.ok(!screens.some((t) => (t as { type: string }).type === 'event'), '이야기 칸은 없다')
        const keys = screens.filter((t) => t.type === 'key')
        assert.deepEqual(keys.map((k) => k.personId), keyPeople(buildTimeline([...materialIds], id, name), id).map((k) => k.personId))
        assert.deepEqual(keys.map((k) => (k as { index: number }).index), [1, 2, 3])
        // 타임라인의 모든 사람(가게·숨은 만남 포함)이 화면 어딘가에서 카드를 받는다
        const want = new Set(timelinePeople([...materialIds], id, name).map((p) => p.personId))
        const got = new Set(screens.flatMap((t) => screenPeople(t)))
        assert.deepEqual([...want].filter((p) => !got.has(p)), [], id)
        // 핵심 인물 사이에서는 묶음 칸이 퀴즈·숨은 만남보다 앞
        let extraSeen = false
        for (const t of screens) {
          if (t.type === 'key') extraSeen = false
          else if (t.type === 'quiz' || t.type === 'hidden') extraSeen = true
          else if (t.type === 'group') assert.ok(!extraSeen, `${id}: 퀴즈 뒤에 묶음 칸`)
        }
      }
    }
  }
})

test("'-k'가 없는 예전 여정은 타임라인 그대로", () => {
  const id = '2026-10-15-1-abcd-r'
  assert.equal(isKeyJourney(id), false)
  assert.deepEqual(journeySteps(['coffee'], id, '아이스 아메리카노'), buildTimeline(['coffee'], id, '아이스 아메리카노'))
  assert.ok(isReverseJourney('2026-10-15-1-abcd-r-k-first'))
  assert.ok(isFirstJourney('2026-10-15-1-abcd-r-k-first'))
  assert.ok(isSecondJourney('2026-10-15-1-abcd-r-k-second'))
})

test('이야기: 핵심 자리에서 만난 횟수대로 다음 편, 다 보면 처음부터. 없으면 카드 문구', () => {
  const eps = KEY_STORIES['sea-crew']!.episodes!
  assert.equal(keyStory('sea-crew', 1), eps[0])
  assert.equal(keyStory('sea-crew', 2), eps[1])
  assert.equal(keyStory('sea-crew', eps.length + 1), eps[0])
  assert.equal(keyStory('coffee-picker', 5), KEY_STORIES['coffee-picker']!.story)
  assert.equal(keyStory('rice-mill'), PEOPLE['rice-mill']!.story)
  assert.equal(keyJoy('rice-mill'), undefined)
})
