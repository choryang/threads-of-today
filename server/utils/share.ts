import { createShares, type ShareStore } from '../../shared/share'
import { kv } from './kv'

/**
 * 공유 링크 저장소 (shared/share.ts의 구조를 KV에 붙인다). 운영은 Upstash(키가 TTL로 사라진다),
 * 개발용 파일 저장소는 TTL이 없어서 shared/share.ts가 만료 시각을 한 번 더 본다.
 * 로그에는 토큰·관리 키·사용자 정보를 남기지 않는다.
 */
const store: ShareStore = {
  get: async (key) => {
    const v = await kv().getItem<string | object>(key)
    if (v === null || v === undefined) return null
    // Upstash 드라이버는 JSON 문자열을 객체로 돌려줄 때가 있다
    return typeof v === 'string' ? v : JSON.stringify(v)
  },
  set: async (key, value, ttl) => { await kv().setItem(key, value, { ttl }) },
  del: async (key) => { await kv().removeItem(key) },
}

export const shares = createShares(store)
