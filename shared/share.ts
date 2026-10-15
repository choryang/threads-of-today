/**
 * 공유 링크 (나의 하루 유형 /d, 이후 사람 카드 소개 /p, 마을 초대 /v). 종류마다 TTL·주소·내용 검사가 다르고 구조는 같다.
 *
 *   share:{token}           { kind, payload, createdAt, expiresAt, owner }  (owner = 관리 키의 SHA-256)
 *   share-owner:{owner}     → 지금 살아 있는 token (재발급하면 이전 token을 지운다)
 *   share-replies:{token}   받은 사람이 '보여주기'를 누른 답 목록
 *
 * 관리 키는 링크를 만든 기기에만 남는다(재발급·답 읽기에 쓴다). 서버는 해시만 안다.
 * 복구 코드나 사용자 id는 토큰·저장 값·응답·로그 어디에도 넣지 않는다: 이 모듈은 그 값을 받지도 않는다.
 * 저장소는 넘겨받는다(createShares): 서버는 KV, 테스트는 메모리.
 */
import { DAY_TYPES, dayTypeOf, isValidPick, type DayTypeId } from './day-type'
import { normalizeNickname } from './nickname'

export type ShareKind = 'day' | 'person' | 'village'

const DAY = 24 * 60 * 60

export interface DayPayload {
  /** 고른 테스트 물건 id */
  items: string[]
  type: DayTypeId
  nickname: string
}

export interface ShareKindSpec<P> {
  /** 링크 주소의 앞부분 (/d/{token}) */
  path: string
  /** 링크가 살아 있는 시간(초) */
  ttl: number
  /** 믿을 수 없는 입력을 다듬는다. 틀리면 null */
  validate: (raw: unknown) => P | null
}

/** 하루 유형: 고른 물건으로 유형을 다시 계산해 넣는다(보낸 값의 유형을 믿지 않는다) */
function validateDay(raw: unknown): DayPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!isValidPick(r.items)) return null
  const nickname = normalizeNickname(r.nickname)
  if (!nickname) return null
  return { items: [...r.items], type: dayTypeOf(r.items), nickname }
}

export const SHARE_KINDS: { day: ShareKindSpec<DayPayload>; person: ShareKindSpec<never>; village: ShareKindSpec<never> } = {
  day: { path: '/d', ttl: 30 * DAY, validate: validateDay },
  // 사람 카드 소개·마을 초대: 아직 내용이 정해지지 않아 받지 않는다 (TTL과 주소만 먼저 정해 둔다)
  person: { path: '/p', ttl: 30 * DAY, validate: () => null },
  village: { path: '/v', ttl: 7 * DAY, validate: () => null },
}

export const isShareKind = (v: unknown): v is ShareKind => v === 'day' || v === 'person' || v === 'village'

/** 받은 사람의 답 ('보여주기'를 눌렀을 때만) */
export interface DayReply {
  items: string[]
  type: DayTypeId
  nickname: string
  at: number
}
export const MAX_REPLIES = 20

export function validateReply(raw: unknown, now: number): DayReply | null {
  const day = validateDay(raw)
  return day ? { ...day, at: now } : null
}

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

export function createShares(store: ShareStore, clock: () => number = Date.now) {
  const shareKey = (token: string) => `share:${token}`
  const ownerKey = (owner: string) => `share-owner:${owner}`
  const repliesKey = (token: string) => `share-replies:${token}`

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
    if (old) await Promise.all([store.del(shareKey(old)), store.del(repliesKey(old))])
    const token = newToken()
    const now = clock()
    const rec: ShareRecord = { kind, payload, createdAt: now, expiresAt: now + spec.ttl * 1000, owner }
    await store.set(shareKey(token), JSON.stringify(rec), spec.ttl)
    await store.set(ownerKey(owner), token, spec.ttl)
    return { token, manage: key, path: `${spec.path}/${token}`, expiresAt: rec.expiresAt }
  }

  /** 링크를 연 사람에게 보여 줄 내용 */
  async function lookup(token: string): Promise<PublicShare | null> {
    const rec = await read(token)
    return rec ? { kind: rec.kind, payload: rec.payload, expiresAt: rec.expiresAt } : null
  }

  /** 받은 사람이 '보여주기'를 눌렀을 때만 보낸 사람에게 남긴다 */
  async function reply(token: string, raw: unknown): Promise<boolean> {
    const rec = await read(token)
    if (!rec || rec.kind !== 'day') return false
    const r = validateReply(raw, clock())
    if (!r) return false
    const list = JSON.parse((await store.get(repliesKey(token))) ?? '[]') as DayReply[]
    const next = [...list, r].slice(-MAX_REPLIES)
    await store.set(repliesKey(token), JSON.stringify(next), Math.max(1, Math.ceil((rec.expiresAt - clock()) / 1000)))
    return true
  }

  /** 보낸 사람이 자기 링크의 답을 읽는다 (관리 키로) */
  async function replies(manage: string): Promise<{ token: string; replies: DayReply[] } | null> {
    if (!isManageKey(manage)) return null
    const token = await store.get(ownerKey(await sha256(manage)))
    if (!token || !(await read(token))) return null
    return { token, replies: JSON.parse((await store.get(repliesKey(token))) ?? '[]') as DayReply[] }
  }

  return { issue, lookup, reply, replies }
}

/** OG 제목: "노을의 찻잎님의 하루는 '목장에서 온 하루'예요" */
export function dayShareTitle(p: DayPayload): string {
  return `${p.nickname}님의 하루는 '${DAY_TYPES[p.type].name}'예요`
}
