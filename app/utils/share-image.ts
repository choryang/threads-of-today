/**
 * 오늘의 실 공유 카드 (1080×1350)를 브라우저 캔버스로 그린다. 시안 docs/redesign/mockups/V2Quote.
 */

export const CARD_W = 1080
export const CARD_H = 1350

const BODY = "'Noto Sans KR', sans-serif"

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

// ── 오늘의 실 카드 (docs/redesign/mockups/V2Quote): 흰 바탕, 장면 그림, 인용, 매듭 진 실 ──

export interface QuoteCardInput {
  /** '10월 15일' */
  date: string
  /** '억울했던' */
  moodPast: string
  moodColor: string
  /** 장면 그림 주소 (없으면 하늘색 면) */
  sceneSrc?: string
  /** '에티오피아 시다마의 알마즈' */
  who: string
  /** 그 편의 첫 문장 */
  quote: string
  /** '아이스 아메리카노로 이어진 사람' */
  via: string
  /** 머리말: '오늘 나와 같은 하루를 보낸 사람' 또는 '오늘 내 하루에 닿은 사람' */
  header: string
}

const Q_SIDE = 88
const Q_TOP = 88
const Q_BOTTOM = 96
const Q_INK = '#14161A'
const Q_SUB = '#6B7079'
const Q_BODY = '#2A2D33'
const Q_KNOT = 'M0 20 C 200 20, 380 20, 432 20 C 446 20, 456 4, 452 2 C 444 0, 436 16, 452 24 C 470 32, 462 40, 452 36 C 444 33, 456 20, 472 20 C 560 20, 760 20, 904 20'

export async function drawQuoteCard(canvas: HTMLCanvasElement, input: QuoteCardInput): Promise<void> {
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!
  await fontsReady()
  const scene = input.sceneSrc ? await loadImage(input.sceneSrc) : null
  const inner = CARD_W - Q_SIDE * 2

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.textBaseline = 'top'

  // 날짜 · 마음
  ctx.font = `400 28px ${BODY}`
  ctx.fillStyle = Q_SUB
  ctx.textAlign = 'left'
  ctx.fillText(input.date, Q_SIDE, Q_TOP)
  const mood = `${input.moodPast} 날`
  ctx.textAlign = 'right'
  ctx.fillText(mood, CARD_W - Q_SIDE, Q_TOP)
  const moodW = ctx.measureText(mood).width
  ctx.fillStyle = input.moodColor
  ctx.beginPath()
  ctx.arc(CARD_W - Q_SIDE - moodW - 12 - 9, Q_TOP + 19, 9, 0, Math.PI * 2)
  ctx.fill()

  // 장면 그림 904×520, 둥글기 40 (가운데 60% 높이 기준으로 채움). 없으면 하늘색 면
  const imgY = Q_TOP + 40 + 40
  const imgH = 520
  ctx.save()
  roundRect(ctx, Q_SIDE, imgY, inner, imgH, 40)
  ctx.clip()
  ctx.fillStyle = '#9ED3EE'
  ctx.fillRect(Q_SIDE, imgY, inner, imgH)
  if (scene) {
    const scale = Math.max(inner / scene.width, imgH / scene.height)
    const w = scene.width * scale
    const h = scene.height * scale
    ctx.drawImage(scene, Q_SIDE + (inner - w) / 2, imgY + (imgH - h) * 0.6, w, h)
  }
  ctx.restore()

  // 머리말 · 이름 · 인용
  let y = imgY + imgH + 64
  ctx.textAlign = 'left'
  ctx.font = `500 32px ${BODY}`
  ctx.fillStyle = input.moodColor
  ctx.fillText(input.header, Q_SIDE, y)
  y += 32 + 16
  ctx.font = `700 72px ${BODY}`
  ctx.fillStyle = Q_INK
  for (const line of wrapText(ctx, input.who, inner).slice(0, 2)) {
    ctx.fillText(line, Q_SIDE, y)
    y += 90
  }
  y += 32 - 18
  ctx.font = `400 38px ${BODY}`
  ctx.fillStyle = Q_BODY
  const knotY = CARD_H - Q_BOTTOM - 30 - 28 - 40
  const maxLines = Math.max(1, Math.floor((knotY - 24 - y) / 64))
  const lines = wrapText(ctx, input.quote, inner)
  lines.slice(0, maxLines).forEach((line, i) => {
    const last = i === maxLines - 1 && lines.length > maxLines
    ctx.fillText(last ? `${line.slice(0, -1)}…` : line, Q_SIDE, y + i * 64)
  })

  // 매듭 진 실
  ctx.save()
  ctx.translate(Q_SIDE, knotY)
  ctx.strokeStyle = input.moodColor
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.stroke(new Path2D(Q_KNOT))
  ctx.restore()

  // 아래 줄
  ctx.textBaseline = 'alphabetic'
  ctx.font = `400 28px ${BODY}`
  ctx.fillStyle = Q_SUB
  ctx.fillText(input.via, Q_SIDE, CARD_H - Q_BOTTOM)
  ctx.textAlign = 'right'
  ctx.font = `700 30px ${BODY}`
  ctx.fillStyle = Q_INK
  ctx.fillText('내 하루에 닿은 사람들', CARD_W - Q_SIDE, CARD_H - Q_BOTTOM)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
}
