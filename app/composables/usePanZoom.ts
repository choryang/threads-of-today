import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue'
import { MOTION, reducedMotion } from '../utils/motion'
import { FAR_SCALE, centerOn, clampScale, clampView, zoomAt, type Size, type View } from '../utils/pan-zoom'

/**
 * 지도 확대·축소와 이동 (라이브러리 없이 포인터 이벤트로). 계산은 utils/pan-zoom.ts의 순수 함수.
 *  - 한 손가락(마우스) 끌기: 이동 / 두 손가락: 두 손가락 가운데 기준 확대·축소 / 휠: 커서 기준 확대·축소
 *  - wheel은 passive: false로 직접 붙인다(페이지가 스크롤되지 않게). 지도 영역에는 CSS로 touch-action: none
 *  - 8px 이상 움직였으면 dragged()가 true: 끌다가 놓은 자리의 주민 카드가 열리지 않게 클릭을 무시한다
 * 포인터 캡처는 쓰지 않는다(캡처하면 주민 버튼의 click이 지도 쪽으로 가서). 끄는 동안의 move·up은 window에서 받는다.
 *
 * 지금 보기(위치·배율)는 반응형 상태가 아니다: 움직일 때마다 화면 컴포넌트가 다시 그려지지 않도록,
 * 바뀐 값은 requestAnimationFrame으로 한 프레임에 한 번 paint(보기, 미끄러지는 중)에 넘겨 지도 요소에 직접 쓴다.
 * 반응형으로 바뀌는 건 far(배율 0.25 미만인지) 하나뿐이고, 경계를 넘을 때만 값이 바뀐다.
 */
export const DRAG_SLOP = 8
const WHEEL_SPEED = 0.0015
const STEP = 1.3

export function usePanZoom(
  el: Ref<HTMLElement | null>,
  map: { w: number; h: number },
  start: (s: Size) => View,
  paint: (v: View, gliding: boolean) => void,
) {
  let view: View = { x: 0, y: 0, scale: 1 }
  /** 화면을 옮기는 연출 중이면 true (transform에 transition을 건다) */
  let gliding = false
  const far = ref(false)
  let size: Size = { vw: 1, vh: 1, mw: map.w, mh: map.h }
  const points = new Map<number, { x: number; y: number }>()
  let moved = 0
  let pinch: { d: number; scale: number; mx: number; my: number } | null = null
  let glideTimer: ReturnType<typeof setTimeout> | undefined
  let frame = 0

  function flush() {
    frame = 0
    paint(view, gliding)
    // 같은 값을 넣으면 Vue가 아무것도 다시 그리지 않는다: 경계를 넘을 때만 바뀐다
    far.value = view.scale < FAR_SCALE
  }
  /** 바뀐 보기를 다음 프레임에 한 번만 그린다 */
  function schedule() {
    if (!frame) frame = requestAnimationFrame(flush)
  }
  const set = (v: View) => {
    view = clampView(v, size)
    schedule()
  }

  const local = (e: { clientX: number; clientY: number }) => {
    const r = el.value!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function measure(first = false) {
    const r = el.value?.getBoundingClientRect()
    if (!r) return
    size = { vw: r.width, vh: r.height, mw: map.w, mh: map.h }
    if (first) {
      // 처음 한 번은 바로 그린다 (첫 화면이 비지 않게)
      view = start(size)
      cancelAnimationFrame(frame)
      flush()
    } else set(view)
  }

  function startPinch() {
    const [a, b] = [...points.values()]
    if (!a || !b) { pinch = null; return }
    const cx = (a.x + b.x) / 2
    const cy = (a.y + b.y) / 2
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: view.scale, mx: (cx - view.x) / view.scale, my: (cy - view.y) / view.scale }
  }

  function stopGlide() {
    if (!gliding) return
    clearTimeout(glideTimer)
    gliding = false
    schedule()
  }

  function onDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (points.size === 0) moved = 0
    stopGlide()
    points.set(e.pointerId, local(e))
    startPinch()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function onMove(e: PointerEvent) {
    const prev = points.get(e.pointerId)
    if (!prev) return
    const p = local(e)
    points.set(e.pointerId, p)
    if (points.size >= 2 && pinch) {
      const [a, b] = [...points.values()]
      const cx = (a!.x + b!.x) / 2
      const cy = (a!.y + b!.y) / 2
      const scale = clampScale(pinch.scale * (Math.hypot(a!.x - b!.x, a!.y - b!.y) / pinch.d), size)
      moved += DRAG_SLOP + 1
      // 처음 잡은 지도 위의 가운데 점이 두 손가락 가운데를 따라온다
      set({ x: cx - pinch.mx * scale, y: cy - pinch.my * scale, scale })
      return
    }
    const dx = p.x - prev.x
    const dy = p.y - prev.y
    moved += Math.abs(dx) + Math.abs(dy)
    set({ ...view, x: view.x + dx, y: view.y + dy })
  }

  function onUp(e: PointerEvent) {
    points.delete(e.pointerId)
    startPinch()
    if (points.size === 0) {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const p = local(e)
    stopGlide()
    set(zoomAt(view, p.x, p.y, view.scale * Math.exp(-e.deltaY * WHEEL_SPEED), size))
  }

  /** 화면 가운데 기준 확대(+)·축소(−) */
  const zoomIn = () => set(zoomAt(view, size.vw / 2, size.vh / 2, view.scale * STEP, size))
  const zoomOut = () => set(zoomAt(view, size.vw / 2, size.vh / 2, view.scale / STEP, size))

  /** 지도의 한 점을 화면 가운데로. glide면 MOTION.panMs 동안 미끄러지듯 옮긴다 */
  function goTo(mx: number, my: number, scale = view.scale, glide = false) {
    clearTimeout(glideTimer)
    gliding = glide && !reducedMotion()
    set(centerOn(mx, my, scale, size))
    if (gliding) glideTimer = setTimeout(() => { gliding = false; schedule() }, MOTION.panMs)
  }

  /** 마지막 누름에서 8px 이상 끌었는지 (주민 클릭 무시용) */
  const dragged = () => moved > DRAG_SLOP

  let observer: ResizeObserver | undefined
  onMounted(() => {
    const node = el.value
    if (!node) return
    measure(true)
    node.addEventListener('pointerdown', onDown)
    node.addEventListener('wheel', onWheel, { passive: false })
    observer = new ResizeObserver(() => measure())
    observer.observe(node)
  })
  onBeforeUnmount(() => {
    clearTimeout(glideTimer)
    cancelAnimationFrame(frame)
    observer?.disconnect()
    el.value?.removeEventListener('pointerdown', onDown)
    el.value?.removeEventListener('wheel', onWheel)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  })

  return {
    /** 지금 보기 (반응형 아님: 읽는 순간의 값) */
    view: () => view,
    /** 배율 0.25 미만(멀리 보기)인지. 경계를 넘을 때만 바뀐다 */
    far: readonly(far),
    zoomIn,
    zoomOut,
    goTo,
    dragged,
    size: () => size,
  }
}
