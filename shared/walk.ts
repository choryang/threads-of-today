import { DOING } from './data/doing'
import { greatCircleKm, pointOf } from './distance'
import { FORMS, formAt } from './data/forms'
import { MATERIALS } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { TRANSPORT } from './data/transport'
import { forwardTimeline } from './journey'
import { hasKeyStory } from './key-story'
import { clockAt, doingBucket } from './local-time'

/**
 * 실 따라 걷기 (docs/redesign/README.md): 하루 한 편 이야기와 별개로, 언제든 물건의 길을 구경한다.
 * 경로는 forwardTimeline의 사람 칸만(퀴즈·숨은 만남·이벤트 없음), 재료마다 갈래, 끝에 가게 사람(closingPeople).
 * 출발지 변형은 걸을 때마다 무작위(여정 id를 새로 만든다).
 * 걷기는 아무것도 쌓지 않는다: 만난 사람·이어진 실·마음 기록에 넣지 않는다. 기기에 남기는 건 최근 걸어 본 물건 이름 5개뿐.
 */
export interface WalkBranch {
  materialId: string
  /** 재료 이름: '커피 원두' */
  name: string
  /** 출발지 → 창고 순서의 사람 */
  stops: string[]
}

export interface Walk {
  branches: WalkBranch[]
  /** 내 손에 닿기 직전의 사무실·가게 사람 */
  hand: string[]
}

export function walkPath(materialIds: string[], journeyId: string, itemName: string): Walk {
  const timeline = forwardTimeline(materialIds, journeyId, itemName)
  const branches: WalkBranch[] = []
  for (const t of timeline) {
    if (t.type !== 'stage' || t.closing) continue
    let b = branches.find((x) => x.materialId === t.materialId)
    if (!b) branches.push((b = { materialId: t.materialId, name: MATERIALS[t.materialId]?.name ?? t.materialId, stops: [] }))
    b.stops.push(t.personId)
  }
  const hand = timeline.flatMap((t) => (t.type === 'stage' && t.closing ? [t.personId] : []))
  return { branches, hand }
}

/** 걸을 때마다 새 여정 id (출발지 변형이 달라진다). random은 0~1 */
export function walkJourneyId(date: string, random: () => number = Math.random): string {
  return `${date}-1-w${Math.floor(random() * 36 ** 5).toString(36).padStart(5, '0')}`
}

export const RECENT_WALKS = 5
/** 최근 걸어 본 물건: 맨 앞에, 같은 이름은 하나, 5개까지 */
export function rememberWalk(list: string[], name: string): string[] {
  return [name, ...list.filter((n) => n !== name)].slice(0, RECENT_WALKS)
}

/** 이 길 위의 사람 (갈래 → 가게, 중복 없이) */
export function walkPeople(walk: Walk): string[] {
  return [...new Set([...walk.branches.flatMap((b) => b.stops), ...walk.hand])]
}

/**
 * 지금 깨어 있는 사람·자고 있는 사람 수. 그곳 시각으로 doing.ts의 구분(일·저녁은 깨어 있음, 잠은 자고 있음) 그대로.
 * 주말·공휴일에 쉬는 사람도 일하는 시간이면 깨어 있다
 */
export function wakeCounts(personIds: string[], now: Date): { awake: number; asleep: number } {
  let awake = 0
  let asleep = 0
  for (const id of new Set(personIds)) {
    const place = PLACES[PEOPLE[id]?.placeId ?? '']
    if (!place) continue
    if (doingBucket(clockAt(place.tz, now).h, DOING[id]?.hours) === 'sleep') asleep++
    else awake++
  }
  return { awake, asleep }
}

/**
 * 칸마다 그 사람 손에서 바뀌는 모습 ('커피 체리 → 생두'). 형태 이름은 forms.ts 그대로, 바뀌지 않으면 null.
 * 첫 칸은 처음 모습(FORMS의 맨 앞)에서, 그다음은 앞 칸을 떠날 때 모습에서
 */
export function formChanges(materialId: string, stops: string[]): ({ from: string; to: string } | null)[] {
  return stops.map((id, i) => {
    const before = i === 0 ? FORMS[materialId]?.[0] : formAt(materialId, stops, stops[i - 1]!)
    const after = formAt(materialId, stops, id)
    return before && after && before.name !== after.name ? { from: before.name, to: after.name } : null
  })
}

/** 강을 오가는 배: transport.ts에서는 배지만 걷기에서는 땅 구간으로 본다 */
const RIVER = new Set(['barge-crew'])

