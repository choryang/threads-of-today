import type { DayPayload, DayReply, PublicShare } from '../../shared/share'

/**
 * 공유 링크 (shared/share.ts · server/api/share). 이 기기가 만든 링크의 관리 키는 localStorage에만 둔다.
 * 하루 유형 링크는 기기마다 하나: 같은 결과면 그 링크를 다시 쓰고, 결과가 바뀌면 다시 만들어 이전 링크를 닫는다.
 */
const KEY = 'my-day-people:shares'

interface Mine {
  token: string
  manage: string
  path: string
  expiresAt: number
  /** 이 링크에 담은 결과 (같으면 다시 쓴다) */
  sig: string
}

function loadMine(): Partial<Record<'day', Mine>> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}
function saveMine(v: Partial<Record<'day', Mine>>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    // 저장이 막히면 다음에 새 링크를 만든다
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

export function useShare() {
  /** 하루 유형 링크 주소. 서버를 쓸 수 없으면 null */
  async function shareDay(items: string[], nickname: string): Promise<{ url: string } | null> {
    const mine = loadMine()
    const sig = `${[...items].sort().join(',')}|${nickname}`
    const cur = mine.day
    if (cur && cur.sig === sig && cur.expiresAt - Date.now() > DAY_MS) return { url: location.origin + cur.path }
    try {
      const res = await $fetch<{ ok: boolean; token?: string; manage?: string; path?: string; expiresAt?: number }>('/api/share', {
        method: 'POST',
        body: { kind: 'day', payload: { items, nickname }, ...(cur ? { manage: cur.manage } : {}) },
      })
      if (!res.ok || !res.token || !res.manage || !res.path || !res.expiresAt) return null
      mine.day = { token: res.token, manage: res.manage, path: res.path, expiresAt: res.expiresAt, sig }
      saveMine(mine)
      return { url: location.origin + res.path }
    } catch {
      return null
    }
  }

  async function open(token: string): Promise<PublicShare<DayPayload> | null> {
    try {
      const res = await $fetch<{ ok: boolean } & Partial<PublicShare<DayPayload>>>(`/api/share/${encodeURIComponent(token)}`)
      return res.ok && res.kind === 'day' && res.payload ? { kind: 'day', payload: res.payload, expiresAt: res.expiresAt ?? 0 } : null
    } catch {
      return null
    }
  }

  /** 받은 사람이 '보여주기'를 눌렀을 때만 */
  async function showBack(token: string, items: string[], nickname: string): Promise<boolean> {
    try {
      const res = await $fetch<{ ok: boolean }>(`/api/share/${encodeURIComponent(token)}/reply`, { method: 'POST', body: { items, nickname } })
      return res.ok
    } catch {
      return false
    }
  }

  /** 내 링크에 친구들이 보여 준 하루 */
  async function myReplies(): Promise<{ items: string[] | null; replies: DayReply[] }> {
    const cur = loadMine().day
    if (!cur || cur.expiresAt < Date.now()) return { items: null, replies: [] }
    try {
      const res = await $fetch<{ ok: boolean; replies?: DayReply[] }>('/api/share/replies', { method: 'POST', body: { manage: cur.manage } })
      return { items: cur.sig.split('|')[0]!.split(','), replies: res.ok ? res.replies ?? [] : [] }
    } catch {
      return { items: null, replies: [] }
    }
  }

  return { shareDay, open, showBack, myReplies }
}
