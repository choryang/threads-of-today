/**
 * 장면 그림 만들기: docs/scenes/prompts.md의 프롬프트로 Gemini API에 그림을 요청해 art/scenes/<장면 id>.png로 저장한다.
 * 그다음 npm run scenes(scripts/build-scenes.ts)가 public/scenes/<장면 id>.webp로 줄인다.
 *
 * npm run scenes:gen                       프롬프트가 있고 아직 그림이 없는 장면 모두
 * npm run scenes:gen -- --only a,b         지정한 장면만
 * npm run scenes:gen -- --redo a           있던 그림을 a.old.png로 바꿔 두고 새로 (쉼표로 여러 개)
 * npm run scenes:gen -- --dry-run          만들 목록과 예상 비용만
 *
 * - 키는 .env.local의 GEMINI_API_KEY에서만 읽는다(다른 값은 읽지 않고, 키를 출력하지 않는다).
 * - 프롬프트는 "## <장면 id>" 아래 ```text 블록 그대로. 블록이 없는 장면('있음')은 건너뛴다.
 * - 요청마다 art/style-ref.png를 참고 이미지로 붙인다(없고 art/style-ref.webp만 있으면 그것을).
 * - 4:3, 2K. 동시 요청 2개. 429·5xx는 최대 3번 다시 시도. 그림 없이 글만 오거나 막히면 그 응답을 로그로 남기고 다음 장면으로.
 * - 로그: data/review/gen-scenes.log (커밋하지 않는 폴더)
 */
