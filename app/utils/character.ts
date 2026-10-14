import type { Continent, Hat, Prop } from '../../shared/types'

export const BODY_COLORS: Record<Continent, string> = {
  korea: '#FFC9A8',
  asia: '#FFE08A',
  africa: '#B8E0A0',
  europe: '#B9D4F5',
  oceania: '#F9B9C9',
  americas: '#D6C4F2',
  sea: '#9EE3DA',
}

export const CONTINENT_LABEL: Record<Continent, string> = {
  korea: '한국',
  asia: '아시아',
  africa: '아프리카',
  europe: '유럽',
  oceania: '오세아니아',
  americas: '아메리카',
  sea: '바다',
}

interface Ink {
  /** 소품·모자 주색 */
  a: string
  /** 보조색 */
  b: string
  /** 밝은 면 */
  c: string
  /** 선 */
  line: string
}

const INK: Ink = { a: '#3B6EA8', b: '#E0705F', c: '#FFFFFF', line: '#2A2A35' }

/** 모자: 머리 꼭대기(약 y=34) 기준 */
export function hatSvg(hat: Hat, ink: Ink = INK): string {
  switch (hat) {
    case 'cap':
      return `<path d="M38 44 Q60 18 82 44 Z" fill="${ink.a}"/><path d="M60 42 L94 46 Q92 51 80 50 L60 48 Z" fill="${ink.a}"/><circle cx="60" cy="27" r="3" fill="${ink.c}" opacity=".8"/>`
    case 'straw':
      return `<ellipse cx="60" cy="42" rx="40" ry="8" fill="#E8C46A"/><path d="M40 42 Q42 20 60 20 Q78 20 80 42 Z" fill="#F2D27E"/><path d="M41 37 H79" stroke="${ink.b}" stroke-width="4"/>`
    case 'helmet':
      return `<path d="M36 46 Q36 18 60 18 Q84 18 84 46 Z" fill="#E6EAF0"/><rect x="32" y="43" width="56" height="6" rx="3" fill="#C9D2DE"/><path d="M60 19 V44" stroke="#C9D2DE" stroke-width="4"/>`
    case 'safetyHelmet':
      return `<path d="M36 46 Q36 18 60 18 Q84 18 84 46 Z" fill="#F2C14E"/><rect x="31" y="43" width="58" height="6" rx="3" fill="#D9A632"/><path d="M60 19 V44" stroke="#D9A632" stroke-width="4"/>`
    case 'minerLamp':
      return `<path d="M36 46 Q36 18 60 18 Q84 18 84 46 Z" fill="#E0705F"/><rect x="31" y="43" width="58" height="6" rx="3" fill="#B85646"/><circle cx="60" cy="32" r="7" fill="#FFF4C2" stroke="#B85646" stroke-width="2"/><path d="M60 25 L52 6 M60 25 L68 6" stroke="#FFF4C2" stroke-width="3" opacity=".55" stroke-linecap="round"/>`
    case 'scarf':
      return `<path d="M34 54 Q32 20 60 20 Q88 20 86 54 Q78 40 60 40 Q42 40 34 54 Z" fill="${ink.b}"/><circle cx="85" cy="56" r="5" fill="${ink.b}"/><path d="M86 58 L92 70 M84 60 L86 72" stroke="${ink.b}" stroke-width="4" stroke-linecap="round"/>`
    case 'beanie':
      return `<path d="M38 44 Q38 20 60 20 Q82 20 82 44 Z" fill="${ink.a}"/><rect x="36" y="38" width="48" height="10" rx="5" fill="#2E5888"/><circle cx="60" cy="18" r="6" fill="${ink.c}"/>`
    case 'hood':
      return `<path d="M30 70 Q28 18 60 18 Q92 18 90 70 L84 70 Q86 46 60 46 Q34 46 36 70 Z" fill="#F4F7FB"/><path d="M36 70 Q34 46 60 46 Q86 46 84 70" fill="none" stroke="#C9D2DE" stroke-width="2"/>`
    case 'chef':
      return `<path d="M40 44 Q34 28 46 26 Q48 14 60 16 Q72 14 74 26 Q86 28 80 44 Z" fill="#FFFFFF"/><rect x="40" y="40" width="40" height="8" rx="4" fill="#E9EEF5"/>`
    case 'headset':
      return `<path d="M34 58 Q34 20 60 20 Q86 20 86 58" fill="none" stroke="#45505F" stroke-width="5" stroke-linecap="round"/><rect x="27" y="52" width="12" height="16" rx="5" fill="#45505F"/><rect x="81" y="52" width="12" height="16" rx="5" fill="#45505F"/><path d="M33 68 Q36 80 48 80" stroke="#45505F" stroke-width="3" fill="none"/>`
    default:
      return ''
  }
}

