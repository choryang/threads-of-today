import type { Rarity } from '../../shared/types'

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
}

/** 등급별로 만나는 방법. 도감의 잠긴 카드와 '등급 기준' 안내가 함께 쓴다 */
export const RARITY_HOW: Record<Rarity, string> = {
  common: '여정을 따라가면 만나요',
  rare: '재료 퀴즈를 맞히면 만나요',
  epic: '하루에 지나온 여정들이 같은 사람을 거치면 만나요 (연결 발견)',
  legendary: '세트 하나를 모두 모으면 만나요',
}

/** 숨은 만남 카드는 희귀도와 따로 표시한다 */
export const HIDDEN_LABEL = '숨은 만남'
export const HIDDEN_HOW = '여정 중에 아주 가끔 우연히 만나요'

/** 도감 희귀도 필터 옆 안내 */
export const RARITY_NOTE = '등급은 게임 안에서 만나기 어려운 정도예요. 각 등급에 어떤 직업이 들어갈지는 랜덤으로 정해졌어요.'

/** '등급 기준' 펼침에 보이는 순서 */
export const RARITY_GUIDE: Array<{ label: string; how: string }> = [
  { label: RARITY_LABEL.common, how: RARITY_HOW.common },
  { label: RARITY_LABEL.rare, how: RARITY_HOW.rare },
  { label: RARITY_LABEL.epic, how: RARITY_HOW.epic },
  { label: HIDDEN_LABEL, how: HIDDEN_HOW },
  { label: RARITY_LABEL.legendary, how: RARITY_HOW.legendary },
]

export function badgeOf(person: { rarity: Rarity; kind: string }): string {
  return person.kind === 'hidden' ? `${HIDDEN_LABEL} · ${RARITY_LABEL[person.rarity]}` : RARITY_LABEL[person.rarity]
}

export function howToMeet(person: { rarity: Rarity; kind: string }): string {
  return person.kind === 'hidden' ? HIDDEN_HOW : RARITY_HOW[person.rarity]
}

/** 도착까지 남은 실제 시간. "약 25분", "약 1시간 10분", 1분 안쪽이면 "곧" */
export function remainingLabel(ms: number): string {
  const min = Math.ceil(ms / 60_000)
  if (ms < 60_000) return '곧 도착해요'
  if (min < 60) return `도착까지 약 ${min}분`
  const h = Math.floor(min / 60)
  return `도착까지 약 ${h}시간${min % 60 ? ` ${min % 60}분` : ''}`
}
