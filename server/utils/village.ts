import { seoulDateKey } from '../../shared/logic'
import type { VillagePayload } from '../../shared/share'
import { FLOWER_KEEP, FLOWER_PUBLIC, FLOWER_TTL_DAYS, type Flower } from '../../shared/visit'
import { recordGratitude } from './gratitude'
import { kv, setIfAbsent } from './kv'
import { shares } from './share'

/**
 * 마을 꽃. 링크가 아니라 마을(링크를 만든 사람의 관리 키 해시)에 붙어서, 초대 링크를 새로 만들어도 꽃은 남는다.
 *   village-flowers:{owner}                 최근 꽃 200개 (60일)
 *   village-flower-day:{owner}:{날짜}:{누가}  같은 방문자는 같은 마을에 하루 한 송이 (2일 뒤 만료)
 */
const DAY = 24 * 60 * 60
const flowersKey = (owner: string) => `village-flowers:${owner}`

async function readAll(owner: string): Promise<Flower[]> {
  const v = await kv().getItem<string | Flower[]>(flowersKey(owner))
  if (!v) return []
  return typeof v === 'string' ? (JSON.parse(v) as Flower[]) : v
}

/** 공개용 마을: 닉네임, 주민 id(주인 마을의 자리 순서), 단짝(100%) 주민 id, 최근 꽃만 */
export async function publicVillage(token: string): Promise<({ open: true } & VillagePayload & { flowers: Flower[] }) | { open: false; nickname: string } | null> {
  const found = await shares.lookup(token)
  if (!found || found.kind !== 'village') return null
  const p = found.payload as VillagePayload
  if (!p.open) return { open: false, nickname: p.nickname }
  const owner = await shares.ownerOf(token)
  const flowers = owner ? (await readAll(owner)).slice(-FLOWER_PUBLIC) : []
  return { open: true, nickname: p.nickname, residents: p.residents, bestFriends: p.bestFriends ?? [], flowers }
}

/** 주인이 자기 마을 꽃을 읽는다 (방문 받기를 꺼도 읽을 수 있게 관리 키로) */
export async function ownerFlowers(owner: string): Promise<Flower[]> {
  return (await readAll(owner)).slice(-FLOWER_PUBLIC)
}

export type FlowerResult = 'ok' | 'already' | 'closed' | 'invalid'

/** 꽃 한 송이. 전체 감사 수(B)에도 더한다 */
export async function leaveFlower(token: string, personId: string, nickname: string, who: string, now = Date.now()): Promise<FlowerResult> {
  const found = await shares.lookup(token)
  if (!found || found.kind !== 'village') return 'invalid'
  const p = found.payload as VillagePayload
  if (!p.open) return 'closed'
  if (!p.residents.includes(personId)) return 'invalid'
  const owner = await shares.ownerOf(token)
  if (!owner) return 'invalid'
  const date = seoulDateKey(now)
  if (!(await setIfAbsent(`village-flower-day:${owner}:${date}:${who}`, '1', 2 * DAY))) return 'already'
  const list = await readAll(owner)
  const next = [...list, { nickname, personId, date, at: now }].slice(-FLOWER_KEEP)
  await kv().setItem(flowersKey(owner), JSON.stringify(next), { ttl: FLOWER_TTL_DAYS * DAY })
  await recordGratitude(personId, who, now)
  return 'ok'
}
