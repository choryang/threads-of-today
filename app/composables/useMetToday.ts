import { computed } from 'vue'
import { seoulDateKey } from '../../shared/logic'
import { useGame } from './useGame'

/**
 * 오늘(서울 날짜) '오늘'에서 이미 한 사람을 만났는지. 읽기만 한다 (걷기 끝 요약의 '오늘 저녁'·'내일 저녁').
 * 걷기 화면은 저장값을 건드리지 않으려고 이 composable로만 묻는다 (tests/walk.test.ts)
 */
export function useMetToday() {
  const game = useGame()
  return computed(() => !!game.state.todays?.[seoulDateKey()])
}
