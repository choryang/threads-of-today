import { BODY_COLORS, assembleCharacter, cleanPart, type CharacterOpts } from '../../shared/character-svg'
import type { Continent, Person } from '../../shared/types'

/** 대륙별 피부색 (shared/character-svg.ts). 파츠의 var(--skin)에 들어간다 */
export { BODY_COLORS }

export const CONTINENT_LABEL: Record<Continent, string> = {
  korea: '한국',
  asia: '아시아',
  africa: '아프리카',
  europe: '유럽',
  oceania: '오세아니아',
  americas: '아메리카',
  sea: '바다',
}

/**
 * 캐릭터 파츠(app/assets/character, 512×640 같은 원점). 빌드 때 문자열로 번들에 들어간다. 조립은 shared/character-svg.ts
 */
const RAW = import.meta.glob<string>('../assets/character/*.svg', { query: '?raw', import: 'default', eager: true })
const PARTS: Record<string, string> = {}
for (const [path, svg] of Object.entries(RAW)) PARTS[path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)] = cleanPart(svg)

function part(name: string): string {
  return PARTS[name] ?? ''
}

/** 정사각형 상자에 넣는 viewBox. 밀짚모자 챙과 발 그림자까지 들어간다 */
export const CHARACTER_VIEWBOX = '-30 56 572 572'
/** 발끝에 맞춰 세우는 상자(가로:세로 = 140:190). 그림자 가운데(y 612)가 상자 아래 끝 가까이에 온다 */
export const STANDING_VIEWBOX = '36 30 440 597'

export type { CharacterOpts }

const cache = new Map<string, string>()

/**
 * 파츠를 README의 순서(body → outfit → face → hair → hat → prop)로 겹친 SVG 안쪽 마크업.
 * 피부색은 감싸는 <svg>의 --skin으로 칠한다. 같은 사람·상태는 한 번만 만들어 둔다(도감에서 수백 번 그림).
 */
export function characterSvg(person: Person, opts: CharacterOpts = {}): string {
  const key = `${person.id}|${opts.locked ? 1 : 0}|${opts.wave ? 1 : 0}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const svg = assembleCharacter(part, person, opts)
  cache.set(key, svg)
  return svg
}
