/* 데이터 무결성 검사: npx tsx scripts/check-data.ts */
import { LINK_RULES, MATERIAL_LIST, PRODUCTS, SETS } from '../shared/data/materials'
import { PEOPLE, PEOPLE_LIST } from '../shared/data/people'
import { PLACES } from '../shared/data/places'
import dictionary from '../shared/data/dictionary.json'
import { EVENTS, HIDDEN_RULES } from '../shared/data/journey-extras'
import { SYNONYM_GROUPS } from '../shared/data/synonyms'
import { buildTimeline, quizzesOf, resolveStages } from '../shared/journey'
import { looksFactual } from '../shared/safety'
import { CODE_WORDS } from '../shared/recovery'
import { NICKNAME_MAX, NICKNAME_PARTS } from '../shared/nickname'
import { dayStats, findLinkCards, journeyMaterialIds, mysteryHints, mysteryOptions, mysteryProduct } from '../shared/logic'
import { createMatcher, match, productEntries, type DictEntry } from '../shared/match'

const errors: string[] = []
const reachable = new Set<string>()

const personIds = new Set<string>()
for (const person of PEOPLE_LIST) {
  if (personIds.has(person.id)) errors.push(`사람 id ${person.id} 중복`)
  personIds.add(person.id)
  if (!PLACES[person.placeId]) errors.push(`${person.id}: 장소 ${person.placeId} 없음`)
}
for (const m of MATERIAL_LIST) {
  for (const pid of m.stages) {
    if (!PEOPLE[pid]) errors.push(`${m.id}: 단계 ${pid} 없음`)
    else if (PEOPLE[pid]!.kind !== 'stage') errors.push(`${m.id}: ${pid}는 stage 카드가 아님`)
    reachable.add(pid)
  }
  for (const [i, quiz] of quizzesOf(m).entries()) {
    if (!PEOPLE[quiz.rewardId] || PEOPLE[quiz.rewardId]!.kind !== 'quiz') errors.push(`${m.id}: 퀴즈 ${i} 보상 ${quiz.rewardId} 오류`)
    if (quiz.answer < 0 || quiz.answer >= quiz.options.length) errors.push(`${m.id}: 퀴즈 ${i} 정답 인덱스 오류`)
    if (quiz.rewardId !== m.quiz!.rewardId) errors.push(`${m.id}: 퀴즈 ${i} 보상이 첫 퀴즈와 다름`)
    if (new Set(quiz.options).size !== quiz.options.length) errors.push(`${m.id}: 퀴즈 ${i} 보기 중복`)
    reachable.add(quiz.rewardId)
  }
  // 출발지 변형: 첫 출발지는 기본 경로 앞부분과 같아야 하고, 모든 사람은 stage 카드
  if (m.origins?.length) {
    const head = m.stages.slice(0, m.originHead ?? 0).join(',')
    if (m.origins[0]!.head.join(',') !== head) errors.push(`${m.id}: 첫 출발지가 기본 경로(${head})와 다름`)
    for (const o of m.origins) {
      if (!(o.weight > 0)) errors.push(`${m.id}/${o.id}: 가중치 오류`)
      for (const pid of o.head) {
        if (!PEOPLE[pid]) errors.push(`${m.id}/${o.id}: 사람 ${pid} 없음`)
        else if (PEOPLE[pid]!.kind !== 'stage') errors.push(`${m.id}/${o.id}: ${pid}는 stage 카드가 아님`)
        reachable.add(pid)
      }
    }
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
// 여정 이벤트: 사실처럼 보이는 문구 금지
const eventIds = new Set<string>()
for (const e of EVENTS) {
  if (eventIds.has(e.id)) errors.push(`이벤트 ${e.id} 중복`)
  eventIds.add(e.id)
  if (looksFactual(e.text)) errors.push(`이벤트 ${e.id}: 사실처럼 보이는 문구`)
}
// 숨은 만남: 카드가 hidden이고, 규칙의 사람이 해당 재료 여정(출발지 변형 포함)에 실제로 나와야 얻을 수 있다
const allStages = (mid: string) => {
  const m = MATERIAL_LIST.find((x) => x.id === mid)!
  return [m.stages, ...(m.origins ?? []).map((o) => [...o.head, ...m.stages.slice(m.originHead ?? 0)])].flat()
}
for (const rule of HIDDEN_RULES) {
  if (!PEOPLE[rule.cardId] || PEOPLE[rule.cardId]!.kind !== 'hidden') errors.push(`숨은 만남 ${rule.cardId}: hidden 카드가 아님`)
  if (!(rule.chance > 0 && rule.chance <= 0.1)) errors.push(`숨은 만남 ${rule.cardId}: 확률은 0~10%`)
  const mids = rule.materialIds ?? MATERIAL_LIST.map((m) => m.id)
  for (const mid of mids) if (!MATERIAL_LIST.find((m) => m.id === mid)) errors.push(`숨은 만남 ${rule.cardId}: 재료 ${mid} 없음`)
  const meets = mids.filter((mid) => MATERIAL_LIST.find((m) => m.id === mid) && rule.afterPersonIds.some((pid) => allStages(mid).includes(pid)))
  if (!meets.length) errors.push(`숨은 만남 ${rule.cardId}: 등장할 여정이 없음`)
  else reachable.add(rule.cardId)
  if (rule.materialIds) for (const mid of rule.materialIds) if (!meets.includes(mid)) errors.push(`숨은 만남 ${rule.cardId}: 재료 ${mid} 여정에는 ${rule.afterPersonIds.join('/')}가 없음`)
}

for (const s of SETS) {
  for (const id of s.memberIds) if (!reachable.has(id)) errors.push(`${s.id}: 멤버 ${id}를 얻을 수 없음`)
  if (!PEOPLE[s.rewardId] || PEOPLE[s.rewardId]!.kind !== 'set') errors.push(`${s.id}: 보상 오류`)
  reachable.add(s.rewardId)
}
for (const person of PEOPLE_LIST) {
  if (!reachable.has(person.id)) errors.push(`${person.id}: 어떤 경로로도 얻을 수 없음`)
}

// 물건 사전 항목 검사
const dictKeys = new Set<string>()
for (const e of dictionary as DictEntry[]) {
  if (dictKeys.has(e.key)) errors.push(`사전 ${e.key}: key 중복`)
  dictKeys.add(e.key)
  if (e.materialIds.length && journeyMaterialIds(e.materialIds, e.missing).length === 0) errors.push(`사전 ${e.key}: 준비 중 재료가 있는데 포장재만 남음`)
  // 재료가 하나도 없으면 준비 중 재료(missing)라도 있어야 한다
  if (!e.materialIds.length && !e.missing?.length) errors.push(`사전 ${e.key}: 재료 0개`)
  for (const m of e.missing ?? []) if (!/^[가-힣][가-힣 ]*$/.test(m)) errors.push(`사전 ${e.key}: 준비 중 재료 이름 "${m}"`)
  for (const id of e.materialIds) if (!MATERIAL_LIST.find((m) => m.id === id)) errors.push(`사전 ${e.key}: 재료 ${id} 없음`)
  for (const v of [...(e.voices ?? []), e.twist ?? '']) if (v && looksFactual(v)) errors.push(`사전 ${e.key}: 사실처럼 보이는 문구 "${v}"`)
}

// 복구 코드 낱말: 두 글자, 중복 없음, 경우의 수 확보
if (CODE_WORDS.length < 100) errors.push(`복구 코드 낱말이 ${CODE_WORDS.length}개뿐이에요 (100개 이상)`)
if (new Set(CODE_WORDS).size !== CODE_WORDS.length) errors.push('복구 코드 낱말 중복')
for (const w of CODE_WORDS) if (!/^[가-힣]{2}$/.test(w)) errors.push(`복구 코드 낱말 '${w}'가 두 글자 한글이 아님`)
// 기본 닉네임: 모든 앞말에 12자 안으로 붙는 뒷말이 있어야 한다
for (const a of NICKNAME_PARTS.WHEN_WHERE) {
  if (!NICKNAME_PARTS.LITTLE_THINGS.some((b) => Array.from(`${a}의 ${b}`).length <= NICKNAME_MAX)) errors.push(`닉네임 앞말 '${a}'는 너무 길어요`)
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
const links = findLinkCards([{ materialIds: ['cobalt', 'lithium'] }])
if (!links.includes('link-cn-refinery')) errors.push(`연결 카드 실패: ${links}`)

for (const key of ['2026-10-14', '2026-10-15', '2027-01-01']) {
  const answer = mysteryProduct(key)
  const options = mysteryOptions(key)
  if (options.length !== 6 || !options.find((o) => o.id === answer.id)) errors.push(`${key}: 미스터리 보기 오류`)
  if (new Set(options.map((o) => o.id)).size !== 6) errors.push(`${key}: 보기 중복`)
}

console.log('물건 사전', dictKeys.size, '· 재료', MATERIAL_LIST.length, '· 사람 카드', PEOPLE_LIST.length, '· 대표 물건', PRODUCTS.length, '· 장소', Object.keys(PLACES).length)
console.log('스마트폰 하루 통계', dayStats([{ materialIds: phone!.materialIds }]))

// 시드 여정 통계: 같은 id면 같은 타임라인, 출발지·이벤트·숨은 만남 빈도
const N = 3000
const originCount: Record<string, number> = {}
let withEvent = 0
let withHidden = 0
for (let i = 0; i < N; i++) {
  const id = `2026-10-14-1-${i.toString(36).padStart(4, '0')}`
  const t1 = JSON.stringify(buildTimeline(['coffee', 'cacao', 'salmon'], id))
  if (t1 !== JSON.stringify(buildTimeline(['coffee', 'cacao', 'salmon'], id))) errors.push(`${id}: 같은 id인데 타임라인이 다름`)
  const items = JSON.parse(t1) as Array<{ type: string; personId?: string }>
  if (items[0]?.type !== 'stage') errors.push(`${id}: 첫 칸이 사람 카드가 아님`)
  if (items.some((t) => t.type === 'event')) withEvent++
  if (items.some((t) => t.type === 'hidden')) withHidden++
  const first = items[0]?.personId ?? ''
  originCount[first] = (originCount[first] ?? 0) + 1
}
for (const old of ['2026-10-14-1', '2026-10-14-1abcd']) if (JSON.stringify(buildTimeline(['coffee', 'cacao'], old)) !== JSON.stringify(buildTimeline(['coffee', 'cacao']))) errors.push(`예전 여정 id ${old}는 기본 경로여야 함`)
if (resolveStages(MATERIAL_LIST.find((m) => m.id === 'coffee')!, null).stages[0] !== 'coffee-picker') errors.push('기본 출발지 오류')
console.log(`여정 ${N}개(커피·카카오·연어): 이벤트 ${Math.round((withEvent / N) * 100)}%, 숨은 만남 ${Math.round((withHidden / N) * 100)}%, 커피 첫 사람`, originCount)
console.log('오늘 미스터리', mysteryProduct('2026-10-14').name, mysteryHints(mysteryProduct('2026-10-14')))
if (errors.length) {
  console.error('\n오류', errors.length, '건\n' + errors.join('\n'))
  process.exit(1)
}
console.log('\n모든 검사 통과')
