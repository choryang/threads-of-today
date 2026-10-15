/**
 * 지도 확대·축소와 이동 계산 (순수 함수). 화면 좌표 = 지도 좌표 × scale + (x, y).
 * 최소 배율은 섬 전체가 화면에 다 들어오는 크기, 최대는 MAX_SCALE.
 * 지도가 화면보다 크면 지도 밖 빈 화면이 보이지 않게 위치를 제한하고, 작으면 가운데에 둔다(바깥은 바다색으로 칠한다).
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
}

export const MAX_SCALE = 1.4
/** 이보다 작게 축소하면 주민 이름표·꽃을 숨기고 구역 이름표만 보인다. 주민을 누르면 카드 대신 다가간다 */
export const FAR_SCALE = 0.25
/** 멀리서 주민을 누르면 이 배율까지 확대하며 그 자리로 간다 */
export const FAR_TAP_SCALE = 0.6

/** 섬 전체가 화면에 다 들어오는 가장 작은 배율 */
export function minScale(s: Size): number {
  return Math.min(s.vw / s.mw, s.vh / s.mh)
}

export function clampScale(scale: number, s: Size): number {
  const min = minScale(s)
  return Math.min(Math.max(min, MAX_SCALE), Math.max(min, scale))
}

/** 한 축: 지도가 화면보다 작으면 가운데, 크면 지도 가장자리가 화면 안쪽으로 들어오지 않게 */
function clampAxis(pos: number, view: number, map: number): number {
  if (map <= view) return (view - map) / 2
  return Math.min(0, Math.max(view - map, pos))
}

/** 배율과 위치를 제한한다 */
export function clampView(v: View, s: Size): View {
  const scale = clampScale(v.scale, s)
  return { x: clampAxis(v.x, s.vw, s.mw * scale), y: clampAxis(v.y, s.vh, s.mh * scale), scale }
}

/** 화면의 한 점(px, py)을 그대로 둔 채 배율을 바꾼다 (휠은 커서, 두 손가락은 가운데) */
export function zoomAt(v: View, px: number, py: number, nextScale: number, s: Size): View {
  const scale = clampScale(nextScale, s)
  const mx = (px - v.x) / v.scale
  const my = (py - v.y) / v.scale
  return clampView({ x: px - mx * scale, y: py - my * scale, scale }, s)
}

/** 지도의 한 점을 화면 가운데에 둔다 */
export function centerOn(mx: number, my: number, scale: number, s: Size): View {
  const sc = clampScale(scale, s)
  return clampView({ x: s.vw / 2 - mx * sc, y: s.vh / 2 - my * sc, scale: sc }, s)
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
