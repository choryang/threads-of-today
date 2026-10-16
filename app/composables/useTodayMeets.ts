import { ref } from 'vue'
import { seoulDateKey } from '../../shared/logic'
import { SNAPSHOT_DEFAULT_MINUTES, moodCountFor, type MeetSnapshot } from '../../shared/today'
import type { MoodId } from '../../shared/data/moods'
import { useSync } from './useSync'

/**
 * 모두의 오늘 (새 기획): 실을 묶으면 오늘의 마음 id만 하루 한 번 보낸다(server/api/mood).
 * 읽기(server/api/today-snapshot): 마음별 수가 든 스냅샷 하나만 읽고 서버가 알려 준 간격(기본 30분) 동안 다시 묻지 않는다.
 * 스냅샷 뒤에 내가 묶은 마음은 나를 1 더해 보여 준다(moodCountFor). 서버를 쓸 수 없으면 조용히 비워 둔다.
 */
/** 오늘 마음을 보낸 날·시각 (새 기획: 실을 묶으면 하루 한 번) */
const MOOD_SENT_KEY = 'my-day-people:mood-sent'
interface MoodSent { date: string; mood: string; at: number }
function loadMoodSent(): MoodSent | null {
  try {
    return JSON.parse(window.localStorage.getItem(MOOD_SENT_KEY) ?? 'null')
  } catch {
    return null
  }
}
const snapshot = ref<MeetSnapshot | null>(null)
let fetchedAt = 0
/** 다시 묻는 간격 (응답의 maxAgeSeconds) */
let maxAgeMs = SNAPSHOT_DEFAULT_MINUTES * 60_000

export function useTodayMeets() {
  const { status } = useSync()

  /** 스냅샷을 받는다 (간격 안에 받은 적이 있으면 그대로) */
  async function load() {
    const now = Date.now()
    if (now - fetchedAt < maxAgeMs) return
    fetchedAt = now
    try {
      const res = await $fetch<{ ok: boolean; snapshot?: MeetSnapshot; maxAgeSeconds?: number }>('/api/today-snapshot')
      if (res.ok && res.snapshot) snapshot.value = res.snapshot
      if (res.maxAgeSeconds && res.maxAgeSeconds > 0) maxAgeMs = res.maxAgeSeconds * 1000
    } catch {
      fetchedAt = 0 // 수를 보여 주지 않고, 다음에 다시 묻는다
    }
  }

  /** 오늘 이 마음으로 실을 묶었다 (하루 한 번만 보낸다). 마음 id만 보낸다 */
  async function tieMood(mood: MoodId) {
    const date = seoulDateKey()
    if (loadMoodSent()?.date === date) return
    try {
      window.localStorage.setItem(MOOD_SENT_KEY, JSON.stringify({ date, mood, at: Date.now() }))
    } catch {
      // 저장이 막히면 다시 보낼 수 있다(서버가 같은 사람으로 센다)
    }
    try {
      await $fetch('/api/mood', { method: 'POST', body: { mood, id: status.profile?.id } })
    } catch {
      // 오프라인: 몇 명 덜 세어도 괜찮다
    }
  }

  /** 오늘 그 마음으로 실을 묶은 사람 수 (나 포함). 아직 모르면 undefined */
  function moodCount(mood: MoodId): number | undefined {
    const date = seoulDateKey()
    const mine = loadMoodSent()
    return moodCountFor(snapshot.value, mood, date, mine?.date === date && mine.mood === mood ? mine.at : undefined)
  }

  return { load, tieMood, moodCount }
}
