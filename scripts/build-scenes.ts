/**
 * 장면 그림 줄이기: art/scenes/{id}.(png|jpg|jpeg|webp) → public/scenes/{id}.webp, 가로 1200px 이하(작으면 키우지 않음).
 * npm run scenes            art/scenes 안의 그림 모두
 * npm run scenes -- a.png   파일을 직접 (이름이 장면 id가 된다)
 * shared/data/scenes.ts에 없는 id는 경고만 한다(먼저 그림을 넣고 목록에 더해도 되게).
 */
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import sharp from 'sharp'
import { SCENES } from '../shared/data/scenes'

const MAX_W = 1200
const QUALITY = 82
const SRC_DIR = resolve('art/scenes')
const OUT_DIR = resolve('public/scenes')
const EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const args = process.argv.slice(2)
const files = args.length
  ? args.map((a) => resolve(a))
  : existsSync(SRC_DIR)
    ? readdirSync(SRC_DIR).filter((f) => EXT.has(extname(f).toLowerCase())).map((f) => join(SRC_DIR, f))
    : []

if (!files.length) {
  console.log(`줄일 그림이 없어요. ${SRC_DIR}에 {장면 id}.png 같은 이름으로 넣어 주세요.`)
  process.exit(0)
}

mkdirSync(OUT_DIR, { recursive: true })
let failed = 0
for (const file of files) {
  const id = basename(file, extname(file))
  if (!EXT.has(extname(file).toLowerCase())) {
    console.error(`${file}: png·jpg·webp만 돼요`)
    failed++
    continue
  }
  const out = join(OUT_DIR, `${id}.webp`)
  const meta = await sharp(file).metadata()
  const info = await sharp(file).rotate().resize({ width: MAX_W, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out)
  const kb = (n: number) => `${Math.round(n / 1024)}KB`
  const ratio = info.width / info.height
  console.log(`${id}: ${meta.width}×${meta.height} ${kb(statSync(file).size)} → ${info.width}×${info.height} ${kb(info.size)}`)
  if (Math.abs(ratio - 4 / 3) > 0.02) console.warn(`  ${id}: 4:3이 아니에요 (${ratio.toFixed(2)}). 하늘 영역에서 가운데를 기준으로 잘려요`)
  if (!SCENES[id]) console.warn(`  ${id}: shared/data/scenes.ts의 SCENES에 아직 없어요`)
}
process.exit(failed ? 1 : 0)
