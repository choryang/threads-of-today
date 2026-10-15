import { dayResult, distanceLabel } from '../../shared/day-type'

/**
 * 10초 테스트 물건의 아이콘 (public/forms). 형태 아이콘 중 그 물건 모양이 있으면 그것, 없던 7개는 완성품 아이콘(product-*).
 * exact: false는 그 물건 모양의 아이콘이 없어 재료 아이콘을 대신 쓴 것 (tests/forms.test.ts가 파일이 있는지 검사)
 */
export const TEST_ICON: Record<string, { slug: string; exact: boolean }> = {
  americano: { slug: 'product-americano', exact: true },
  'choco-bar': { slug: 'product-choco-bar', exact: true },
  banana: { slug: 'prop-banana', exact: true },
  smartphone: { slug: 'assembled-device', exact: true },
  'tuna-can': { slug: 'tuna-can', exact: true },
  samgak: { slug: 'product-samgak', exact: true },
  'salmon-sushi': { slug: 'product-salmon-sushi', exact: true },
  ramen: { slug: 'product-ramen', exact: true },
  burger: { slug: 'product-burger', exact: true },
  samgyeopsal: { slug: 'chilled-pork', exact: true },
  'banana-milk': { slug: 'milk-carton', exact: true },
  kimchi: { slug: 'kimchi', exact: true },
  apple: { slug: 'apple', exact: true },
  notebook: { slug: 'paper', exact: true },
  tshirt: { slug: 'cotton-clothes', exact: true },
  tofu: { slug: 'tofu', exact: true },
  chopsticks: { slug: 'product-chopsticks', exact: true },
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
