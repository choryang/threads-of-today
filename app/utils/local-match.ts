import clientDictionary from '../../shared/data/dictionary-client.json'
import { createMatcher, productEntries, type DictEntry, type MatchResult } from '../../shared/match'

/**
 * 화면에서 바로 하는 분해. 대표 물건 + 앱용 물건 사전(dictionary-client.json)으로 서버와 같은 매칭을 돌린다.
 * 여기서 잡히면 서버를 거치지 않고 즉시 결과를 보여 주고, 못 잡을 때만 /api/decompose(캐시 → AI)로 보낸다.
 */
const matcher = createMatcher([...productEntries(), ...(clientDictionary as DictEntry[])])

/** 서버와 같은 길이 제한(60자)으로 자른 뒤 찾는다 */
export function matchLocal(text: string): MatchResult | null {
  const value = text.trim().slice(0, 60)
  return value ? matcher.match(value) : null
}
