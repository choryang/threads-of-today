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

/** Save.seenScenes에 남기는 장면 id: 세트 id 또는 'ending' */
export const sceneKey = (scene: ThanksScene) => (scene.type === 'set' ? scene.setId : 'ending')

/** 열렸지만 아직 보여 주지 않은 장면. 고마움을 전한 순간에도, 다른 기기와 합쳐진 뒤 도감을 열 때도 이걸로 고른다 */
export function unseenScenes(thanked: Set<string>, seen: string[]): ThanksScene[] {
  const scenes: ThanksScene[] = thankedSets(thanked).map((s) => ({ type: 'set', setId: s.id }))
  if (everyoneThanked(thanked)) scenes.push({ type: 'ending' })
  return scenes.filter((scene) => !seen.includes(sceneKey(scene)))
}

export function setSceneLines(setId: string): string[] {
  return SET_THANKS_SCENES[setId] ?? []
}

export function endingLines(nickname: string): string[] {
  return ENDING_LINES.map((line) => line.replace('{nickname}', nickname))
}
