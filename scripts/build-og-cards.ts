/*
 * 오늘의 실 링크 공통 미리보기(OG) 이미지 public/og/thread.png 1080×1350을 resvg로 그린다 (Chrome이 없어도 된다).
 * 링크를 만든 기기가 카드 그림을 못 올렸을 때 쓴다.
 * 글꼴은 scripts/fonts의 Pretendard 고정 굵기 OTF(Regular·Bold, SIL OFL 1.1, LICENSE.txt)만 쓴다. 시스템 글꼴은 읽지 않아
 * 어느 컴퓨터에서 돌려도 같은 그림이 나온다.
 *   npx tsx scripts/build-og-cards.ts   (npm run build:og-cards)
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const OUT = 'public/og'
const FONT = 'Pretendard'
const FONT_FILES = ['scripts/fonts/Pretendard-Regular.otf', 'scripts/fonts/Pretendard-Bold.otf']

function render(svg: string, file: string, width: number) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: FONT } }).render().asPng()
  writeFileSync(join(OUT, file), png)
  return png.length
}

/** 오늘의 실 공통 카드: 새 기획의 흰 바탕, 매듭 진 실 (docs/redesign/mockups/V2Quote) */
function threadCard(): string {
  const KNOT = 'M0 20 C 200 20, 380 20, 432 20 C 446 20, 456 4, 452 2 C 444 0, 436 16, 452 24 C 470 32, 462 40, 452 36 C 444 33, 456 20, 472 20 C 560 20, 760 20, 904 20'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<rect width="1080" height="1350" fill="#FFFFFF"/>
<text x="88" y="300" font-family="${FONT}" font-size="34" fill="#6B7079">오늘, 지구 반대편에도</text>
<text x="88" y="420" font-family="${FONT}" font-size="76" font-weight="700" fill="#14161A">당신 같은 하루를</text>
<text x="88" y="520" font-family="${FONT}" font-size="76" font-weight="700" fill="#14161A">보낸 사람이 있어요</text>
<text x="88" y="640" font-family="${FONT}" font-size="38" fill="#2A2D33">당신의 오늘은 어땠어요?</text>
<g transform="translate(88 1150)"><path d="${KNOT}" fill="none" stroke="#E0528A" stroke-width="4" stroke-linecap="round"/></g>
<text x="992" y="1250" font-family="${FONT}" font-size="30" font-weight="700" fill="#14161A" text-anchor="end">내 하루에 닿은 사람들</text>
</svg>`
}

console.log(`${OUT}/thread.png ${render(threadCard(), 'thread.png', 1080)} bytes`)
