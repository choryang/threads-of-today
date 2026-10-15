/*
 * 공유 링크 미리보기(OG) 이미지: 나의 하루 유형 9장(1200×630)을 public/og/day-{유형}.png로 미리 만든다.
 * 유형 이름·설명·배경색·대표 주민은 shared/day-type.ts, 캐릭터는 앱과 같은 조립(shared/character-svg.ts).
 * 그림은 이 컴퓨터의 Chrome(또는 Edge)을 화면 없이 띄워 찍는다. 글꼴은 앱과 같은 Google Fonts.
 *   npx tsx scripts/build-og.ts            (CHROME_PATH로 브라우저 경로를 정할 수 있다)
 * 유형 이름·설명·색이나 캐릭터를 바꾸면 다시 돌리고 PNG를 함께 커밋한다.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { BODY_COLORS, assembleCharacter, cleanPart } from '../shared/character-svg'
import { PEOPLE } from '../shared/data/people'
import { PLACES } from '../shared/data/places'
import { DAY_TYPES } from '../shared/day-type'

const W = 1200
const H = 630
const OUT = 'public/og'
const STANDING_VIEWBOX = '36 30 440 597'

const PARTS: Record<string, string> = {}
for (const f of readdirSync('app/assets/character').filter((f) => f.endsWith('.svg'))) {
  PARTS[f.slice(0, -4)] = cleanPart(readFileSync(join('app/assets/character', f), 'utf8'))
}

function browser(): string {
  const env = process.env.CHROME_PATH
  const candidates = [
    env,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter((p): p is string => !!p)
  const found = candidates.find((p) => existsSync(p))
  if (!found) throw new Error('Chrome이나 Edge를 찾지 못했어요. CHROME_PATH에 브라우저 경로를 넣어 주세요.')
  return found
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

function page(id: keyof typeof DAY_TYPES): string {
  const t = DAY_TYPES[id]
  const p = PEOPLE[t.resident]!
  const skin = BODY_COLORS[PLACES[p.placeId]?.continent ?? 'korea']
  const character = assembleCharacter((n) => PARTS[n] ?? '', p)
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
body{background:${t.bg};color:#F3F1EA;font-family:'Noto Sans KR',sans-serif;position:relative}
.ground{position:absolute;left:0;right:0;bottom:0;height:150px;background:rgba(255,255,255,.18)}
.text{position:absolute;left:72px;top:64px;width:700px}
.brand{font-family:'Black Han Sans',sans-serif;font-size:30px}
.kicker{margin-top:44px;font-size:30px;font-weight:700;color:#F2C14E}
h1{margin:10px 0 0;font-family:'Black Han Sans',sans-serif;font-weight:400;font-size:92px;line-height:1.08;word-break:keep-all}
p{margin:22px 0 0;font-size:30px;line-height:1.5;word-break:keep-all}
.who{position:absolute;right:70px;bottom:24px;width:330px;height:448px}
.tag{position:absolute;right:56px;top:56px;font-size:24px;font-weight:700;background:#F3F1EA;color:#2A2A35;padding:6px 16px;border-radius:20px;border:4px solid #2A2A35}
</style></head><body>
<div class="ground"></div>
<div class="text"><div class="brand">내 하루에 닿은 사람들</div><div class="kicker">나의 하루 유형</div><h1>${esc(t.name)}</h1><p>${esc(t.desc)}</p></div>
<span class="tag">대표 주민 · ${esc(p.job)}</span>
<svg class="who" xmlns="http://www.w3.org/2000/svg" viewBox="${STANDING_VIEWBOX}" style="--skin:${skin}">${character}</svg>
</body></html>`
}

/** PNG 머리(IHDR)의 가로·세로 */
function pngSize(file: string): [number, number] {
  const b = readFileSync(file)
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

const chrome = browser()
const dir = mkdtempSync(join(tmpdir(), 'og-'))
for (const id of Object.keys(DAY_TYPES) as Array<keyof typeof DAY_TYPES>) {
  const html = join(dir, `day-${id}.html`)
  writeFileSync(html, page(id))
  const out = join(process.cwd(), OUT, `day-${id}.png`)
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${W},${H}`, '--virtual-time-budget=10000', `--screenshot=${out}`, pathToFileURL(html).href,
  ], { stdio: 'ignore' })
  const [w, h] = pngSize(out)
  if (w !== W || h !== H) throw new Error(`${out}: ${w}×${h} (${W}×${H}이어야 해요)`)
  console.log(`${OUT}/day-${id}.png ${w}×${h}`)
}
