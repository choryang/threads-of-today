/**
 * 이야기 편마다 붙인 마음 태그 검토표 → docs/redesign/mood-tags.md (npm run mood-tags).
 * 태그는 shared/data/stories.ts의 각 편 moods. 표를 보고 stories.ts를 고친 뒤 다시 돌린다.
 */
import { writeFileSync } from 'node:fs'
import { MOODS, MOOD_LIST } from '../shared/data/moods'
import { PEOPLE } from '../shared/data/people'
import { KEY_STORIES } from '../shared/data/stories'

/** 첫 문장: 처음 나오는 '.'·'?'·'!'까지 */
const firstSentence = (t: string) => (/^.*?[.?!](?=\s|$)/.exec(t)?.[0] ?? t).trim()
const esc = (t: string) => t.replace(/\|/g, '\\|')

const rows: string[] = []
const count = Object.fromEntries(MOOD_LIST.map((m) => [m.id, 0])) as Record<string, number>
let total = 0
for (const [pid, story] of Object.entries(KEY_STORIES)) {
  const p = PEOPLE[pid]
  ;(story.episodes ?? []).forEach((e, i) => {
    total++
    e.moods.forEach((m) => count[m]++)
    rows.push(`| ${p?.name ?? ''} (${pid}) | ${i + 1} | ${esc(firstSentence(e.text))} | ${e.moods.map((m) => MOODS[m].label).join(', ')} |`)
  })
}

const doc = `# 이야기 편별 마음 태그 (검토용)

\`npm run mood-tags\`로 만든 표예요(scripts/mood-tags.ts). 태그는 shared/data/stories.ts의 각 편 \`moods\`에 있어요.
고칠 때는 stories.ts의 \`moods: [...]\`만 바꾸고 다시 돌려 주세요. 마음 id: ${MOOD_LIST.map((m) => `${m.id}(${m.label})`).join(' · ')}

초안은 이야기 흐름을 보고 편마다 1~2개 붙였어요. 이야기의 첫 편(물건과 잇는 편)은 대체로 '그냥 그랬어요'예요.

편 ${total}개 · 마음별 편 수: ${MOOD_LIST.map((m) => `${m.label} ${count[m.id]}`).join(' · ')}

| 사람 | 편 | 첫 문장 | 마음 |
|---|---|---|---|
${rows.join('\n')}
`
writeFileSync(new URL('../docs/redesign/mood-tags.md', import.meta.url), doc)
console.log(`docs/redesign/mood-tags.md: 편 ${total}개`)
