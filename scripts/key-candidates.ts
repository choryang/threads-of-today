/**
 * 핵심 자리에 올 수 있는 사람 전체 목록 → docs/key-candidates.md (npm run key-candidates).
 * 규칙은 docs/key-people.md, 계산은 shared/journey.ts의 keyPeople.
 * - 자리별 후보: 모든 재료의 경로(출발지 변형마다)를 보고 규칙대로 센다. AI가 나눈 물건은 어느 재료든 첫 재료가 될 수 있어서 재료 전체를 본다.
 * - 많이 나오는 순: 대표 물건 + 물건 사전의 물건마다 여정 id 몇 개로 실제 keyPeople을 돌려, 그 자리에 선 비율. 이야기를 먼저 쓸 순서를 정할 때 본다.
 * - 이야기: shared/data/stories.ts에 있는지(여러 편이면 편 수).
 */
import { writeFileSync } from 'node:fs'
import dictionary from '../shared/data/dictionary.json'
import { MATERIAL_LIST, PRODUCTS } from '../shared/data/materials'
import { PEOPLE } from '../shared/data/people'
import { PLACES } from '../shared/data/places'
import { CLOSINGS } from '../shared/data/shops'
import { KEY_STORIES } from '../shared/data/stories'
import { HUBS, buildTimeline, keyPeople, type KeySlot } from '../shared/journey'
import { placeLabel } from '../shared/rewind'

const IDS_PER_ITEM = 8
const SLOTS: Array<{ slot: KeySlot; title: string; rule: string }> = [
  { slot: 'start', title: '1. 시작한 손', rule: '첫 재료 경로의 첫 사람 (출발지 변형이 있으면 출발지마다의 첫 사람)' },
  { slot: 'cross', title: '2. 건너온 손', rule: '경로의 바다·항구·비행기 사람(HUBS). 없으면(국내 경로) 창고 바로 앞의 가공하는 사람' },
  { slot: 'hand', title: '3. 건네준 손', rule: '여정 끝 가게 사람 (물건 종류마다 shared/data/shops.ts)' },
]

// ── 자리별 후보: 재료 경로에서 규칙대로 ──
const candidates: Record<KeySlot, Map<string, Set<string>>> = { start: new Map(), cross: new Map(), hand: new Map() }
const add = (slot: KeySlot, pid: string, from: string) => {
  if (!candidates[slot].has(pid)) candidates[slot].set(pid, new Set())
  candidates[slot].get(pid)!.add(from)
}
for (const m of MATERIAL_LIST) {
  const routes = m.origins?.length ? m.origins.map((o) => [...o.head, ...m.stages.slice(m.originHead ?? 0)]) : [m.stages]
  for (const route of routes) {
    if (route[0]) add('start', route[0], m.name)
    const hubs = route.filter((id) => HUBS.includes(id))
    if (hubs.length) hubs.forEach((id) => add('cross', id, m.name))
    else {
      const at = route.indexOf('warehouse')
      const processor = at > 0 ? route[at - 1] : route.at(-1)
      if (processor) add('cross', processor, `${m.name} (바다·항구 없는 경로)`)
    }
  }
}
for (const [kind, c] of Object.entries(CLOSINGS)) for (const pid of c.shop) add('hand', pid, kind)

// ── 많이 나오는 순: 실제 물건으로 돌려 본 비율 ──
const items = [
  ...PRODUCTS.map((p) => ({ name: p.name, materialIds: [...p.materialIds] })),
  ...(dictionary as Array<{ name: string; materialIds: string[] }>).filter((e) => e.materialIds.length).map((e) => ({ name: e.name, materialIds: e.materialIds })),
]
const seen: Record<KeySlot, Map<string, number>> = { start: new Map(), cross: new Map(), hand: new Map() }
let journeys = 0
items.forEach((it, n) => {
  for (let i = 0; i < IDS_PER_ITEM; i++) {
    const id = `2026-10-15-1-c${n.toString(36)}x${i}-k`
    const keys = keyPeople(buildTimeline(it.materialIds, id, it.name), id)
    journeys++
    for (const k of keys) {
      seen[k.slot].set(k.personId, (seen[k.slot].get(k.personId) ?? 0) + 1)
      // 규칙 밖에서 고른 사람(다음 후보로 넘어간 경우)도 목록에 넣는다
      if (!candidates[k.slot].has(k.personId)) add(k.slot, k.personId, '다음 후보')
    }
  }
})

