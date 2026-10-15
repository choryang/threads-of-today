/**
 * 공유 이미지 (1080×1350 PNG)를 브라우저 캔버스로 그린다. 시안: 캔버스 '내 하루 마을' 두 번째 줄의 공유 이미지 2장.
 * 글씨는 위아래 여백 80px 안쪽에만 둔다(SAFE). 글꼴은 앱과 같은 Black Han Sans(제목)·Noto Sans KR(본문).
 */
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import type { DayType } from '../../shared/day-type'
import { BODY_COLORS, STANDING_VIEWBOX, characterSvg } from './character'

export const CARD_W = 1080
export const CARD_H = 1350
/** 글씨가 들어갈 수 있는 위아래 한계 */
export const SAFE = 80

const INK = '#F3F1EA'
const SOFT = '#D9E2E8'
const GOLD = '#F2C14E'
const LINE = '#2A2A35'
const DISPLAY = "'Black Han Sans', 'Noto Sans KR', sans-serif"
const BODY = "'Noto Sans KR', sans-serif"

/** 캐릭터를 <img>로 쓸 SVG 문서 (피부색은 SVG 안의 --skin으로) */
export function characterImageUrl(personId: string): string {
  const p = PEOPLE[personId]
  if (!p) return ''
  const skin = BODY_COLORS[PLACES[p.placeId]?.continent ?? 'korea']
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${STANDING_VIEWBOX}" width="440" height="597" style="--skin:${skin}">${characterSvg(p)}</svg>`
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load(`120px ${DISPLAY}`, '하루'),
      document.fonts.load(`700 34px ${BODY}`, '하루'),
      document.fonts.load(`400 34px ${BODY}`, '하루'),
    ])
  } catch {
    // 글꼴을 못 읽으면 기본 글꼴로 그린다
  }
}

/** 띄어쓰기 단위로 줄을 나눈다(낱말을 자르지 않는다). 한 낱말이 너무 길면 글자 단위로 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width <= maxWidth) {
        line = next
        continue
      }
      if (line) lines.push(line)
      line = ''
      if (ctx.measureText(word).width <= maxWidth) {
        line = word
        continue
      }
      for (const ch of word) {
        if (ctx.measureText(line + ch).width > maxWidth && line) {
          lines.push(line)
          line = ''
        }
        line += ch
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** 바탕색을 조금 밝힌 색 (땅·바다 띠) */
function lighten(hex: string, k = 0.22): string {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${c.map((v) => Math.round(v + (255 - v) * k)).join(',')})`
}

export interface DayCardInput {
  type: DayType
  /** 숫자 3개: [값, 설명] */
  numbers: Array<[string, string]>
  /** 고른 물건 아이콘 주소 */
  icons: string[]
  /** 머리 오른쪽: '10월 15일의 나' 또는 '노을의 찻잎의 하루' */
  caption: string
}

/** 나의 하루 유형 공유 이미지 */
export async function drawDayCard(canvas: HTMLCanvasElement, input: DayCardInput): Promise<void> {
  await fontsReady()
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!
  const x0 = 84
  const w = CARD_W - x0 * 2
  ctx.fillStyle = input.type.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.textBaseline = 'top'

  // 머리
  let y = SAFE
  ctx.fillStyle = INK
  ctx.font = `32px ${DISPLAY}`
  ctx.fillText('내 하루에 닿은 사람들', x0, y)
  ctx.font = `28px ${BODY}`
  ctx.fillStyle = SOFT
  ctx.textAlign = 'right'
  ctx.fillText(input.caption, x0 + w, y + 4)
  ctx.textAlign = 'left'

  // 유형 이름과 설명
  y += 96
  ctx.fillStyle = GOLD
  ctx.font = `700 32px ${BODY}`
  ctx.fillText(input.type.rare ? '나의 하루 유형 · 드문 하루' : '나의 하루 유형', x0, y)
  y += 52
  ctx.fillStyle = INK
  ctx.font = `120px ${DISPLAY}`
  for (const line of wrapText(ctx, input.type.name, w)) {
    ctx.fillText(line, x0, y)
    y += 128
  }
  y += 12
  ctx.fillStyle = SOFT
  ctx.font = `34px ${BODY}`
  for (const line of wrapText(ctx, input.type.desc, w)) {
    ctx.fillText(line, x0, y)
    y += 52
  }

  // 대표 주민이 선 땅
  const sceneTop = y + 20
  const sceneH = 340
  ctx.fillStyle = lighten(input.type.bg)
  ctx.fillRect(0, sceneTop + sceneH - 130, CARD_W, 130)
  const resident = await loadImage(characterImageUrl(input.type.resident))
  if (resident) ctx.drawImage(resident, CARD_W - 90 - 250, sceneTop + sceneH - 340 - 10, 250, 340)
  const job = PEOPLE[input.type.resident]?.job ?? ''
  ctx.font = `700 26px ${BODY}`
  const tag = `대표 주민 · ${job}`
  const tw = ctx.measureText(tag).width + 40
  ctx.fillStyle = INK
  roundRect(ctx, x0, sceneTop + 40, tw, 52, 26)
  ctx.fill()
  ctx.strokeStyle = LINE
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = LINE
  ctx.fillText(tag, x0 + 20, sceneTop + 52)

  // 숫자 3개
  y = sceneTop + sceneH + 40
  const colW = w / 3
  input.numbers.forEach(([value, label], i) => {
    const cx = x0 + colW * i
    ctx.fillStyle = INK
    ctx.font = `${value.length > 6 ? 52 : 72}px ${DISPLAY}`
    ctx.fillText(value, cx, y)
    ctx.fillStyle = SOFT
    ctx.font = `26px ${BODY}`
    ctx.fillText(label, cx, y + 86)
  })

  // 고른 물건과 물음 (아래 여백 80px 위에)
  const bottom = CARD_H - SAFE
  const icons = await Promise.all(input.icons.map(loadImage))
  icons.forEach((img, i) => {
    const ix = x0 + i * 76
    ctx.fillStyle = INK
    roundRect(ctx, ix, bottom - 64, 64, 64, 16)
    ctx.fill()
    if (img) ctx.drawImage(img, ix + 4, bottom - 60, 56, 56)
  })
  ctx.fillStyle = GOLD
  ctx.font = `700 30px ${BODY}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('당신의 하루는 어떤 하루일까요?', x0 + w, bottom - 14)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
}

