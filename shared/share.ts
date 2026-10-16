/**
 * 공유 링크: 오늘의 실(/t). 예전 기획의 /d·/p·/v 링크는 server/routes에서 첫 화면으로 보낸다.
 *
 *   share:{token}           { kind, payload, createdAt, expiresAt, owner }  (owner = 관리 키의 SHA-256)
 *   share-owner:{owner}     → 지금 살아 있는 token (재발급하면 이전 token을 지운다)
 *
 * 관리 키는 링크를 만든 기기에만 남는다(재발급·카드 그림 올리기에 쓴다). 서버는 해시만 안다.
 * 복구 코드나 사용자 id는 토큰·저장 값·응답·로그 어디에도 넣지 않는다: 이 모듈은 그 값을 받지도 않는다.
 * 저장소는 넘겨받는다(createShares): 서버는 KV, 테스트는 메모리.
 */
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { MOODS, isMoodId, type MoodId } from './data/moods'
import { storyEpisodes } from './key-story'
import { placeLabel } from './rewind'

export type ShareKind = 'thread'

const DAY = 24 * 60 * 60

export interface ShareKindSpec<P> {
  /** 링크 주소의 앞부분 (/t/{token}) */
  path: string
  /** 링크가 살아 있는 시간(초) */
  ttl: number
  /** 믿을 수 없는 입력을 다듬는다. 틀리면 null */
  validate: (raw: unknown) => P | null
}

/**
 * 오늘의 실 (docs/redesign/README.md "공유"): 그날 만난 사람과 마음. 한 줄·직접 쓴 한마디·건넨 말은 담지 않는다.
 * 카드 그림(V2Quote)은 앱이 그려서 링크를 만든 기기에서만 올린다(api/share/[token]/image)
 */
export interface ThreadPayload {
  /** 서울 날짜 */
  date: string
  mood: MoodId
  personId: string
  /** 그날 본 편(0부터). 카드 문구로 만났으면 null */
  episode: number | null
  /** 물건 이름 */
  item: string
  /** 그 사람을 고른 방식. next(마음과 상관없이 다음 편)면 카드 머리말이 "오늘 내 하루에 닿은 사람" */
  how?: 'mood' | 'cell' | 'next' | 'none'
}

function validateThread(raw: unknown): ThreadPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !isMoodId(r.mood)) return null
  if (typeof r.personId !== 'string' || !PEOPLE[r.personId]) return null
  const episode = r.episode === null ? null : Number.isInteger(r.episode) && (r.episode as number) >= 0 && (r.episode as number) < storyEpisodes(r.personId).length ? (r.episode as number) : undefined
  if (episode === undefined) return null
  const item = typeof r.item === 'string' ? r.item.trim().slice(0, 40) : ''
  if (!item) return null
  const how = r.how === 'mood' || r.how === 'cell' || r.how === 'next' || r.how === 'none' ? r.how : undefined
  return { date: r.date, mood: r.mood, personId: r.personId, episode, item, ...(how ? { how } : {}) }
}

export const SHARE_KINDS: { thread: ShareKindSpec<ThreadPayload> } = {
  // 오늘의 실: 그날마다 링크 하나
  thread: { path: '/t', ttl: 30 * DAY, validate: validateThread },
}

export const isShareKind = (v: unknown): v is ShareKind => v === 'thread'

// ── 토큰 ──

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const TOKEN_LENGTH = 10
const TOKEN = new RegExp(`^[${ALPHABET}]{${TOKEN_LENGTH}}$`)
export const isToken = (v: unknown): v is string => typeof v === 'string' && TOKEN.test(v)

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export const newToken = () => randomString(TOKEN_LENGTH)
/** 관리 키: 링크를 만든 기기에만 남는다 */
export const newManageKey = () => randomString(32)
const MANAGE = new RegExp(`^[${ALPHABET}]{32}$`)
export const isManageKey = (v: unknown): v is string => typeof v === 'string' && MANAGE.test(v)

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

// ── 저장 ──

export interface ShareStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

export interface ShareRecord<P = unknown> {
  kind: ShareKind
  payload: P
  createdAt: number
  expiresAt: number
  owner: string
}

/** 받는 사람에게 보여 줄 것 (owner는 내보내지 않는다) */
export interface PublicShare<P = unknown> {
  kind: ShareKind
  payload: P
  expiresAt: number
}

// ── 저장 ──

export interface ShareStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

