export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export type Continent = 'korea' | 'asia' | 'africa' | 'europe' | 'oceania' | 'americas' | 'sea'

export type Hat =
  | 'none' | 'cap' | 'straw' | 'helmet' | 'minerLamp' | 'scarf'
  | 'beanie' | 'hood' | 'chef' | 'headset' | 'safetyHelmet'

export type Prop =
  | 'basket' | 'cherry' | 'pod' | 'leaf' | 'wheat' | 'box' | 'wrench'
  | 'pickaxe' | 'fish' | 'anchor' | 'spool' | 'drop' | 'clipboard'
  | 'flask' | 'chip' | 'cup' | 'gear' | 'banana' | 'orange' | 'magnifier'
  | 'phone' | 'recycle' | 'seed' | 'crane'

export interface Place {
  id: string
  name: string
  /** 국가명. 바다 위처럼 국가가 없으면 빈 문자열 */
  country: string
  continent: Continent
}

export interface Look {
  hat: Hat
  prop: Prop
}

export interface Person {
  id: string
  job: string
  placeId: string
  story: string
  look: Look
  rarity: Rarity
  /** stage: 여정 단계 / quiz: 퀴즈 보상 / link: 연결 발견 / set: 세트 완성 보상 */
  kind: 'stage' | 'quiz' | 'link' | 'set'
}

export interface Quiz {
  q: string
  options: string[]
  answer: number
  explain: string
  rewardId: string
}

export interface Material {
  id: string
  name: string
  aliases: string[]
  /** 여정 순서대로 나열한 사람 id */
  stages: string[]
  quiz?: Quiz
}

export interface Product {
  id: string
  name: string
  aliases: string[]
  materialIds: string[]
}

export interface LinkRule {
  /** 이 사람이 하루 여정의 서로 다른 재료 2개 이상에 등장하면 */
  personId: string
  /** 이 연결 카드를 얻는다 */
  cardId: string
}

export interface CardSet {
  id: string
  name: string
  desc: string
  memberIds: string[]
  rewardId: string
}
