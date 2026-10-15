import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { parseClock, shiftToLocal, shiftToLocalDate } from '../../shared/local-time'
import { MOTION } from '../utils/motion'

/**
 * 지금 시각(30초마다 다시). 개발 중에는 주소에 ?clock=05:30·?date=2026-09-27을 붙이면 tz 그곳 시각을 그렇게 옮긴다
 * (서울 시각도 같은 만큼 옮겨진다). PlaceSky와 같은 규칙
 */
export function usePlaceNow(tz: Ref<string>) {
  const route = useRoute()
  const tick = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => { timer = setInterval(() => { tick.value = Date.now() }, MOTION.skyTickMs) })
  onBeforeUnmount(() => clearInterval(timer))
  return computed(() => {
    let d = new Date(tick.value)
    if (!import.meta.dev) return d
    const date = String(route.query.date ?? '')
    const clock = parseClock(String(route.query.clock ?? ''))
    if (date) d = shiftToLocalDate(d, tz.value, date)
    if (clock) d = shiftToLocal(d, tz.value, clock)
    return d
  })
}