export interface ShareRecord<P = unknown> {
  kind: ShareKind
  payload: P
  createdAt: number
  expiresAt: number
  owner: string
}

/** 받는 사람에게 보여 줄 것 (owner는 내보내지 않는다) */
export interface PublicShare<P = unknown> {
  kind: ShareKind
  payload: P
  expiresAt: number
}

export function createShares(store: ShareStore, clock: () => number = Date.now) {
  const shareKey = (token: string) => `share:${token}`
  const ownerKey = (owner: string) => `share-owner:${owner}`

  async function read(token: string): Promise<ShareRecord | null> {
    if (!isToken(token)) return null
    const raw = await store.get(shareKey(token))
    if (!raw) return null
    const rec = JSON.parse(raw) as ShareRecord
    // TTL을 지키지 않는 저장소(개발용 파일)도 있어서 만료 시각을 한 번 더 본다
    return rec.expiresAt > clock() ? rec : null
  }

  /** 새 링크. 이 관리 키로 만든 링크가 있으면 그 링크는 지운다(재발급) */
  async function issue(kind: ShareKind, rawPayload: unknown, manage?: string): Promise<{ token: string; manage: string; path: string; expiresAt: number } | null> {
    const spec = SHARE_KINDS[kind] as ShareKindSpec<unknown>
    const payload = spec.validate(rawPayload)
    if (!payload) return null
    const key = isManageKey(manage) ? manage : newManageKey()
    const owner = await sha256(key)
    const old = await store.get(ownerKey(owner))
    if (old) await store.del(shareKey(old))
    const token = newToken()
    const now = clock()
    const rec: ShareRecord = { kind, payload, createdAt: now, expiresAt: now + spec.ttl * 1000, owner }
    await store.set(shareKey(token), JSON.stringify(rec), spec.ttl)
    await store.set(ownerKey(owner), token, spec.ttl)
    return { token, manage: key, path: `${spec.path}/${token}`, expiresAt: rec.expiresAt }
  }

  /** 서버 안에서만: 이 관리 키가 이 링크를 만든 기기의 것인지 (카드 그림 올리기) */
  async function manages(token: string, manage: unknown): Promise<ShareRecord | null> {
    if (!isManageKey(manage)) return null
    const rec = await read(token)
    return rec && rec.owner === (await sha256(manage)) ? rec : null
  }

  /** 링크를 연 사람에게 보여 줄 내용 */
  async function lookup(token: string): Promise<PublicShare | null> {
    const rec = await read(token)
    return rec ? { kind: rec.kind, payload: rec.payload, expiresAt: rec.expiresAt } : null
  }

  return { issue, lookup, manages }
}

// ── 오늘의 실 ──

/** 인용: 그 편(없으면 카드 문구)의 첫 문장 */
export function threadQuote(p: Pick<ThreadPayload, 'personId' | 'episode'>): string {
  const text = p.episode === null ? PEOPLE[p.personId]?.story ?? '' : storyEpisodes(p.personId)[p.episode] ?? ''
  return (/^.*?[.?!](?=\s|$)/.exec(text)?.[0] ?? text).trim()
}

/** '에티오피아 시다마의 알마즈' */
export function threadWho(p: Pick<ThreadPayload, 'personId'>): string {
  const person = PEOPLE[p.personId]
  const place = PLACES[person?.placeId ?? '']
  return `${place ? placeLabel(place) : ''}의 ${person?.name ?? person?.job ?? ''}`
}

/** 카드 머리말: 마음으로 고른 사람이면 '오늘 나와 같은 하루를 보낸 사람', 다음 편으로 만난 사람(next)이면 '오늘 내 하루에 닿은 사람' */
export function threadHeader(p: Pick<ThreadPayload, 'how'>): string {
  return p.how === 'next' ? '오늘 내 하루에 닿은 사람' : '오늘 나와 같은 하루를 보낸 사람'
}

/** OG 제목·설명 */
export function threadShareTitle(p: ThreadPayload): string {
  return `${threadHeader(p)}, ${threadWho(p)}`
}
export function threadShareLine(p: ThreadPayload): string {
  return `${MOODS[p.mood].past} 날, ${withEuro(p.item)} 이어진 사람. 당신의 오늘은 어땠어요?`
}

/** '라면으로' · '커피로' · '물로'(ㄹ 받침은 '로') */
export function withEuro(word: string): string {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return `${word}로`
  const batchim = (last - 0xac00) % 28
  return `${word}${batchim === 0 || batchim === 8 ? '로' : '으로'}`
}
