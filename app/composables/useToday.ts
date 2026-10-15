import { reactive } from 'vue'
import type { MoodId } from '../../shared/data/moods'
import { hash } from '../../shared/random'
import { seoulDateKey } from '../../shared/logic'
import { pickPerson, type Met, type Pick } from '../../shared/pick'

/**
 * 오늘 흐름 (docs/redesign/README.md): 마음 → 물건 → 실 → 그 사람의 오늘 → 한마디.
 * 화면 다섯 개가 같은 상태를 나눠 쓴다.
 */
export type TodayStep = 'mood' | 'item' | 'thread' | 'person' | 'reply'

/** 건넨 한마디: 고른 문구 번호, 또는 직접 쓴 말(기기에만) */
export type Reply = { kind: 'preset'; index: number } | { kind: 'own'; text: string }

interface Draft {
  step: TodayStep
  date: string
  mood?: MoodId
  /** 한 줄 (선택). 기기에만 */
  note: string
  item?: { name: string; materialIds: string[] }
  pick?: Pick
  reply?: Reply
}

const draft = reactive<Draft>({ step: 'mood', date: seoulDateKey(), note: '' })

/** 그날 그 물건의 시드: 출발지 변형·가게 사람이 하루 동안 같게 (shared/journey.ts의 새 여정 id 꼴) */
export function dayJourneyId(date: string, itemName: string): string {
  return `${date}-1-${hash(`today:${itemName}`).toString(36).slice(0, 6)}`
}

export function useToday() {
  function chooseMood(mood: MoodId) {
    draft.mood = mood
  }
  function chooseItem(item: { name: string; materialIds: string[] }, history: Met[] = []): Pick | null {
    if (!draft.mood) return null
    const pick = pickPerson({ materialIds: item.materialIds, itemName: item.name, journeyId: dayJourneyId(draft.date, item.name), mood: draft.mood, history })
    if (!pick) return null
    draft.item = item
    draft.pick = pick
    draft.reply = undefined
    return pick
  }
  function go(step: TodayStep) {
    draft.step = step
  }
  function giveReply(reply: Reply) {
    draft.reply = reply
  }
  /** 처음부터 (새 날) */
  function reset() {
    Object.assign(draft, { step: 'mood', date: seoulDateKey(), mood: undefined, note: '', item: undefined, pick: undefined, reply: undefined })
  }
  return { draft, chooseMood, chooseItem, go, giveReply, reset }
}