const pct = (n: number) => (n === 0 ? '-' : n / journeys < 0.001 ? '0.1% 미만' : `${((n / journeys) * 100).toFixed(1)}%`)
const storyMark = (pid: string) => {
  const s = KEY_STORIES[pid]
  if (s?.episodes?.length) return `있음 (${s.episodes.length}편)`
  return s?.story ? '있음' : '없음'
}
const esc = (t: string) => t.replace(/\|/g, '\\|')

let total = 0
let written = 0
const sections = SLOTS.map(({ slot, title, rule }) => {
  const rows = [...candidates[slot].entries()]
    .map(([pid, from]) => ({ pid, from: [...from], n: seen[slot].get(pid) ?? 0 }))
    .sort((a, b) => b.n - a.n || a.pid.localeCompare(b.pid))
  const have = rows.filter((r) => storyMark(r.pid) !== '없음').length
  total += rows.length
  written += have
  const lines = rows.map((r) => {
    const p = PEOPLE[r.pid]!
    const place = PLACES[p.placeId]!
    return `| ${r.pid} | ${p.name ?? ''} | ${esc(p.job)} | ${esc(placeLabel(place))} | ${storyMark(r.pid)} | ${pct(r.n)} | ${esc(r.from.join(', '))} |`
  })
  return [
    `## ${title} (${rows.length}명, 이야기 ${have}명)`,
    '',
    rule,
    '',
    '| id | 이름 | 일 | 장소 | 이야기 | 이 자리에 서는 비율 | 어디서 |',
    '|---|---|---|---|---|---|---|',
    ...lines,
  ].join('\n')
})

const doc = `# 핵심 자리에 올 수 있는 사람들

\`npm run key-candidates\`로 만든 목록이에요(scripts/key-candidates.ts). 규칙은 docs/key-people.md, 이야기는 shared/data/stories.ts.
이야기를 더하면 다시 돌려서 '이야기' 칸을 새로 고쳐요.

- **이야기**: stories.ts에 있는지. 여러 여정에 나오는 사람(바다·항구·가게)은 편 수도.
- **이 자리에 서는 비율**: 대표 물건과 물건 사전의 물건 ${items.length}개를 여정 id ${IDS_PER_ITEM}개씩(${journeys.toLocaleString('ko-KR')}번) 돌려서 그 자리에 선 비율. 높은 사람부터 쓰면 이야기를 만나는 여정이 빨리 늘어요. '-'는 규칙상 올 수 있지만 지금 물건으로는 안 나온 사람(직접 쓴 물건을 AI가 나누면 나올 수 있어요).
- **어디서**: 그 자리에 서게 하는 재료(시작한 손·건너온 손) 또는 가게 종류(건네준 손). '바다·항구 없는 경로'는 HUBS가 없어 창고 바로 앞의 가공하는 사람(창고가 없으면 경로의 마지막 사람)이 건너온 손이 되는 경우. 대부분 국내 경로지만, 수입 재료인데 경로에 배·항구 사람이 없는 것도 여기 들어요.

후보 ${total}자리 중 이야기가 있는 사람 ${written}자리 (한 사람이 두 자리에 나오면 따로 셉니다).

${sections.join('\n\n')}
`
writeFileSync(new URL('../docs/key-candidates.md', import.meta.url), doc)
console.log(`docs/key-candidates.md: ${SLOTS.map(({ slot, title }) => `${title} ${candidates[slot].size}명`).join(', ')} (여정 ${journeys}번으로 비율)`)
