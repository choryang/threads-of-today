/**
 * 미리 만드는 물건 사전: 시드 단어를 Claude Message Batches API로 한꺼번에 분해해 shared/data/dictionary.json에 쌓는다.
 *
 *   npx tsx scripts/build-dictionary.ts --dry-run          요청 본문 예시와 예상 비용만 출력 (API 호출 없음)
 *   npx tsx scripts/build-dictionary.ts --limit 50         시드 50개만 배치로 보낸다 (실행 전 확인을 받는다)
 *   npx tsx scripts/build-dictionary.ts --resume <batch>   이미 만든 배치의 결과만 다시 받아 사전에 반영한다
 *   npx tsx scripts/build-dictionary.ts --redo-missing 팥,감자   준비 중 재료에 이 이름이 있는 사전 항목만 다시 만든다 (재료를 추가한 뒤)
 *   npx tsx scripts/build-dictionary.ts --refresh          API 없이, 지금 사전에 정리 규칙(resolveMaterials)을 다시 적용하고 검토 CSV를 새로 쓴다
 *   --yes                                                  확인 질문을 건너뛴다
 *
 * 환경 변수: ANTHROPIC_API_KEY (없으면 NUXT_ANTHROPIC_API_KEY), DICT_MODEL (기본 claude-haiku-5-5)
 *
 * 이미 대표 물건 이름·별칭과 정확히 같은 시드, 이미 사전에 있는 시드는 건너뛴다.
 * 결과 검증: 재료도 missing_ingredients도 없으면 버리고, 숫자·나라 이름이 섞인 voice와 twist는 버린다(shared/safety.ts).
 * 주재료가 목록에 없는 물건은 missing에 남겨 사전에 넣는다(화면에 "○○의 여정은 아직 준비 중이에요").
 * 사전 전체의 missing을 많이 나온 순서로 data/review/missing.csv에 집계한다. 새 재료를 고를 때 본다.
 */
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import Anthropic from '@anthropic-ai/sdk'
import { MATERIALS } from '../shared/data/materials'
import { compact, createMatcher, productEntries, type DictEntry } from '../shared/match'
import { SYSTEM, TOOL_NAME, buildTool, canonicalMissing, clean, cleanFlavor, resolveMaterials, textPrompt } from '../server/utils/decompose'

const ROOT = process.cwd()
const SEED_FILES = { item: 'data/seeds/items.txt', word: 'data/seeds/words.txt' } as const
const DICT_PATH = 'shared/data/dictionary.json'
const REVIEW_CSV = 'data/review/dictionary.csv'
const REJECTED_CSV = 'data/review/dictionary-rejected.csv'
const MISSING_CSV = 'data/review/missing.csv'
const BATCH_DIR = 'data/review/batches'

const MODEL = process.env.DICT_MODEL ?? 'claude-haiku-5-5'
const MAX_TOKENS = 1024
/** claude-haiku-5-5, 프롬프트 100K 토큰 이하 기준 $/MTok. Batches API는 50% 할인 */
const PRICE = { input: 0.1, output: 0.5, batch: 0.5 }
/** 응답 하나의 예상 출력 토큰 (이름·재료·한마디 3~5개 + 도구 호출 JSON) */
const EST_OUTPUT_TOKENS = 350

type SeedKind = keyof typeof SEED_FILES
interface Seed {
  customId: string
  text: string
  kind: SeedKind
}

// ---------- 인자 ----------
const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const dryRun = flag('dry-run')
const assumeYes = flag('yes')
const limit = option('limit') ? Number(option('limit')) : undefined
const resumeId = option('resume')
const refresh = flag('refresh')
const redoMissing = option('redo-missing')?.split(',').map((s) => canonicalMissing(s.trim())).filter(Boolean)
if (limit !== undefined && !(limit > 0)) throw new Error('--limit 뒤에는 1 이상의 숫자를 적어 주세요')

