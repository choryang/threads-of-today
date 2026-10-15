import { MOODS } from '../../shared/data/moods'
import { sceneOf, sceneSrc } from '../../shared/data/scenes'
import type { TodayRecord } from '../../shared/progress'
import { threadHeader, threadQuote, threadWho, withEuro, type ThreadPayload } from '../../shared/share'
import { recordEpisode, recordHow } from '../../shared/today-log'
import { shortDate } from '../../shared/today-text'
import { drawQuoteCard } from '../utils/share-image'

/**
 * 오늘의 실 공유 (docs/redesign/README.md "공유"): 그날마다 링크 하나(/t/{token}), 카드 그림(V2Quote)은 이 기기가 그려서 올린다.
 * 담는 것: 날짜·마음·사람·편·물건. 한 줄과 직접 쓴 한마디는 담지 않는다. 관리 키는 이 기기에만(localStorage)
 */
const KEY = 'my-day-people:thread-shares'

interface Mine {
  token: string
  manage: string
  path: string
  expiresAt: number
  /** 카드 그림을 올렸는지 */
  image: boolean
}

function load(): Record<string, Mine> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}
function save(v: Record<string, Mine>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    // 저장이 막히면 다음에 새 링크를 만든다
  }
}

export function threadPayload(date: string, rec: TodayRecord): ThreadPayload {
  return { date, mood: rec.mood, personId: rec.personId, episode: recordEpisode(rec), item: rec.item, how: recordHow(rec) }
}

/** 카드 그림을 캔버스에 그린다 */
export async function drawThreadCard(canvas: HTMLCanvasElement, p: ThreadPayload) {
  const scene = sceneOf(p.personId)
  await drawQuoteCard(canvas, {
    date: shortDate(p.date),
    moodPast: MOODS[p.mood].past,
    moodColor: MOODS[p.mood].color,
    sceneSrc: scene ? sceneSrc(scene.id) : undefined,
    who: threadWho(p),
    quote: threadQuote(p),
    via: `${withEuro(p.item)} 이어진 사람`,
    header: threadHeader(p),
  })
}

export function useThreadShare() {
  /** 그날의 링크 주소 (없으면 만들고, 카드 그림을 아직 안 올렸으면 올린다). 서버를 쓸 수 없으면 null */
  async function linkFor(date: string, rec: TodayRecord, canvas: HTMLCanvasElement): Promise<string | null> {
    const mine = load()
    let cur = mine[date]
    try {
      if (!cur || cur.expiresAt - Date.now() < 60_000) {
        const res = await $fetch<{ ok: boolean; token?: string; manage?: string; path?: string; expiresAt?: number }>('/api/share', {
          method: 'POST',
          body: { kind: 'thread', payload: threadPayload(date, rec) },
        })
        if (!res.ok || !res.token || !res.manage || !res.path || !res.expiresAt) return null
        cur = { token: res.token, manage: res.manage, path: res.path, expiresAt: res.expiresAt, image: false }
        mine[date] = cur
        save(mine)
      }
      if (!cur.image) {
        const image = canvas.toDataURL('image/jpeg', 0.82)
        const up = await $fetch<{ ok: boolean }>(`/api/share/${cur.token}/image`, { method: 'POST', body: { manage: cur.manage, image } }).catch(() => ({ ok: false }))
        if (up.ok) {
          cur.image = true
          mine[date] = cur
          save(mine)
        }
      }
      return location.origin + cur.path
    } catch {
      return null
    }
  }
  return { linkFor }
}
