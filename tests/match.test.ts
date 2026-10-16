import assert from 'node:assert/strict'
import { test } from 'node:test'
import { match, normalize } from '../shared/match'

const ids = (text: string) => match(text)?.materialIds ?? []

test('합성어: 참치김치김밥은 재료를 합치고 참치캔으로 잡히지 않는다', () => {
  const r = match('참치김치김밥')
  assert.ok(r)
  for (const id of ['tuna', 'chili', 'cabbage', 'rice']) assert.ok(r.materialIds.includes(id), id)
  assert.notEqual(r.name, '참치캔')
  assert.ok(!r.materialIds.includes('steel'))
  assert.equal(r.via, 'compound')
  assert.ok(r.materialIds.length <= 5)
})

test('한 글자 별칭 오매칭 방지', () => {
  assert.ok(!ids('김치').includes('laver'))
  assert.ok(!ids('라면').includes('cotton'))
  assert.equal(match('지하철'), null)
})

test('오타 허용', () => {
  const r = match('아메리까노')
  assert.equal(r?.name, '아이스 아메리카노')
  assert.equal(r?.via, 'typo')
})

test('동의어와 브랜드: 갤럭시 핸드폰은 스마트폰 계열', () => {
  const r = match('갤럭시 핸드폰')
  assert.ok(r)
  for (const id of ['cobalt', 'lithium', 'chip']) assert.ok(r.materialIds.includes(id), id)
})

test('무의미한 입력은 매칭하지 않는다', () => {
  assert.equal(match('ㅁㄴㅇㄹ'), null)
  assert.equal(match('   '), null)
  assert.equal(match('!!!'), null)
})

test('정확 일치는 대표 물건 이름으로 돌려준다', () => {
  assert.equal(match('참치마요')?.name, '참치마요 삼각김밥')
  assert.equal(match('카페라떼')?.name, '카페라떼')
  assert.equal(match('참치마요')?.via, 'exact')
})

test('입력한 말이 들어 있는 다른 물건으로 잡지 않는다', async () => {
  const { createMatcher, productEntries, widensInput } = await import('../shared/match')
  assert.ok(widensInput('딸기', '딸기 우유'))
  assert.ok(widensInput('레몬', '레몬 에이드 한 잔'))
  assert.ok(widensInput('고양이', '고양이 사료'))
  assert.ok(!widensInput('꿀', '꿀병'))
  assert.ok(!widensInput('레몬차', '레몬차 한 잔'))
  assert.ok(!widensInput('락스', '락스 (욕실 세정제)'))
  assert.ok(!widensInput('월요일', '아이스 아메리카노'))
  // '삼각김밥'은 참치마요 삼각김밥이 아니라 삼각김밥의 재료로
  assert.equal(match('삼각김밥')?.name, '삼각김밥')
  assert.deepEqual(match('삼각김밥')?.materialIds, ['rice', 'laver', 'tuna'])
  assert.equal(match('참치')?.name, '참치')
  assert.deepEqual(match('참치')?.materialIds, ['tuna'])
  // 사전(AI가 만든 것)의 그런 별칭은 쓰지 않는다. 대표 물건 별칭은 그대로
  const m = createMatcher([...productEntries(), { key: '딸기우유', name: '딸기 우유', aliases: ['딸기', '딸기우유'], materialIds: ['milk'] }])
  assert.notEqual(m.match('딸기')?.name, '딸기 우유')
  assert.equal(m.match('딸기우유')?.name, '딸기 우유')
  assert.equal(m.match('폰')?.name, '스마트폰')
  // 덜 쓴 말을 채운 낱말, 두 글자 오타는 잡지 않는다
  assert.equal(match('아이스아메리카'), null)
  assert.notEqual(match('운동')?.name, '우동')
})

test('수식어를 지운다', () => {
  assert.equal(normalize('편의점 삼각김밥 하나'), '삼각김밥')
  assert.equal(normalize('오늘 아메리카노 한 잔'), '아메리카노')
  assert.equal(match('오늘 마신 아메리카노 한잔')?.name, '아이스 아메리카노')
  assert.deepEqual(match('편의점삼각김밥')?.materialIds, ['rice', 'laver', 'tuna'])
  // 한 글자 수식어는 붙여 쓰면 지우지 않는다
  assert.equal(normalize('새우깡'), '새우깡')
})

test('동의어 치환', () => {
  assert.equal(match('쇠고기')?.materialIds[0], 'beef')
  assert.equal(match('폰')?.name, '스마트폰')
  assert.equal(match('돈까스')?.materialIds[0], 'pork')
  // '이어폰'이 '이어스마트폰'이 되지 않는다
  assert.equal(match('이어폰')?.name, '무선 이어폰')
})

test('재료 별칭 부분 일치', () => {
  const r = match('치즈케이크')
  assert.ok(r)
  assert.ok(r.materialIds.includes('milk'))
})

test('사실처럼 보이는 문구 거르기', async () => {
  const { looksFactual } = await import('../shared/safety')
  assert.ok(looksFactual('브라질에서 왔어요'))
  assert.ok(looksFactual('전 세계 70%가 여기서 나와요'))
  assert.ok(!looksFactual('아메리카노 한 잔 어때요?'))
  assert.ok(!looksFactual('오늘도 수고했어요'))
})

test('물건 사전 항목: 같은 물건을 다시 넣으면 voices 중 하나를 준다', async () => {
  const { createMatcher, productEntries } = await import('../shared/match')
  const voices = ['하나', '둘', '셋']
  const m = createMatcher([
    ...productEntries(),
    { key: '고양이사료', name: '고양이 사료', aliases: ['캣푸드'], materialIds: ['chicken', 'corn'], twist: '고양이 밥그릇을 채우는 것부터', voices },
  ])
  const seen = new Set<string>()
  for (let i = 0; i < 50; i++) {
    const r = m.match('캣푸드')
    assert.equal(r?.name, '고양이 사료')
    assert.ok(r?.twist)
    assert.ok(voices.includes(r!.voice!))
    seen.add(r!.voice!)
  }
  assert.ok(seen.size > 1)
  // 대표 물건이 사전보다 먼저 잡힌다
  assert.equal(m.match('라면')?.key, 'ramen')
})
