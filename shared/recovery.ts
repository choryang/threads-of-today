/**
 * 기기 이동용 복구 코드: "바다-연필-4827"처럼 두 글자 낱말 2개와 숫자 4개.
 * 숫자는 영문 O·l과 헷갈리는 0과 1을 뺀 2~9만 쓴다. 낱말은 모두 두 글자 한글 명사다.
 * 경우의 수는 낱말 수² × 8⁴ (121개 기준 약 6천만). 서버가 IP별 복구 시도 횟수를 제한해 무작위 대입을 막는다.
 */
export const CODE_WORDS = [
  '바다', '하늘', '구름', '노을', '별빛', '달빛', '햇살', '바람', '파도', '모래', '조개', '등대',
  '항구', '들판', '언덕', '숲길', '냇물', '호수', '폭포', '계곡', '꽃잎', '새싹', '열매', '씨앗',
  '나무', '솔잎', '단풍', '이슬', '서리', '안개', '소풍', '우산', '장화', '연필', '공책', '지도',
  '편지', '엽서', '우표', '기차', '버스', '배낭', '풍선', '연못', '오리', '고래', '펭귄', '여우',
  '토끼', '거북', '참새', '나비', '꿀벌', '사과', '포도', '딸기', '수박', '참외', '자두', '앵두',
  '감귤', '레몬', '호두', '밤알', '감자', '당근', '오이', '호박', '상추', '커피', '홍차', '녹차',
  '우유', '두부', '김밥', '만두', '국수', '호떡', '쿠키', '사탕', '식빵', '치즈', '버터', '쨈병',
  '찻잔', '접시', '냄비', '의자', '책상', '창문', '지붕', '마당', '골목', '시장', '광장', '다리',
  '터널', '등불', '촛불', '시계', '종이', '가방', '모자', '장갑', '양말', '단추', '노래', '피리',
  '북채', '기타', '그림', '액자', '일기', '사진', '달력', '열쇠', '상자', '화분', '씨름', '썰매',
  '팽이',
]

const DIGITS = '23456789'

function randomInt(max: number): number {
  const buf = new Uint32Array(1)
  globalThis.crypto.getRandomValues(buf)
  return buf[0]! % max
}

export function generateRecoveryCode(): string {
  const w1 = CODE_WORDS[randomInt(CODE_WORDS.length)]!
  const w2 = CODE_WORDS[randomInt(CODE_WORDS.length)]!
  let digits = ''
  for (let i = 0; i < 4; i++) digits += DIGITS[randomInt(DIGITS.length)]
  return `${w1}-${w2}-${digits}`
}

/** 사용자가 적은 코드를 "낱말-낱말-숫자" 꼴로 맞춘다. 띄어쓰기·하이픈 유무는 상관없다. 틀린 꼴이면 null */
export function normalizeRecoveryCode(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const s = input.replace(/[^가-힣0-9]/g, '')
  const m = /^([가-힣]{2})([가-힣]{2})([2-9]{4})$/.exec(s)
  if (!m || !CODE_WORDS.includes(m[1]!) || !CODE_WORDS.includes(m[2]!)) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}
