import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PRODUCTS } from '../shared/data/materials'
import { PEOPLE } from '../shared/data/people'
import { mysteryOptions, mysteryProduct } from '../shared/logic'
import { mysteryHints } from '../shared/mystery'

const product = (id: string) => PRODUCTS.find((p) => p.id === id)!

test('미스터리 힌트: 모든 대표 물건이 5개, 재료·나라 개수 힌트는 없다', () => {
  for (const p of PRODUCTS) {
    const hints = mysteryHints(p)
    assert.equal(hints.length, 5, p.id)
    assert.ok(hints.every(Boolean), p.id)
    assert.ok(!hints.some((h) => /재료 \d+가지|\d+개 나라/.test(h)), p.id)
  }
})

test('미스터리 힌트: 보기의 다른 물건과 3·4번이 겹치지 않게 고른다', () => {
  // 4번: 기본 나라 힌트가 같은 두 물건이 같은 보기에 있으면, 다른 출발지로 바꿀 수 있을 때 바꾼다
  let switched = 0
  for (const a of PRODUCTS) {
    for (const b of PRODUCTS) {
      if (a === b) continue
      const base = mysteryHints(a)[3]
      const withB = mysteryHints(a, [b])[3]
      if (base !== mysteryHints(b)[3]) assert.equal(withB, base, `${a.id}/${b.id}`)
      else if (withB !== base) switched++
    }
  }
  assert.ok(switched > 0)
  // 3번: 다른 보기의 여정에 나오지 않는 중간 사람을 고른다 (아메리카노와 라떼)
  const middle = mysteryHints(product('latte'), [product('americano')])[2]!
  for (const id of ['sea-crew', 'busan-crane', 'warehouse', 'barista']) assert.ok(!middle.includes(PEOPLE[id]!.job), middle)
})

test('미스터리: 날짜마다 같은 문제와 같은 힌트', () => {
  const key = '2026-10-20'
  const answer = mysteryProduct(key)
  const others = () => mysteryOptions(key).filter((o) => o.id !== answer.id)
  assert.equal(mysteryOptions(key).length, 6)
  assert.deepEqual(mysteryHints(answer, others()), mysteryHints(answer, others()))
})
