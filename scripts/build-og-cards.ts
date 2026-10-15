/*
 * 링크 미리보기(OG) 이미지 1200×630을 resvg로 그린다 (Chrome이 없어도 된다).
 *   public/og/village.png      마을 초대 링크 공통 한 장
 *   public/og/person-{id}.png  사람 카드 소개 (캐릭터 파츠 조합 + 이름 + 하는 일)
 * 글꼴은 scripts/fonts의 Pretendard 고정 굵기 OTF(Regular·Bold, SIL OFL 1.1, LICENSE.txt)만 쓴다. 시스템 글꼴은 읽지 않아
 * 어느 컴퓨터에서 돌려도 같은 그림이 나온다. 사람·지도·캐릭터를 바꾸면 다시 돌리고 PNG를 함께 커밋한다.
 *   npx tsx scripts/build-og-cards.ts [village|people]   (npm run build:og-cards)
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { BODY_COLORS, assembleCharacter, cleanPart } from '../shared/character-svg'
import { PEOPLE, PEOPLE_LIST } from '../shared/data/people'
import { PLACES } from '../shared/data/places'
import type { Person } from '../shared/types'
import { FLOWER_COLORS } from '../shared/visit'

export const W = 1200
export const H = 630
const OUT = 'public/og'
const STANDING_VIEWBOX = '36 30 440 597'
const FONT = 'Pretendard'
const FONT_FILES = ['scripts/fonts/Pretendard-Regular.otf', 'scripts/fonts/Pretendard-Bold.otf']
const INK = '#F3F1EA'
const LINE = '#2A2A35'

const PARTS: Record<string, string> = {}
for (const f of readdirSync('app/assets/character').filter((f) => f.endsWith('.svg'))) {
  PARTS[f.slice(0, -4)] = cleanPart(readFileSync(join('app/assets/character', f), 'utf8'))
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 캐릭터 한 명을 (x, y) 발끝에 높이 h로 세운다 */
function character(p: Person, x: number, y: number, h: number, wave = false): string {
  const w = Math.round((h * 440) / 597)
  const skin = BODY_COLORS[PLACES[p.placeId]?.continent ?? 'korea']
  // resvg는 CSS 변수를 모르니 --skin 자리에 색을 바로 넣는다
  const body = assembleCharacter((n) => PARTS[n] ?? '', p, { wave }).replace(/var\(--skin,\s*#[0-9A-Fa-f]{3,6}\)/g, skin)
  return `<svg x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" viewBox="${STANDING_VIEWBOX}">${body}</svg>`
}

function flower(cx: number, cy: number, color: string, r = 14): string {
  const petals = [0, 72, 144, 216, 288].map((deg) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `<circle cx="${cx + Math.cos(a) * r * 0.9}" cy="${cy + Math.sin(a) * r * 0.9}" r="${r * 0.75}" fill="${color}" stroke="${LINE}" stroke-width="3"/>`
  })
  return `${petals.join('')}<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="#F2C14E" stroke="${LINE}" stroke-width="3"/>`
}

function render(svg: string, file: string) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: FONT } }).render().asPng()
  writeFileSync(join(OUT, file), png)
  return png.length
}

/**
 * 마을 지도의 한쪽을 PNG로. resvg는 지도를 안쪽 <svg>로 넣거나 1배보다 크게 그리면 멈춰서(geom.rs unwrap)
 * 바깥 viewBox만 1:1 크기로 바꿔 따로 그린 뒤 <image>로 넣는다
 */
function mapCrop(viewBox: string): string {
  const svg = readFileSync('public/village/map.svg', 'utf8').replace(/<svg[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${W}" height="${H}">`)
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`
}

/** 마을 초대 공통 이미지: 마을 지도 한쪽 + 주민 셋과 꽃 + 제목 */
function villageCard(): string {
  const crew = ['coffee-picker', 'busan-crane', 'barista'].map((id) => PEOPLE[id]!)
  const spots: Array<[number, number]> = [[760, 520], [920, 560], [1080, 520]]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<image x="0" y="0" width="${W}" height="${H}" href="${mapCrop('150 1150 1200 630')}"/>
<rect width="${W}" height="${H}" fill="#0F1B2D" opacity=".35"/>
<rect x="56" y="64" width="560" height="300" rx="32" fill="#0F1B2D" opacity=".9"/>
<text x="96" y="132" font-family="${FONT}" font-size="30" font-weight="700" fill="#F2C14E">내 하루에 닿은 사람들</text>
<text x="96" y="214" font-family="${FONT}" font-size="64" font-weight="700" fill="${INK}">친구의 마을에</text>
<text x="96" y="294" font-family="${FONT}" font-size="64" font-weight="700" fill="${INK}">놀러 오세요</text>
<text x="96" y="340" font-family="${FONT}" font-size="26" fill="#C9CFD9">주민에게 고마워요를 남기면 꽃이 피어요</text>
${crew.map((p, i) => character(p, spots[i]![0], spots[i]![1], 300, i === 1)).join('')}
${crew.map((p, i) => flower(spots[i]![0] - 70, spots[i]![1] - 8, FLOWER_COLORS[p.zone])).join('')}
</svg>`
}

/** 사람 카드 소개: 손 흔드는 캐릭터 + 이름 + 하는 일 + 사는 곳 */
function personCard(p: Person): string {
  const place = PLACES[p.placeId]
  const where = !place ? '' : place.continent === 'korea' || !place.country || place.name.includes(place.country) ? place.name : `${place.country} ${place.name}`
  const name = p.name ?? p.job
  const nameSize = name.length > 8 ? 60 : 84
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#0F1B2D"/>
<circle cx="900" cy="330" r="250" fill="#F3F1EA"/>
<ellipse cx="900" cy="560" rx="170" ry="22" fill="#000" opacity=".12"/>
${character(p, 900, 580, 470, true)}
<text x="80" y="118" font-family="${FONT}" font-size="30" font-weight="700" fill="#F2C14E">내 하루에 닿은 사람들</text>
<text x="80" y="196" font-family="${FONT}" font-size="34" fill="#C9CFD9">이 분을 소개해요</text>
<text x="80" y="${196 + 30 + nameSize}" font-family="${FONT}" font-size="${nameSize}" font-weight="700" fill="${INK}">${esc(name)}</text>
<text x="80" y="${196 + 90 + nameSize}" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}">${esc(p.name ? p.job : '')}</text>
<text x="80" y="${196 + 140 + nameSize}" font-family="${FONT}" font-size="28" fill="#C9CFD9">${esc(where)}</text>
</svg>`
}

const which = process.argv[2] ?? 'all'
if (which === 'all' || which === 'village') console.log(`${OUT}/village.png ${render(villageCard(), 'village.png')} bytes`)
if (which === 'all' || which === 'people') {
  let bytes = 0
  for (const p of PEOPLE_LIST) bytes += render(personCard(p), `person-${p.id}.png`)
  console.log(`${OUT}/person-*.png ${PEOPLE_LIST.length}장, 모두 ${Math.round(bytes / 1024)}KB`)
}
