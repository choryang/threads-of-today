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

export type Outfit =
  | 'farm' | 'coverall' | 'vest' | 'sailor' | 'miner'
  | 'lab' | 'cleanroom' | 'apron' | 'office' | 'rider'

export type Hair = 'short' | 'bob' | 'tied' | 'curly' | 'gray'

/** glad는 "고마워요"를 눌렀을 때 잠깐 짓는 얼굴로 아껴 둔다 */
export type Face = 'smile' | 'focus' | 'sleepy' | 'glad'

export interface Look {
  hat: Hat
  prop: Prop
  outfit: Outfit
  /** 사람 id로 고르게 섞어 정한다 (people.ts) */
  hair: Hair
  face: Face
  /** prop이 drop일 때 방울 색. 없으면 기름(검은색) */
  tint?: string
}

export interface Person {
  id: string
  job: string
  placeId: string
  story: string
  look: Look
  rarity: Rarity
  /** stage: 여정 단계 / quiz: 퀴즈 보상 / link: 연결 발견 / set: 세트 완성 보상 / hidden: 여정 중 아주 가끔 만나는 숨은 만남 */
  kind: 'stage' | 'quiz' | 'link' | 'set' | 'hidden'
}

export interface Quiz {
  q: string
  options: string[]
  answer: number
  explain: string
  rewardId: string
}

/**
 * 재료의 출발지 변형. 여정 앞부분(재배·채굴·수출항)을 이 사람들로 바꾼다.
 * 첫 번째 출발지는 기본 경로(stages 앞부분)와 같아야 한다(check:data가 검사).
 */
export interface Origin {
  id: string
  /** 화면에 보일 출발지 이름 */
  name: string
  /** 뽑힐 가중치. 게임용이라 실제 수입 비중이 아니다 (가장 드문 출발지도 25% 이상) */
  weight: number
  head: string[]
}

export interface Material {
  id: string
  name: string
  aliases: string[]
  /** 여정 순서대로 나열한 사람 id (기본 경로) */
  stages: string[]
  quiz?: Quiz
  /** 같은 재료의 다른 퀴즈. 여정마다 quiz와 이것들 중 하나가 나온다. 보상 카드는 quiz와 같다 */
  extraQuizzes?: Quiz[]
  /** stages 앞에서 몇 명을 출발지 변형으로 바꿀지 */
  originHead?: number
  origins?: Origin[]
}

/** 여정 사이에 낮은 확률로 끼어드는 짧은 장면. 특정 날짜·실제 사건을 말하지 않는 연출이다. */
export interface JourneyEvent {
  id: string
  text: string
  /** sea: 바다 위 사람 다음에만 / land: 땅 위 사람 다음에만 / any: 어디든 */
  where: 'sea' | 'land' | 'any'
}

/** 숨은 만남: 이 사람들 다음에 아주 낮은 확률로 등장한다 */
export interface HiddenRule {
  cardId: string
  afterPersonIds: string[]
  /** 이 재료의 여정에서만 (없으면 모든 재료) */
  materialIds?: string[]
  chance: number
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
