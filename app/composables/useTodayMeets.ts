import { reactive, ref } from 'vue'
import { seoulDateKey } from '../../shared/logic'
import { SNAPSHOT_MAX_AGE_MS, meetCountFor, unsentToday, type MeetSnapshot, type SentToday } from '../../shared/today'
import { useSync } from './useSync'

/**
 * 모두의 오늘. 보내기(server/api/meet): 사람을 만나면 모아 두었다가 한 번에 보내고, 사람마다 하루(서울 날짜) 한 번만 보낸다.
 * 읽기(server/api/today-snapshot): 모든 사람의 수가 든 스냅샷 하나만 읽고 10분 동안 다시 묻지 않는다.
 * 스냅샷 뒤에 내가 만난 사람은 나를 1 더해 보여 준다(meetCountFor). 서버를 쓸 수 없으면 조용히 비워 둔다.
 */
const SENT_KEY = 'my-day-people:meet-sent'
const SEND_DELAY_MS = 1500

const snapshot = ref<MeetSnapshot | null>(null)
/** 오늘 이 기기가 보낸 시각 (사람마다) */
const sentAt = reactive<Record<string, number>>({})
let sentLoadedFor = ''
let fetchedAt = 0
let queue: string[] = []
let timer: ReturnType<typeof setTimeout> | undefined

function loadSent(): SentToday | null {
  try {
    return JSON.parse(window.localStorage.getItem(SENT_KEY) ?? 'null')
  } catch {
    return null
  }
}
function saveSent(v: SentToday) {
  try {
    window.localStorage.setItem(SENT_KEY, JSON.stringify(v))
  } catch {
    // 저장이 막히면 다음에 한 번 더 보낼 수 있다(서버가 같은 사람으로 센다)
  }
}

/** 오늘 보낸 시각을 localStorage에서 한 번 읽어 둔다 (날짜가 바뀌면 비운다) */
function syncSentAt(date: string) {
  if (sentLoadedFor === date) return
  sentLoadedFor = date
  for (const k of Object.keys(sentAt)) delete sentAt[k]
  const sent = loadSent()
  if (sent?.date === date) for (const id of sent.ids) sentAt[id] = sent.at?.[id] ?? 0
}

export function useTodayMeets() {
  const { status } = useSync()

  async function flush() {
    const date = seoulDateKey()
    const sent = loadSent()
    const ids = unsentToday(queue, sent, date)
    queue = []
    if (!ids.length) return
    const now = Date.now()
    const prev = sent?.date === date ? sent : { date, ids: [], at: {} }
    saveSent({ date, ids: [...prev.ids, ...ids], at: { ...prev.at, ...Object.fromEntries(ids.map((id) => [id, now])) } })
    syncSentAt(date)
    for (const id of ids) sentAt[id] = now
    try {
      await $fetch('/api/meet', { method: 'POST', body: { personIds: ids, id: status.profile?.id } })
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
    syncSentAt(seoulDateKey())
    return personId in sentAt || queue.includes(personId)
  }

  /** 스냅샷을 받는다 (10분 안에 받은 적이 있으면 그대로) */
  async function load() {
    const now = Date.now()
    if (now - fetchedAt < SNAPSHOT_MAX_AGE_MS) return
    fetchedAt = now
    try {
      const res = await $fetch<{ ok: boolean; snapshot?: MeetSnapshot }>('/api/today-snapshot')
      if (res.ok && res.snapshot) snapshot.value = res.snapshot
    } catch {
      fetchedAt = 0 // 수를 보여 주지 않고, 다음에 다시 묻는다
    }
  }

  /** 화면에 보일 오늘 수. 아직 모르면 undefined */
  function countOf(personId: string): number | undefined {
    const date = seoulDateKey()
    syncSentAt(date)
    return meetCountFor(snapshot.value, personId, date, sentAt[personId])
  }

  return { report, metToday, load, flush, countOf }
}
