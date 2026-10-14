import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { dateKey } from '../../shared/logic'
import { emptySave, mergeSaves, sanitizeSave, type Save } from '../../shared/progress'
import { generateRecoveryCode } from '../../shared/recovery'
import { kv, setIfAbsent } from './kv'

/**
 * 익명 사용자. 로그인 없이 기기에서 만든 id와 기기별 비밀값으로 진행 상황을 동기화한다.
 *
 * 저장 키
 *   user:{id}   UserRecord (메타 + 진행 상황을 한 값에 담아 동기화가 GET 1번, SET 1번으로 끝나게 한다)
 *   code:{code} → id (복구 코드로 다른 기기에서 이어 하기)
 *
 * 나중에 카카오·구글 로그인을 붙일 때 (지금은 구현하지 않음)
 *   account:{provider}:{subject} → id 키를 추가하고, 로그인한 계정을 UserRecord.accounts에 적는다.
 *   - 그 계정 키가 없으면: 지금 기기의 익명 id에 계정을 연결한다(진행 상황 그대로).
 *   - 이미 다른 id에 연결돼 있으면: 그 id로 갈아타고 두 진행 상황을 mergeSaves로 합친다.
 *   익명 id와 기기 비밀값 구조는 그대로 두고, 로그인은 "id를 찾는 또 하나의 방법"으로만 쓴다.
 */
export interface LinkedAccount {
  provider: 'kakao' | 'google'
  /** 제공자가 주는 사용자 고유값 (sub) */
  subject: string
  linkedAt: string
}

export interface DeviceKey {
  /** 기기 비밀값의 SHA-256 */
  hash: string
  addedAt: string
}

export interface UserRecord {
  id: string
  code: string
  createdAt: string
  updatedAt: string
  /** 복구 코드 키의 유효 기간을 마지막으로 늘린 달(YYYY-MM)과 그때 쓴 유효 기간(초) */
  codeTouchedAt: string
  codeTtl: number
  devices: DeviceKey[]
  accounts: LinkedAccount[]
  save: Save
}

const DAY = 24 * 60 * 60
/** 진행 기록이 없는 새 사용자는 30일, 동기화한 사용자는 마지막 동기화부터 400일 동안 남긴다 */
const NEW_USER_TTL = 30 * DAY
const USER_TTL = 400 * DAY
const MAX_DEVICES = 5
export const MAX_SAVE_BYTES = 200_000

const ID = /^u_[A-Za-z0-9_-]{24}$/
export const isUserId = (v: unknown): v is string => typeof v === 'string' && ID.test(v)

const userKey = (id: string) => `user:${id}`
const codeKey = (code: string) => `code:${code}`
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
const newSecret = () => randomBytes(24).toString('base64url')

function deviceMatches(user: UserRecord, secret: unknown): boolean {
  if (typeof secret !== 'string' || !secret) return false
  const hash = Buffer.from(sha256(secret))
  return user.devices.some((d) => {
    const stored = Buffer.from(d.hash)
    return stored.length === hash.length && timingSafeEqual(stored, hash)
  })
}

function addDevice(user: UserRecord, secret: string) {
  user.devices = [...user.devices, { hash: sha256(secret), addedAt: dateKey() }].slice(-MAX_DEVICES)
}

const hasProgress = (s: Save) => Object.keys(s.cards).length > 0 || Object.keys(s.days).length > 0

/** (SET 1, 복구 코드 키의 유효 기간을 늘려야 할 때만 SET 1번 더) */
async function store(user: UserRecord) {
  const ttl = hasProgress(user.save) ? USER_TTL : NEW_USER_TTL
  // 복구 코드 키도 사용자와 함께 살아 있어야 한다. 달이 바뀌었거나 유효 기간 단계가 바뀌었을 때만 늘린다
  const month = dateKey().slice(0, 7)
  const touchCode = user.codeTouchedAt !== month || user.codeTtl !== ttl
  user.codeTouchedAt = month
  user.codeTtl = ttl
  await kv().setItem(userKey(user.id), user, { ttl })
  if (touchCode) await kv().setItem(codeKey(user.code), user.id, { ttl })
}

export interface Identity {
  id: string
  secret: string
  code: string
}

/** 새 익명 사용자. (SET NX 1 + SET 1, 처음부터 기록이 있으면 코드 유효 기간을 늘리는 SET 1번 더) */
export async function createUser(initial: unknown): Promise<Identity & { save: Save }> {
  const today = dateKey()
  const id = `u_${randomBytes(18).toString('base64url')}`
  let code = generateRecoveryCode()
  for (let i = 0; !(await setIfAbsent(codeKey(code), id, NEW_USER_TTL)); i++) {
    if (i >= 4) throw new Error('복구 코드를 만들지 못했어요')
    code = generateRecoveryCode()
  }
  const secret = newSecret()
  const user: UserRecord = {
    id,
    code,
    createdAt: today,
    updatedAt: today,
    codeTouchedAt: today.slice(0, 7),
    codeTtl: NEW_USER_TTL,
    devices: [],
    accounts: [],
    save: sanitizeSave(initial, today),
  }
  addDevice(user, secret)
  await store(user)
  return { id, secret, code, save: user.save }
}

/** 기기의 진행 상황을 서버 것과 합쳐 저장하고 합친 결과를 돌려준다. (GET 1 + SET 1) */
export async function syncUser(id: string, secret: unknown, incoming: unknown): Promise<{ save: Save; code: string } | null> {
  const user = await kv().getItem<UserRecord>(userKey(id))
  if (!user || !deviceMatches(user, secret)) return null
  const today = dateKey()
  user.save = mergeSaves(sanitizeSave(user.save, today), sanitizeSave(incoming, today), today)
  user.updatedAt = today
  await store(user)
  return { save: user.save, code: user.code }
}

/** 복구 코드로 다른 기기에서 이어 하기. 이 기기용 비밀값을 새로 발급하고, 이 기기의 기록도 합친다. (GET 2 + SET 1) */
export async function restoreUser(code: string, incoming: unknown): Promise<(Identity & { save: Save }) | null> {
  const id = await kv().getItem<string>(codeKey(code))
  if (!isUserId(id)) return null
  const user = await kv().getItem<UserRecord>(userKey(id))
  if (!user) return null
  const today = dateKey()
  const secret = newSecret()
  addDevice(user, secret)
  user.save = mergeSaves(sanitizeSave(user.save, today), sanitizeSave(incoming ?? emptySave(), today), today)
  user.updatedAt = today
  await store(user)
  return { id, secret, code: user.code, save: user.save }
}
