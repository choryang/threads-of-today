import { MATERIAL_LIST } from '../../shared/data/materials'
import { MAX_MATERIALS, sanitizeMaterialIds, type Decomposed } from '../../shared/logic'

export interface DecomposeInput {
  text?: string
  image?: { data: string; mediaType: string }
}

export type DecomposeResult =
  | ({ ok: true; source: 'ai' | 'local' } & Decomposed)
  | { ok: false; message: string }

const MATERIAL_GUIDE = MATERIAL_LIST.map((m) => `- ${m.id}: ${m.name}`).join('\n')

const SYSTEM = `너는 "내 하루에 닿은 사람들"이라는 게임의 재료 분해기야.
사용자가 오늘 쓰거나 먹은 물건 하나를 알려 주면, 아래 재료 목록 중에서 그 물건을 만드는 데 실제로 들어가는 주요 재료만 골라.

재료 목록 (id: 이름)
${MATERIAL_GUIDE}

규칙
- 목록에 있는 id만 쓴다. 목록에 없는 재료는 고르지 않는다.
- 그 물건의 핵심 재료부터 최대 ${MAX_MATERIALS}개까지. 억지로 채우지 않는다.
- 포장재가 물건의 일부로 늘 함께 오면 plastic이나 pulp를 넣어도 된다.
- 휴대폰·이어폰·태블릿처럼 완성 전자기기는 assembly를 넣는다.
- 물건이 아니거나, 목록 재료로 전혀 설명할 수 없거나, 사람·동물·장소를 가리키면 recognized를 false로 한다.
- item_name은 사용자가 알아보기 쉬운 짧은 한국어 이름(15자 이내)으로 쓴다.`

const TOOL = {
  name: 'report_materials',
  description: '물건의 이름과 재료 id 목록을 보고한다.',
  input_schema: {
    type: 'object',
    properties: {
      recognized: { type: 'boolean', description: '목록 재료로 설명할 수 있는 물건이면 true' },
      item_name: { type: 'string', description: '짧은 한국어 물건 이름' },
      material_ids: {
        type: 'array',
        items: { type: 'string', enum: MATERIAL_LIST.map((m) => m.id) },
        maxItems: MAX_MATERIALS,
      },
    },
    required: ['recognized', 'item_name', 'material_ids'],
  },
}

export function parseToolResponse(json: any): DecomposeResult {
  const block = Array.isArray(json?.content)
    ? json.content.find((c: any) => c?.type === 'tool_use' && c?.name === TOOL.name)
    : null
  const input = block?.input
  if (!input) return { ok: false, message: '물건을 알아보지 못했어요. 다시 시도해 주세요.' }
  const ids = sanitizeMaterialIds(input.material_ids)
  if (!input.recognized || !ids.length) {
    return { ok: false, message: '아직 여정을 준비하지 못한 물건이에요. 다른 물건으로 해 볼까요?' }
  }
  const name = String(input.item_name || '오늘의 물건').trim().slice(0, 20)
  return { ok: true, source: 'ai', name, materialIds: ids }
}

export async function decomposeWithClaude(
  input: DecomposeInput,
  opts: { apiKey: string; model: string; fetchImpl?: typeof fetch },
): Promise<DecomposeResult> {
  const content: any[] = []
  if (input.image) {
    content.push({ type: 'image', source: { type: 'base64', media_type: input.image.mediaType, data: input.image.data } })
    content.push({ type: 'text', text: '사진 속에서 가장 눈에 띄는 물건 하나를 골라 재료로 분해해 줘.' })
  } else {
    content.push({ type: 'text', text: `오늘 쓴 물건: ${input.text}` })
  }

  const res = await (opts.fetchImpl ?? fetch)('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 400,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) {
    console.error('[decompose] Claude API error', res.status, await res.text().catch(() => ''))
    return { ok: false, message: '물건을 분석하는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' }
  }
  return parseToolResponse(await res.json())
}
