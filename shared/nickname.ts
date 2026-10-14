/**
 * 닉네임. 중복 허용, 앞뒤 공백을 지운 1~12자.
 * 첫 방문에는 게임 세계관에 맞춘 "{때·곳}의 {물건 조각}" 조합을 무작위로 준다. ('새벽의 커피 체리')
 */
export const NICKNAME_MAX = 12

const WHEN_WHERE = [
  '새벽', '아침', '한낮', '오후', '노을', '달밤', '별밤', '첫눈', '장마', '봄비',
  '소나기', '바닷바람', '항구', '부두', '언덕', '들판', '숲속', '골목', '시장', '창가',
  '다락방', '텃밭', '등대', '강가', '온실', '찻집', '부엌', '정류장', '기찻길', '물결',
]

const LITTLE_THINGS = [
  '커피 체리', '카카오 꼬투리', '목화솜', '찻잎', '밀 이삭', '바나나 송이', '귤 한 알', '쌀 한 톨', '콩 한 알', '옥수수 알',
  '고무 방울', '종이배', '작은 컨테이너', '화물선', '나무 상자', '우유 방울', '달걀 한 알', '설탕 한 스푼', '김 한 장', '배추 한 포기',
  '유리병', '알루미늄 캔', '연필 한 자루', '택배 상자', '실타래', '씨앗', '찻잔', '빵 부스러기', '오렌지 조각', '코코아 한 잔',
]

export const NICKNAME_PARTS = { WHEN_WHERE, LITTLE_THINGS }

const length = (s: string) => Array.from(s).length

function pick<T>(list: T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)]!
}

/** 12자를 넘지 않는 기본 닉네임을 무작위로 만든다 */
export function randomNickname(rand: () => number = Math.random): string {
  for (;;) {
    const name = `${pick(WHEN_WHERE, rand)}의 ${pick(LITTLE_THINGS, rand)}`
    if (length(name) <= NICKNAME_MAX) return name
  }
}

/**
 * 사용자가 적은 닉네임을 다듬는다. 쓸 수 없으면 null.
 * 대사 자리표시자({name})와 섞이지 않게 중괄호는 받지 않는다.
 */
export function normalizeNickname(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const name = input.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\ufeff]/g, '').trim()
  if (!name || length(name) > NICKNAME_MAX || /[{}]/.test(name)) return null
  return name
}
