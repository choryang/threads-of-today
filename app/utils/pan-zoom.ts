/**
 * 지도 확대·축소와 이동 계산 (순수 함수). 화면 좌표 = 지도 좌표 × scale + (x, y).
 * 최소 배율은 지도가 화면을 꽉 채우는 크기, 최대는 MAX_SCALE. 지도 밖 빈 화면이 보이지 않게 위치를 제한한다.
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

/** 지도가 화면을 꽉 채우는 가장 작은 배율 */
export function minScale(s: Size): number {
  return Math.max(s.vw / s.mw, s.vh / s.mh)
}

export function clampScale(scale: number, s: Size): number {
  const min = minScale(s)
  return Math.min(Math.max(min, MAX_SCALE), Math.max(min, scale))
}

/** 배율을 제한하고, 지도 가장자리가 화면 안쪽으로 들어오지 않게 위치를 제한한다 */
export function clampView(v: View, s: Size): View {
  const scale = clampScale(v.scale, s)
  const x = Math.min(0, Math.max(s.vw - s.mw * scale, v.x))
  const y = Math.min(0, Math.max(s.vh - s.mh * scale, v.y))
  return { x, y, scale }
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
