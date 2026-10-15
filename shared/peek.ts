import { coveredEpisodes, storyEpisodes } from './key-story'
import type { MoodId } from './data/moods'
import type { TodayRecord } from './progress'

/**
 * 지금 들여다보기 (docs/redesign/README.md): 이어진 사람(또는 걷기에서 누른 사람)을 아래 시트로 다시 본다.
 * 하루 기록에서 읽기만 한다: 새 편을 열지 않고(하루 한 편 규칙 그대로), 기록에 아무것도 더하지 않는다.
 */
export interface Peek {
  /** 마지막으로 만난 날과 그날의 내 마음. 만난 적 없으면 없음(걷기에서 처음 본 사람) */
  last?: { date: string; mood: MoodId }
  /** 지난 이야기: 본 편만, 편 순서대로 */
  seen: string[]
}

export function peekOf(todays: Record<string, TodayRecord> | undefined, personId: string): Peek {
  const mine = Object.entries(todays ?? {}).filter(([, r]) => r.personId === personId)
  const latest = [...mine].sort(([a], [b]) => b.localeCompare(a))[0]
  const texts = storyEpisodes(personId)
  const seen = [...new Set(mine.flatMap(([, r]) => coveredEpisodes(personId, r.episode, r.rev)))]
    .sort((a, b) => a - b)
    .flatMap((i) => (texts[i] ? [texts[i]!] : []))
  return { ...(latest ? { last: { date: latest[0], mood: latest[1].mood } } : {}), seen }
}
