import type { DictEntry } from './index'

/**
 * 앱에 넣을 가벼운 물건 사전. 전체 사전(dictionary.json)에서 물건마다 한마디(voices)를 첫 번째 하나만 남긴다.
 * 1,454개 기준 전체 약 120KB(gzip) → 약 52KB(gzip). 매칭에 쓰는 이름·별칭·재료는 그대로라 서버와 같은 결과가 나온다.
 * scripts/build-client-dictionary.ts가 shared/data/dictionary-client.json으로 쓴다.
 */
export function slimDictionary(entries: DictEntry[]): DictEntry[] {
  return entries.map(({ voices, ...entry }) => (voices?.length ? { ...entry, voices: [voices[0]!] } : entry))
}
