import { computed } from 'vue'
import { buildTapestry } from '../../shared/threads'

/** '나의 실타래' 배치. todayOnly면 오늘 지나온 실만 (공유 이미지) */
export function useTapestry(opts: { todayOnly?: boolean } = {}) {
  const game = useGame()
  return computed(() => {
    const todayMaterials = game.today.value.journeys.filter((j) => j.done).flatMap((j) => j.materialIds)
    const all = game.state.threads ?? {}
    const threads = opts.todayOnly ? Object.fromEntries(Object.entries(all).filter(([id]) => todayMaterials.includes(id))) : all
    return buildTapestry({ threads, cards: game.state.cards, todayKey: game.todayKey, todayMaterials })
  })
}