export interface MatchCardInput {
  left: { label: string; type: DayType }
  right: { label: string; type: DayType }
  /** 두 사람의 하루가 만나는 곳 */
  place: string
  /** 그 자리의 사람 (가운데 그림) */
  hub: string
  /** 같이 닿은 사람들의 직업 */
  shared: string[]
}

/** 두 사람의 하루 공유 이미지 */
export async function drawMatchCard(canvas: HTMLCanvasElement, input: MatchCardInput): Promise<void> {
  await fontsReady()
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!
  const x0 = 72
  const w = CARD_W - x0 * 2
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.textBaseline = 'top'

  let y = SAFE
  ctx.fillStyle = '#1A1A22'
  ctx.font = `32px ${DISPLAY}`
  ctx.fillText('내 하루에 닿은 사람들', x0, y)
  ctx.fillStyle = '#4A4A55'
  ctx.font = `28px ${BODY}`
  ctx.textAlign = 'right'
  ctx.fillText('두 사람의 하루', x0 + w, y + 4)
  ctx.textAlign = 'left'

  // 두 사람의 유형 카드
  y += 88
  const cardW = (w - 24) / 2
  const cardH = 400
  const sides = [input.left, input.right]
  const residents = await Promise.all(sides.map((s) => loadImage(characterImageUrl(s.type.resident))))
  sides.forEach((side, i) => {
    const cx = x0 + i * (cardW + 24)
    ctx.save()
    roundRect(ctx, cx, y, cardW, cardH, 36)
    ctx.clip()
    ctx.fillStyle = side.type.bg
    ctx.fillRect(cx, y, cardW, cardH)
    ctx.fillStyle = lighten(side.type.bg)
    ctx.fillRect(cx, y + cardH - 90, cardW, 90)
    const img = residents[i]
    if (img) ctx.drawImage(img, cx + cardW - 30 - 162, y + cardH - 20 - 220, 162, 220)
    ctx.restore()
    ctx.fillStyle = SOFT
    ctx.font = `28px ${BODY}`
    ctx.fillText(side.label, cx + 32, y + 32)
    ctx.fillStyle = INK
    ctx.font = `48px ${DISPLAY}`
    let ly = y + 76
    for (const line of wrapText(ctx, side.type.name, cardW - 64).slice(0, 3)) {
      ctx.fillText(line, cx + 32, ly)
      ly += 56
    }
  })

  // 두 하루가 만나는 사람
  y += cardH + 30
  const hub = await loadImage(characterImageUrl(input.hub))
  ctx.fillStyle = '#C8955A'
  roundRect(ctx, x0 + 60, y + 150, w - 120, 46, 12)
  ctx.fill()
  ctx.strokeStyle = LINE
  ctx.lineWidth = 6
  ctx.stroke()
  if (hub) ctx.drawImage(hub, CARD_W / 2 - 70, y, 140, 190)

  y += 220
  ctx.fillStyle = '#1A1A22'
  ctx.font = `64px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('두 사람의 하루는', CARD_W / 2, y)
  y += 78
  for (const line of wrapText(ctx, `${input.place}에서 만나요`, w)) {
    ctx.fillText(line, CARD_W / 2, y)
    y += 78
  }
  y += 8
  ctx.fillStyle = '#4A4A55'
  ctx.font = `30px ${BODY}`
  ctx.fillText(`같이 닿은 사람 ${input.shared.length}명`, CARD_W / 2, y)
  y += 52
  ctx.font = `26px ${BODY}`
  for (const line of wrapText(ctx, input.shared.slice(0, 8).join(' · '), w).slice(0, 2)) {
    ctx.fillText(line, CARD_W / 2, y)
    y += 40
  }
  ctx.fillStyle = '#1F5A73'
  ctx.font = `700 30px ${BODY}`
  ctx.textBaseline = 'bottom'
  ctx.fillText('우리 하루는 어디서 만날까요?', CARD_W / 2, CARD_H - SAFE)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
}

/** 캔버스를 PNG로 저장(내려받기) */
export function savePng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve()
    }, 'image/png')
  })
}
