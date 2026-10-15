/**
 * 지도 확대·축소와 이동 계산 (순수 함수). 화면 좌표 = 지도 좌표 × scale + (x, y).
 * 화면 위·아래에는 지도를 가리는 카드가 있다(insets: 위 제목 카드·알림, 아래 오고 있는 물건·버튼·탭, 안전 영역 포함).
 * 세로는 그 사이 영역(보이는 영역: top ~ vh - bottom)을 기준으로 한다.
 * 최소 배율은 섬 전체가 보이는 영역에 다 들어오는 크기, 최대는 MAX_SCALE.
 * 지도가 영역보다 크면 지도 끝을 영역 끝(위 카드 아래, 아래 버튼 위)까지만 끌어올 수 있고, 작으면 영역 가운데에 둔다.
 * insets가 0이면 화면 전체가 보이는 영역이다.
 */
export interface View {
  x: number
  y: number
  scale: number
}

export interface Size {
  /** 화면(뷰포트) */
  vw: number
  vh: number
  /** 지도 */
  mw: number
  mh: number
  /** 위·아래 카드가 가리는 높이 (없으면 0) */
  top?: number
  bottom?: number
}

/** 보이는 영역의 높이 (화면 높이 - 위·아래 카드) */
export function areaHeight(s: Size): number {
  return Math.max(1, s.vh - (s.top ?? 0) - (s.bottom ?? 0))
}

export const MAX_SCALE = 1.4
/** 이보다 작게 축소하면 주민 이름표·꽃을 숨기고 구역 이름표만 보인다. 주민을 누르면 카드 대신 다가간다 */
export const FAR_SCALE = 0.25
/** 이보다 작게 축소하면 지도 SVG를 숨기고 미리 그린 PNG(public/village/map-overview.png)만 보여 준다 */
export const OVERVIEW_SCALE = 0.3
/** 멀리서 주민을 누르면 이 배율까지 확대하며 그 자리로 간다 */
export const FAR_TAP_SCALE = 0.6

/** 섬 전체가 보이는 영역에 다 들어오는 가장 작은 배율 */
export function minScale(s: Size): number {
  return Math.min(s.vw / s.mw, areaHeight(s) / s.mh)
}

export function clampScale(scale: number, s: Size): number {
  const min = minScale(s)
  return Math.min(Math.max(min, MAX_SCALE), Math.max(min, scale))
}

/** 한 축 (영역 start부터 길이 view): 지도가 영역보다 작으면 영역 가운데, 크면 지도 끝이 영역 끝 안쪽으로 들어오지 않게 */
function clampAxis(pos: number, start: number, view: number, map: number): number {
  if (map <= view) return start + (view - map) / 2
  return Math.min(start, Math.max(start + view - map, pos))
}

/** 배율과 위치를 제한한다 */
export function clampView(v: View, s: Size): View {
  const scale = clampScale(v.scale, s)
  return { x: clampAxis(v.x, 0, s.vw, s.mw * scale), y: clampAxis(v.y, s.top ?? 0, areaHeight(s), s.mh * scale), scale }
}

/** 화면의 한 점(px, py)을 그대로 둔 채 배율을 바꾼다 (휠은 커서, 두 손가락은 가운데) */
export function zoomAt(v: View, px: number, py: number, nextScale: number, s: Size): View {
  const scale = clampScale(nextScale, s)
  const mx = (px - v.x) / v.scale
  const my = (py - v.y) / v.scale
  return clampView({ x: px - mx * scale, y: py - my * scale, scale }, s)
}

/** 보이는 영역의 가운데 (화면 좌표) */
export function areaCenter(s: Size): { x: number; y: number } {
  return { x: s.vw / 2, y: (s.top ?? 0) + areaHeight(s) / 2 }
}

/** 지도의 한 점을 보이는 영역 가운데에 둔다 */
export function centerOn(mx: number, my: number, scale: number, s: Size): View {
  const sc = clampScale(scale, s)
  const c = areaCenter(s)
  return clampView({ x: c.x - mx * sc, y: c.y - my * sc, scale: sc }, s)
}

/**
 * 가리는 높이가 바뀔 때(카드를 펴고 접거나 오고 있는 물건이 생기고 사라질 때): 보이는 영역 가운데에 있던 지도 지점을
 * 새 영역의 가운데에 그대로 둔다. 배율은 새 최소 배율 아래로 내려가지 않게만 맞추고, 끝까지 축소해 둔 상태였으면
 * 새 최소 배율로 맞춰 섬 전체가 계속 보이게 한다(예: 끝까지 축소한 채 알림이 떠서 위 카드가 길어질 때)
 */
export function withInsets(v: View, s: Size, top: number, bottom: number): { view: View; size: Size } {
  const c = areaCenter(s)
  const mx = (c.x - v.x) / v.scale
  const my = (c.y - v.y) / v.scale
  const size = { ...s, top, bottom }
  const atMin = v.scale <= minScale(s) + 1e-9
  return { view: centerOn(mx, my, atMin ? minScale(size) : v.scale, size), size }
}

/**
 * 지도 위 상자(x0, y0, x1, y1)가 화면에 다 들어오게: 상자 가운데를 화면 가운데에 두고, 들어가는 가장 큰 배율(maxScale 이하).
 * 마을로 모실 때 이번에 만난 사람들이 모두 보이게 쓴다
 */
export function fitBox(x0: number, y0: number, x1: number, y1: number, s: Size, maxScale = 0.6): View {
  const scale = Math.min(maxScale, s.vw / Math.max(1, x1 - x0), areaHeight(s) / Math.max(1, y1 - y0))
  return centerOn((x0 + x1) / 2, (y0 + y1) / 2, scale, s)
}

/** 주민 누르는 영역 (지도 좌표): 가로 140, 세로 210(발끝 아래 20까지). 캐릭터 그림(140×190)보다 넉넉하다 */
export const HIT_W = 140
export const HIT_H = 210
export const HIT_BELOW = 20
/** 화면에서 누르는 영역의 최소 크기(px) */
export const MIN_HIT_PX = 44

export interface HitBox {
  /** 지도 좌표의 너비·높이 */
  w: number
  h: number
  /** 발끝에서 상자 왼쪽 위까지 (지도 좌표) */
  left: number
  top: number
}

/**
 * 배율에 맞춘 주민 누르는 영역. 화면에서 44px보다 작아지면 화면 기준 44×44px이 되게 키운다.
 * 키울 때는 기본 상자의 가운데(발끝 위 85)를 그대로 두고 사방으로 넓힌다.
 */
export function hitBox(scale: number): HitBox {
  const min = MIN_HIT_PX / scale
  const w = Math.max(HIT_W, min)
  const h = Math.max(HIT_H, min)
  const cy = HIT_BELOW - HIT_H / 2
  return { w, h, left: -w / 2, top: cy - h / 2 }
}

/** 많이 축소했을 때 구역 이름표가 읽히게 키우는 배율 (화면에서 글자 약 13px 이상) */
export function zoneLabelScale(scale: number, fontPx = 30, minScreenPx = 13): number {
  return Math.max(1, minScreenPx / (fontPx * scale))
}
