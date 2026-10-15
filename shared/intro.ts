/**
 * 사람 카드 소개하기 (/p/{token}, shared/share.ts의 person 종류). 남는 글은 모두 정해진 문구다: 자유 입력은 받지 않는다.
 * 링크에는 사람 id, 보낸 사람 닉네임, 문구 id, (맛있어서 문구일 때) 물건 id만 담는다.
 */
import { PRODUCTS } from './data/materials'
import { PEOPLE } from './data/people'
import { NON_FOOD } from './data/shops'
import { withJosa } from './logic'
import type { Product } from './types'

export type IntroPhraseId = 'tasty' | 'in-my-day' | 'thanks-to' | 'story'

export const INTRO_PHRASES: Array<{ id: IntroPhraseId; needsItem?: true }> = [
  { id: 'tasty', needsItem: true },
  { id: 'in-my-day' },
  { id: 'thanks-to' },
  { id: 'story' },
]

const productOf = (id?: string) => (id ? PRODUCTS.find((p) => p.id === id) : undefined)

/** 소개 문구. tasty는 물건 이름이 들어간다: "오늘 아침 커피가 맛있어서, 이 분을 소개해요" */
export function introText(phraseId: IntroPhraseId, itemId?: string): string {
  switch (phraseId) {
    case 'tasty': {
      const name = productOf(itemId)?.name ?? ''
      return name ? `오늘 아침 ${withJosa(name, '이', '가')} 맛있어서, 이 분을 소개해요` : '오늘 제 하루에 이 분이 있었어요'
    }
    case 'in-my-day': return '오늘 제 하루에 이 분이 있었어요'
    case 'thanks-to': return '이 분 덕분에 오늘 하루가 편했어요'
    case 'story': return '이 분 이야기를 알려주고 싶었어요'
  }
}

/** 먹는 물건인지 (맛있어서 문구를 쓸 수 있는지) */
export const isFood = (p: Product) => p.materialIds.some((m) => !NON_FOOD.includes(m))

/**
 * 맛있어서 문구에 넣을 물건: 그 사람을 만난 여정의 물건 이름(metNames) 중 대표 물건이고 먹는 것. 없으면 null(문구를 고를 수 없다)
 */
export function tastyItemFor(metNames: string[] = []): Product | null {
  for (const name of [...metNames].reverse()) {
    const p = PRODUCTS.find((x) => x.name === name)
    if (p && isFood(p)) return p
  }
  return null
}

/** 소개 화면 3단계에 쓰는 일하는 사실: 출처가 있고 사람 한 명의 크기인 숫자만. 없으면 건너뛴다 */
export function introFactOf(personId: string): { fact: string; source: NonNullable<(typeof PEOPLE)[string]['workFactSource']> } | null {
  const p = PEOPLE[personId]
  return p?.workFact && p.workFactSource && p.workFactHuman ? { fact: p.workFact, source: p.workFactSource } : null
}

/**
 * 보낸 사람에게 한 번 보여 주는 알림. entries: 소개 링크마다 새로 생긴 고마워요 수.
 *  1번: "누군가 옥희님의 소개로 커피 체리 수확자에게 고마워했어요" / 여러 번: "3명이 …"
 */
export function introThanksNotice(entries: Array<{ personId: string; fresh: number }>, nickname: string): string {
  const live = entries.filter((e) => e.fresh > 0)
  const total = live.reduce((s, e) => s + e.fresh, 0)
  if (!total) return ''
  const jobs = [...new Set(live.map((e) => PEOPLE[e.personId]?.job ?? ''))]
  const to = jobs.length === 1 ? jobs[0]! : `${jobs[0]} 외 ${jobs.length - 1}명`
  const who = total === 1 ? '누군가' : `${total.toLocaleString('ko-KR')}명이`
  return `${who} ${nickname}님의 소개로 ${to}에게 고마워했어요`
}
