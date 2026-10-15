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
