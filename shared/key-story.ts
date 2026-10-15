import type { MoodId } from './data/moods'
import { KEY_STORIES, type Episode } from './data/stories'

/**
 * 핵심 인물 이야기를 보여 주는 규칙 (docs/key-people.md). 문구는 shared/data/stories.ts.
 * 사용자가 이야기가 몇 편인지, 더 남았는지 알 수 없게 한다: 편 번호·남은 개수·끝났다는 표시는 화면 어디에도 두지 않는다.
 * - Save.keyMeets[사람]: 그 사람의 이야기를 몇 편 봤는지. 핵심 자리에서 만날 때 아직 안 본 편이 있으면 다음 편을 보여 주고 1 늘린다.
 *   다 본 뒤에는 늘리지 않는다. 그래서 나중에 편을 더하면 처음부터 다시 돌지 않고 더한 편부터 이어서 나온다.
 * - 한 편짜리(story)도 한 편으로 센다. 이야기가 없는 사람은 세지 않는다(나중에 이야기가 생기면 첫 편부터).
 */

/** 이 사람의 이야기 편들과 마음 태그 (episodes, 없으면 story 한 편(태그 없음), 둘 다 없으면 빈 목록) */
export function storyEpisodeList(personId: string): Episode[] {
  const s = KEY_STORIES[personId]
  if (s?.episodes?.length) return s.episodes
  return s?.story ? [{ moods: [] as MoodId[], text: s.story }] : []
}

/** 이 사람의 이야기 편 글 */
export function storyEpisodes(personId: string): string[] {
  return storyEpisodeList(personId).map((e) => e.text)
}

/** 이번에 보여 줄 편 번호(0부터). 이미 다 봤으면 null */
export function nextEpisode(personId: string, seen: number): number | null {
  return seen < storyEpisodes(personId).length ? Math.max(0, seen) : null
}

/** 지금까지 본 편 (사람 카드의 '이야기' 칸). 안 본 편은 넣지 않는다 */
export function seenEpisodes(personId: string, seen: number): string[] {
  return storyEpisodes(personId).slice(0, Math.max(0, seen))
}

/** 그 사람의 작은 기쁨 한 구절. 없으면 undefined */
export function keyJoy(personId: string): string | undefined {
  return KEY_STORIES[personId]?.joy
}

/** 이 사람에게 쓴 이야기가 있는지 (docs/key-candidates.md 표시) */
export function hasKeyStory(personId: string): boolean {
  return storyEpisodes(personId).length > 0
}