/** cross: 나라를 건너는데 무엇에 실려 가는지 모르는 구간(거리만 적는다) · net: 앱·노래처럼 인터넷으로 오가는 구간 */
export type LegMode = 'sea' | 'air' | 'land' | 'cross' | 'net'

/** 물건이 아니라 인터넷으로 오가는 길의 사람들 (앱·노래·드라마·애니메이션·게임·인터넷 재료. 그림·영상도 파일로 오간다) */
const NET = new Set(['app', 'song', 'drama', 'anime-jp', 'anime-kr', 'game', 'internet'].flatMap((id) => MATERIALS[id]?.stages ?? []))
export interface LegGap {
  mode: LegMode
  /** 이 구간의 대권 거리(반올림 전). 화면에는 roundKm으로 */
  km: number
  /** 구간의 첫 칸 사이에만 이름·거리를 적는다 */
  first: boolean
}

/**
 * 칸 사이 이동. gaps[i]는 ids[i]와 ids[i+1] 사이. 좌표가 있는 두 칸 사이를 한 구간으로 보고(바다 위처럼 좌표가 없는 칸은 건너뛴다)
 * 구간 안의 칸 사이에 모두 같은 값을 둔다. 좌표 있는 다음 칸이 없으면 null.
 * 바다: 떠나는 칸이나 그 사이에 배(transport.ts, 강을 오가는 바지선은 빼고)나 바다 위 사람이 있다.
 * 인터넷: 두 끝이 모두 앱·노래·인터넷 길의 사람(바다 위 케이블 칸을 지나면 바다).
 * 하늘: 나라를 건너고 한쪽 끝이 공항 화물 담당. 땅: 같은 나라 안. 그 밖(나라를 건너는데 실려 가는 것을 모름)은 cross
 */
export function walkLegs(ids: string[]): (LegGap | null)[] {
  const gaps: (LegGap | null)[] = ids.slice(1).map(() => null)
  const points = ids.map(pointOf)
  let a = points.findIndex(Boolean)
  while (a >= 0) {
    let b = a + 1
    while (b < ids.length && !points[b]) b++
    if (b >= ids.length) break
    const sea = ids.slice(a, b).some((id) => (TRANSPORT[id] === 'ship' && !RIVER.has(id)) || PLACES[PEOPLE[id]?.placeId ?? '']?.continent === 'sea')
    const country = (id: string) => PLACES[PEOPLE[id]?.placeId ?? '']?.country
    const abroad = country(ids[a]!) !== country(ids[b]!)
    const air = TRANSPORT[ids[a]!] === 'air' || TRANSPORT[ids[b]!] === 'air'
    const net = NET.has(ids[a]!) && NET.has(ids[b]!)
    const mode: LegMode = sea ? 'sea' : net ? 'net' : !abroad ? 'land' : air ? 'air' : 'cross'
    const km = greatCircleKm(points[a]!, points[b]!)
    for (let i = a; i < b; i++) gaps[i] = { mode, km, first: i === a }
    a = b
  }
  return gaps
}

/** 갈래마다 끝 칸에서 내 손 쪽 첫 사람까지 이어 잰 칸 사이 이동 (화면의 갈래 칸 사이와 같다) */
export function branchLegs(walk: Walk, branch: WalkBranch): (LegGap | null)[] {
  return walkLegs([...branch.stops, ...walk.hand.slice(0, 1)])
}

/**
 * 끝 요약: 나라 수(바다 위는 세지 않는다)·거리(화면의 구간을 한 번씩 더한 것, 반올림 전)·사람 수.
 * story: 오늘 한 사람을 고르는 길(첫 재료 갈래 + 가게 사람, pickRoute와 같은 범위)에 이야기가 있는 사람이 있는지
 */
export function walkSummary(walk: Walk): { countries: number; km: number; people: number; story: boolean } {
  const people = walkPeople(walk)
  const countries = new Set(people.map((id) => PLACES[PEOPLE[id]?.placeId ?? '']?.country).filter(Boolean)).size
  const legs = [...walk.branches.flatMap((b) => branchLegs(walk, b)), ...walkLegs(walk.hand)]
  const km = legs.reduce((sum, g) => sum + (g?.first ? g.km : 0), 0)
  const story = [...(walk.branches[0]?.stops ?? []), ...walk.hand].some(hasKeyStory)
  return { countries, km, people: people.length, story }
}
