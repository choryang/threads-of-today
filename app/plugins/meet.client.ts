import { onMeet } from '../composables/useGame'
import { useTodayMeets } from '../composables/useTodayMeets'

/** 여정에서 사람을 만날 때마다 모두의 오늘에 센다 (사람마다 하루 한 번만 보낸다) */
export default defineNuxtPlugin(() => {
  const meets = useTodayMeets()
  onMeet((personId) => meets.report(personId))
})
