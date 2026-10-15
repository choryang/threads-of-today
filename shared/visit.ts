/**
 * 마을에 놀러 가서 꽃 남기기 (순수 함수). 저장은 server/utils/village.ts, 링크는 shared/share.ts의 village 종류.
 * 남는 글은 모두 정해진 문구다: 꽃에는 방문자 닉네임·주민 id·날짜만 있고 자유 입력 글은 없다.
 */
import { MATERIAL_LIST, PRODUCTS } from './data/materials'
import { PEOPLE } from './data/people'
import { PLACES } from './data/places'
import { CLOSINGS, IMPORT_OFFICE, closingKind } from './data/shops'
import type { ZoneId } from './data/village'
import { materialsOfPerson } from './friendship'
import type { Product } from './types'

export interface Flower {
  /** 꽃을 남긴 사람 (다른 사람에게 보이는 건 닉네임뿐) */
  nickname: string
  personId: string
  /** 서울 기준 날짜 YYYY-MM-DD */
  date: string
  /** 남긴 시각(ms). 주인이 마지막으로 본 뒤 새 꽃인지 가린다 */
  at: number
}

/** 마을마다 최근 꽃 개수, 기간 */
export const FLOWER_KEEP = 200
export const FLOWER_TTL_DAYS = 60
/** 공개 마을 API가 돌려주는 최근 꽃 (지도·알림에 쓰기에 충분한 만큼) */
export const FLOWER_PUBLIC = 60

/** 꽃 색: 주민이 사는 구역별 */
export const FLOWER_COLORS: Record<ZoneId, string> = {
  farm: '#F9B9C9', // 커피 언덕 분홍
  mine: '#C9A8F2', // 광산 마을 보라
  factory: '#F2D04E', // 공장 거리 노랑
  port: '#FFFFFF', // 항구 하양
  town: '#F59A4E', // 우리 동네 주황
}
export const flowerColor = (personId: string) => FLOWER_COLORS[PEOPLE[personId]?.zone ?? 'town']

/** 같은 방문자는 같은 마을에 하루(서울 날짜) 한 송이: 이 날짜에 이미 남겼는지 */
export function canLeaveFlower(lastDates: string[], seoulDate: string): boolean {
  return !lastDates.includes(seoulDate)
}

const jobOf = (id: string) => PEOPLE[id]?.job ?? ''

/** "10월 15일" */
export function dateLabel(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${m}월 ${d}일`
}

/** 마을의 꽃을 눌렀을 때: "세운님 · 10월 15일 · 커피 체리 수확자에게 고마워요" */
export function flowerLabel(f: Flower): string {
  return `${f.nickname}님 · ${dateLabel(f.date)} · ${jobOf(f.personId)}에게 고마워요`
}

/**
 * 주인이 마지막으로 본 뒤 새로 생긴 꽃의 알림 한 줄. 없으면 null.
 * 한 사람: "세운님이 다녀갔어요 · 커피 체리 수확자에게 고마워요를 남겼어요" / 여러 사람: "3명이 다녀갔어요"
 */
export function newFlowerNotice(flowers: Flower[], seenAt: number): { text: string; flowers: Flower[] } | null {
  const fresh = flowers.filter((f) => f.at > seenAt).sort((a, b) => b.at - a.at)
  if (!fresh.length) return null
  const visitors = [...new Set(fresh.map((f) => f.nickname))]
  if (visitors.length > 1) return { text: `${visitors.length}명이 다녀갔어요`, flowers: fresh }
  const jobs = [...new Set(fresh.map((f) => jobOf(f.personId)))]
  const to = jobs.length > 2 ? `${jobs.slice(0, 2).join('·')} 외 ${jobs.length - 2}명` : jobs.join('·')
  return { text: `${visitors[0]}님이 다녀갔어요 · ${to}에게 고마워요를 남겼어요`, flowers: fresh }
}

/**
 * 친구 마을에서 내가 못 만난 주민의 힌트 물건: "이 분은 바나나 속에 있어요".
 * 그 사람이 나오는 재료로 만든 대표 물건 중, 그 재료가 앞에 있고 재료가 적은 물건(바나나 농부 → 바나나우유보다 바나나).
 * 재료 여정 밖의 가게·사무실 사람은 그 사람이 마지막 장면에 나오는 물건. 못 찾으면 null
 */
export function hintProductOf(personId: string): Product | null {
  const mats = materialsOfPerson(personId)
  if (mats.length) {
    const scored = PRODUCTS.flatMap((p) => {
      const i = p.materialIds.findIndex((m) => mats.includes(m))
      return i < 0 ? [] : [{ p, key: i * 10 + p.materialIds.length }]
    })
    scored.sort((a, b) => a.key - b.key || PRODUCTS.indexOf(a.p) - PRODUCTS.indexOf(b.p))
    if (scored[0]) return scored[0].p
  }
  // 무역회사 수입 담당은 나라 밖을 지나온 물건의 마지막 장면에 나온다
  const imported = (p: Product) =>
    p.materialIds.some((m) => (MATERIAL_LIST.find((x) => x.id === m)?.stages ?? []).some((s) => {
      const country = PLACES[PEOPLE[s]?.placeId ?? '']?.country
      return !!country && country !== '대한민국'
    }))
  return PRODUCTS.find((p) => {
    const c = CLOSINGS[closingKind(p.name, p.materialIds)]
    return [...c.shop, ...c.office].includes(personId) || (personId === IMPORT_OFFICE && imported(p))
  }) ?? null
}
