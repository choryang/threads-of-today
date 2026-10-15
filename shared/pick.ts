import { MATERIALS } from './data/materials'
import { sameCell, type MoodId } from './data/moods'
import { forwardTimeline, keyPeople, resolveStages, journeyRandom } from './journey'
import { storyEpisodeList } from './key-story'

/**
 * 한 사람 고르기 (docs/redesign/README.md "한 사람 고르기").
 * 1. 물건 → 재료 → 첫 재료의 경로 사람들(출발지 변형 포함, 여정 id 시드). 끝에 그 물건을 건네준 가게·사무실 사람도 경로로 친다
 *    (지금 timeline 규칙: 가게 사람은 여정 끝에 붙는다. 마트 계산원·택배 기사·바리스타의 이야기가 여기서 나온다).
 * 2. 그 경로에서 이야기가 있는 사람 중, 아직 안 본 편 가운데 오늘의 마음 태그가 붙은 편이 있는 사람.
 *    여럿이면 덜 만난 사람, 그다음 출발지에 가까운 사람. 그 사람의 편 중에서는 앞 편부터.
 * 3. 없으면 같은 칸(에너지·편안함이 같은 쪽)의 마음 태그 편 → 그래도 없으면 그 경로에서 이야기가 있는 아무나의 다음 편(안 본 편 중 맨 앞).
 * 4. 경로에 (남은 편이 있는) 이야기 사람이 없으면 핵심 인물 규칙의 시작한 손을 카드 문구로. 제목에 마음을 지어 붙이지 않는다.
 * 본 편은 하루 기록(만난 사람·본 편 번호)에서 센다. 편 번호·편 수는 화면에 보이지 않는다.
 */

export interface Met {
  personId: string
  /** 본 편 번호(0부터). 카드 문구로 만났으면 null */
  episode: number | null
}

export interface PickInput {
  materialIds: string[]
  itemName: string
  /** 출발지 변형·가게 사람을 정하는 시드 (shared/journey.ts의 새 여정 id 꼴: 'YYYY-MM-DD-1-xxxx') */
  journeyId: string
  mood: MoodId
  /** 지난 만남 (오래된 것부터) */
  history: Met[]
}

export type PickHow = 'mood' | 'cell' | 'next' | 'none'

export interface Pick {
  personId: string
  /** 보여 줄 편 번호. 'none'이면 null(카드 문구) */
  episode: number | null
  how: PickHow
  /** 첫 재료 경로 + 가게 사람 (출발지 → 내 손) */
  route: string[]
  /** 이 물건이 거쳐 온 모든 사람 (정방향, 중복 없이). 3번 화면의 손 점·'M명의 손' */
  hands: string[]
}

/** 첫 재료의 경로(출발지 변형 포함) + 여정 끝 가게·사무실 사람 */
export function pickRoute(materialIds: string[], journeyId: string, itemName: string): string[] {
  const first = materialIds.map((id) => MATERIALS[id]).find(Boolean)
  if (!first) return []
  const timeline = forwardTimeline(materialIds, journeyId, itemName)
  const firstStages = timeline.flatMap((t) => (t.type === 'stage' && !t.closing && t.materialId === first.id ? [t.personId] : []))
  // 타임라인이 없을 때(예전 id)도 출발지 변형 규칙은 그대로
  const route = firstStages.length ? firstStages : resolveStages(first, journeyRandom(journeyId)).stages
  const closing = timeline.flatMap((t) => (t.type === 'stage' && t.closing ? [t.personId] : []))
  return [...new Set([...route, ...closing])]
}

export function pickPerson(input: PickInput): Pick | null {
  const { materialIds, itemName, journeyId, mood, history } = input
  const route = pickRoute(materialIds, journeyId, itemName)
  if (!route.length) return null
  const timeline = forwardTimeline(materialIds, journeyId, itemName)
  const hands = [...new Set(timeline.flatMap((t) => (t.type === 'stage' || t.type === 'hidden' ? [t.personId] : [])))]

  const seen = new Map<string, Set<number>>()
  const met = new Map<string, number>()
  for (const h of history) {
    met.set(h.personId, (met.get(h.personId) ?? 0) + 1)
    if (h.episode !== null) seen.set(h.personId, (seen.get(h.personId) ?? new Set()).add(h.episode))
  }
  /** 사람마다 아직 안 본 편 (번호와 태그) */
  const candidates = route.flatMap((personId, order) => {
    const unseen = storyEpisodeList(personId)
      .map((e, i) => ({ i, moods: e.moods }))
      .filter((e) => !seen.get(personId)?.has(e.i))
    return unseen.length ? [{ personId, order, unseen }] : []
  })
  const byPreference = (a: { personId: string; order: number }, b: { personId: string; order: number }) =>
    (met.get(a.personId) ?? 0) - (met.get(b.personId) ?? 0) || a.order - b.order

  const tries: Array<{ how: PickHow; match: (m: MoodId[]) => boolean }> = [
    { how: 'mood', match: (moods) => moods.includes(mood) },
    { how: 'cell', match: (moods) => moods.some((m) => sameCell(m, mood)) },
    { how: 'next', match: () => true },
  ]
  for (const { how, match } of tries) {
    const found = candidates
      .map((c) => ({ ...c, episode: c.unseen.find((e) => match(e.moods))?.i }))
      .filter((c): c is typeof c & { episode: number } => c.episode !== undefined)
      .sort(byPreference)[0]
    if (found) return { personId: found.personId, episode: found.episode, how, route, hands }
  }

  // 이야기 사람이 없다: 시작한 손을 카드 문구로
  const start = keyPeople(timeline, journeyId).find((k) => k.slot === 'start')?.personId ?? route[0]!
  return { personId: start, episode: null, how: 'none', route, hands }
}
