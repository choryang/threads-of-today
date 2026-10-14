import { onJourneyFinish } from '../composables/useGame'
import { useSync } from '../composables/useSync'

/** 앱을 열 때 한 번, 여정을 마칠 때마다 서버와 동기화한다 */
export default defineNuxtPlugin(() => {
  const { sync } = useSync()
  onJourneyFinish(() => void sync())
  void sync()
})
