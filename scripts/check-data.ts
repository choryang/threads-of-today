/* 데이터 무결성 검사: npx tsx scripts/check-data.ts */
import { existsSync } from 'node:fs'
import { LINK_RULES, MATERIAL_LIST, PRODUCTS, SETS } from '../shared/data/materials'
import { PEOPLE, PEOPLE_LIST } from '../shared/data/people'
import { PLACES } from '../shared/data/places'
import dictionary from '../shared/data/dictionary.json'
import { EVENTS, HIDDEN_RULES } from '../shared/data/journey-extras'
import { SYNONYM_GROUPS } from '../shared/data/synonyms'
import { SET_THANKS_SCENES, THANKS_BY_PERSON } from '../shared/data/thanks'
import { CLOSINGS, CLOSING_PEOPLE, closingKind, type ClosingKind } from '../shared/data/shops'
import { thanksRepliesOf } from '../shared/thanks'
import { buildTimeline, forwardTimeline, quizzesOf, resolveStages, reverseTimeline, timelinePeople } from '../shared/journey'
import { FORMS } from '../shared/data/forms'
import { reverseDistances } from '../shared/distance'
import { looksFactual } from '../shared/safety'
import { CODE_WORDS } from '../shared/recovery'
import { NICKNAME_MAX, NICKNAME_PARTS } from '../shared/nickname'
import { dayStats, findLinkCards, journeyMaterialIds, mysteryOptions, mysteryProduct } from '../shared/logic'
import { MYSTERY_HINT_COUNT, middleCandidates, mysteryHints } from '../shared/mystery'
import { MYSTERY_INFO } from '../shared/data/mystery'
import { createMatcher, match, productEntries, type DictEntry } from '../shared/match'
import { WORK_QUIZZES } from '../shared/data/work-quizzes'
import { NAME_GROUPS } from '../shared/data/names'

const errors: string[] = []
const reachable = new Set<string>()

