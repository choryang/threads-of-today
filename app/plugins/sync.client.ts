import { useSync } from '../composables/useSync'

/** 앱을 열 때 한 번 서버와 동기화한다 (남길 기록이 있을 때만, useSync). 한마디를 건넬 때는 useToday가 다시 부른다 */
export default defineNuxtPlugin(() => {
  const { sync } = useSync()
  void sync()
})
