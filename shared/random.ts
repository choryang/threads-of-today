/** 문자열 → 32비트 해시 (FNV-1a) */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 시드가 같으면 늘 같은 순서로 0 이상 1 미만의 수를 내는 난수 (xorshift32) */
export function seeded(seed: number) {
  let x = seed || 1
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 0) / 4294967296
  }
}

/** 해시 값을 한 번 더 고루 섞는다 (murmur3 fmix32). 끝 글자만 다른 문자열들의 시드가 서로 닮지 않게 한다 */
export function mix32(h: number): number {
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}