const personIds = new Set<string>()
for (const person of PEOPLE_LIST) {
  if (personIds.has(person.id)) errors.push(`사람 id ${person.id} 중복`)
  personIds.add(person.id)
  if (!PLACES[person.placeId]) errors.push(`${person.id}: 장소 ${person.placeId} 없음`)
  const { outfit, hair, face, prop, tint } = person.look
  for (const name of [`outfit-${outfit}`, `hair-${hair}`, `face-${face}`, `prop-${prop}`]) {
    if (!existsSync(new URL(`../app/assets/character/${name}.svg`, import.meta.url))) errors.push(`${person.id}: 캐릭터 파츠 ${name}.svg 없음`)
  }
  if (tint && prop !== 'drop') errors.push(`${person.id}: tint는 prop이 drop일 때만 씀`)
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

// 여정 끝의 가게·사무실 사람: stage 카드이고, 그 종류의 물건이 대표 물건이나 사전에 실제로 있어야 얻을 수 있다
const kindsInUse = new Set<ClosingKind>([
  ...PRODUCTS.map((p) => closingKind(p.name, p.materialIds)),
  ...(dictionary as DictEntry[]).filter((e) => e.materialIds.length).map((e) => closingKind(e.name, e.materialIds)),
])
for (const [kind, closing] of Object.entries(CLOSINGS) as Array<[ClosingKind, (typeof CLOSINGS)[ClosingKind]]>) {
  if (!kindsInUse.has(kind)) errors.push(`마지막 장면 ${kind}: 이 종류의 물건이 대표 물건·사전에 없음`)
  for (const id of [...closing.shop, ...closing.office]) if (kindsInUse.has(kind)) reachable.add(id)
}
for (const id of CLOSING_PEOPLE) {
  if (!PEOPLE[id]) errors.push(`마지막 장면: 사람 ${id} 없음`)
  else if (PEOPLE[id]!.kind !== 'stage') errors.push(`마지막 장면: ${id}는 stage 카드가 아님`)
}
reachable.add('trade-clerk') // 수입 재료가 지나온 여정이면 늘 후보에 들어간다

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

// 고마워요: 모든 사람에게 답이 2개 이상, 세트마다 감사 장면. 숫자·이모지 없이
const EMOJI = /\p{Extended_Pictographic}/u
for (const person of PEOPLE_LIST) {
  const replies = thanksRepliesOf(person.id)
  if (replies.length < 2) errors.push(`${person.id}: 고마워요 답이 ${replies.length}개`)
  for (const r of replies) if (/[0-9]/.test(r) || EMOJI.test(r)) errors.push(`${person.id}: 답에 숫자·이모지 "${r}"`)
}
for (const id of Object.keys(THANKS_BY_PERSON)) if (!PEOPLE[id]) errors.push(`고마워요 답: 사람 ${id} 없음`)
for (const set of SETS) {
  const lines = SET_THANKS_SCENES[set.id] ?? []
  if (!lines.length) errors.push(`${set.id}: 감사 장면 없음`)
  for (const line of lines) if (/[0-9]/.test(line) || EMOJI.test(line)) errors.push(`${set.id}: 장면에 숫자·이모지`)
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
// 미스터리 힌트: 모든 대표 물건이 힌트 5개, 1~4번에 정답 이름(물건 이름·별칭)이 없을 것. 날짜별 보기 조합으로도 확인
const answerWords = (p: (typeof PRODUCTS)[number]) => [...new Set([p.name, ...p.aliases].flatMap((w) => [w, w.replace(/\s+/g, '')]).filter((w) => w.length >= 2))]
function checkHints(p: (typeof PRODUCTS)[number], hints: string[], where: string) {
  if (hints.length !== MYSTERY_HINT_COUNT || hints.some((h) => !h)) errors.push(`미스터리 ${p.id}${where}: 힌트가 ${MYSTERY_HINT_COUNT}개가 아님 ${JSON.stringify(hints)}`)
  for (const [i, h] of hints.slice(0, 4).entries()) {
    const word = answerWords(p).find((w) => h.replace(/\s+/g, '').includes(w.replace(/\s+/g, '')))
    if (word) errors.push(`미스터리 ${p.id}${where}: 힌트 ${i + 1}에 정답 이름 '${word}' — ${h}`)
  }
}
for (const p of PRODUCTS) {
  if (!MYSTERY_INFO[p.id]) errors.push(`미스터리 ${p.id}: 쓰임새·분류 데이터 없음`)
  if (!middleCandidates(p).length) errors.push(`미스터리 ${p.id}: 힌트 3에 쓸 중간 사람이 없음`)
  checkHints(p, mysteryHints(p), '')
}
for (const id of Object.keys(MYSTERY_INFO)) if (!PRODUCTS.find((p) => p.id === id)) errors.push(`미스터리 데이터 ${id}: 대표 물건에 없음`)
for (let i = 0; i < 120; i++) {
  const d = new Date(2026, 9, 15 + i)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const answer = mysteryProduct(key)
  checkHints(answer, mysteryHints(answer, mysteryOptions(key).filter((o) => o.id !== answer.id)), ` (${key})`)
}
// 일의 크기 한 줄: 40자 이내 해요체, 숫자 앞에 '약'·'보통', 출처(이름·연도·URL) 필수, 임금·사고 같은 이야기는 넣지 않는다
const FORBIDDEN_FACT = ['임금', '월급', '시급', '연봉', '소득', '빈곤', '가난', '사고', '부상', '사망', '다쳐', '힘들']
for (const person of PEOPLE_LIST) {
  const fact = person.workFact
  if (!fact) {
    if (person.workFactSource) errors.push(`${person.id}: 출처만 있고 workFact가 없음`)
    continue
  }
  if (fact.length > 40) errors.push(`${person.id}: workFact가 40자를 넘음 (${fact.length}자)`)
  if (!/요[.!]?$/.test(fact)) errors.push(`${person.id}: workFact는 해요체로 — ${fact}`)
  if (!/[0-9]/.test(fact) || !/(약|보통)/.test(fact)) errors.push(`${person.id}: workFact에 숫자와 '약'·'보통'이 필요함 — ${fact}`)
  for (const w of FORBIDDEN_FACT) if (fact.includes(w)) errors.push(`${person.id}: workFact에 '${w}' — ${fact}`)
  const src = person.workFactSource
  if (!src?.name || !Number.isInteger(src.year) || !/^https?:\/\//.test(src.url ?? '')) errors.push(`${person.id}: workFactSource(이름·연도·URL)가 없거나 잘못됨`)
}

// 일의 크기 퀴즈: 아는 재료, 보기 3개(서로 다름), 해설에 숫자
for (const [id, q] of Object.entries(WORK_QUIZZES)) {
  if (!MATERIAL_LIST.some((m) => m.id === id)) errors.push(`일의 크기 퀴즈 ${id}: 재료 없음`)
  if (q.options.length !== 3 || new Set(q.options).size !== 3) errors.push(`일의 크기 퀴즈 ${id}: 보기는 서로 다른 3개`)
  if (!/[0-9]/.test(q.explain)) errors.push(`일의 크기 퀴즈 ${id}: 해설에 정답 숫자가 없음`)
}
console.log('일의 크기: 카드', PEOPLE_LIST.filter((p) => p.workFact).length, '명 · 퀴즈', Object.keys(WORK_QUIZZES).length, '개 / 재료', MATERIAL_LIST.length, '개')

// 이름: 한글 1~6자, 일하는 나라 묶음에 넣고, 같은 나라 안에서 겹치지 않는다. 바다 위 이름은 가져온 나라의 이름과도 겹치지 않는다
const namesByCountry = new Map<string, Map<string, string>>()
const claim = (country: string, name: string, id: string) => {
  const seen = namesByCountry.get(country) ?? new Map<string, string>()
  namesByCountry.set(country, seen)
  if (seen.has(name)) errors.push(`이름 '${name}'이 ${country || '바다'}에서 겹침: ${seen.get(name)}, ${id}`)
  seen.set(name, id)
}
for (const group of NAME_GROUPS) {
  for (const [id, name] of Object.entries(group.names)) {
    const person = PEOPLE[id]
    if (!person) { errors.push(`이름 ${id}: 사람 없음`); continue }
    if (person.kind === 'link') errors.push(`이름 ${id}: 연결 카드는 원래 사람의 이름을 따른다 (names.ts에 넣지 않음)`)
    if (PLACES[person.placeId]?.country !== group.country) errors.push(`이름 ${id}: ${group.country || '바다'} 묶음인데 장소는 ${PLACES[person.placeId]?.country || '바다'}`)
    if (!/^[가-힣]{1,6}$/.test(name)) errors.push(`이름 ${id}: 한글 1~6자 — ${name}`)
    if (!group.country && !group.from?.[id]) errors.push(`이름 ${id}: 바다 위 사람은 이름을 가져온 나라(from)를 적는다`)
    claim(group.from?.[id] ?? group.country, name, id)
  }
}
for (const rule of LINK_RULES) {
  if (PEOPLE[rule.cardId]?.name !== PEOPLE[rule.personId]?.name) errors.push(`${rule.cardId}: 연결 카드 이름이 원래 사람(${rule.personId})과 다름`)
}
const unnamed = PEOPLE_LIST.filter((p) => !p.name)
console.log('이름:', PEOPLE_LIST.length - unnamed.length, '/', PEOPLE_LIST.length, unnamed.length ? `· 이름 없음 ${unnamed.map((p) => p.id).join(', ')}` : '')

// 장소 좌표: 지나가는 바다 말고는 모두 있어야 거리를 잴 수 있다
for (const place of Object.values(PLACES)) {
  const has = place.lat !== undefined && place.lng !== undefined
  if (place.continent !== 'sea' && !has) errors.push(`장소 ${place.id}: 위도·경도 없음`)
  if (has && (Math.abs(place.lat!) > 90 || Math.abs(place.lng!) > 180)) errors.push(`장소 ${place.id}: 좌표 범위 오류`)
  if (has && place.continent === 'korea' && (place.lat! < 33 || place.lat! > 39 || place.lng! < 124 || place.lng! > 132)) errors.push(`장소 ${place.id}: 우리나라 밖 좌표`)
}

// 되감기 변신: 재료마다 형태 목록. 첫 형태는 출발지 모습(by 없음), 나머지는 그 재료의 여정에 있는 사람이 만든다.
// 어느 출발지로 가도 형태가 뒤로 돌아가지 않아야 한다(실제 가공 순서)
for (const m of MATERIAL_LIST) {
  const forms = FORMS[m.id]
  if (!forms?.length) { errors.push(`${m.id}: 형태 목록(forms.ts) 없음`); continue }
  if (forms[0]!.by?.length) errors.push(`${m.id}: 첫 형태 '${forms[0]!.name}'에는 by를 두지 않는다`)
  if (new Set(forms.map((f) => f.name)).size !== forms.length) errors.push(`${m.id}: 형태 이름 중복`)
  const routes = [m.stages, ...(m.origins ?? []).map((o) => [...o.head, ...m.stages.slice(m.originHead ?? 0)])]
  const onRoute = new Set(routes.flat())
  forms.slice(1).forEach((f, k) => {
    if (!f.by?.length) errors.push(`${m.id}: 형태 '${f.name}'에 by가 없음`)
    for (const id of f.by ?? []) if (!onRoute.has(id)) errors.push(`${m.id}: 형태 '${f.name}'의 ${id}는 이 재료의 여정에 없음`)
    if (!(f.by ?? []).some((id) => onRoute.has(id))) errors.push(`${m.id}: 형태 ${k + 2} '${f.name}'은 어느 경로에서도 나오지 않음`)
  })
  for (const route of routes) {
    let last = 0
    for (const id of route) {
      const made = forms.findIndex((f) => f.by?.includes(id))
      if (made < 0) continue
      if (made < last) errors.push(`${m.id}: ${route.join('>')} 경로에서 ${id}의 형태가 앞 형태보다 앞섬`)
      last = Math.max(last, made)
    }
  }
}

// 거꾸로 가는 여정: 정방향과 같은 사람·퀴즈·숨은 만남·연결 카드, 순서만 다르다. 첫 칸은 가게 사람
const pairs = (list: Array<{ materialId: string; personId: string }>) => [...new Set(list.map((x) => `${x.materialId}:${x.personId}`))].sort().join(',')
const forwardPairs = (ids: string[], id: string, name: string) =>
  pairs(forwardTimeline(ids, id, name).flatMap((t) => (t.type === 'stage' || t.type === 'hidden' ? [{ materialId: t.materialId, personId: t.personId }] : [])))
let maxKm = 0
for (const product of PRODUCTS) {
  for (let i = 0; i < 40; i++) {
    const id = `2026-10-15-1-${i.toString(36).padStart(4, '0')}-r`
    const rev = reverseTimeline(product.materialIds, id, product.name)
    const fwd = forwardTimeline(product.materialIds, id, product.name)
    if (rev[0]?.type !== 'stage' || !rev[0].closing) errors.push(`${product.id} ${id}: 거꾸로 가는 여정의 첫 칸이 가게 사람이 아님`)
    if (pairs(timelinePeople(product.materialIds, id, product.name)) !== forwardPairs(product.materialIds, id, product.name)) errors.push(`${product.id} ${id}: 거꾸로 간 여정의 사람이 정방향과 다름`)
    const kinds = (list: typeof rev) => list.filter((t) => t.type === 'quiz' || t.type === 'hidden' || t.type === 'event').map((t) => JSON.stringify(t)).sort().join()
    if (kinds(rev) !== kinds(fwd)) errors.push(`${product.id} ${id}: 퀴즈·숨은 만남·이야기가 정방향과 다름`)
    const km = reverseDistances(rev).total
    if (!Number.isFinite(km)) errors.push(`${product.id} ${id}: 거리 계산 오류`)
    maxKm = Math.max(maxKm, km)
  }
}
if (JSON.stringify(buildTimeline(['coffee'], '2026-10-15-1-k3x9-r', '아메리카노')) !== JSON.stringify(reverseTimeline(['coffee'], '2026-10-15-1-k3x9-r', '아메리카노'))) errors.push("'-r' 여정은 거꾸로 가야 함")
if (JSON.stringify(buildTimeline(['coffee'], '2026-10-15-1-k3x9', '아메리카노')) !== JSON.stringify(forwardTimeline(['coffee'], '2026-10-15-1-k3x9', '아메리카노'))) errors.push("'-r'이 없는 여정은 예전 순서여야 함")
console.log('형태:', Object.values(FORMS).flat().length, '개 · 거꾸로 가는 여정 검사', PRODUCTS.length * 40, '개 · 가장 먼 여정 약', Math.round(maxKm), 'km')

const today = mysteryProduct('2026-10-15')
console.log('오늘 미스터리', today.name, mysteryHints(today, mysteryOptions('2026-10-15').filter((o) => o.id !== today.id)))
if (errors.length) {
  console.error('\n오류', errors.length, '건\n' + errors.join('\n'))
  process.exit(1)
}
console.log('\n모든 검사 통과')