/** 소품: 오른손 위치(약 x=92, y=82) 기준 */
export function propSvg(prop: Prop, ink: Ink = INK): string {
  const g = (inner: string) => `<g transform="translate(84 66)">${inner}</g>`
  switch (prop) {
    case 'basket':
      return g(`<path d="M2 12 H26 L22 28 H6 Z" fill="#C8955A"/><path d="M6 12 Q14 -2 22 12" fill="none" stroke="#A8743E" stroke-width="3"/><path d="M5 18 H23 M6 23 H22" stroke="#A8743E" stroke-width="2"/>`)
    case 'cherry':
      return g(`<path d="M14 2 Q12 10 8 16 M14 2 Q18 10 20 16" stroke="#5A8F4E" stroke-width="2.5" fill="none"/><circle cx="8" cy="20" r="6" fill="#D2463A"/><circle cx="20" cy="20" r="6" fill="#B8352B"/><circle cx="6" cy="18" r="1.6" fill="#fff" opacity=".7"/>`)
    case 'pod':
      return g(`<ellipse cx="14" cy="16" rx="9" ry="14" fill="#D9822B" transform="rotate(20 14 16)"/><path d="M10 4 Q8 16 12 28 M16 3 Q18 16 18 29" stroke="#B5651D" stroke-width="2" fill="none" transform="rotate(20 14 16)"/>`)
    case 'leaf':
      return g(`<path d="M4 28 Q2 6 26 2 Q26 26 4 28 Z" fill="#6DBA6A"/><path d="M4 28 L22 8" stroke="#4E9A4C" stroke-width="2"/>`)
    case 'wheat':
      return g(`<path d="M14 30 V4" stroke="#C99A3B" stroke-width="2.5"/>${[6, 12, 18].map((y) => `<ellipse cx="10" cy="${y}" rx="3.5" ry="5" fill="#E8B84E" transform="rotate(-25 10 ${y})"/><ellipse cx="18" cy="${y}" rx="3.5" ry="5" fill="#E8B84E" transform="rotate(25 18 ${y})"/>`).join('')}<ellipse cx="14" cy="2" rx="3" ry="4.5" fill="#E8B84E"/>`)
    case 'box':
      return g(`<rect x="2" y="6" width="26" height="22" rx="3" fill="#D3A06A"/><path d="M2 13 H28 M15 6 V13" stroke="#B07E48" stroke-width="2.5"/>`)
    case 'wrench':
      return g(`<path d="M6 28 L20 12" stroke="#8C9AAD" stroke-width="6" stroke-linecap="round"/><circle cx="22" cy="9" r="7" fill="#8C9AAD"/><circle cx="24" cy="7" r="3.5" fill="#fff"/>`)
    case 'pickaxe':
      return g(`<path d="M8 30 L20 6" stroke="#A8743E" stroke-width="4" stroke-linecap="round"/><path d="M6 6 Q20 -2 32 10" stroke="#7D8794" stroke-width="5" fill="none" stroke-linecap="round"/>`)
    case 'fish':
      return g(`<ellipse cx="14" cy="16" rx="12" ry="7" fill="#F28B6B"/><path d="M24 16 L32 9 V23 Z" fill="#F28B6B"/><circle cx="8" cy="14" r="1.8" fill="${ink.line}"/>`)
    case 'anchor':
      return g(`<circle cx="15" cy="5" r="4" fill="none" stroke="#45607F" stroke-width="3"/><path d="M15 9 V28 M8 14 H22" stroke="#45607F" stroke-width="3" stroke-linecap="round"/><path d="M4 20 Q6 30 15 29 Q24 30 26 20" fill="none" stroke="#45607F" stroke-width="3" stroke-linecap="round"/>`)
    case 'spool':
      return g(`<rect x="4" y="4" width="22" height="5" rx="2" fill="#B07E48"/><rect x="4" y="24" width="22" height="5" rx="2" fill="#B07E48"/><rect x="7" y="9" width="16" height="15" fill="${ink.b}"/><path d="M7 13 H23 M7 17 H23 M7 21 H23" stroke="#C2574A" stroke-width="1.5"/>`)
    case 'drop':
      return g(`<path d="M15 2 Q26 16 26 21 A11 11 0 0 1 4 21 Q4 16 15 2 Z" fill="#3A3A48"/><ellipse cx="11" cy="20" rx="2.5" ry="4" fill="#fff" opacity=".35"/>`)
    case 'clipboard':
      return g(`<rect x="3" y="4" width="24" height="28" rx="3" fill="#C8955A"/><rect x="7" y="9" width="16" height="20" fill="#fff"/><rect x="10" y="1" width="10" height="6" rx="2" fill="#7D8794"/><path d="M10 15 H20 M10 20 H20 M10 25 H16" stroke="#9AA6B6" stroke-width="2"/>`)
    case 'flask':
      return g(`<path d="M11 2 H19 V11 L27 27 Q28 30 25 30 H5 Q2 30 3 27 L11 11 Z" fill="#E9F3FF" stroke="#8C9AAD" stroke-width="1.5"/><path d="M6 22 H24 L26 27 Q27 29 24 29 H6 Q3 29 4 27 Z" fill="#7FC4B8"/>`)
    case 'chip':
      return g(`<rect x="6" y="6" width="20" height="20" rx="3" fill="#3D4A5C"/><rect x="11" y="11" width="10" height="10" rx="1.5" fill="#8C9AAD"/>${[10, 16, 22].map((v) => `<path d="M${v} 2 V6 M${v} 26 V30 M2 ${v} H6 M26 ${v} H30" stroke="#C9A24A" stroke-width="2"/>`).join('')}`)
    case 'cup':
      return g(`<path d="M4 8 H24 L21 30 H7 Z" fill="#FFFFFF" stroke="#C9D2DE" stroke-width="1.5"/><rect x="5" y="14" width="18" height="6" fill="#B5651D"/><path d="M24 12 Q31 13 30 19 Q29 23 23 22" fill="none" stroke="#C9D2DE" stroke-width="2.5"/><path d="M11 3 Q13 0 11 -3 M17 3 Q19 0 17 -3" stroke="#C9D2DE" stroke-width="1.8" fill="none" stroke-linecap="round"/>`)
    case 'gear':
      return g(`<circle cx="16" cy="16" r="10" fill="#8C9AAD"/>${[0, 45, 90, 135].map((r) => `<rect x="13" y="1" width="6" height="30" rx="2" fill="#8C9AAD" transform="rotate(${r} 16 16)"/>`).join('')}<circle cx="16" cy="16" r="4.5" fill="#fff"/>`)
    case 'banana':
      return g(`<path d="M4 6 Q2 26 26 28 Q30 28 28 24 Q10 22 10 6 Z" fill="#F7D84A"/><path d="M4 6 L8 2" stroke="#7A6A2A" stroke-width="3" stroke-linecap="round"/>`)
    case 'orange':
      return g(`<circle cx="15" cy="18" r="12" fill="#F39A2B"/><path d="M15 6 Q17 2 22 2" stroke="#5A8F4E" stroke-width="2.5" fill="none"/><ellipse cx="20" cy="4" rx="4" ry="2" fill="#6DBA6A"/><circle cx="11" cy="14" r="2" fill="#fff" opacity=".45"/>`)
    case 'magnifier':
      return g(`<circle cx="13" cy="13" r="9" fill="#E9F3FF" stroke="#45607F" stroke-width="3.5"/><path d="M20 20 L29 29" stroke="#45607F" stroke-width="4.5" stroke-linecap="round"/>`)
    case 'phone':
      return g(`<rect x="7" y="2" width="17" height="28" rx="4" fill="#2E3440"/><rect x="9.5" y="6" width="12" height="19" rx="1.5" fill="#7FB2E5"/><circle cx="15.5" cy="27.5" r="1.3" fill="#8C9AAD"/>`)
    case 'recycle':
      return g(`<circle cx="15" cy="16" r="11" fill="none" stroke="#4E9A4C" stroke-width="4" stroke-dasharray="17 6"/><path d="M24 6 L27 12 L20 12 Z" fill="#4E9A4C"/>`)
    case 'seed':
      return g(`<ellipse cx="15" cy="22" rx="8" ry="6" fill="#B5823F"/><path d="M15 17 Q14 8 8 5 M15 13 Q18 6 25 6" stroke="#5A8F4E" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="9" cy="6" rx="4" ry="2.5" fill="#6DBA6A"/><ellipse cx="23" cy="6" rx="4" ry="2.5" fill="#6DBA6A"/>`)
    case 'crane':
      return g(`<path d="M15 0 V18" stroke="#45607F" stroke-width="2"/><path d="M15 18 Q15 26 9 26 Q5 26 5 21" fill="none" stroke="#45607F" stroke-width="3.5" stroke-linecap="round"/><rect x="18" y="14" width="13" height="14" rx="2" fill="${ink.b}"/>`)
    default:
      return ''
  }
}

