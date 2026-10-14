/**
 * AI 공유 캐시를 조회 수 높은 순으로 CSV로 뽑는다. 검토해서 좋은 항목은 사전(shared/data/dictionary.json)으로 옮긴다.
 *
 *   KV_REST_API_URL=... KV_REST_API_TOKEN=... npx tsx scripts/export-cache.ts   운영(Upstash)
 *   npx tsx scripts/export-cache.ts                                              로컬 개발(.data/kv)
 *
 * 출력: data/review/cache.csv (key, hits, name, materials, missing, twist, voice, firstSeen, lastSeen)
 *       data/review/missing-live.csv (실제 요청에서 "준비 중"으로 보여 준 재료, 많이 나온 순서)
 */
import fs from 'node:fs'
import { Redis } from '@upstash/redis'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import upstashDriver from 'unstorage/drivers/upstash'
import { MATERIALS } from '../shared/data/materials'
import { MISSING_KEY, type CachedDecompose } from '../server/utils/ai-cache'

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const storage = createStorage({
  driver: url && token ? upstashDriver({ url, token, base: 'mdp' }) : fsDriver({ base: '.data/kv' }),
})

const OUT = 'data/review/cache.csv'
const MISSING_OUT = 'data/review/missing-live.csv'
const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

/** Upstash는 정렬 집합(ZINCRBY), 개발용 파일 저장소는 { 이름: 횟수 } 객체 (server/utils/kv.ts incrementScores) */
async function missingCounts(): Promise<Array<[string, number]>> {
  if (url && token) {
    const flat = await new Redis({ url, token }).zrange<(string | number)[]>(`mdp:${MISSING_KEY}`, 0, -1, { rev: true, withScores: true })
    const out: Array<[string, number]> = []
    for (let i = 0; i < flat.length; i += 2) out.push([String(flat[i]), Number(flat[i + 1])])
    return out
  }
  const counts = (await storage.getItem<Record<string, number>>(MISSING_KEY)) ?? {}
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

async function main() {
  const keys = await storage.getKeys('cache:text')
  const rows: Array<{ key: string; e: CachedDecompose }> = []
  for (const key of keys) {
    const e = await storage.getItem<CachedDecompose>(key)
    if (e?.materialIds) rows.push({ key: key.replace(/^cache:text:/, ''), e })
  }
  rows.sort((a, b) => (b.e.hits ?? 0) - (a.e.hits ?? 0))
  const lines = ['key,hits,name,materials,missing,twist,voice,firstSeen,lastSeen']
  for (const { key, e } of rows) {
    const materials = e.materialIds.map((id) => MATERIALS[id]?.name ?? id).join(' / ')
    lines.push([key, e.hits, e.name, materials, (e.missing ?? []).join(' / '), e.twist, e.voice, e.firstSeen, e.lastSeen].map(cell).join(','))
  }
  fs.mkdirSync('data/review', { recursive: true })
  fs.writeFileSync(OUT, '﻿' + lines.join('\n') + '\n')
  console.log(`${url ? 'Upstash' : '.data/kv'}에서 캐시 ${rows.length}개 → ${OUT}`)

  const missing = await missingCounts()
  fs.writeFileSync(MISSING_OUT, '﻿' + ['ingredient,count', ...missing.map((r) => r.map(cell).join(','))].join('\n') + '\n')
  console.log(`준비 중 재료 ${missing.length}개 → ${MISSING_OUT}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
