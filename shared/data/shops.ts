/**
 * 여정의 마지막 장면: 물건이 손에 닿기 직전의 가게·사무실 사람들.
 * 물건 이름과 재료로 종류를 정하고(closingKind), 여정 끝에 사무실 사람 한 명(있으면)과 가게 사람 한 명을 붙인다.
 * 수입 재료가 지나온 여정이면 사무실 사람 후보에 수입 서류를 챙기는 무역회사 직원이 들어간다.
 */
export type ClosingKind = 'cafe' | 'delivery' | 'cvs' | 'electronics' | 'clothes' | 'mart' | 'goods' | 'books' | 'computer' | 'app' | 'online' | 'cinema'

export interface Closing {
  /** 마지막에 물건을 건네는 사람 (후보 중 여정 id 시드로 하나) */
  shop: string[]
  /** 그 앞에 나오는 사무실 사람 후보. 비어 있으면 가게 사람만 */
  office: string[]
  /** 물건이 아니라 통관이 없다(앱): 나라 밖을 지나도 무역회사 수입 담당을 붙이지 않는다 */
  noImport?: true
}

export const CLOSINGS: Record<ClosingKind, Closing> = {
  cafe: { shop: ['barista'], office: [] },
  delivery: { shop: ['delivery-rider'], office: [] },
  cvs: { shop: ['cvs-clerk'], office: ['merch-md'] },
  electronics: { shop: ['phone-clerk'], office: ['cs-agent'] },
  clothes: { shop: ['clothing-clerk'], office: ['merch-md'] },
  mart: { shop: ['mart-cashier'], office: ['merch-md'] },
  goods: { shop: ['courier'], office: ['dispatcher', 'cs-agent'] },
  books: { shop: ['bookseller'], office: [] },
  computer: { shop: ['pc-builder'], office: ['cs-agent'] },
  app: { shop: ['cs-agent'], office: [], noImport: true },
  cinema: { shop: ['projectionist'], office: [], noImport: true },
  /** 건네주는 사람 없이 인터넷으로 바로 닿는 것(노래·드라마·애니메이션) */
  online: { shop: [], office: [] },
}

/** 수입 재료가 지나온 여정에서 사무실 사람 후보에 더한다 */
export const IMPORT_OFFICE = 'trade-clerk'

/** 이름에 이 낱말이 들어 있으면 그 종류 (앞에 있는 종류가 먼저) */
const KEYWORDS: Array<[ClosingKind, string[]]> = [
  ['cafe', ['아메리카노', '라떼', '에스프레소', '카푸치노', '콜드브루', '마키아토', '카페', '프라푸치노', '버블티', '밀크티', '에이드', '스무디', '아아']],
  ['delivery', ['치킨', '피자', '짜장', '짬뽕', '탕수육', '떡볶이', '족발', '보쌈', '햄버거', '버거', '마라', '찜닭', '닭강정', '배달', '야식']],
  ['cvs', ['삼각김밥', '컵라면', '편의점', '도시락', '과자', '젤리', '사탕', '초코바', '아이스크림', '캔', '음료', '생수', '탄산수', '콜라', '사이다', '우유', '주스', '요구르트', '한 병', '소주', '맥주', '봉지']],
  ['clothes', ['티셔츠', '셔츠', '청바지', '바지', '양말', '후드', '패딩', '점퍼', '운동복', '레깅스', '속옷', '운동화', '신발', '모자', '옷']],
]

const ELECTRONICS = ['assembly', 'chip']
const CLOTHING = ['cotton', 'polyester', 'rubber']
/** 먹을거리가 아닌 재료. 이것만으로 된 물건은 가게 물건(goods) */
export const NON_FOOD = ['anime-jp', 'anime-kr', 'film', 'drama', 'app', 'song', 'internet', 'switch', 'pcb', 'panel', 'cpu', 'memory', 'sensor', 'publishing', 'cotton', 'polyester', 'plastic', 'rubber', 'cobalt', 'lithium', 'chip', 'assembly', 'aluminum', 'pulp', 'steel', 'glass', 'wood']

export function closingKind(itemName: string, materialIds: string[]): ClosingKind {
  const name = itemName.replace(/\s+/g, ' ')
  const has = (words: string[]) => words.some((w) => name.includes(w))
  if (has(KEYWORDS[0]![1])) return 'cafe'
  // 서비스: 앱은 고객센터 상담원, 노래는 건네주는 사람 없이
  if (materialIds.includes('app')) return 'app'
  if (materialIds.includes('film')) return 'cinema'
  if (['drama', 'anime-jp', 'anime-kr'].some((id) => materialIds.includes(id))) return 'online'
  if (materialIds.includes('song')) return 'online'
  // CPU가 든 물건(데스크톱)은 조립 PC 가게. 휴대폰 매장보다 먼저
  if (materialIds.includes('cpu')) return 'computer'
  if (materialIds.some((id) => ELECTRONICS.includes(id))) return 'electronics'
  // 출판 재료가 있으면 서점 ('책상'처럼 '책'이 든 다른 물건은 이름으로 고르지 않는다)
  if (materialIds.includes('publishing')) return 'books'
  for (const [kind, words] of KEYWORDS.slice(1)) if (has(words)) return kind
  if (materialIds.includes('coffee')) return 'cafe'
  if (materialIds.every((id) => CLOTHING.includes(id)) && materialIds.some((id) => id === 'cotton' || id === 'polyester')) return 'clothes'
  if (materialIds.some((id) => !NON_FOOD.includes(id))) return 'mart'
  return 'goods'
}

/** 마지막 장면에 나올 수 있는 모든 사람 (check:data가 얻을 수 있는지 검사) */
export const CLOSING_PEOPLE = [...new Set([...Object.values(CLOSINGS).flatMap((c) => [...c.shop, ...c.office]), IMPORT_OFFICE])]