// ---------- 파일 ----------
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const write = (p: string, s: string) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true })
  fs.writeFileSync(path.join(ROOT, p), s)
}
const loadDictionary = (): DictEntry[] => (fs.existsSync(path.join(ROOT, DICT_PATH)) ? JSON.parse(read(DICT_PATH)) : [])

function loadSeeds(): Seed[] {
  const seeds: Seed[] = []
  for (const kind of Object.keys(SEED_FILES) as SeedKind[]) {
    const lines = read(SEED_FILES[kind]).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    // custom_id는 영문·숫자·_-만 허용돼서 번호로 매기고, 원래 단어는 배치 기록 파일에 따로 남긴다
    lines.forEach((text, i) => seeds.push({ customId: `${kind}-${String(i + 1).padStart(4, '0')}`, text, kind }))
  }
  return seeds
}

/** 처리할 시드: 대표 물건과 정확히 같거나 이미 사전에 있으면 뺀다 */
function pendingSeeds(): Seed[] {
  const known = new Set(loadDictionary().map((e) => e.key))
  const { lookup } = createMatcher(productEntries())
  const seen = new Set<string>()
  return loadSeeds().filter((s) => {
    const key = compact(s.text)
    if (!key || seen.has(key) || known.has(key)) return false
    seen.add(key)
    const hit = lookup(key)
    return !(hit && 'entry' in hit)
  })
}

