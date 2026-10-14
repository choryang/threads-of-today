/* 데이터 무결성 검사: npx tsx scripts/check-data.ts */
import { LINK_RULES, MATERIAL_LIST, PRODUCTS, SETS } from '../shared/data/materials'
import { PEOPLE, PEOPLE_LIST } from '../shared/data/people'
import { PLACES } from '../shared/data/places'
import { SYNONYM_GROUPS } from '../shared/data/synonyms'
import { dayStats, findLinkCards, mysteryHints, mysteryOptions, mysteryProduct } from '../shared/logic'
import { createMatcher, match, productEntries } from '../shared/match'

const errors: string[] = []
const reachable = new Set<string>()

for (const person of PEOPLE_LIST) {
  if (!PLACES[person.placeId]) errors.push(`${person.id}: 장소 ${person.placeId} 없음`)
}
for (const m of MATERIAL_LIST) {
  for (const pid of m.stages) {
    if (!PEOPLE[pid]) errors.push(`${m.id}: 단계 ${pid} 없음`)
    else if (PEOPLE[pid]!.kind !== 'stage') errors.push(`${m.id}: ${pid}는 stage 카드가 아님`)
    reachable.add(pid)
  }
  if (m.quiz) {
    if (!PEOPLE[m.quiz.rewardId] || PEOPLE[m.quiz.rewardId]!.kind !== 'quiz') errors.push(`${m.id}: 퀴즈 보상 ${m.quiz.rewardId} 오류`)
    if (m.quiz.answer < 0 || m.quiz.answer >= m.quiz.options.length) errors.push(`${m.id}: 정답 인덱스 오류`)
    reachable.add(m.quiz.rewardId)
  }
}
for (const p of PRODUCTS) {
  for (const id of p.materialIds) if (!MATERIAL_LIST.find((m) => m.id === id)) errors.push(`${p.id}: 재료 ${id} 없음`)
}
for (const rule of LINK_RULES) {
  if (!PEOPLE[rule.cardId] || PEOPLE[rule.cardId]!.kind !== 'link') errors.push(`연결 ${rule.cardId} 오류`)
  const count = MATERIAL_LIST.filter((m) => m.stages.includes(rule.personId)).length
  if (count < 2) errors.push(`연결 ${rule.cardId}: ${rule.personId}가 재료 ${count}개에만 등장 → 얻을 수 없음`)
  reachable.add(rule.cardId)
}
for (const s of SETS) {
  for (const id of s.memberIds) if (!reachable.has(id)) errors.push(`${s.id}: 멤버 ${id}를 얻을 수 없음`)
  if (!PEOPLE[s.rewardId] || PEOPLE[s.rewardId]!.kind !== 'set') errors.push(`${s.id}: 보상 오류`)
  reachable.add(s.rewardId)
}
for (const person of PEOPLE_LIST) {
  if (!reachable.has(person.id)) errors.push(`${person.id}: 어떤 경로로도 얻을 수 없음`)
}

// 동의어의 대표 표기는 사전에 있는 단어여야 한다
const { lookup } = createMatcher(productEntries())
for (const [canonical] of SYNONYM_GROUPS) {
  if (!lookup(canonical!)) errors.push(`동의어 대표 표기 '${canonical}'가 대표 물건·재료 별칭에 없음`)
}

// 로직 스모크 테스트 (자세한 매칭 사례는 npm test)
const samgak = match('삼각김밥')
if (samgak?.name !== '참치마요 삼각김밥') errors.push(`match 삼각김밥 실패: ${JSON.stringify(samgak)}`)
const tkg = match('참치김치김밥')
for (const id of ['tuna', 'chili', 'cabbage', 'rice']) if (!tkg?.materialIds.includes(id)) errors.push(`참치김치김밥에 ${id} 없음: ${JSON.stringify(tkg)}`)
if (tkg?.name !== '참치김치김밥') errors.push(`참치김치김밥이 대표 물건으로 잘못 매칭: ${tkg?.name}`)
const kimchi = match('김치')
if (kimchi?.materialIds.includes('laver')) errors.push('김치가 김(laver)으로 오매칭')
if (match('라면')?.materialIds.includes('cotton')) errors.push('라면이 면(cotton)으로 오매칭')
if (match('지하철')) errors.push('지하철이 철강으로 오매칭')
const phone = match('갤럭시 휴대폰')
if (!phone?.materialIds.includes('cobalt')) errors.push('match 휴대폰 실패')
if (match('ㅁㄴㅇㄹ') !== null) errors.push('match 무의미 입력이 매칭됨')
const links = findLinkCards(['cobalt', 'lithium'])
if (!links.includes('link-cn-refinery')) errors.push(`연결 카드 실패: ${links}`)

for (const key of ['2026-10-14', '2026-10-15', '2027-01-01']) {
  const answer = mysteryProduct(key)
  const options = mysteryOptions(key)
  if (options.length !== 6 || !options.find((o) => o.id === answer.id)) errors.push(`${key}: 미스터리 보기 오류`)
  if (new Set(options.map((o) => o.id)).size !== 6) errors.push(`${key}: 보기 중복`)
}

console.log('재료', MATERIAL_LIST.length, '· 사람 카드', PEOPLE_LIST.length, '· 대표 물건', PRODUCTS.length, '· 장소', Object.keys(PLACES).length)
console.log('스마트폰 하루 통계', dayStats([phone!.materialIds]))
console.log('오늘 미스터리', mysteryProduct('2026-10-14').name, mysteryHints(mysteryProduct('2026-10-14')))
if (errors.length) {
  console.error('\n오류', errors.length, '건\n' + errors.join('\n'))
  process.exit(1)
}
console.log('\n모든 검사 통과')
