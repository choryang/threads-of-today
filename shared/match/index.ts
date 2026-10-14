/**
 * AI 없이 입력을 재료로 분해하는 매칭. 순수 함수라 서버와 클라이언트에서 함께 쓴다.
 *
 * 해석 순서 (앞에서 잡히면 거기서 끝)
 *   1. 정규화          normalize()로 공백·특수문자·흔한 수식어 제거
 *   2. exact          사전 항목(대표 물건 등)·재료 별칭과 정확 일치
 *   3. synonym        동의어 사전으로 바꾼 뒤 정확 일치
 *   4. typo           자모 편집 거리로 오타 허용 (짧은 단어일수록 엄격)
 *   5. compound       사전 단어로 가장 긴 것부터 쪼개 2개 이상 잡히면 재료를 합침
 *   6. partial        재료 별칭(2글자 이상) 부분 일치
 */
import { MATERIAL_LIST, PRODUCTS } from '../data/materials'
import { SYNONYM_GROUPS } from '../data/synonyms'
import { MAX_MATERIALS, type Decomposed } from '../logic'
import { editDistance, hasSyllable, toJamo } from './hangul'
import { compact, normalize } from './normalize'

export { compact, normalize } from './normalize'

export type MatchVia = 'exact' | 'synonym' | 'typo' | 'compound' | 'partial'

export interface MatchResult extends Decomposed {
  /** 어느 단계에서 잡혔는지 (디버깅용) */
  via: MatchVia
  /** 잡힌 사전 항목 key. 재료 별칭이나 합성어로 잡혔으면 정규화한 입력 */
  key: string
}

/** 사전 항목. 대표 물건과 (2단계의) 미리 만든 물건 사전이 같은 모양을 쓴다. */
export interface DictEntry {
  key: string
  name: string
  aliases: string[]
  materialIds: string[]
  twist?: string
  voices?: string[]
}

export function productEntries(): DictEntry[] {
  return PRODUCTS.map((p) => ({ key: p.id, name: p.name, aliases: p.aliases, materialIds: p.materialIds }))
}

/** 낱말 하나가 가리키는 대상: 사전 항목 하나, 또는 그 별칭을 가진 재료들 */
type Target = { entry: DictEntry } | { materialIds: string[] }

const materialIdsOf = (t: Target) => ('entry' in t ? t.entry.materialIds : t.materialIds)

/** 자모 길이에 따른 오타 허용 개수. 짧은 단어는 한 글자만 달라도 다른 단어라 허용하지 않는다. */
function typoThreshold(jamoLength: number): number {
  if (jamoLength < 5) return 0
  if (jamoLength < 10) return 1
  return 2
}

/** 동의어를 대표 표기로 바꾼다. 1글자 표기는 입력 전체가 그 글자일 때만 바꾼다. */
function applySynonyms(s: string): string {
  for (const [canonical, ...variants] of SYNONYM_GROUPS) {
    for (const v of variants) {
      if (v.length < 2) {
        if (s === v) return canonical!
      } else if (s.includes(v) && !s.includes(canonical!)) {
        s = s.split(v).join(canonical)
      }
    }
  }
  return s
}

