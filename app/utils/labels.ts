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
