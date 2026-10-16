import { compact } from './normalize'

/** 이름 끝에 붙어도 같은 물건으로 보는 양·그릇 말 ('레몬차 한 잔', '담배 한 갑', '꿀병') */
const MEASURE = /(한|두|세|네|반)?(잔|컵|그릇|병|접시|갑|봉지|봉|팩|개|캔|통|조각|송이|알|공기|인분|세트|포기|마리|토막|줄|장|박스|상자|묶음|단)$/

/**
 * 입력한 말이 들어 있는 다른 물건인지. '딸기' → '딸기 우유', '레몬' → '레몬 에이드 한 잔', '고양이' → '고양이 사료'는 다른 물건이라 true.
 * 같은 말이거나 양·그릇·괄호 설명만 붙었으면('꿀' → '꿀병', '락스' → '락스 (욕실 세정제)') false.
 * 입력이 들어 있지 않은 아예 다른 이름('월요일' → '아이스 아메리카노')도 false: 그건 입력을 다른 물건에 잇는 일이라 여기서 막지 않는다.
 */
export function widensInput(input: string, name: string): boolean {
  const i = compact(input)
  let n = compact(name.replace(/\([^)]*\)/g, ''))
  if (!i || n === i || !n.includes(i)) return false
  n = n.replace(i, '')
  for (let prev = ''; prev !== n; ) {
    prev = n
    n = n.replace(MEASURE, '')
  }
  return n.length > 0
}
