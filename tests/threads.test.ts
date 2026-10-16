import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MATERIALS } from '../shared/data/materials'
import { emptySave, type Save } from '../shared/progress'
import { addJourneyToThreads, backfillThreads, buildTapestry, threadWidth } from '../shared/threads'

const TODAY = '2026-10-15'
const journey = (id: string, materialIds: string[], done = true) => ({
  id, name: 'x', source: 'pick' as const, materialIds, step: 0, quiz: {}, newCards: [], done,
})

test('누적 채우기: 남은 30일의 마친 여정 + 그보다 오래된 물건을 재료로', () => {
  const save: Save = {
    ...emptySave(),
    days: { '2026-10-01': { journeys: [journey('2026-10-01-1-aaaa', ['coffee', 'plastic']), journey('2026-10-01-2-bbbb', ['rice'], false)], linkCards: [] } },
    items: { '아이스 아메리카노': '2026-10-01', 라면: '2026-08-20', 알수없는물건: '2026-08-01' },
  }
  assert.deepEqual(backfillThreads(save), {
    coffee: { count: 1, first: '2026-10-01' },
    plastic: { count: 2, first: '2026-08-20' },
    wheat: { count: 1, first: '2026-08-20' },
    'palm-oil': { count: 1, first: '2026-08-20' },
  })
})

test('여정을 마치면 재료마다 1씩, 같은 재료는 한 번만', () => {
  const t: Save['threads'] = {}
  addJourneyToThreads(t, ['coffee', 'coffee', 'milk', 'nope'], TODAY)
  addJourneyToThreads(t, ['coffee'], '2026-10-16')
  assert.deepEqual(t, { coffee: { count: 2, first: TODAY }, milk: { count: 1, first: TODAY } })
  assert.ok(threadWidth(1000) <= 7 && threadWidth(1) < threadWidth(10))
})

test('실타래: 늘 같은 모양, 매듭은 나라, 한국·바다는 그리지 않는다', () => {
  const cards: Record<string, string> = {}
  for (const id of ['coffee', 'cacao', 'rice']) for (const p of MATERIALS[id]!.stages) cards[p] = '2026-10-01'
  cards['co-coffee-farmer'] = TODAY
  const input = {
    threads: { coffee: { count: 4, first: '2026-10-01' }, cacao: { count: 1, first: '2026-10-01' }, rice: { count: 2, first: TODAY } },
    cards, todayKey: TODAY, todayMaterials: ['coffee'],
  }
  const a = buildTapestry(input)
  assert.deepEqual(a, buildTapestry(input))
  const names = a.countries.map((c) => c.country)
  assert.ok(!names.includes('대한민국'))
  assert.ok(!names.includes(''))
  for (const c of ['에티오피아', '지부티', '콜롬비아', '코트디부아르', '네덜란드']) assert.ok(names.includes(c), c)
  // 에티오피아(출발지)는 지부티(수출항)보다 바깥 원
  const dist = (n: string) => { const c = a.countries.find((x) => x.country === n)!; return Math.hypot(c.x - a.center, c.y - a.center) }
  assert.ok(dist('에티오피아') > dist('지부티'))
  // 커피는 출발지마다 가닥, 국내 재료(쌀)는 고리에만
  assert.equal(a.threads.find((t) => t.materialId === 'coffee')!.paths.length, 2)
  assert.equal(a.threads.find((t) => t.materialId === 'rice')!.paths.length, 0)
  assert.equal(a.ring.length, 3)
  // 매듭 크기는 그 나라에서 만난 사람 수
  const et = a.countries.find((c) => c.country === '에티오피아')!
  assert.deepEqual(et.people, ['coffee-picker', 'et-coffee-cupper', 'washing-station'])
  assert.ok(et.r > a.countries.find((c) => c.country === '지부티')!.r)
  // 오늘 표시
  assert.equal(a.threads.find((t) => t.materialId === 'coffee')!.today, true)
  assert.equal(a.threads.find((t) => t.materialId === 'rice')!.fresh, true)
  assert.equal(a.countries.find((c) => c.country === '코트디부아르')!.today, false)
})

test('실타래: 기록이 없으면 비어 있다', () => {
  const empty = buildTapestry({ threads: {}, cards: {}, todayKey: TODAY, todayMaterials: [] })
  assert.equal(empty.threads.length, 0)
  assert.equal(empty.countries.length, 0)
})
