import { DOING } from './data/doing'
import { MATERIALS } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { forwardTimeline } from './journey'
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