/** --redo-missing: 준비 중 재료에 이 이름들이 들어 있는 사전 항목의 시드 */
function redoSeeds(names: string[]): Seed[] {
  const keys = new Set(loadDictionary().filter((e) => e.missing?.some((m) => names.includes(canonicalMissing(m)))).map((e) => e.key))
  const seen = new Set<string>()
  return loadSeeds().filter((s) => {
    const key = compact(s.text)
    if (!keys.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** --refresh: 정리 규칙만 다시 적용. 재료도 준비 중 재료도 남지 않는 항목은 사전에서 빼고 알려 준다 */
function refreshDictionary() {
  const kept: DictEntry[] = []
  const removed: string[] = []
  let changed = 0
  for (const e of loadDictionary()) {
    const { materialIds, missing } = resolveMaterials(e.materialIds, e.missing ?? [])
    if (!materialIds.length && !missing.length) {
      removed.push(e.key)
      continue
    }
    const { missing: _old, ...rest } = e
    const next: DictEntry = { ...rest, materialIds, ...(missing.length ? { missing } : {}) }
    if (JSON.stringify(next) !== JSON.stringify(e)) changed++
    kept.push(next)
  }
  writeOutputs(kept, [])
  console.log(`사전 ${kept.length}개 (바뀜 ${changed}, 뺌 ${removed.length}${removed.length ? `: ${removed.join(', ')}` : ''})`)
}

// ---------- 요청 ----------
const TOOL = buildTool({ voices: true })

function requestParams(seed: Seed): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // 모든 요청이 같은 system·tools를 쓰므로 캐시가 잡히면 입력 비용이 줄어든다(보장되지는 않음)
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    tools: [TOOL as Anthropic.Tool],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [{ role: 'user', content: textPrompt(seed.text) }],
  }
}

/** 대략적인 토큰 수. 한글 1글자 ≈ 1토큰, 그 밖의 글자 ≈ 0.3토큰으로 넉넉하게 잡는다. */
function estimateTokens(s: string): number {
  const hangul = (s.match(/[가-힣]/g) ?? []).length
  return Math.ceil(hangul + (s.length - hangul) * 0.3)
}

function estimate(seeds: Seed[]) {
  const fixed = estimateTokens(SYSTEM) + estimateTokens(JSON.stringify(TOOL)) + 50
  const input = seeds.reduce((sum, s) => sum + fixed + estimateTokens(textPrompt(s.text)), 0)
  const output = seeds.length * EST_OUTPUT_TOKENS
  const cost = ((input * PRICE.input + output * PRICE.output) / 1_000_000) * PRICE.batch
  return { fixed, input, output, cost }
}

function printEstimate(seeds: Seed[]) {
  const e = estimate(seeds)
  const byKind = (k: SeedKind) => seeds.filter((s) => s.kind === k).length
  console.log(`모델 ${MODEL} · 요청 ${seeds.length}개 (물건 ${byKind('item')}, 단어 ${byKind('word')})`)
  console.log(`예상 입력 토큰 약 ${e.input.toLocaleString()} (요청당 고정 부분 약 ${e.fixed.toLocaleString()})`)
  console.log(`예상 출력 토큰 약 ${e.output.toLocaleString()} (요청당 ${EST_OUTPUT_TOKENS} 가정, 최대 ${MAX_TOKENS})`)
  console.log(`예상 비용 약 $${e.cost.toFixed(4)} (Batches 50% 할인 적용, 프롬프트 캐시 할인 미적용 상한치)`)
  console.log(`  단가: 입력 $${PRICE.input} / 출력 $${PRICE.output} per MTok. 실제 토큰 수는 토크나이저에 따라 달라요.`)
}

async function confirm(question: string): Promise<boolean> {
  if (assumeYes) return true
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`${question} (y/N) `)
  rl.close()
  return answer.trim().toLowerCase() === 'y'
}

// ---------- 결과 처리 ----------
interface Rejected {
  seed: Seed
  reason: string
  detail?: string
}

function toEntry(seed: Seed, input: any): DictEntry | string {
  if (!input) return '도구 호출 없음'
  if (!input.recognized) return '물건으로 잇지 못함'
  const { materialIds, missing } = resolveMaterials(input.material_ids, input.missing_ingredients)
  if (!materialIds.length && !missing.length) return '재료 0개'
  const rawVoices: unknown[] = Array.isArray(input.voices) ? input.voices : []
  const voices = [...new Set(rawVoices.map((v) => cleanFlavor(v, 50, { allowName: true })).filter(Boolean))]
  const name = clean(input.item_name, 20) || seed.text
  const key = compact(seed.text)
  const twist = seed.kind === 'word' ? cleanFlavor(input.twist, 60) : ''
  return {
    key,
    name,
    aliases: compact(name) === key ? [] : [seed.text],
    materialIds,
    ...(twist ? { twist } : {}),
    voices,
    ...(missing.length ? { missing } : {}),
  }
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`

function writeOutputs(entries: DictEntry[], rejected: Rejected[]) {
  // 물건(twist 없음)을 앞에 둬서 이름이 겹치면 물건 항목이 먼저 잡히게 한다
  const sorted = [...entries].sort((a, b) => Number(!!a.twist) - Number(!!b.twist) || a.key.localeCompare(b.key, 'ko'))
  write(DICT_PATH, JSON.stringify(sorted, null, 1) + '\n')

  const header = ['key', 'name', 'aliases', 'materials', 'missing', 'twist', 'voices']
  const rows = sorted.map((e) =>
    [e.key, e.name, e.aliases.join(' / '), e.materialIds.map((id) => MATERIALS[id]?.name ?? id).join(' / '), (e.missing ?? []).join(' / '), e.twist ?? '', (e.voices ?? []).join(' | ')]
      .map(csvCell)
      .join(','),
  )
  write(REVIEW_CSV, '﻿' + [header.join(','), ...rows].join('\n') + '\n')

  // 아직 여정이 없는 주재료: 많이 나온 순서, 여정을 아예 못 떠나는 물건 수, 예시 물건
  const tally = new Map<string, { count: number; blocked: number; items: string[] }>()
  for (const e of sorted) {
    for (const m of e.missing ?? []) {
      const t = tally.get(m) ?? { count: 0, blocked: 0, items: [] }
      t.count++
      if (!e.materialIds.length) t.blocked++
      t.items.push(e.name)
      tally.set(m, t)
    }
  }
  const mrows = [...tally]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], 'ko'))
    .map(([name, t]) => [name, String(t.count), String(t.blocked), t.items.join(' / ')].map(csvCell).join(','))
  write(MISSING_CSV, '﻿' + ['ingredient,count,blocked,items', ...mrows].join('\n') + '\n')

  if (rejected.length) {
    const rrows = rejected.map((r) => [r.seed.text, r.seed.kind, r.reason, r.detail ?? ''].map(csvCell).join(','))
    write(REJECTED_CSV, '﻿' + ['seed,kind,reason,detail', ...rrows].join('\n') + '\n')
  }
}

async function collect(client: Anthropic, batchId: string) {
  const record = JSON.parse(read(path.join(BATCH_DIR, `${batchId}.json`))) as { seeds: Seed[] }
  const seedById = new Map(record.seeds.map((s) => [s.customId, s]))

  const byKey = new Map(loadDictionary().map((e) => [e.key, e]))
  const rejected: Rejected[] = []
  let added = 0

  for await (const item of await client.messages.batches.results(batchId)) {
    const seed = seedById.get(item.custom_id)
    if (!seed) continue
    if (item.result.type !== 'succeeded') {
      rejected.push({ seed, reason: `배치 ${item.result.type}` })
      continue
    }
    const block = item.result.message.content.find((c) => c.type === 'tool_use' && c.name === TOOL_NAME)
    const entry = toEntry(seed, block?.type === 'tool_use' ? block.input : undefined)
    if (typeof entry === 'string') {
      rejected.push({ seed, reason: entry, detail: block?.type === 'tool_use' ? JSON.stringify(block.input) : '' })
      continue
    }
    byKey.set(entry.key, entry)
    added++
  }

  writeOutputs([...byKey.values()], rejected)
  console.log(`사전 반영 ${added}개, 버림 ${rejected.length}개 → ${DICT_PATH}, ${REVIEW_CSV}, ${MISSING_CSV}`)
  if (rejected.length) console.log(`버린 항목: ${REJECTED_CSV}`)
}

async function waitForBatch(client: Anthropic, batchId: string) {
  for (;;) {
    const batch = await client.messages.batches.retrieve(batchId)
    const c = batch.request_counts
    console.log(`[${new Date().toLocaleTimeString()}] ${batch.processing_status} · 처리 중 ${c.processing}, 성공 ${c.succeeded}, 오류 ${c.errored}`)
    if (batch.processing_status === 'ended') return
    await new Promise((r) => setTimeout(r, 30_000))
  }
}

// ---------- 실행 ----------
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.NUXT_ANTHROPIC_API_KEY

  if (resumeId) {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 필요해요')
    const client = new Anthropic({ apiKey })
    await waitForBatch(client, resumeId)
    await collect(client, resumeId)
    return
  }

  if (refresh) {
    refreshDictionary()
    return
  }

  let seeds = redoMissing?.length ? redoSeeds(redoMissing) : pendingSeeds()
  if (limit) seeds = seeds.slice(0, limit)
  if (!seeds.length) {
    console.log('새로 만들 시드가 없어요.')
    return
  }
  printEstimate(seeds)

  if (dryRun) {
    console.log('\n요청 본문 예시 (처음 2개):')
    for (const s of seeds.slice(0, 2)) console.log(JSON.stringify({ custom_id: s.customId, seed: s.text, params: requestParams(s) }, null, 2))
    console.log('\n--dry-run이라 API를 호출하지 않았어요.')
    return
  }

  if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 필요해요')
  if (!(await confirm('이대로 배치를 만들까요?'))) {
    console.log('취소했어요.')
    return
  }

  const client = new Anthropic({ apiKey })
  const batch = await client.messages.batches.create({
    requests: seeds.map((s) => ({ custom_id: s.customId, params: requestParams(s) })),
  })
  write(path.join(BATCH_DIR, `${batch.id}.json`), JSON.stringify({ id: batch.id, model: MODEL, createdAt: new Date().toISOString(), seeds }, null, 1) + '\n')
  console.log(`배치 ${batch.id} 생성. 중간에 멈춰도 --resume ${batch.id}로 결과만 다시 받을 수 있어요.`)

  await waitForBatch(client, batch.id)
  await collect(client, batch.id)
}

main().catch((err) => {
  if (err instanceof Anthropic.APIError) console.error(`API 오류 ${err.status}: ${err.message}`)
  else console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
