import { reactive } from 'vue'
import { seoulDateKey } from '../../shared/logic'
import { unsentToday } from '../../shared/today'
import { useSync } from './useSync'

/**
 * 모두의 오늘 (server/api/meet). 사람을 만나면 모아 두었다가 한 번에 보내고, 사람마다 하루(서울 날짜) 한 번만 보낸다.
 * 수는 사람 여럿을 한 번에 묻고 이 기기에서 60초 동안 다시 묻지 않는다. 서버를 쓸 수 없으면 조용히 비워 둔다.
 */
const SENT_KEY = 'my-day-people:meet-sent'
const SEND_DELAY_MS = 1500
const FRESH_MS = 60_000

const counts = reactive<Record<string, number | undefined>>({})
const fetchedAt: Record<string, number> = {}
let queue: string[] = []
let timer: ReturnType<typeof setTimeout> | undefined

function loadSent(): { date: string; ids: string[] } | null {
  try {
    return JSON.parse(window.localStorage.getItem(SENT_KEY) ?? 'null')
  } catch {
    return null
  }
}
function saveSent(v: { date: string; ids: string[] }) {
  try {
    window.localStorage.setItem(SENT_KEY, JSON.stringify(v))
  } catch {
    // 저장이 막히면 다음에 한 번 더 보낼 수 있다(서버가 같은 사람으로 센다)
  }
}

export function useTodayMeets() {
  const { status } = useSync()

  async function flush() {
    const date = seoulDateKey()
    const sent = loadSent()
    const ids = unsentToday(queue, sent, date)
    queue = []
    if (!ids.length) return
    saveSent({ date, ids: [...(sent?.date === date ? sent.ids : []), ...ids] })
    try {
      await $fetch('/api/meet', { method: 'POST', body: { personIds: ids, id: status.profile?.id } })
      for (const id of ids) fetchedAt[id] = 0 // 다음에 물을 때 새로 받는다
    } catch {
      // 오프라인: 오늘은 다시 보내지 않는다 (몇 명 덜 세어도 괜찮다)
    }
  }

  /** 오늘 이 사람을 만났다 (모아서 보낸다) */
  function report(personId: string) {
    queue.push(personId)
    clearTimeout(timer)
    timer = setTimeout(() => void flush(), SEND_DELAY_MS)
  }

  /** 나도 오늘 이 사람을 만났는지 */
  function metToday(personId: string): boolean {
    const sent = loadSent()
    return (sent?.date === seoulDateKey() && sent.ids.includes(personId)) || queue.includes(personId)
  }

  /** 여러 사람의 오늘 수를 한 번에 */
  async function load(personIds: string[]) {
    const now = Date.now()
    const ids = [...new Set(personIds)].filter((id) => now - (fetchedAt[id] ?? 0) > FRESH_MS).slice(0, 60)
    if (!ids.length) return
    for (const id of ids) fetchedAt[id] = now
    try {
      const res = await $fetch<{ ok: boolean; counts?: Record<string, number> }>('/api/meet', { query: { ids: ids.join(',') } })
      if (res.ok && res.counts) Object.assign(counts, res.counts)
    } catch {
      // 수를 보여 주지 않는다
    }
  }

  return { counts, report, metToday, load, flush }
}
