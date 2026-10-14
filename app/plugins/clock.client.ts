import { startClock } from '../composables/useGame'

/** 앱을 열 때 그사이 흐른 여정을 처리하고 여정 시계를 돌린다. sync 플러그인보다 먼저 돈다(이름 순) */
export default defineNuxtPlugin(() => {
  startClock()
})
