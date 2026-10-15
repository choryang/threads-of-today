import { dayResult, distanceLabel } from '../../shared/day-type'

/**
 * 10초 테스트 물건의 아이콘: public/forms의 형태 아이콘 중 가장 가까운 것.
 * exact: false는 그 물건 모양의 아이콘이 없어 재료 아이콘을 대신 쓴 것 (새로 그리면 바꾼다)
 */
export const TEST_ICON: Record<string, { slug: string; exact: boolean }> = {
  americano: { slug: 'roasted-coffee-beans', exact: false },
  'choco-bar': { slug: 'cocoa-liquor', exact: false },
  banana: { slug: 'prop-banana', exact: true },
  smartphone: { slug: 'assembled-device', exact: true },
  'tuna-can': { slug: 'tuna-can', exact: true },
  samgak: { slug: 'rice', exact: false },
  'salmon-sushi': { slug: 'salmon-fillet', exact: false },
  ramen: { slug: 'buckwheat-noodles', exact: false },
  burger: { slug: 'chilled-beef', exact: false },
  samgyeopsal: { slug: 'chilled-pork', exact: true },
  'banana-milk': { slug: 'milk-carton', exact: true },
  kimchi: { slug: 'kimchi', exact: true },
  apple: { slug: 'apple', exact: true },
  notebook: { slug: 'paper', exact: true },
  tshirt: { slug: 'cotton-clothes', exact: true },
  tofu: { slug: 'tofu', exact: true },
  chopsticks: { slug: 'planks', exact: false },
  'fried-chicken': { slug: 'fried-chicken', exact: true },
}

export const iconUrl = (productId: string) => `/forms/${TEST_ICON[productId]?.slug ?? 'parcel-box'}.svg`

/** 결과 숫자 3개 [값, 설명] (결과 화면과 공유 이미지가 같은 문구) */
export function dayNumbersText(items: string[]): Array<[string, string]> {
  const n = dayResult(items).numbers
  const dist = distanceLabel(n.km)
  return [
    [`${n.people.length}명`, '나에게 닿은 사람'],
    [`${n.countries.length}개`, '나라'],
    dist.startsWith('지구 ') ? [dist.slice(3), '지구를 돌아온 거리'] : [dist, '물건이 지나온 거리'],
  ]
}
