import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { strandsOf } from '../shared/connections'
import { emptySave } from '../shared/progress'
import { historyOf } from '../shared/today-log'
import { DOING } from '../shared/data/doing'
import { PEOPLE } from '../shared/data/people'
import { PLACES } from '../shared/data/places'
import { clockAt, doingBucket } from '../shared/local-time'
import { FORMS } from '../shared/data/forms'
import { roundKm } from '../shared/distance'
import { hasKeyStory } from '../shared/key-story'
import { pickRoute } from '../shared/pick'
import { RECENT_WALKS, branchLegs, formChanges, rememberWalk, wakeCounts, walkLegs, walkSummary, walkJourneyId, walkPath, walkPeople } from '../shared/walk'

const AMERICANO = { materialIds: ['coffee', 'plastic'], name: '아이스 아메리카노' }

test('걷기 경로: 사람 칸만, 재료마다 갈래, 끝에 가게 사람. 걸을 때마다 출발지가 달라질 수 있다', () => {
  const walk = walkPath(AMERICANO.materialIds, '2026-10-15-1-w00001', AMERICANO.name)
  assert.deepEqual(walk.branches.map((b) => b.materialId), ['coffee', 'plastic'])
  assert.equal(walk.branches[0]!.name, '커피 원두')
  assert.ok(walk.branches.every((b) => b.stops.length > 0))
  assert.equal(walk.hand.at(-1), 'barista')
  const starts = new Set(Array.from({ length: 40 }, (_, i) => walkPath(['coffee'], `2026-10-15-1-w${i.toString(36).padStart(5, '0')}`, '아이스 아메리카노').branches[0]!.stops[0]))
  assert.ok(starts.size > 1, '출발지 변형')
  assert.match(walkJourneyId('2026-10-15', () => 0.5), /^2026-10-15-1-w[0-9a-z]{5}$/)
})

test('걷기는 아무것도 쌓지 않는다: 만남 기록·이어진 사람들은 그대로, 남는 건 최근 물건 5개뿐', () => {
  const save = emptySave()
  const before = JSON.stringify(save)
  for (let i = 0; i < 10; i++) walkPath(AMERICANO.materialIds, walkJourneyId('2026-10-15'), AMERICANO.name)
  assert.equal(JSON.stringify(save), before)
  assert.deepEqual(historyOf(save.todays), [])
  assert.deepEqual(strandsOf(save.todays), [])
  // 최근 걸어 본 물건: 맨 앞에, 중복 없이, 5개까지
  let recent: string[] = []
  for (const n of ['라면', '커피', '라면', 'a', 'b', 'c', 'd']) recent = rememberWalk(recent, n)
  assert.deepEqual(recent, ['d', 'c', 'b', 'a', '라면'])
  assert.equal(recent.length, RECENT_WALKS)
  // 걷기 화면은 저장값(게임 상태·하루 기록·기기에만 남기는 한 줄)을 건드리지 않는다
  const page = readFileSync(new URL('../app/pages/walk.vue', import.meta.url), 'utf8')
  for (const forbidden of ['useGame', 'useToday', 'game.state', 'todays', 'setLocalDay', 'today-local']) assert.ok(!page.includes(forbidden), forbidden)
})

test('맨 위 요약: 길 위의 사람을 그곳 시각의 일·저녁·잠으로 나눠 센다', () => {
  const walk = walkPath(AMERICANO.materialIds, '2026-10-15-1-w00001', AMERICANO.name)
  const ids = walkPeople(walk)
  assert.equal(new Set(ids).size, ids.length)
  for (const at of ['2026-10-16T00:00:00Z', '2026-10-16T09:30:00Z', '2026-10-16T18:00:00Z']) {
    const now = new Date(at)
    const { awake, asleep } = wakeCounts(ids, now)
    assert.equal(awake + asleep, ids.length)
    const sleeping = ids.filter((id) => doingBucket(clockAt(PLACES[PEOPLE[id]!.placeId]!.tz, now).h, DOING[id]?.hours) === 'sleep').length
    assert.equal(asleep, sleeping)
  }
  // 같은 사람은 한 번만
  assert.deepEqual(wakeCounts(['barista', 'barista'], new Date('2026-10-16T03:00:00Z')), { awake: 1, asleep: 0 })
})

