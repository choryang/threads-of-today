import { introThanksNotice, type IntroPhraseId } from '../../shared/intro'
import { personShareTitle, type DayPayload, type DayReply, type PersonPayload, type PublicShare } from '../../shared/share'

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

/** 내가 보낸 소개 링크 (관리 키는 이 기기에만). seen: 이미 알림으로 보여 준 고마워요 수 */
interface SentIntro {
  token: string
  manage: string
  personId: string
  seen: number
  at: number
}
/** 받은 소개 (사람 id → 소개해 준 사람 닉네임). 나중에 그 사람을 여정에서 만나면 "옥희님이 소개해준 분이에요" */
type ReceivedIntros = Record<string, { nickname: string; token: string; at: number }>
const SENT_INTROS = 'my-day-people:intros-sent'
const RECEIVED_INTROS = 'my-day-people:intros-received'
const MAX_SENT_INTROS = 50

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}
function writeJson(key: string, v: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(v))
  } catch {
    // 저장이 막힌 환경에서는 이번 방문 동안만
  }
}

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

  // ── 사람 카드 소개 ──

  /** 소개 링크를 만든다 (소개마다 따로). 서버를 쓸 수 없으면 null */
  async function introduce(personId: string, nickname: string, phraseId: IntroPhraseId, itemId?: string): Promise<{ url: string; title: string } | null> {
    const payload: PersonPayload = { personId, nickname, phraseId, ...(itemId ? { itemId } : {}) }
    try {
      const res = await $fetch<{ ok: boolean; token?: string; manage?: string; path?: string }>('/api/share', { method: 'POST', body: { kind: 'person', payload } })
      if (!res.ok || !res.token || !res.manage || !res.path) return null
      const sent = readJson<SentIntro[]>(SENT_INTROS, [])
      writeJson(SENT_INTROS, [{ token: res.token, manage: res.manage, personId, seen: 0, at: Date.now() }, ...sent].slice(0, MAX_SENT_INTROS))
      return { url: location.origin + res.path, title: personShareTitle(payload) }
    } catch {
      return null
    }
  }

  /** 내 소개로 새로 생긴 고마워요 알림 한 줄 (한 번만: 보여 준 수를 적어 둔다) */
  async function introNotice(nickname: string): Promise<string> {
    const sent = readJson<SentIntro[]>(SENT_INTROS, [])
    if (!sent.length) return ''
    try {
      const res = await $fetch<{ ok: boolean; counts?: number[] }>('/api/share/intro-thanks', { method: 'POST', body: { manages: sent.map((x) => x.manage) } })
      if (!res.ok || !res.counts) return ''
      const entries = sent.map((x, i) => ({ personId: x.personId, fresh: Math.max(0, (res.counts![i] ?? 0) - x.seen) }))
      writeJson(SENT_INTROS, sent.map((x, i) => ({ ...x, seen: Math.max(x.seen, res.counts![i] ?? 0) })))
      return introThanksNotice(entries, nickname)
    } catch {
      return ''
    }
  }

  async function openIntro(token: string): Promise<PersonPayload | null> {
    try {
      const res = await $fetch<{ ok: boolean; kind?: string; payload?: PersonPayload }>(`/api/share/${encodeURIComponent(token)}`)
      if (!res.ok || res.kind !== 'person' || !res.payload) return null
      const received = readJson<ReceivedIntros>(RECEIVED_INTROS, {})
      received[res.payload.personId] = { nickname: res.payload.nickname, token, at: Date.now() }
      writeJson(RECEIVED_INTROS, received)
      return res.payload
    } catch {
      return null
    }
  }

  /** 소개받은 사람이 가입 없이 고마워요 */
  async function thankIntro(token: string, userId?: string): Promise<boolean> {
    try {
      const res = await $fetch<{ ok: boolean }>(`/api/share/${encodeURIComponent(token)}/thank`, { method: 'POST', body: { id: userId } })
      return res.ok
    } catch {
      return false
    }
  }

  /** 이 사람을 소개해 준 사람 닉네임 (받은 소개가 없으면 '') */
  function introducedBy(personId: string): string {
    return readJson<ReceivedIntros>(RECEIVED_INTROS, {})[personId]?.nickname ?? ''
  }

  return { shareDay, open, showBack, myReplies, introduce, introNotice, openIntro, thankIntro, introducedBy }
}
