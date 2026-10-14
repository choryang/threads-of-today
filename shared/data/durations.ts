/**
 * 여정에서 사람마다 머무는 게임 날수. 게임 연출용 값이라 실제 소요 기간과 다를 수 있다.
 * 장소 종류별 기본값을 두고, 따로 정할 사람만 PERSON_DAYS에 적는다.
 * 여정 전체 길이는 shared/timing.ts가 MIN~MAX_JOURNEY_DAYS 안으로 늘이거나 줄인다.
 */
import { PEOPLE } from './people'
import { PLACES } from './places'

export type PlaceKind = 'farm' | 'mine' | 'factory' | 'port' | 'ship' | 'plane' | 'warehouse' | 'shop'

/** 장소 종류별 머무는 날수. 배는 [최소, 최대] 사이에서 여정 id 시드로 고른다 */
export const KIND_DAYS: Record<PlaceKind, number | [number, number]> = {
  farm: 3,
  mine: 3,
  factory: 2,
  port: 1,
  ship: [15, 20],
  plane: 1,
  warehouse: 1,
  shop: 1,
}

/** 기본값 대신 따로 정한 날수 */
export const PERSON_DAYS: Record<string, number | [number, number]> = {
  'barge-crew': [6, 8], // 바다가 아니라 강을 따라 내려가는 바지선
}

/** 이야기(여정 이벤트)와 숨은 만남 */
export const EVENT_DAYS = 0.5
export const HIDDEN_DAYS = 1

/** 직업 이름에 이 낱말이 있으면 그 종류 (앞에 있는 규칙이 먼저) */
const JOB_RULES: Array<[PlaceKind, string[]]> = [
  ['plane', ['항공', '공항']],
  ['port', ['항만', '수출항', '하역', '크레인', '수출 담당']],
  ['mine', ['광부', '광산', '유전']],
  ['shop', ['가게', '편의점', '마트', '매장', '바리스타', '라이더', '택배', '치킨집', '사장님', '상담원', '무역회사', 'MD', '배차', '경매사']],
  ['warehouse', ['물류센터', '저장소', '저장고', '유통센터', '유통인', '탱크로리', '숙성실']],
  ['farm', ['농부', '농장', '수확', '양식', '어민', '낙농', '목장', '조림지', '벌목', '채취', '농사', '선원']],
  ['factory', ['공장', '제분소', '제련소', '제철소', '제재소', '가공장', '처리장', '스테이션', '로스터', '장인', '말리는', '발효', '선별', '용해로', '성형', '운전원', '기술자', '엔지니어', '작업자', '재봉사', '담당']],
]

/** 사람의 장소 종류. 바다 위 사람은 배, 그 밖에는 직업 이름으로 정한다. 못 정하면 undefined (check:data가 잡는다) */
export function placeKindOf(personId: string): PlaceKind | undefined {
  const person = PEOPLE[personId]
  if (!person) return undefined
  if (PLACES[person.placeId]?.continent === 'sea') return 'ship'
  return JOB_RULES.find(([, words]) => words.some((w) => person.job.includes(w)))?.[0]
}

/** 이 사람이 머무는 기본 날수 (범위면 [최소, 최대]) */
export function personDays(personId: string): number | [number, number] {
  return PERSON_DAYS[personId] ?? KIND_DAYS[placeKindOf(personId) ?? 'shop']
}
