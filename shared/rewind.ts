/**
 * 거꾸로 가는 여정의 연출용 순수 함수: 칸마다 보여 줄 물건의 형태(되감기 변신), 칸 위의 문구,
 * '이 전엔 어디 있었을까요?' 질문, 되감기 엔딩에서 지나갈 사람들.
 * 무작위는 늘 여정 id 시드로.
 */
import { formAt } from './data/forms'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { forwardTimeline, isFirstJourney, materialRoute, type TimelineItem } from './journey'
import { withJosa } from './logic'
import { hash } from './random'
import type { Place } from './types'

/** 화면에 보여 줄 형태. product: 완성된 물건(물건 아이콘으로 그린다) / icon: 형태 아이콘 slug */
export interface ShownForm {
  name: string
  icon?: string
  product?: true
}

/** 우리나라·바다는 장소 이름만, 나라 밖은 이름에 나라가 없으면 앞에 붙인다 */
export function placeLabel(place: Place): string {
  const { name, country, continent } = place
  return continent === 'korea' || !country || name.includes(country) ? name : `${country} ${name}`
}

/**
 * 칸마다 보여 줄 형태. 가게·사무실 사람 칸은 완성된 물건, 재료 칸은 그 사람이 넘기는 형태.
 * 이야기·퀴즈·숨은 만남 칸은 바로 앞 칸의 형태를 그대로 쓴다.
 */
export function formsAlong(timeline: TimelineItem[], materialIds: string[], journeyId: string | undefined, itemName: string): ShownForm[] {
  const routes = new Map(materialIds.map((id) => [id, materialRoute(materialIds, journeyId, id)]))
  const product: ShownForm = { name: itemName, product: true }
  let last: ShownForm = product
  return timeline.map((t) => {
    if (t.type === 'stage' && t.closing) last = product
    else if (t.type === 'stage' || t.type === 'pass') {
      const personId = t.type === 'stage' ? t.personId : t.personIds[t.personIds.length - 1]!
      const f = formAt(t.materialId, routes.get(t.materialId) ?? [], personId)
      if (f) last = { name: f.name, ...(f.formIcon ? { icon: f.formIcon } : {}) }
    }
    return last
  })
}

/** 사람 칸 위의 문구: 처음엔 "내 손에 닿기 바로 전", 재료가 바뀌면 "이 ○○는 어디서 왔을까요?", 그다음은 "그 전에는…" */
export function reverseKicker(timeline: TimelineItem[], forms: ShownForm[], index: number): string {
  const t = timeline[index]
  if (!t || (t.type !== 'stage' && t.type !== 'pass')) return ''
  if (index === 0) return '내 손에 닿기 바로 전'
  if (t.type === 'stage' && t.closing) return '그 전에는…'
  const earlier = timeline.slice(0, index).some((x) => (x.type === 'stage' && !x.closing) || x.type === 'pass' ? x.materialId === t.materialId : false)
  return earlier ? '그 전에는…' : `이 ${withJosa(forms[index]?.name ?? '', '은', '는')} 어디서 왔을까요?`
}

const placeOf = (personId: string): Place | undefined => PLACES[PEOPLE[personId]?.placeId ?? '']
const isSea = (p?: Place) => p?.continent === 'sea'
const isPort = (p?: Place) => !!p && /항(구)?$/.test(p.name) && !p.name.includes('공항')

/** 이 칸 다음(원산지 쪽)에 물건이 있던 땅 위의 장소. 같은 재료 안에서, 바다는 건너뛴다 */
function placeBefore(timeline: TimelineItem[], index: number): Place | undefined {
  const t = timeline[index]
  if (!t) return undefined
  for (const x of timeline.slice(index + 1)) {
    if (x.materialId !== t.materialId || x.type === 'pass') return undefined
    if (x.type !== 'stage') continue
    const p = placeOf(x.personId)
    if (!isSea(p)) return p
  }
  return undefined
}

function asks(timeline: TimelineItem[], index: number): Place | undefined {
  const t = timeline[index]
  if (t?.type !== 'stage' || t.closing) return undefined
  const here = placeOf(t.personId)
  if (!isSea(here) && !isPort(here)) return undefined
  const before = placeBefore(timeline, index)
  return before && before.country !== here?.country ? before : undefined
}

export interface StopQuestion {
  options: [string, string]
  answer: 0 | 1
}

/**
 * 항구·바다 칸에서 묻는 '이 전엔 어디 있었을까요?' 보기 2개. 바로 앞 칸에서 물었으면 묻지 않는다(부산항에서 물었으면 바다 위는 건너뛰고 그 앞 항구에서 다시).
 * 오답은 정답과 다른 나라의 장소(정답이 우리나라면 우리나라의 다른 장소)에서 여정 id 시드로 고른다.
 */
export function stopQuestion(timeline: TimelineItem[], index: number, journeyId: string): StopQuestion | null {
  // 첫 여정은 사람 카드만 (경유지 맞히기 없음)
  if (isFirstJourney(journeyId)) return null
  // 바로 앞 사람 칸에서 물었는지 (사이의 숨은 만남·이야기 칸은 건너뛰고 본다)
  let asked = false
  for (let i = 0; i < index; i++) if (timeline[i]?.type === 'stage') asked = !asked && !!asks(timeline, i)
  const right = asks(timeline, index)
  if (!right || asked) return null
  const here = placeOf((timeline[index] as { personId: string }).personId)
  const domestic = right.continent === 'korea'
  const pool = Object.values(PLACES)
    .filter((p) => p.lat !== undefined && !isSea(p) && p.id !== here?.id && p.id !== right.id)
    .filter((p) => (domestic ? p.continent === 'korea' && placeLabel(p) !== placeLabel(right) : p.continent !== 'korea' && p.country !== right.country))
    .sort((a, b) => a.id.localeCompare(b.id))
  if (!pool.length) return null
  const h = hash(`stop:${journeyId}:${index}`)
  const wrong = pool[h % pool.length]!
  const answer = (h >>> 16) % 2 === 0 ? 0 : 1
  const labels: [string, string] = answer === 0 ? [placeLabel(right), placeLabel(wrong)] : [placeLabel(wrong), placeLabel(right)]
  return { options: labels, answer }
}

/** 되감기 엔딩: 원산지 → 내 손 순서로 물건을 넘긴 사람과 그때의 형태 (숨은 만남 제외) */
export function replayFrames(materialIds: string[], journeyId: string, itemName: string): Array<{ personId: string; form: ShownForm }> {
  const forward = forwardTimeline(materialIds, journeyId, itemName)
  const forms = formsAlong(forward, materialIds, journeyId, itemName)
  return forward.flatMap((t, i) => (t.type === 'stage' ? [{ personId: t.personId, form: forms[i]! }] : []))
}
