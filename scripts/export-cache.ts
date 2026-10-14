/**
 * AI 공유 캐시를 조회 수 높은 순으로 CSV로 뽑는다. 검토해서 좋은 항목은 사전(shared/data/dictionary.json)으로 옮긴다.
 *
 *   KV_REST_API_URL=... KV_REST_API_TOKEN=... npx tsx scripts/export-cache.ts   운영(Upstash)
 *   npx tsx scripts/export-cache.ts                                              로컬 개발(.data/kv)
 *
 * 출력: data/review/cache.csv (key, hits, name, materials, twist, voice, firstSeen, lastSeen)
 */
import fs from 'node:fs'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import upstashDriver from 'unstorage/drivers/upstash'
import { MATERIALS } from '../shared/data/materials'
import type { CachedDecompose } from '../server/utils/ai-cache'

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const storage = createStorage({
  driver: url && token ? upstashDriver({ url, token, base: 'mdp' }) : fsDriver({ base: '.data/kv' }),
})

const OUT = 'data/review/cache.csv'
const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

async function main() {
  const keys = await storage.getKeys('cache:text')
  const rows: Array<{ key: string; e: CachedDecompose }> = []
  for (const key of keys) {
    const e = await storage.getItem<CachedDecompose>(key)
    if (e?.materialIds) rows.push({ key: key.replace(/^cache:text:/, ''), e })
  }
  rows.sort((a, b) => (b.e.hits ?? 0) - (a.e.hits ?? 0))
  const lines = ['key,hits,name,materials,twist,voice,firstSeen,lastSeen']
  for (const { key, e } of rows) {
    lines.push([key, e.hits, e.name, e.materialIds.map((id) => MATERIALS[id]?.name ?? id).join(' / '), e.twist, e.voice, e.firstSeen, e.lastSeen].map(cell).join(','))
  }
  fs.mkdirSync('data/review', { recursive: true })
  fs.writeFileSync(OUT, '﻿' + lines.join('\n') + '\n')
  console.log(`${url ? 'Upstash' : '.data/kv'}에서 캐시 ${rows.length}개 → ${OUT}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
