/*
 * 나의 하루 유형 분포 (docs/day-types.md 6번). 테스트 물건 18개에서 3~5개를 고르는 모든 조합(12,444가지)을 판정한다.
 * 한 유형이 25%를 넘으면 실패한다. 테스트 물건이나 분류를 바꾸면 다시 돌린다: npx tsx scripts/day-type-dist.ts
 */
import { DAY_TYPES, PICK_MAX, PICK_MIN, TEST_ITEMS, TYPE_ORDER, dayTypeOf, type DayTypeId } from '../shared/day-type'

const LIMIT = 0.25

function* combinations<T>(list: readonly T[], k: number, start = 0, picked: T[] = []): Generator<T[]> {
  if (picked.length === k) {
    yield picked
    return
  }
  for (let i = start; i <= list.length - (k - picked.length); i++) yield* combinations(list, k, i + 1, [...picked, list[i]!])
}

const counts = Object.fromEntries(TYPE_ORDER.map((t) => [t, 0])) as Record<DayTypeId, number>
let total = 0
for (let k = PICK_MIN; k <= PICK_MAX; k++) {
  for (const pick of combinations(TEST_ITEMS, k)) {
    counts[dayTypeOf(pick)]++
    total++
  }
}

console.log(`조합 ${total.toLocaleString('ko-KR')}가지\n`)
console.log('| 유형 | 비율 |\n|---|---|')
const rows = [...TYPE_ORDER].sort((a, b) => counts[b] - counts[a])
for (const t of rows) console.log(`| ${t} | ${((counts[t] / total) * 100).toFixed(1)}% |`)
const over = rows.filter((t) => counts[t] / total > LIMIT)
const never = rows.filter((t) => counts[t] === 0)
if (never.length) console.log(`\n한 번도 나오지 않는 유형: ${never.map((t) => DAY_TYPES[t].name).join(', ')}`)
if (over.length) {
  console.error(`\n${LIMIT * 100}%를 넘는 유형: ${over.map((t) => `${t} ${((counts[t] / total) * 100).toFixed(1)}%`).join(', ')}`)
  process.exit(1)
}
console.log(`\n모든 유형이 ${LIMIT * 100}% 이하예요`)
