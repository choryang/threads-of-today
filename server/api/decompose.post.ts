import { matchText } from '../utils/matcher'
import { decomposeWithClaude, type DecomposeInput, type DecomposeResult } from '../utils/decompose'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BASE64 = 1_500_000 // 약 1.1MB. 클라이언트에서 줄여서 보낸다.

// 서버리스 인스턴스 단위의 가벼운 남용 방지 (정확한 제한은 아님)
const hits = new Map<string, { count: number; reset: number }>()
function allow(ip: string, limit = 30, windowMs = 10 * 60_000) {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= limit
}

export default defineEventHandler(async (event): Promise<DecomposeResult> => {
  const body = await readBody<Partial<DecomposeInput>>(event).catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 60) : ''
  const image = body?.image

  if (image) {
    if (!IMAGE_TYPES.includes(image.mediaType) || typeof image.data !== 'string' || image.data.length > MAX_IMAGE_BASE64) {
      return { ok: false, message: '사진을 읽을 수 없어요. 다른 사진으로 시도해 주세요.' }
    }
  } else if (!text) {
    return { ok: false, message: '물건 이름을 적어 주세요.' }
  }

  // 로컬 매칭(대표 물건·물건 사전·동의어·오타·합성어·재료 별칭)으로 잡히면 API를 부르지 않는다
  if (!image) {
    const local = matchText(text)
    if (local) return { ok: true, source: 'local', ...local }
  }

  const config = useRuntimeConfig(event)
  if (!config.anthropicApiKey) {
    if (image) return { ok: false, message: '사진 인식은 아직 준비 중이에요. 물건 이름으로 적어 주세요.' }
    return { ok: false, message: '아직 모르는 물건이에요. "골라 보기"에서 비슷한 물건을 골라 볼까요?' }
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!allow(ip)) return { ok: false, message: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' }

  try {
    const result = await decomposeWithClaude(image ? { image } : { text }, {
      apiKey: config.anthropicApiKey,
      model: config.anthropicModel,
    })
    return result
  } catch (err) {
    console.error('[decompose] failed', err)
    return { ok: false, message: '물건을 분석하는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' }
  }
})
