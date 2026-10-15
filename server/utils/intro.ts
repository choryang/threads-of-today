import type { PersonPayload } from '../../shared/share'
import { recordGratitude } from './gratitude'
import { incrementCounter, readCounters, setIfAbsent } from './kv'
import { shares } from './share'

/**
 * 사람 카드 소개의 고마워요. 소개 링크마다 센다(보낸 사람에게 "누군가 …의 소개로 고마워했어요"를 보여 주려고).
 *   intro-thanks:{token}            그 링크에서 고마워한 수 (링크와 같은 기간)
 *   intro-thanked:{token}:{누가}     같은 기기·IP는 한 링크에 한 번
 * 전체 감사 수(B)에도 더한다.
 */
const countKey = (token: string) => `intro-thanks:${token}`

export async function thankIntro(token: string, who: string, now = Date.now()): Promise<{ count: number; counted: boolean } | null> {
  const found = await shares.lookup(token)
  if (!found || found.kind !== 'person') return null
  const ttl = Math.max(60, Math.ceil((found.expiresAt - now) / 1000))
  const first = await setIfAbsent(`intro-thanked:${token}:${who}`, '1', ttl)
  if (!first) return { count: (await readCounters([countKey(token)]))[0] ?? 0, counted: false }
  const count = await incrementCounter(countKey(token), ttl)
  await recordGratitude((found.payload as PersonPayload).personId, who, now)
  return { count, counted: true }
}

/** 보낸 사람이 자기 소개 링크들의 고마워요 수를 읽는다 (관리 키마다, 순서대로). 사라진 링크는 0 */
export async function introCounts(manages: string[]): Promise<number[]> {
  const tokens = await Promise.all(manages.map((m) => shares.tokenOf(m)))
  const counts = await readCounters(tokens.map((t) => (t ? countKey(t) : 'intro-thanks:none')))
  return tokens.map((t, i) => (t ? counts[i] ?? 0 : 0))
}
