import { allowAiCall, countMissing, readCache, toDecomposed, writeCache } from '../utils/ai-cache'
import { decomposeWithClaude, type DecomposeInput, type DecomposeResult } from '../utils/decompose'
import type { H3Event } from 'h3'
import { matchText } from '../utils/matcher'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BASE64 = 1_500_000 // 약 1.1MB. 클라이언트에서 줄여서 보낸다.

const LIMIT_MESSAGE = '오늘은 새 물건을 정말 많이 알아봤어요. 내일 다시 적어 주거나, "골라 보기"에서 골라 볼까요?'

/**
 * 텍스트: 로컬 매칭(대표 물건·물건 사전·동의어·오타·합성어·재료 별칭) → 공유 캐시 → (하루 한도 안에서) Claude → 캐시에 저장
 * 사진:   (하루 한도 안에서) Claude → 알아본 물건 이름으로 사전·캐시를 다시 조회 → 없으면 이름 키로 캐시에 저장
 * 결과에 missing(아직 여정이 없는 주재료)이 있으면 어느 경로든 Upstash에 횟수를 센다.
 */
export default defineEventHandler(async (event): Promise<DecomposeResult> => {
  const result = await decompose(event)
  if (result.ok) await countMissing(result.missing).catch((err) => console.error('[decompose] missing count', err))
  return result
})

async function decompose(event: H3Event): Promise<DecomposeResult> {
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

  if (!image) {
    const local = matchText(text)
    if (local) return { ok: true, source: 'local', ...local }
    const cached = await readCache(text).catch(() => null)
    if (cached) return { ok: true, source: 'ai', via: 'cache', ...toDecomposed(cached) }
  }

  const config = useRuntimeConfig(event)
  if (!config.anthropicApiKey) {
    if (image) return { ok: false, message: '사진 인식은 아직 준비 중이에요. 물건 이름으로 적어 주세요.' }
    return { ok: false, message: '아직 모르는 물건이에요. "골라 보기"에서 비슷한 물건을 골라 볼까요?' }
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const allowed = await allowAiCall(ip, Number(config.aiDailyLimit) || 20).catch(() => true)
  // limited: 화면이 '오늘은 직접 쓰기를 다 썼어요' 안내로 바꿔 보여 준다 (물건 고르기는 계속된다)
  if (!allowed) return { ok: false, message: LIMIT_MESSAGE, limited: true }

  try {
    const result = await decomposeWithClaude(image ? { image } : { text }, {
      apiKey: config.anthropicApiKey,
      model: config.anthropicModel,
    })
    if (!result.ok) return result

    if (image) {
      // 사진은 입력 자체를 캐시할 수 없으니, 알아본 물건 이름으로 사전과 캐시를 한 번 더 찾는다
      const known = matchText(result.name)
      if (known && known.via === 'exact') return { ok: true, source: 'local', ...known }
      const cached = await readCache(result.name).catch(() => null)
      if (cached) return { ok: true, source: 'ai', via: 'cache', ...toDecomposed(cached) }
      await writeCache(result.name, result).catch((err) => console.error('[decompose] cache write', err))
      return result
    }

    await writeCache(text, result).catch((err) => console.error('[decompose] cache write', err))
    return result
  } catch (err) {
    console.error('[decompose] failed', err)
    return { ok: false, message: '물건을 분석하는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' }
  }
}
