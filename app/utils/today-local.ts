/**
 * 기기에만 남는 것 (docs/redesign/README.md "저장"): 오늘의 한 줄, 직접 쓴 한마디.
 * 서버 동기화(Save)·로그·공유 어디에도 넣지 않는다. 저장소를 못 쓰면 이번 방문 동안만 기억한다
 */
const KEY = 'my-day-people:today-local'

export interface LocalDay {
  note?: string
  own?: string
}

let memory: Record<string, LocalDay> = {}

function read(): Record<string, LocalDay> {
  try {
    const raw = window.localStorage.getItem(KEY)
    const v = raw ? JSON.parse(raw) : {}
    return v && typeof v === 'object' ? v : {}
  } catch {
    return memory
  }
}

export function localDay(date: string): LocalDay {
  return read()[date] ?? {}
}

export function setLocalDay(date: string, patch: LocalDay) {
  const all = read()
  const next = { ...all[date], ...patch }
  for (const k of Object.keys(next) as Array<keyof LocalDay>) if (!next[k]) delete next[k]
  all[date] = next
  memory = all
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // 이번 방문 동안만
  }
}