export interface CharacterOpts {
  hat: Hat
  prop: Prop
  body: string
  locked?: boolean
}

/** 귀여운 콩 캐릭터 SVG 문자열 (viewBox 0 0 120 120) */
export function characterSvg({ hat, prop, body, locked }: CharacterOpts): string {
  if (locked) {
    const s = '#2A3F5C'
    const ink: Ink = { a: s, b: s, c: s, line: s }
    const flat = (svg: string) => svg.replace(/fill="[^"]*"/g, `fill="${s}"`).replace(/stroke="[^"]*"/g, `stroke="${s}"`)
    return `<ellipse cx="60" cy="110" rx="26" ry="5" fill="#000" opacity=".18"/>`
      + `<rect x="30" y="34" width="60" height="72" rx="30" fill="${s}"/>`
      + flat(hatSvg(hat, ink)) + flat(propSvg(prop, ink))
      + `<text x="60" y="80" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="22" fill="#5A6F8E">?</text>`
  }
  const shade = 'rgba(0,0,0,.08)'
  return [
    `<ellipse cx="60" cy="110" rx="26" ry="5" fill="#000" opacity=".18"/>`,
    // 발
    `<ellipse cx="48" cy="104" rx="9" ry="6" fill="${body}" stroke="${shade}" stroke-width="2"/>`,
    `<ellipse cx="72" cy="104" rx="9" ry="6" fill="${body}" stroke="${shade}" stroke-width="2"/>`,
    // 몸통
    `<rect x="30" y="34" width="60" height="70" rx="30" fill="${body}"/>`,
    `<path d="M34 84 Q60 104 86 84 V86 Q86 104 60 104 Q34 104 34 86 Z" fill="${shade}"/>`,
    // 왼팔
    `<ellipse cx="29" cy="78" rx="7" ry="10" fill="${body}" stroke="${shade}" stroke-width="2" transform="rotate(20 29 78)"/>`,
    hatSvg(hat),
    // 얼굴
    `<ellipse cx="50" cy="64" rx="3.4" ry="4.4" fill="#2A2A35"/>`,
    `<ellipse cx="70" cy="64" rx="3.4" ry="4.4" fill="#2A2A35"/>`,
    `<circle cx="51.2" cy="62.4" r="1.2" fill="#fff"/>`,
    `<circle cx="71.2" cy="62.4" r="1.2" fill="#fff"/>`,
    `<ellipse cx="43" cy="73" rx="5" ry="3" fill="#FF8A8A" opacity=".45"/>`,
    `<ellipse cx="77" cy="73" rx="5" ry="3" fill="#FF8A8A" opacity=".45"/>`,
    `<path d="M55 72 Q60 77 65 72" stroke="#2A2A35" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    propSvg(prop),
    // 오른팔(소품을 잡은 손)
    `<ellipse cx="90" cy="82" rx="7" ry="7" fill="${body}" stroke="${shade}" stroke-width="2"/>`,
  ].join('')
}
