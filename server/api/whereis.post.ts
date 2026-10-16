import { allowAiCall, readCache } from '../utils/ai-cache'
import { hashIp, incrementCounter } from '../utils/kv'
import { mapsSearchUrl, quipFor, searchPlace, type FoundPlace } from '../utils/whereis'
import { seoulDateKey } from '../../shared/logic'

export type WhereIsResult = { ok: true; query: string; place: FoundPlace | null; quip: string; searchUrl: string } | { ok: false; message: string }

/**
 * 고유명사를 지도에서 찾기 (docs/redesign/README.md "실 따라 걷기"). 분해에서 고유명사로 판정되어 캐시에 남은 입력만 받는다
 * (사람 이름이나 아무 글자를 지도에 보내지 않게). 지도 키가 없으면 검색 링크와 한마디만.
 */
export default defineEventHandler(async (event): Promise<WhereIsResult> => {
  const body = await readBody<{ text?: string }>(event).catch(() => null)
  const query = typeof body?.text === 'string' ? body.text.trim().slice(0, 30) : ''
  if (!query) return { ok: false, message: '이름을 적어 주세요.' }
  const cached = await readCache(query).catch(() => null)
  if (!cached?.proper) return { ok: false, message: '이 이름은 지도에서 찾을 수 없어요.' }

  const config = useRuntimeConfig(event)
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  let place: (FoundPlace & { id: string }) | null = null
  if (config.googleMapsKey) {
    const count = await incrementCounter(`rate:maps:${seoulDateKey()}:${hashIp(ip)}`, 2 * 24 * 60 * 60).catch(() => 0)
    if (count <= (Number(config.mapsDailyLimit) || 30)) place = await searchPlace(query, config.googleMapsKey).catch(() => null)
  }
  const quip = await quipFor(query, place, {
    apiKey: config.anthropicApiKey,
    model: config.anthropicModel,
    allow: () => allowAiCall(ip, Number(config.aiDailyLimit) || 20).catch(() => true),
  }).catch(() => '')
  return {
    ok: true,
    query,
    place: place ? { name: place.name, address: place.address, mapsUri: place.mapsUri } : null,
    quip,
    searchUrl: mapsSearchUrl(query),
  }
})