import { existsSync, mkdirSync, readFileSync, renameSync, appendFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'
import { ApiError, GoogleGenAI, Modality } from '@google/genai'
import sharp from 'sharp'

const MODEL = 'gemini-nano-banana-2.1'
const ASPECT = '4:3'
const SIZE = '2K'
const COST_PER_IMAGE = 0.05
const CONCURRENCY = 2
const RETRIES = 3

const root = new URL('..', import.meta.url)
const path = (p: string) => new URL(p, root)
const PROMPTS = path('docs/scenes/prompts.md')
const OUT_DIR = path('art/scenes/')
const LOG = path('data/review/gen-scenes.log')
const STYLE_REFS = [
  { file: path('art/style-ref.png'), mimeType: 'image/png' },
  { file: path('art/style-ref.webp'), mimeType: 'image/webp' },
]

// ── 옵션 ──
const args = process.argv.slice(2)
const optList = (name: string) => {
  const i = args.indexOf(name)
  if (i < 0) return undefined
  const v = args[i + 1]
  if (!v || v.startsWith('--')) {
    console.error(`${name} 뒤에 장면 id를 써 주세요 (쉼표로 여러 개)`)
    process.exit(1)
  }
  return v.split(',').map((s) => s.trim()).filter(Boolean)
}
const only = optList('--only')
const redo = optList('--redo')
const dryRun = args.includes('--dry-run')

// ── 프롬프트 읽기: "## <id>" 섹션마다 ```text 블록 ──
interface ScenePrompt { id: string; prompt?: string }
function readPrompts(): ScenePrompt[] {
  const doc = readFileSync(PROMPTS, 'utf8').replace(/\r\n/g, '\n')
  const out: ScenePrompt[] = []
  const sections = doc.split(/^## /m).slice(1)
  for (const section of sections) {
    const id = section.slice(0, section.indexOf('\n')).trim()
    const block = /```text\n([\s\S]*?)\n```/.exec(section)
    out.push({ id, prompt: block?.[1] })
  }
  return out
}

const all = readPrompts()
const known = new Set(all.map((s) => s.id))
for (const id of [...(only ?? []), ...(redo ?? [])]) {
  if (!known.has(id)) {
    console.error(`docs/scenes/prompts.md에 없는 장면이에요: ${id}`)
    process.exit(1)
  }
}
const outFile = (id: string) => new URL(`${id}.png`, OUT_DIR)

const skipped: string[] = []
const targets = all.filter((s) => {
  const wanted = redo ? redo.includes(s.id) : only ? only.includes(s.id) : true
  if (!wanted) return false
  if (!s.prompt) {
    skipped.push(`${s.id} (프롬프트 없음, 이미 있는 그림)`)
    return false
  }
  if (!redo?.includes(s.id) && existsSync(outFile(s.id))) {
    skipped.push(`${s.id} (art/scenes에 이미 있음)`)
    return false
  }
  return true
})

const cost = (n: number) => `$${(n * COST_PER_IMAGE).toFixed(2)}`
console.log(`모델 ${MODEL} · ${ASPECT} · ${SIZE}`)
if (skipped.length) console.log(`건너뜀: ${skipped.join(', ')}`)
console.log(`만들 장면 ${targets.length}장: ${targets.map((t) => (redo?.includes(t.id) ? `${t.id}(다시)` : t.id)).join(', ') || '없음'}`)
console.log(`예상 비용: 약 ${cost(targets.length)} (장당 약 $${COST_PER_IMAGE})`)
if (dryRun || !targets.length) process.exit(0)

// ── 참고 이미지 ──
const ref = STYLE_REFS.find((r) => existsSync(r.file))
if (!ref) {
  console.error('art/style-ref.png가 없어요. 참고 그림을 넣고 다시 실행해 주세요.')
  process.exit(1)
}
if (ref.mimeType !== 'image/png') console.log('art/style-ref.png가 없어 art/style-ref.webp를 참고 그림으로 써요.')
const refData = readFileSync(ref.file).toString('base64')

// ── 키: .env.local의 GEMINI_API_KEY만 ──
function apiKey(): string {
  const file = path('.env.local')
  if (!existsSync(file)) {
    console.error('.env.local이 없어요. GEMINI_API_KEY=... 한 줄을 넣어 주세요.')
    process.exit(1)
  }
  const key = parseEnv(readFileSync(file, 'utf8')).GEMINI_API_KEY
  if (!key) {
    console.error('.env.local에 GEMINI_API_KEY가 없어요.')
    process.exit(1)
  }
  return key
}

// ── 확인 ──
const rl = createInterface({ input: process.stdin, output: process.stdout })
const answer = (await rl.question(`${targets.length}장, 약 ${cost(targets.length)}. 만들까요? (y/n) `)).trim().toLowerCase()
rl.close()
if (answer !== 'y' && answer !== 'yes') {
  console.log('그만뒀어요.')
  process.exit(0)
}

const ai = new GoogleGenAI({ apiKey: apiKey() })
mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(path('data/review/'), { recursive: true })

function log(id: string, what: string, detail: unknown) {
  const line = JSON.stringify({ at: new Date().toISOString(), id, what, detail })
  appendFileSync(LOG, `${line}\n`)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const retryable = (e: unknown) => e instanceof ApiError && (e.status === 429 || e.status >= 500)

type Result = 'ok' | 'no-image' | 'failed'

async function generate(scene: ScenePrompt): Promise<Result> {
  // 다시 만들기: 있던 그림을 <id>.old.png로 (예전 .old.png는 덮어쓴다)
  if (redo?.includes(scene.id) && existsSync(outFile(scene.id))) renameSync(outFile(scene.id), new URL(`${scene.id}.old.png`, OUT_DIR))
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: scene.prompt! }, { inlineData: { mimeType: ref!.mimeType, data: refData } }] }],
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT], imageConfig: { aspectRatio: ASPECT, imageSize: SIZE } },
      })
      const parts = res.candidates?.[0]?.content?.parts ?? []
      const image = parts.find((p) => p.inlineData?.data && p.inlineData.mimeType?.startsWith('image/'))
      if (!image?.inlineData?.data) {
        // 그림 없이 글만 왔거나 막혔다: 응답을 남기고 다음 장면으로
        const detail = {
          finishReason: res.candidates?.[0]?.finishReason,
          promptFeedback: res.promptFeedback,
          text: parts.map((p) => p.text).filter(Boolean).join('\n'),
        }
        log(scene.id, 'no-image', detail)
        console.log(`  ${scene.id}: 그림이 오지 않았어요 (${detail.finishReason ?? detail.promptFeedback?.blockReason ?? '글만 옴'}). 로그에 남겼어요`)
        return 'no-image'
      }
      // 어떤 형식으로 오든 png로 저장한다
      const file = fileURLToPath(outFile(scene.id))
      await sharp(Buffer.from(image.inlineData.data, 'base64')).png().toFile(file)
      const meta = await sharp(file).metadata()
      log(scene.id, 'ok', { width: meta.width, height: meta.height, attempt })
      console.log(`  ${scene.id}: ${meta.width}×${meta.height} → art/scenes/${scene.id}.png`)
      return 'ok'
    } catch (e) {
      if (retryable(e) && attempt < RETRIES) {
        const wait = 2000 * 2 ** attempt
        console.log(`  ${scene.id}: ${(e as ApiError).status}, ${wait / 1000}초 뒤 다시 (${attempt + 1}/${RETRIES})`)
        await sleep(wait)
        continue
      }
      const detail = e instanceof ApiError ? { status: e.status, message: e.message } : { message: String(e) }
      log(scene.id, 'failed', detail)
      console.log(`  ${scene.id}: 실패했어요 (${detail.message.slice(0, 120)}). 로그에 남겼어요`)
      return 'failed'
    }
  }
}

// ── 동시 요청 2개 ──
const queue = [...targets]
const results: Record<Result, string[]> = { ok: [], 'no-image': [], failed: [] }
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let scene = queue.shift(); scene; scene = queue.shift()) {
      console.log(`${scene.id} 만드는 중…`)
      results[await generate(scene)].push(scene.id)
    }
  }),
)

console.log(`\n만듦 ${results.ok.length}장${results['no-image'].length ? `, 그림 없음 ${results['no-image'].join(', ')}` : ''}${results.failed.length ? `, 실패 ${results.failed.join(', ')}` : ''}`)
if (results['no-image'].length || results.failed.length) console.log('자세한 응답: data/review/gen-scenes.log')
if (results.ok.length) console.log('다음: 그림을 확인한 뒤 npm run scenes 로 public/scenes에 webp를 만들어요')
