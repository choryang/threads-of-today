import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { FORMS } from '../shared/data/forms'
import { PROP_ICON_CROPS, propDrawing } from '../scripts/sync-prop-icons'
import { TEST_ITEMS } from '../shared/day-type'

const index = JSON.parse(readFileSync('public/forms/index.json', 'utf8')) as Record<string, { ko: string; group: string }>

test('형태 아이콘: 모든 formIcon이 public/forms에 있다', () => {
  const missing = Object.entries(FORMS).flatMap(([materialId, forms]) =>
    forms.filter((f) => f.formIcon && !existsSync(`public/forms/${f.formIcon}.svg`)).map((f) => `${materialId}:${f.name} → ${f.formIcon}`),
  )
  assert.deepEqual(missing, [])
  // index.json의 slug도 모두 파일이 있다
  assert.deepEqual(Object.keys(index).filter((slug) => !existsSync(`public/forms/${slug}.svg`)), [])
})

test('형태 아이콘: index.json에 있는 이름은 그 아이콘을 쓴다', () => {
  for (const forms of Object.values(FORMS)) {
    for (const f of forms) {
      const slug = Object.keys(index).find((s) => index[s]!.ko === f.name)
      if (slug) assert.equal(f.formIcon, slug, f.name)
    }
  }
})

test('형태 아이콘: prop-* 아이콘은 캐릭터 소품과 같은 그림이다 (scripts/sync-prop-icons.ts)', () => {
  for (const prop of Object.keys(PROP_ICON_CROPS)) {
    const source = propDrawing(readFileSync(`app/assets/character/prop-${prop}.svg`, 'utf8'))
    const copy = propDrawing(readFileSync(`public/forms/prop-${prop}.svg`, 'utf8').trimEnd())
    assert.equal(copy, source, `prop-${prop}: npx tsx scripts/sync-prop-icons.ts 로 다시 만든다`)
  }
})

