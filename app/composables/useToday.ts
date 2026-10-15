import { reactive } from 'vue'
import type { MoodId } from '../../shared/data/moods'
import { hash } from '../../shared/random'
import { seoulDateKey } from '../../shared/logic'
import { pickPerson, type Pick } from '../../shared/pick'
import type { TodayRecord } from '../../shared/progress'
import { historyOf, memoryFor, recordHow } from '../../shared/today-log'
import { localDay, setLocalDay } from '../utils/today-local'
import type { JobId } from '../../shared/data/jobs'
import { shouldAskJob } from '../../shared/job'

/**
 * 오늘 흐름 (docs/redesign/README.md): 마음 → 물건 → 실 → 그 사람의 오늘 → 한마디. 화면 다섯 개가 같은 상태를 나눠 쓴다.
 * 저장 (README "저장"):
 *  - 그 사람을 만나는 순간(4번 화면) 하루 기록을 Save.todays[서울 날짜]에 남기고, 한마디를 건네면 고른 번호를 더한다.
 *    서버에는 마음·물건·사람·편·한마디 번호만 간다(동기화).
 *  - 한 줄과 직접 쓴 한마디는 기기에만(app/utils/today-local.ts).
 *  - 하루 한 번: 오늘 기록이 있으면 첫 화면은 오늘의 결과('done'), 한마디 전이면 그 사람 화면부터.
 */
export type TodayStep = 'mood' | 'item' | 'thread' | 'person' | 'reply' | 'done'

/** 건넨 한마디: 고른 문구 번호, 또는 직접 쓴 말(기기에만) */
export type Reply = { kind: 'preset'; index: number } | { kind: 'own'; text: string }

interface Draft {
  step: TodayStep
  date: string
  mood?: MoodId
  /** 한 줄 (선택). 기기에만 */
  note: string
  item?: { name: string; materialIds: string[] }
  /** 만난 사람과 편. 오늘 기록에서 다시 열면 route·hands는 비어 있다 */
  pick?: Pick
  reply?: Reply
  /** 같은 사람을 다시 만났을 때 이야기 위 한 줄 */
  memory?: string
}

const draft = reactive<Draft>({ step: 'mood', date: seoulDateKey(), note: '' })

/** 그날 그 물건의 시드: 출발지 변형·가게 사람이 하루 동안 같게 (shared/journey.ts의 새 여정 id 꼴) */
export function dayJourneyId(date: string, itemName: string): string {
  return `${date}-1-${hash(`today:${itemName}`).toString(36).slice(0, 6)}`
}

const replyOf = (rec: TodayRecord, date: string): Reply | undefined => {
  if (rec.reply === undefined) return undefined
  if (rec.reply === 'own') return { kind: 'own', text: localDay(date).own ?? '' }
  return { kind: 'preset', index: rec.reply }
}

export function useToday() {
  const game = useGame()
  const { sync } = useSync()
  const todays = () => game.state.todays

  /** 첫 화면을 열 때: 오늘 기록이 있으면 그 자리부터 (새 날이면 처음부터) */
  function open() {
    const date = seoulDateKey()
    const rec = todays()?.[date]
    if (draft.date !== date) reset()
    draft.date = date
    draft.note = localDay(date).note ?? draft.note
    if (!rec) {
      if (draft.step === 'done') reset()
      return
    }
    draft.mood = rec.mood
    draft.item = { name: rec.item, materialIds: draft.item?.name === rec.item ? draft.item.materialIds : [] }
    draft.pick = draft.pick?.personId === rec.personId ? draft.pick : { personId: rec.personId, episode: rec.episode, how: recordHow(rec), route: [], hands: [] }
    draft.reply = replyOf(rec, date)
    draft.memory = memoryFor(todays(), rec.personId, date, (d) => localDay(d).own)
    if (draft.reply) draft.step = 'done'
    else if (draft.step !== 'reply') draft.step = 'person'
  }

  function chooseMood(mood: MoodId) {
    draft.mood = mood
  }
  function setNote(text: string) {
    draft.note = text
    setLocalDay(draft.date, { note: text.trim() })
  }
  function chooseItem(item: { name: string; materialIds: string[] }): Pick | null {
    if (!draft.mood) return null
    const pick = pickPerson({
      materialIds: item.materialIds,
      itemName: item.name,
      journeyId: dayJourneyId(draft.date, item.name),
      mood: draft.mood,
      history: historyOf(todays(), draft.date),
    })
    if (!pick) return null
    draft.item = item
    draft.pick = pick
    draft.reply = undefined
    draft.memory = memoryFor(todays(), pick.personId, draft.date, (d) => localDay(d).own)
    return pick
  }
  /** 그 사람을 만나는 순간 하루 기록을 남긴다(한 번만). 그 뒤로는 오늘 다른 사람을 고르지 않는다 */
  function meet() {
    const { mood, item, pick, date } = draft
    if (!mood || !item || !pick || todays()?.[date]) return
    if (!game.state.todays) game.state.todays = {}
    game.state.todays[date] = { mood, item: item.name, personId: pick.personId, episode: pick.episode, how: pick.how }
  }
  function go(step: TodayStep) {
    if (step === 'person') meet()
    draft.step = step
  }
  function giveReply(reply: Reply) {
    const rec = todays()?.[draft.date]
    if (!rec || rec.reply !== undefined) return
    draft.reply = reply
    rec.reply = reply.kind === 'preset' ? reply.index : 'own'
    if (reply.kind === 'own') setLocalDay(draft.date, { own: reply.text })
    void sync()
  }
  /** 하는 일: 고른 일 또는 'declined'(말하지 않을래요·닫기). 정하면 다시 묻지 않는다 */
  function setJob(value: JobId | 'declined') {
    game.state.job = { value, at: Date.now() }
    void sync()
  }
  /** 오늘 하는 일을 물을지 (3일째, 한마디를 건넨 뒤, 아직 정하지 않았을 때) */
  function askJobToday(): boolean {
    return shouldAskJob(todays(), game.state.job, draft.date)
  }
  function reset() {
    Object.assign(draft, { step: 'mood', date: seoulDateKey(), mood: undefined, note: '', item: undefined, pick: undefined, reply: undefined, memory: undefined })
  }
  return { draft, open, chooseMood, setNote, chooseItem, go, giveReply, setJob, askJobToday, reset }
}
