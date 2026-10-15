import { KEY_STORIES } from './data/stories'
import { PEOPLE } from './data/people'

/**
 * 핵심 인물 화면의 이야기 (docs/key-people.md). 문구는 shared/data/stories.ts.
 * meetCount: 이 사람을 핵심 자리에서 만난 횟수(이번 만남 포함, 1부터). episodes가 있으면 그 횟수대로 다음 편, 다 보면 처음부터.
 * 이야기가 없는 사람은 카드 문구(Person.story)
 */
export function keyStory(personId: string, meetCount = 1): string {
  const s = KEY_STORIES[personId]
  const episodes = s?.episodes
  if (episodes?.length) return episodes[(Math.max(1, meetCount) - 1) % episodes.length]!
  return s?.story ?? PEOPLE[personId]?.story ?? ''
}

/** 그 사람의 작은 기쁨 한 구절. 없으면 undefined */
export function keyJoy(personId: string): string | undefined {
  return KEY_STORIES[personId]?.joy
}

/** 이 사람에게 쓴 이야기가 있는지 (docs/key-candidates.md 표시) */
export function hasKeyStory(personId: string): boolean {
  const s = KEY_STORIES[personId]
  return !!(s?.story || s?.episodes?.length)
}