test('칸 사이 변신: forms.ts의 형태 이름만, 바뀌는 칸에만', () => {
  assert.deepEqual(formChanges('coffee', ['coffee-picker', 'washing-station', 'djibouti-docker', 'sea-crew', 'busan-crane', 'roaster', 'warehouse']), [
    null,
    { from: '커피 체리', to: '생두' },
    { from: '생두', to: '생두 자루' },
    null,
    null,
    { from: '생두 자루', to: '볶은 원두' },
    null,
  ])
  // 형태 목록이 없는 재료는 아무것도 없다
  assert.deepEqual(formChanges('nothing', ['a', 'b']), [null, null])
  // 어느 길로 걸어도 이름은 forms.ts에 있는 것뿐
  for (let i = 0; i < 20; i++) {
    const walk = walkPath(AMERICANO.materialIds, `2026-10-15-1-w${i.toString(36).padStart(5, '0')}`, AMERICANO.name)
    for (const b of walk.branches) {
      const names = new Set((FORMS[b.materialId] ?? []).map((f) => f.name))
      for (const c of formChanges(b.materialId, b.stops)) if (c) assert.ok(names.has(c.from) && names.has(c.to))
    }
  }
})

test('칸 사이 이동: 바다 위 칸은 건너뛰어 한 구간, 배가 있으면 바다, 나라를 건너 공항이면 하늘, 같은 나라는 땅', () => {
  const coffee = walkLegs(['coffee-picker', 'washing-station', 'djibouti-docker', 'sea-crew', 'busan-crane', 'roaster'])
  assert.equal(coffee.length, 5)
  // 에티오피아 → 지부티: 나라를 건너는데 실려 가는 것을 모름
  assert.equal(coffee[1]!.mode, 'cross')
  // 지부티 → (바다 위) → 부산: 두 칸 사이가 한 구간, 이름·거리는 첫 칸 사이에만
  assert.equal(coffee[2]!.mode, 'sea')
  assert.equal(coffee[3]!.mode, 'sea')
  assert.equal(coffee[2]!.first, true)
  assert.equal(coffee[3]!.first, false)
  assert.equal(coffee[2]!.km, coffee[3]!.km)
  assert.ok(roundKm(coffee[2]!.km) >= 5000)
  const salmon = walkLegs(['salmon-processor', 'oslo-air', 'air-cargo', 'warehouse'])
  assert.deepEqual(salmon.map((g) => g!.mode), ['land', 'air', 'land'])
  // 강을 오가는 바지선은 땅, 항구에서 큰 배로는 바다
  assert.deepEqual(walkLegs(['corn-farmer', 'barge-crew', 'nola-port', 'bulk-crew', 'starch-plant']).map((g) => g!.mode), ['land', 'land', 'sea', 'sea'])
  // 나라를 건너면서 한쪽이 공항이면 하늘, 실려 가는 것을 모르면 거리만(cross)
  assert.deepEqual(walkLegs(['cpu-fab', 'osat', 'air-cargo', 'warehouse']).map((g) => g!.mode), ['cross', 'air', 'land'])
  // 앱·노래는 인터넷으로, 바다 밑 케이블 칸을 지나는 구간만 바다
  assert.deepEqual(walkLegs(['track-maker', 'topliner', 'music-distributor', 'datacenter-tech', 'cable-repairer', 'base-station']).map((g) => g?.mode), ['net', 'net', 'net', 'sea', 'sea'])
  // 좌표 있는 다음 칸이 없으면 비워 둔다
  assert.deepEqual(walkLegs(['djibouti-docker', 'sea-crew']), [null])
  assert.deepEqual(walkLegs(['barista']), [])
})

test('끝 요약: 나라 수·거리·사람 수, 오늘 고를 수 있는 길에 이야기가 있는지', () => {
  for (let i = 0; i < 20; i++) {
    const id = `2026-10-15-1-w${i.toString(36).padStart(5, '0')}`
    const walk = walkPath(AMERICANO.materialIds, id, AMERICANO.name)
    const sum = walkSummary(walk)
    const people = walkPeople(walk)
    assert.equal(sum.people, people.length)
    assert.ok(sum.countries >= 2, '원산지 나라와 한국')
    // 바다 위(나라 없음)는 세지 않는다
    assert.equal(sum.countries, new Set(people.map((p) => PLACES[PEOPLE[p]!.placeId]!.country).filter((c) => c !== '')).size)
    // 거리는 화면에 적힌 구간을 한 번씩 더한 것
    const shown = [...walk.branches.flatMap((b) => branchLegs(walk, b)), ...walkLegs(walk.hand)].filter((g) => g?.first)
    assert.equal(sum.km, shown.reduce((a, g) => a + g!.km, 0))
    assert.ok(roundKm(sum.km) >= 5000)
    // 이야기: 오늘 한 사람을 고르는 길과 같은 범위
    assert.equal(sum.story, pickRoute(AMERICANO.materialIds, id, AMERICANO.name).some(hasKeyStory))
  }
})