export function createMatcher(entries: DictEntry[]) {
  /** 사전 항목의 이름·별칭 → 항목 (먼저 나온 항목이 우선) */
  const entryWords = new Map<string, DictEntry>()
  for (const e of entries) {
    for (const w of [e.name, ...e.aliases].map(compact)) if (w && !entryWords.has(w)) entryWords.set(w, e)
  }
  /** 재료 이름·별칭 → 그 별칭을 가진 재료 id들 */
  const materialWords = new Map<string, string[]>()
  for (const m of MATERIAL_LIST) {
    for (const w of [m.name, ...m.aliases].map(compact)) {
      if (!w) continue
      const ids = materialWords.get(w) ?? []
      if (!ids.includes(m.id)) ids.push(m.id)
      materialWords.set(w, ids)
    }
  }

  /** 오타 비교·합성어 분해에 쓰는 2글자 이상 낱말 */
  const vocab = [...new Set([...entryWords.keys(), ...materialWords.keys()])].filter((w) => w.length >= 2)
  const vocabJamo = vocab.map((w) => ({ w, j: toJamo(w) }))
  const maxWordLength = Math.max(...vocab.map((w) => w.length))

  /** 정확 일치. 사전 항목이 재료 별칭보다 우선한다. */
  function lookup(word: string): Target | null {
    const entry = entryWords.get(word)
    if (entry) return { entry }
    const ids = materialWords.get(word)
    return ids ? { materialIds: ids } : null
  }

  /** 합성어 분해에서는 재료 별칭을 먼저 본다. ('참치김치김밥'의 '참치'가 참치캔의 철강까지 끌고 오지 않게) */
  function lookupPart(word: string): Target | null {
    const ids = materialWords.get(word)
    if (ids) return { materialIds: ids }
    const entry = entryWords.get(word)
    return entry ? { entry } : null
  }

  /** 왼쪽부터 가장 긴 낱말을 잘라 낸다. 어떤 낱말도 시작하지 않는 글자는 건너뛴다. */
  function segment(s: string): { parts: Target[]; covered: number } {
    const parts: Target[] = []
    let covered = 0
    let i = 0
    while (i < s.length) {
      let hit: Target | null = null
      let len = Math.min(maxWordLength, s.length - i)
      for (; len >= 2; len--) {
        hit = lookupPart(s.slice(i, i + len))
        if (hit) break
      }
      if (hit) {
        parts.push(hit)
        covered += len
        i += len
      } else {
        i++
      }
    }
    return { parts, covered }
  }

  function typo(s: string): DictEntry | string[] | null {
    const j = toJamo(s)
    const limit = typoThreshold(j.length)
    if (!limit) return null
    let best: { w: string; d: number } | null = null
    for (const v of vocabJamo) {
      const d = editDistance(j, v.j, Math.min(limit, typoThreshold(v.j.length)))
      if (d === 0 || d > Math.min(limit, typoThreshold(v.j.length))) continue
      if (!best || d < best.d || (d === best.d && entryWords.has(v.w) && !entryWords.has(best.w))) best = { w: v.w, d }
    }
    if (!best) return null
    const t = lookup(best.w)!
    return 'entry' in t ? t.entry : t.materialIds
  }

  function result(t: Target, via: MatchVia, key: string, display: string): MatchResult {
    if ('entry' in t) {
      const { entry } = t
      const voice = entry.voices?.length ? entry.voices[Math.floor(Math.random() * entry.voices.length)] : undefined
      return { name: entry.name, materialIds: entry.materialIds.slice(0, MAX_MATERIALS), twist: entry.twist, voice, via, key: entry.key }
    }
    return { name: display, materialIds: t.materialIds.slice(0, MAX_MATERIALS), via, key }
  }

  function match(input: string): MatchResult | null {
    const display = input.trim().slice(0, 20)
    const raw = compact(input)
    let s = normalize(input)
    if (!s || !hasSyllable(s)) return null

    // 2. 정확 일치 ('카페라떼'처럼 수식어처럼 보이는 글자가 이름의 일부일 수 있어 정규화 전 값도 본다)
    for (const cand of new Set([raw, s])) {
      const t = lookup(cand)
      if (t) return result(t, 'exact', cand, display)
    }

    // 3. 동의어
    const syn = applySynonyms(s)
    if (syn !== s) {
      s = syn
      const t = lookup(s)
      if (t) return result(t, 'synonym', s, display)
    }

    // 4. 오타. 단, 아는 낱말 2개 이상으로 빈틈없이 쪼개지면 오타가 아니라 합성어로 본다.
    const seg = segment(s)
    const isCompound = seg.parts.length >= 2 && seg.covered === s.length
    if (!isCompound) {
      const t = typo(s)
      if (t) return result(Array.isArray(t) ? { materialIds: t } : { entry: t }, 'typo', s, display)
    }

    // 5. 합성어
    if (seg.parts.length >= 2) {
      const ids = [...new Set(seg.parts.flatMap(materialIdsOf))]
      return result({ materialIds: ids }, 'compound', s, display)
    }

    // 6. 재료 별칭 부분 일치 (2글자 이상만)
    const ids: string[] = []
    for (const [w, mids] of materialWords) {
      if (w.length >= 2 && s.includes(w)) for (const id of mids) if (!ids.includes(id)) ids.push(id)
    }
    return ids.length ? result({ materialIds: ids }, 'partial', s, display) : null
  }

  return { match, segment, lookup }
}

const defaultMatcher = createMatcher(productEntries())

/** 대표 물건 사전으로 매칭한다. */
export const match = defaultMatcher.match
