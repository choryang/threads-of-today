/**
 * 대표 물건 아이콘 (viewBox 0 0 32 32). 캐릭터 소품(character.ts propSvg)과 같은 색·선 굵기로 그린다.
 * 대표 물건을 추가했는데 아이콘이 없으면 상자 모양으로 보인다.
 */
const L = '#2A2A35'
const PAPER = '#FFFFFF'

const bowl = (fill: string, top: string) =>
  `<path d="M3 15 H29 Q28 27 16 27 Q4 27 3 15 Z" fill="${fill}"/><ellipse cx="16" cy="15" rx="13" ry="3" fill="${top}"/>`
const can = (body: string, band: string) =>
  `<rect x="8" y="4" width="16" height="25" rx="3" fill="${body}"/><rect x="9" y="3" width="14" height="3" rx="1.5" fill="#C9D2DE"/><rect x="8" y="12" width="16" height="8" fill="${band}"/>`
const cup = (liquid: string, lid?: string) =>
  `<path d="M7 8 H25 L22 30 H10 Z" fill="${PAPER}" opacity=".9" stroke="#C9D2DE" stroke-width="1.5"/><path d="M8 13 H24 L22 29 H10 Z" fill="${liquid}"/>${lid ? `<rect x="6" y="5" width="20" height="4" rx="2" fill="${lid}"/>` : ''}`

