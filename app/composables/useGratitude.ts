import { reactive } from 'vue'
import { useSync } from './useSync'

/**
 * 다른 사람들의 고마움 수 (server/utils/gratitude.ts). 서버를 쓸 수 없으면 조용히 비워 둔다.
 * 고마워요를 누르면 수를 올리고, 카드를 열 때 그 사람의 수를 한 번 읽는다(1분 동안은 다시 묻지 않는다).
 */
export interface GratitudeCount {
  today: number
  total: number
}

const counts = reactive<Record<string, GratitudeCount | undefined>>({})
const fetchedAt: Record<string, number> = {}
const FRESH_MS = 60_000

export function useGratitude() {
  const { status } = useSync()

  async function load(personId: string, force = false) {
    if (!force && Date.now() - (fetchedAt[personId] ?? 0) < FRESH_MS) return
    fetchedAt[personId] = Date.now()
    try {
      const res = await $fetch<{ ok: boolean; counts?: Record<string, GratitudeCount> }>('/api/thanks', { query: { ids: personId } })
      if (res.ok && res.counts?.[personId]) counts[personId] = res.counts[personId]
    } catch {
      // 오프라인 등: 수를 보여 주지 않는다
    }
  }

  /** 이 기기에서 오늘 처음 고마워한 사람이면 서버 수를 올린다 */
  async function send(personId: string) {
    try {
      const res = await $fetch<{ ok: boolean; counted?: boolean }>('/api/thanks', { method: 'POST', body: { personId, id: status.profile?.id } })
      if (res.ok) await load(personId, true)
    } catch {
      // 다음에 다시 누를 때 센다
    }
  }

  return { counts, load, send }
}
