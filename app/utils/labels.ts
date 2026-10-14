import type { Rarity } from '../../shared/types'

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
}

export const RARITY_HOW: Record<Rarity, string> = {
  common: '여정에서 만나요',
  rare: '퀴즈를 맞히면 만나요',
  epic: '서로 다른 재료의 여정이 겹치면 만나요',
  legendary: '세트를 모두 모으면 만나요',
}

/** 숨은 만남 카드는 희귀도와 따로 표시한다 */
export const HIDDEN_LABEL = '숨은 만남'
export const HIDDEN_HOW = '여정 중에 아주 가끔 나타나는 숨은 만남이에요'

export function badgeOf(person: { rarity: Rarity; kind: string }): string {
  return person.kind === 'hidden' ? `${HIDDEN_LABEL} · ${RARITY_LABEL[person.rarity]}` : RARITY_LABEL[person.rarity]
}

export function howToMeet(person: { rarity: Rarity; kind: string }): string {
  return person.kind === 'hidden' ? HIDDEN_HOW : RARITY_HOW[person.rarity]
}
