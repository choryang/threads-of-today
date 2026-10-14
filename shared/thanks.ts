/**
 * "고마워요": 만난 사람에게 한 번씩 고마움을 전한다. 답은 카드 id를 시드로 고르고(늘 같은 답),
 * 세트 하나를 모두(보상 카드 포함) 고마워하면 감사 장면, 모든 사람에게 전하면 엔딩을 한 번 보여 준다.
 */
import { SETS } from './data/materials'
import { PEOPLE, PEOPLE_LIST } from './data/people'
import { ENDING_LINES, SET_THANKS_SCENES, THANKS_BY_PERSON, THANKS_REPLIES, thanksGroupOf } from './data/thanks'
import { hash } from './random'
import type { CardSet } from './types'

export function thanksRepliesOf(personId: string): string[] {
  const person = PEOPLE[personId]
  if (!person) return []
  return THANKS_BY_PERSON[personId] ?? THANKS_REPLIES[thanksGroupOf(person)]
}

/** 이 사람이 "고마워요"에 하는 답 */
export function thanksReply(personId: string): string {
  const replies = thanksRepliesOf(personId)
  return replies[hash(`thanks:${personId}`) % replies.length] ?? ''
}

const setMembers = (set: CardSet) => [...set.memberIds, set.rewardId]

/** 멤버와 보상 카드 모두에게 고마움을 전한 세트 */
export function thankedSets(thanked: Set<string>): CardSet[] {
  return SETS.filter((set) => setMembers(set).every((id) => thanked.has(id)))
}

export function everyoneThanked(thanked: Set<string>): boolean {
  return PEOPLE_LIST.every((p) => thanked.has(p.id))
}

export type ThanksScene = { type: 'set'; setId: string } | { type: 'ending' }

/** 고마움을 하나 더 전했을 때 새로 열리는 장면 */
export function newScenes(before: Set<string>, after: Set<string>): ThanksScene[] {
  const was = new Set(thankedSets(before).map((s) => s.id))
  const scenes: ThanksScene[] = thankedSets(after).filter((s) => !was.has(s.id)).map((s) => ({ type: 'set', setId: s.id }))
  if (!everyoneThanked(before) && everyoneThanked(after)) scenes.push({ type: 'ending' })
  return scenes
}

export function setSceneLines(setId: string): string[] {
  return SET_THANKS_SCENES[setId] ?? []
}

export function endingLines(nickname: string): string[] {
  return ENDING_LINES.map((line) => line.replace('{nickname}', nickname))
}
