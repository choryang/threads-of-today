/**
 * 운송 구간: 이 사람이 여정에 있으면 물건이 배·비행기·트럭에 실려 온 것이다 ('오고 있는 물건'이 생기는 조건, shared/incoming.ts).
 * 고기잡이 배(원양어선 선원·오징어잡이)는 잡는 일이라 넣지 않았다. 항구·공항에서 싣고 내리는 사람도 운송 수단이 아니라 넣지 않았다.
 */
export type TransportKind = 'ship' | 'air' | 'truck'

export const TRANSPORT: Record<string, TransportKind> = {
  'sea-crew': 'ship',
  'bulk-crew': 'ship',
  'tanker-crew': 'ship',
  'reefer-crew': 'ship',
  'barge-crew': 'ship',
  'air-cargo': 'air',
  'oslo-air': 'air',
  'hanoi-air': 'air',
  'milk-collector': 'truck',
  courier: 'truck',
}

/** 실은 것 ('초콜릿을 실은 배') */
export const VEHICLE: Record<TransportKind, string> = { ship: '배', air: '비행기', truck: '트럭' }
/** 지나는 곳 이름이 없을 때 */
export const ON_THE_WAY: Record<TransportKind, string> = { ship: '바다를 건너는 중', air: '하늘을 나는 중', truck: '길을 달리는 중' }
