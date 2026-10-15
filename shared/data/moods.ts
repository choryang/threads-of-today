/**
 * 오늘의 마음 8개 (docs/redesign/README.md "마음 8개" 표, 점 자리는 시안 V2Mood).
 * 실의 색 = 오늘 고른 마음의 색. 화면의 점·실·머리말이 이 색을 쓴다.
 * 이야기 편마다 붙이는 마음 태그(shared/data/stories.ts)도 이 id를 쓴다.
 */

export type MoodId = 'glad' | 'excited' | 'proud' | 'plain' | 'wronged' | 'anxious' | 'lonely' | 'tired'

/** 에너지(높음·낮음) × 편안함(편안·불편) 네 칸 */
export interface MoodCell {
  energy: 'high' | 'low'
  ease: 'ease' | 'uneasy'
}

export interface Mood {
  id: MoodId
  /** 보이는 말: '억울했어요' */
  label: string
  /** '억울했던' (모두의 오늘 문구 "오늘 억울했던 사람", 공유 카드 "억울했던 날") */
  past: string
  cell: MoodCell
  color: string
  /** 장면이 담는 것 (1번 화면에서 고른 마음 아래 한 줄) */
  scene: string
  /** 제목 꼴: "{이름}도 오늘,\n억울한 하루였어요." */
  title: string
  /** 기억 문장 꼴: "지난번엔 당신도 억울했다고 했죠." */
  memory: string
  /** 시안 V2Mood의 점 자리 (342×342 안의 좌표, 점의 가운데) */
  dot: { x: number; y: number }
}

const HIGH_EASE: MoodCell = { energy: 'high', ease: 'ease' }
const LOW_EASE: MoodCell = { energy: 'low', ease: 'ease' }
const HIGH_UNEASY: MoodCell = { energy: 'high', ease: 'uneasy' }
const LOW_UNEASY: MoodCell = { energy: 'low', ease: 'uneasy' }

export const MOOD_LIST: Mood[] = [
  { id: 'glad', label: '기뻤어요', past: '기뻤던', cell: HIGH_EASE, color: '#F2B33D', scene: '좋은 일이 생긴 날', title: '기쁜 하루였어요', memory: '기뻤다고', dot: { x: 262, y: 66 } },
  { id: 'excited', label: '설렜어요', past: '설렜던', cell: HIGH_EASE, color: '#F2B33D', scene: '무언가를 시작하거나 기다리는 날', title: '설레는 하루였어요', memory: '설렜다고', dot: { x: 226, y: 124 } },
  { id: 'proud', label: '뿌듯했어요', past: '뿌듯했던', cell: LOW_EASE, color: '#3FAE84', scene: '작은 것을 지켜낸 날', title: '뿌듯한 하루였어요', memory: '뿌듯했다고', dot: { x: 252, y: 214 } },
  { id: 'plain', label: '그냥 그랬어요', past: '그냥 그랬던', cell: LOW_EASE, color: '#3FAE84', scene: '평범한 하루의 작은 장면', title: '평범한 하루였어요', memory: '그냥 그랬다고', dot: { x: 220, y: 276 } },
  { id: 'wronged', label: '억울했어요', past: '억울했던', cell: HIGH_UNEASY, color: '#E0528A', scene: '아무도 믿어 주지 않은 날', title: '억울한 하루였어요', memory: '억울했다고', dot: { x: 70, y: 70 } },
  { id: 'anxious', label: '불안했어요', past: '불안했던', cell: HIGH_UNEASY, color: '#E0528A', scene: '내 자리가 흔들리는 날', title: '불안한 하루였어요', memory: '불안했다고', dot: { x: 104, y: 128 } },
  { id: 'lonely', label: '외로웠어요', past: '외로웠던', cell: LOW_UNEASY, color: '#4C7BD9', scene: '멀리 있거나, 혼자라고 느낀 날', title: '외로운 하루였어요', memory: '외로웠다고', dot: { x: 108, y: 218 } },
  { id: 'tired', label: '지쳤어요', past: '지쳤던', cell: LOW_UNEASY, color: '#4C7BD9', scene: '끝없는 일을 버틴 날', title: '지친 하루였어요', memory: '지쳤다고', dot: { x: 66, y: 276 } },
]

export const MOODS: Record<MoodId, Mood> = Object.fromEntries(MOOD_LIST.map((m) => [m.id, m])) as Record<MoodId, Mood>
export const MOOD_IDS = MOOD_LIST.map((m) => m.id)

export function isMoodId(v: unknown): v is MoodId {
  return typeof v === 'string' && (MOOD_IDS as string[]).includes(v)
}

/** 같은 칸(에너지·편안함이 같은 쪽)의 마음인지 */
export function sameCell(a: MoodId, b: MoodId): boolean {
  const x = MOODS[a].cell
  const y = MOODS[b].cell
  return x.energy === y.energy && x.ease === y.ease
}

/** 좋은 마음(기쁨·설렘·뿌듯함): 5번 화면의 한마디 보기가 달라진다 */
export function isGoodMood(id: MoodId): boolean {
  return id === 'glad' || id === 'excited' || id === 'proud'
}
