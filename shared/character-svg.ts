/**
 * 캐릭터 SVG 조립 (순수 함수). 파츠 문자열은 넘겨받는다: 앱은 Vite가 번들에 넣은 파츠(app/utils/character.ts),
 * OG 이미지 스크립트는 파일에서 읽은 파츠(scripts/build-og.ts). 그래서 두 곳의 캐릭터가 똑같다.
 */
import type { Continent, Hat, Person } from './types'

/** 대륙별 피부색. 파츠의 var(--skin)에 들어간다. 대한민국도 아시아라 아시아와 같은 색 */
export const BODY_COLORS: Record<Continent, string> = {
  korea: '#FFE08A',
  asia: '#FFE08A',
  africa: '#B8E0A0',
  europe: '#B9D4F5',
  oceania: '#F9B9C9',
  americas: '#D6C4F2',
  sea: '#9EE3DA',
}


export const HAT_PART: Record<Hat, string> = {
  none: '',
  cap: 'hat-cap',
  straw: 'hat-straw',
  helmet: 'hat-helmet',
  minerLamp: 'hat-miner',
  scarf: 'hat-scarf',
  beanie: 'hat-beanie',
  hood: 'hat-hood',
  chef: 'hat-chef',
  headset: 'hat-headset',
  safetyHelmet: 'hat-safety',
}

const LOCKED_INK = '#2A3F5C'
const DROP_INK = 'fill="#3A3A48"'

/** 파츠 파일(512×640)에서 겉의 <svg>, 주석, 태그 사이 공백, 몸 파츠의 그룹 id를 걷어 내 안쪽 마크업만 남긴다 */
export function cleanPart(svg: string): string {
  return svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ id="(shadow|legs|arm-r|arm-l|torso|hand-r|head)"/g, '')
    .replace(/>\s+</g, '><')
    .trim()
}

export interface CharacterOpts {
  locked?: boolean
  /** 손 흔드는 자세(body-wave) + 반가운 얼굴(face-glad) */
  wave?: boolean
}

/** 파츠를 README의 순서(body → outfit → face → hair → hat → prop)로 겹친 SVG 안쪽 마크업. 피부색은 감싸는 <svg>의 --skin */
export function assembleCharacter(part: (name: string) => string, person: Person, { locked = false, wave = false }: CharacterOpts = {}): string {
  const { hat, prop, outfit, hair, face, tint } = person.look
  const propSvg = tint && prop === 'drop' ? part('prop-drop').replace(DROP_INK, `fill="${tint}"`) : part(`prop-${prop}`)
  const layers = [
    part(wave ? 'body-wave' : 'body-stand'),
    part(`outfit-${outfit}`),
    // 잠긴 실루엣에는 얼굴이 보이지 않으니 뺀다
    locked ? '' : part(wave ? 'face-glad' : `face-${face}`),
    // 방진복 후드는 머리를 덮는다
    hat === 'hood' ? '' : part(`hair-${hair}`),
    part(HAT_PART[hat]),
    propSvg,
  ]
  let svg = layers.join('')
  if (locked) {
    // 모든 색(--skin 기본값 포함)을 한 색으로 눌러 실루엣을 만든다
    svg = svg.replace(/#[0-9A-Fa-f]{3,6}\b/g, LOCKED_INK)
      + `<text x="256" y="300" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="120" fill="#5A6F8E">?</text>`
  }
  return svg
}
