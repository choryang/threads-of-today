/**
 * AI 분해 응답 시간 재기: node --env-file=.env --import tsx scripts/time-ai.ts [횟수]
 * 사전·대표 물건으로 잡히지 않는 입력만 골라 Claude를 직접 부르고, 걸린 시간과 토큰 수를 적는다.
 * 캐시·하루 한도는 거치지 않는다(서버 경로가 아니라 decomposeWithClaude만 부른다).
 */
import dictionary from '../shared/data/dictionary.json'
import { createMatcher, productEntries, type DictEntry } from '../shared/match'
import { decomposeWithClaude } from '../server/utils/decompose'

const INPUTS = ['고양이 털', '비 오는 날', '첫사랑', '퇴근길 노을', '할머니 잔소리', '시험 끝난 날', '새벽 세 시', '눈사람', '여름 방학', '첫 월급날', '버스 정류장', '이불 밖은 위험해', '운동회 날', '졸업식 꽃다발', '단풍 구경', '야식 생각']

const apiKey = process.env.NUXT_ANTHROPIC_API_KEY
const model = process.env.NUXT_ANTHROPIC_MODEL || 'claude-haiku-5-5'
if (!apiKey) {
  console.error('NUXT_ANTHROPIC_API_KEY가 없어요')
  process.exit(1)
}

const matcher = createMatcher([...productEntries(), ...(dictionary as DictEntry[])])
const count = Number(process.argv[2]) || 8
const inputs = INPUTS.filter((t) => !matcher.match(t)).slice(0, count)

const rows: Array<{ text: string; ms: number; input?: number; output?: number; name?: string }> = []
for (const text of inputs) {
  let usage: { input_tokens?: number; output_tokens?: number } = {}
  const fetchImpl: typeof fetch = async (url, init) => {
    const res = await fetch(url, init)
    const body = await res.clone().json().catch(() => ({}))
    usage = body?.usage ?? {}
    return res
  }
  const t0 = performance.now()
  const result = await decomposeWithClaude({ text }, { apiKey, model, fetchImpl })
  const ms = Math.round(performance.now() - t0)
  rows.push({ text, ms, input: usage.input_tokens, output: usage.output_tokens, name: result.ok ? result.name : `실패: ${result.message}` })
}

const sorted = rows.map((r) => r.ms).sort((a, b) => a - b)
const median = sorted[Math.floor(sorted.length / 2)] ?? 0
console.table(rows)
console.log(`모델 ${model} · ${rows.length}회 · 중앙값 ${median}ms · 최소 ${sorted[0]}ms · 최대 ${sorted[sorted.length - 1]}ms`)
