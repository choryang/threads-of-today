/**
 * 앱용 물건 사전 만들기: npx tsx scripts/build-client-dictionary.ts
 * shared/data/dictionary.json → shared/data/dictionary-client.json (한마디는 하나만). build-dictionary.ts가 끝날 때도 부른다.
 * 사전을 고치면 다시 돌린다. 둘이 어긋나면 npm test(tests/dictionary-client.test.ts)가 알려 준다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { slimDictionary } from '../shared/match/slim'
import type { DictEntry } from '../shared/match'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function writeClientDictionary() {
  const full = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/data/dictionary.json'), 'utf8')) as DictEntry[]
  const slim = slimDictionary(full)
  fs.writeFileSync(path.join(ROOT, 'shared/data/dictionary-client.json'), JSON.stringify(slim) + '\n')
  console.log(`앱용 사전 ${slim.length}개를 썼어요.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) writeClientDictionary()
