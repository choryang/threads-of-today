import type { Place } from './types'

/** 우리나라·바다는 장소 이름만, 나라 밖은 이름에 나라가 없으면 앞에 붙인다 */
export function placeLabel(place: Place): string {
  const { name, country, continent } = place
  return continent === 'korea' || !country || name.includes(country) ? name : `${country} ${name}`
}