const ICONS: Record<string, string> = {
  americano: `${cup('#5A3A22', '#E9EEF5')}<rect x="11" y="15" width="4" height="4" rx="1" fill="#E9F3FF" opacity=".7"/><rect x="16" y="19" width="4" height="4" rx="1" fill="#E9F3FF" opacity=".7"/><path d="M18 5 L21 0" stroke="#3B6EA8" stroke-width="2" stroke-linecap="round"/>`,
  latte: `<path d="M5 10 H25 L22 28 H8 Z" fill="${PAPER}" stroke="#C9D2DE" stroke-width="1.5"/><ellipse cx="15" cy="11" rx="9.5" ry="2.5" fill="#D9B38C"/><path d="M15 9 Q12 11 15 13 Q18 11 15 9" fill="${PAPER}"/><path d="M25 13 Q31 14 30 19 Q29 23 23 22" fill="none" stroke="#C9D2DE" stroke-width="2.5"/>`,
  'choco-bar': `<rect x="6" y="4" width="20" height="24" rx="2" fill="#6B3E26"/><path d="M6 12 H26 M6 20 H26 M16 4 V28" stroke="#4E2A18" stroke-width="2"/><path d="M6 22 L26 14 V28 H6 Z" fill="#E0705F"/>`,
  ramen: `${bowl('#E0705F', '#F2D27E')}<path d="M8 15 Q10 12 12 15 T16 15 T20 15 T24 15" fill="none" stroke="#E8B84E" stroke-width="2"/><path d="M19 2 L23 15 M23 2 L26 14" stroke="#A8743E" stroke-width="2" stroke-linecap="round"/>`,
  samgak: `<path d="M16 4 L29 27 H3 Z" fill="${PAPER}" stroke="#E9EEF5" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 27 L12 17 H20 L23 27 Z" fill="#2E3B2E"/><path d="M12 10 L20 10" stroke="#E0705F" stroke-width="2"/>`,
  smartphone: `<rect x="8" y="2" width="16" height="28" rx="4" fill="#2E3440"/><rect x="10.5" y="6" width="11" height="19" rx="1.5" fill="#7FB2E5"/><circle cx="16" cy="27.5" r="1.3" fill="#8C9AAD"/>`,
  tshirt: `<path d="M11 4 L4 8 L6 14 L9 13 V28 H23 V13 L26 14 L28 8 L21 4 Q16 8 11 4 Z" fill="#3B6EA8"/><path d="M12 4 Q16 7 20 4" fill="none" stroke="#2E5888" stroke-width="2"/>`,
  sneakers: `<path d="M3 21 V12 Q3 10 6 10 L12 11 Q14 16 20 16 L27 18 Q30 19 30 22 V23 H3 Z" fill="#E0705F"/><rect x="2" y="23" width="29" height="4" rx="2" fill="#E9EEF5"/><path d="M9 13 L11 16 M12 13 L14 16" stroke="${PAPER}" stroke-width="1.6"/>`,
  banana: `<path d="M5 6 Q3 26 27 28 Q31 28 29 24 Q11 22 11 6 Z" fill="#F7D84A"/><path d="M5 6 L9 2" stroke="#7A6A2A" stroke-width="3" stroke-linecap="round"/>`,
  'salmon-sushi': `<rect x="5" y="16" width="22" height="10" rx="5" fill="${PAPER}" stroke="#E9EEF5" stroke-width="1.5"/><path d="M3 15 Q16 6 29 15 Q29 19 26 19 H6 Q3 19 3 15 Z" fill="#F28B6B"/><path d="M10 11 L12 18 M16 9 L17 18 M22 11 L21 18" stroke="#FFC9A8" stroke-width="1.5"/>`,
  cola: can('#D2463A', '#FFFFFF') + `<path d="M10 16 Q16 13 22 17" stroke="#D2463A" stroke-width="1.8" fill="none"/>`,
  oj: `<path d="M8 6 H22 V28 Q22 30 20 30 H10 Q8 30 8 28 Z" fill="#E9F3FF"/><path d="M8 11 H22 V28 Q22 30 20 30 H10 Q8 30 8 28 Z" fill="#F39A2B"/><circle cx="23" cy="8" r="6" fill="#F7B04E"/><path d="M23 4 V12 M19 8 H27" stroke="#FFE08A" stroke-width="1.4"/>`,
  tofu: `<path d="M4 12 L16 7 L28 12 L16 17 Z" fill="${PAPER}"/><path d="M4 12 V22 L16 27 V17 Z" fill="#E9E3D3"/><path d="M28 12 V22 L16 27 V17 Z" fill="#D9D1BC"/>`,
  bicycle: `<circle cx="8" cy="21" r="6" fill="none" stroke="#45607F" stroke-width="2.5"/><circle cx="24" cy="21" r="6" fill="none" stroke="#45607F" stroke-width="2.5"/><path d="M8 21 L13 12 H22 L24 21 M13 12 L16 21 L22 12 M11 9 H16 M22 12 L21 7 H25" fill="none" stroke="#E0705F" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`,
  notebook: `<rect x="7" y="3" width="19" height="26" rx="2" fill="#3B6EA8"/><rect x="5" y="3" width="4" height="26" rx="1" fill="#2E5888"/><rect x="12" y="8" width="10" height="5" rx="1" fill="${PAPER}"/>`,
  'tuna-can': `<ellipse cx="16" cy="22" rx="13" ry="5" fill="#8C9AAD"/><rect x="3" y="13" width="26" height="9" fill="#3B6EA8"/><ellipse cx="16" cy="13" rx="13" ry="5" fill="#C9D2DE"/><ellipse cx="16" cy="13" rx="10" ry="3.4" fill="#E9EEF5"/><path d="M8 18 Q12 15 16 18 L18 16 V20 L16 18" fill="#F28B6B"/>`,
  'banana-milk': `<path d="M11 3 H21 V8 Q27 11 27 18 V27 Q27 30 24 30 H8 Q5 30 5 27 V18 Q5 11 11 8 Z" fill="#F7D84A"/><rect x="11" y="2" width="10" height="4" rx="1.5" fill="#3B6EA8"/><path d="M9 20 Q16 25 23 19" stroke="#E0B82E" stroke-width="2" fill="none"/>`,
  earbuds: `<rect x="5" y="12" width="22" height="16" rx="7" fill="${PAPER}" stroke="#C9D2DE" stroke-width="1.5"/><path d="M5 18 H27" stroke="#C9D2DE" stroke-width="1.5"/><circle cx="11" cy="7" r="4" fill="${PAPER}" stroke="#C9D2DE" stroke-width="1.5"/><circle cx="21" cy="7" r="4" fill="${PAPER}" stroke="#C9D2DE" stroke-width="1.5"/>`,
  kimchi: `<path d="M6 26 Q2 14 10 6 Q16 2 20 8 Q28 12 26 22 Q24 28 16 28 Q9 28 6 26 Z" fill="#E0705F"/><path d="M10 8 Q14 16 12 26 M19 8 Q19 18 22 25" stroke="#F7D0A0" stroke-width="2.2" fill="none"/><path d="M20 8 Q24 4 28 6" stroke="#6DBA6A" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  'kimchi-stew': `<path d="M4 13 H28 V22 Q28 28 22 28 H10 Q4 28 4 22 Z" fill="#45505F"/><rect x="1" y="14" width="4" height="3" rx="1.5" fill="#45505F"/><rect x="27" y="14" width="4" height="3" rx="1.5" fill="#45505F"/><ellipse cx="16" cy="13" rx="12" ry="3" fill="#D2463A"/><path d="M11 3 Q13 6 11 9 M17 2 Q19 5 17 8 M22 4 Q24 7 22 9" stroke="#C9D2DE" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  'fried-chicken': `<path d="M8 22 Q2 14 8 8 Q14 3 20 8 Q24 12 21 18 Z" fill="#D9822B"/><circle cx="10" cy="11" r="1.6" fill="#F2B04E"/><circle cx="15" cy="9" r="1.4" fill="#F2B04E"/><circle cx="13" cy="15" r="1.4" fill="#F2B04E"/><path d="M19 19 L27 27" stroke="#F4F0E6" stroke-width="3.5" stroke-linecap="round"/><circle cx="28" cy="26" r="2.2" fill="#F4F0E6"/><circle cx="26" cy="28.5" r="2.2" fill="#F4F0E6"/>`,
  samgyeopsal: `<rect x="3" y="9" width="26" height="15" rx="3" fill="#F9B9C9"/><path d="M3 14 H29 M3 19 H29" stroke="${PAPER}" stroke-width="2.5"/><path d="M8 27 L11 24 M16 28 L18 24" stroke="#45505F" stroke-width="2" stroke-linecap="round"/>`,
  burger: `<path d="M4 14 Q4 4 16 4 Q28 4 28 14 Z" fill="#E8B84E"/><rect x="3" y="14" width="26" height="3" rx="1.5" fill="#6DBA6A"/><rect x="4" y="17" width="24" height="4" rx="2" fill="#6B3E26"/><path d="M4 21 H28 V24 Q28 28 24 28 H8 Q4 28 4 24 Z" fill="#E8B84E"/><circle cx="11" cy="8" r="1" fill="${PAPER}"/><circle cx="18" cy="7" r="1" fill="${PAPER}"/>`,
  'shrimp-snack': `<path d="M8 3 H24 L26 29 H6 Z" fill="#E0705F"/><path d="M8 3 L10 6 L12 3 L14 6 L16 3 L18 6 L20 3 L22 6 L24 3" fill="#B85646"/><path d="M11 20 Q10 12 18 12 Q22 13 21 17 Q19 15 16 16 Q14 18 16 21 Z" fill="#F7B04E"/>`,
  popcorn: `<path d="M7 13 H25 L22 30 H10 Z" fill="${PAPER}"/><path d="M11 13 L12 30 M16 13 V30 M21 13 L20 30" stroke="#E0705F" stroke-width="2.5"/><circle cx="10" cy="11" r="4" fill="#FFF4C2"/><circle cx="16" cy="9" r="4.5" fill="#FFF4C2"/><circle cx="22" cy="11" r="4" fill="#FFF4C2"/><circle cx="13" cy="6" r="3" fill="#FFE08A"/><circle cx="19" cy="5" r="3" fill="#FFF4C2"/>`,
  desk: `<rect x="2" y="9" width="28" height="4" rx="1" fill="#C8955A"/><rect x="4" y="13" width="3" height="15" fill="#A8743E"/><rect x="25" y="13" width="3" height="15" fill="#A8743E"/><rect x="15" y="13" width="10" height="8" fill="#B07E48"/><path d="M18 17 H22" stroke="#E8C46A" stroke-width="1.8"/>`,
  chopsticks: `<path d="M8 29 L19 3 M13 29 L22 3" stroke="#D3A06A" stroke-width="3" stroke-linecap="round"/><rect x="10" y="12" width="12" height="4" rx="1" fill="#E0705F" transform="rotate(-20 16 14)"/>`,
  soju: `<path d="M13 2 H19 V9 Q24 12 24 17 V28 Q24 30 22 30 H10 Q8 30 8 28 V17 Q8 12 13 9 Z" fill="#6DBA6A" opacity=".9"/><rect x="13" y="1" width="6" height="3" rx="1" fill="#4E9A4C"/><rect x="8" y="18" width="16" height="8" fill="${PAPER}"/><path d="M12 22 H20" stroke="#4E9A4C" stroke-width="1.8"/>`,
  'green-tea': `<path d="M5 13 H24 Q24 27 15 27 Q5 27 5 13 Z" fill="${PAPER}" stroke="#C9D2DE" stroke-width="1.5"/><ellipse cx="14.5" cy="13" rx="9.5" ry="2.5" fill="#9FCF7A"/><path d="M14 13 L22 3" stroke="#8C9AAD" stroke-width="1.2"/><rect x="20" y="1" width="6" height="5" rx="1" fill="#6DBA6A"/>`,
  omurice: `<ellipse cx="16" cy="23" rx="14" ry="5" fill="${PAPER}" stroke="#E9EEF5" stroke-width="1.5"/><path d="M5 22 Q5 9 16 9 Q27 9 27 22 Z" fill="#F7D84A"/><path d="M9 15 Q12 13 15 15 T21 15 T25 16" stroke="#D2463A" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  bungeoppang: `<path d="M3 16 Q8 7 18 8 Q24 9 25 14 L30 9 V23 L25 18 Q24 23 18 24 Q8 25 3 16 Z" fill="#D9822B"/><circle cx="8" cy="14" r="1.6" fill="${L}"/><path d="M13 12 Q15 16 13 20 M17 11 Q19 16 17 21" stroke="#B5651D" stroke-width="1.6" fill="none"/>`,
  makguksu: `${bowl('#B9D4F5', '#E9F3FF')}<path d="M7 15 Q10 13 13 15 T19 15 T25 15" fill="none" stroke="#8A7A6A" stroke-width="2"/><circle cx="16" cy="11" r="3.5" fill="#D2463A"/><path d="M11 8 L18 9" stroke="#6DBA6A" stroke-width="2" stroke-linecap="round"/>`,
  'potato-chips': `<path d="M7 3 H25 L27 29 H5 Z" fill="#F2C14E"/><path d="M7 3 L9 6 L11 3 L13 6 L15 3 L17 6 L19 3 L21 6 L23 3 L25 6" fill="#D9A632"/><ellipse cx="16" cy="18" rx="7" ry="5" fill="#FFE08A" transform="rotate(-15 16 18)"/><path d="M11 18 Q16 15 21 17" stroke="#E8B84E" stroke-width="1.4" fill="none"/>`,
  'roast-sweet-potato': `<path d="M4 18 Q3 9 14 8 Q26 7 29 14 Q30 22 18 24 Q6 26 4 18 Z" fill="#8E3F5A"/><path d="M15 9 Q24 9 27 15 Q22 21 15 20 Q11 14 15 9 Z" fill="#F2B04E"/><path d="M18 4 Q20 2 18 0 M23 5 Q25 3 23 1" stroke="#C9D2DE" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  kkakdugi: `<rect x="3" y="12" width="11" height="11" rx="2" fill="#F28B6B" transform="rotate(-8 8 17)"/><rect x="16" y="9" width="12" height="12" rx="2" fill="#E0705F" transform="rotate(10 22 15)"/><rect x="10" y="18" width="11" height="11" rx="2" fill="#D2463A"/><circle cx="7" cy="16" r="1" fill="#FFC9A8"/><circle cx="22" cy="13" r="1" fill="#FFC9A8"/>`,
  apple: `<path d="M16 9 Q10 5 6 10 Q2 17 7 25 Q11 30 16 27 Q21 30 25 25 Q30 17 26 10 Q22 5 16 9 Z" fill="#D2463A"/><path d="M16 9 Q16 5 18 2" stroke="#7A6A2A" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="21" cy="5" rx="4" ry="2" fill="#6DBA6A"/><circle cx="10" cy="14" r="2" fill="${PAPER}" opacity=".45"/>`,
  grape: `<path d="M16 6 Q16 2 19 1" stroke="#7A6A2A" stroke-width="2" fill="none"/>${[[10, 9], [16, 9], [22, 9], [13, 15], [19, 15], [10, 20], [22, 20], [16, 21], [13, 26], [19, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#8B6CC7"/>`).join('')}<ellipse cx="22" cy="5" rx="4" ry="2" fill="#6DBA6A"/>`,
  ketchup: `<path d="M12 2 H20 L21 8 Q26 10 26 16 V27 Q26 30 23 30 H9 Q6 30 6 27 V16 Q6 10 11 8 Z" fill="#D2463A"/><rect x="12" y="1" width="8" height="5" rx="1.5" fill="${PAPER}"/><circle cx="16" cy="20" r="5" fill="${PAPER}"/><circle cx="16" cy="20" r="3" fill="#E0705F"/>`,
  'barley-tea': `<path d="M12 2 H20 V7 Q24 9 24 14 V28 Q24 30 22 30 H10 Q8 30 8 28 V14 Q8 9 12 7 Z" fill="#E9F3FF" opacity=".9"/><path d="M8 14 H24 V28 Q24 30 22 30 H10 Q8 30 8 28 Z" fill="#C8955A"/><rect x="12" y="1" width="8" height="4" rx="1.5" fill="#E8B84E"/>`,
  soba: `<rect x="3" y="20" width="26" height="6" rx="1" fill="#45505F"/><path d="M3 20 H29" stroke="#2E3440" stroke-width="2"/><path d="M6 19 Q9 14 12 19 T18 19 T24 19 T28 18" fill="none" stroke="#8A7A6A" stroke-width="2.5"/><ellipse cx="16" cy="10" rx="7" ry="3" fill="#3B6EA8"/><path d="M9 10 Q9 15 16 15 Q23 15 23 10" fill="#3B6EA8"/>`,
  beer: can('#E8B84E', '#FFFFFF') + `<circle cx="16" cy="16" r="2.4" fill="#E8B84E"/>`,
  'squid-stir-fry': `<ellipse cx="16" cy="22" rx="14" ry="6" fill="${PAPER}" stroke="#E9EEF5" stroke-width="1.5"/><path d="M5 21 Q16 12 27 21 Q16 27 5 21 Z" fill="#D2463A"/><path d="M10 19 Q12 16 14 19 M17 18 Q19 15 21 18" stroke="#F7D0A0" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M8 13 L11 17" stroke="#6DBA6A" stroke-width="2.5" stroke-linecap="round"/>`,
}

const FALLBACK = `<rect x="4" y="8" width="24" height="20" rx="3" fill="#D3A06A"/><path d="M4 14 H28 M16 8 V14" stroke="#B07E48" stroke-width="2.5"/>`

/** 물건 아이콘 SVG 문자열 */
export function productIconSvg(productId: string): string {
  return ICONS[productId] ?? FALLBACK
}
