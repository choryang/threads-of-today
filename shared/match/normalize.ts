/**
 * 물건 이름 앞뒤에 흔히 붙는 수식어. 띄어 쓴 낱말이 통째로 이 목록에 있으면 지우고,
 * 붙여 쓴 경우에는 입력의 맨 앞·맨 뒤에 붙은 2글자 이상 수식어만 지운다. ('편의점샌드위치' → '샌드위치')
 * 한 글자 수식어('삼', '새')는 붙여 쓰면 '인삼', '새우'처럼 단어 일부라서 띄어 썼을 때만 지운다.
 */
export const MODIFIERS = [
  // 장소·때
  '편의점', '카페', '마트', '집', '회사', '학교', '오늘', '어제', '아침', '점심', '저녁', '야식', '방금', '아까',
  // 수량
  '한잔', '두잔', '한컵', '한병', '두병', '한캔', '한개', '두개', '한봉지', '한그릇', '한조각', '한팩', '하나', '한박스', '한통',
  // 꾸밈말
  '내', '나의', '우리', '새', '새로산', '맛있는', '따뜻한', '차가운', '시원한', '뜨거운', '작은', '큰',
  // 서술
  '먹었어', '먹음', '먹은', '마셨어', '마심', '마신', '샀어', '삼', '산', '썼어', '씀', '쓴',
]

const AFFIXES = MODIFIERS.filter((m) => m.length >= 2).sort((a, b) => b.length - a.length)

/** 공백·특수문자를 없애고 소문자로 바꾼다. 비교용 키를 만들 때 쓴다. */
export function compact(s: string): string {
  return s.toLowerCase().replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')
}

/** 사용자 입력을 매칭용 키로 바꾼다. 수식어를 지운 결과가 비면 수식어를 지우기 전 값을 쓴다. */
export function normalize(input: string): string {
  const words = input.toLowerCase().split(/[\s,.!?~·/]+/).map(compact).filter(Boolean)
  const kept = words.filter((w) => !MODIFIERS.includes(w))
  let s = (kept.length ? kept : words).join('')
  let changed = true
  while (changed) {
    changed = false
    for (const m of AFFIXES) {
      if (s.length <= m.length + 1) continue
      if (s.startsWith(m)) {
        s = s.slice(m.length)
        changed = true
      } else if (s.endsWith(m)) {
        s = s.slice(0, -m.length)
        changed = true
      }
    }
  }
  return s
}
