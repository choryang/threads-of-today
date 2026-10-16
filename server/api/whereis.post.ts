import { allowAiCall, readCache } from '../utils/ai-cache'
import { mapsSearchUrl, quipFor } from '../utils/whereis'

export type WhereIsResult = { ok: true; query: string; quip: string; searchUrl: string } | { ok: false; message: string }

/**
 * 고유명사 "찾아봤더니" (docs/redesign/README.md "실 따라 걷기"). 분해에서 고유명사로 판정되어 캐시에 남은 입력만 받는다
 * (사람 이름이나 아무 글자에 한마디를 만들지 않게). 한마디와 구글 지도 검색 링크만 돌려준다
 */
export default defineEventHandler(async (event): Promise<WhereIsResult> => {
  const body = await readBody<{ text?: string }>(event).catch(() => null)
  const query = typeof body?.text === 'string' ? body.text.trim().slice(0, 30) : ''
  if (!query) return { ok: false, message: '이름을 적어 주세요.' }
  const cached = await readCache(query).catch(() => null)
  if (!cached?.proper) return { ok: false, message: '이 이름은 지도에서 찾아볼 수 없어요.' }
  const config = useRuntimeConfig(event)
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const quip = await quipFor(query, {
    apiKey: config.anthropicApiKey,
    model: config.anthropicModel,
    allow: () => allowAiCall(ip, Number(config.aiDailyLimit) || 20).catch(() => true),
  }).catch(() => '')
  return { ok: true, query, quip, searchUrl: mapsSearchUrl(query) }
})
