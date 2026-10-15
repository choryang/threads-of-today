/*
 * 마을 지도 한눈에 보기 PNG: public/village/map.svg(2800×4200)를 반 크기 1400×2100 한 장으로 미리 그린다.
 * 지도 화면은 이 PNG를 SVG 아래에 같은 크기로 깔고, 많이 축소했을 때(배율 0.3 미만)는 PNG만 보여 준다.
 * 큰 SVG 한 장을 크게 축소하면 휴대폰 브라우저가 타일을 다 그리지 못해 섬 일부가 빈칸으로 남기 때문이다.
 * 도구는 OG 이미지와 같은 resvg. 지도에 붙은 출처 메타데이터(<metadata>, c2pa)는 resvg가 읽지 못해 뺀다.
 * 지도를 다시 그리면(python scripts/gen_map2.py) 이것도 다시 돌리고 PNG를 함께 커밋한다.
 *   npx tsx scripts/build-map-overview.ts   (npm run build:map-overview)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { MAP_H, MAP_W } from '../shared/data/village'

const OUT = 'public/village/map-overview.png'
const WIDTH = MAP_W / 2

const svg = readFileSync('public/village/map.svg', 'utf8').replace(/<metadata>[\s\S]*?<\/metadata>/g, '').replace(/\sxmlns:c2pa="[^"]*"/, '')
const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render()
writeFileSync(OUT, png.asPng())
console.log(`${OUT} ${png.width}×${png.height} (지도 ${MAP_W}×${MAP_H}의 절반), ${Math.round(readFileSync(OUT).length / 1024)}KB`)
