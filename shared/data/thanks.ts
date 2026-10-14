import type { Person } from '../types'
import { PLACES } from './places'

/**
 * "고마워요"에 대한 답. 직업·종류별로 묶어 두고, 카드 id를 시드로 하나를 고른다(shared/thanks.ts).
 * 직접 쓴 연출이다. 해요체, 이모지 없이, 숫자·나라 이름은 넣지 않는다.
 */
export type ThanksGroup =
  | 'sea' | 'port' | 'farm' | 'mine' | 'factory' | 'drive' | 'market'
  | 'shop' | 'office' | 'expert' | 'hidden' | 'link' | 'legend'

export const THANKS_REPLIES: Record<ThanksGroup, string[]> = {
  sea: [
    '바다 위에서도 그 말은 잘 들려요. 고마워요.',
    '긴 항해가 조금 덜 외로워졌어요.',
    '다음 항구까지 힘내서 갈게요.',
  ],
  port: [
    '오늘 내린 짐 중에 당신 것도 있었군요. 잘 도착해서 다행이에요.',
    '높은 데서 손 흔들어 줄게요. 고마워요.',
    '덕분에 오늘 하루가 한결 가벼워졌어요.',
  ],
  farm: [
    '밭에서 들으니 더 반갑네요. 고마워요.',
    '올해 농사가 헛되지 않았네요.',
    '흙 묻은 손이지만, 악수해요.',
  ],
  mine: [
    '땅속은 어둡지만 그 말은 환하게 들려요.',
    '오늘도 무사히 올라왔어요. 고마워요.',
  ],
  factory: [
    '기계 소리 사이로도 잘 들렸어요.',
    '제가 만든 게 잘 쓰이고 있다니 다행이에요.',
    '오늘 교대 끝날 때까지 힘이 날 것 같아요.',
  ],
  drive: [
    '길이 막혀도 기분 좋게 달릴게요.',
    '다음에도 늦지 않게 갈게요. 고마워요.',
  ],
  market: [
    '좋은 걸 골라 보낸 보람이 있네요.',
    '새벽부터 일한 게 다 보상받는 기분이에요.',
  ],
  shop: [
    '오늘도 와 줘서 고마워요. 좋은 하루 보내요.',
    '손님 덕분에 오늘도 힘이 나요.',
  ],
  office: [
    '서류 너머의 사람에게 이런 말을 듣다니 신기해요.',
    '보이지 않는 곳에서도 꼼꼼히 챙길게요.',
  ],
  expert: [
    '그렇게 말해 주면 연구할 힘이 나요.',
    '퀴즈를 맞혀 줘서 저도 기뻤어요.',
    '궁금한 게 생기면 언제든 물어봐요.',
  ],
  hidden: [
    '어떻게 저를 찾았어요? 반가워요.',
    '잘 보이지 않는 곳에서 일하지만, 이제 혼자가 아닌 것 같아요.',
  ],
  link: [
    '서로 다른 여정이 저에게서 만났어요. 알아봐 줘서 고마워요.',
    '연결을 찾아내다니, 눈이 밝네요.',
  ],
  legend: [
    '모두를 만나고 왔군요. 정말 고생 많았어요.',
    '그 고맙다는 말, 모두에게 꼭 전할게요.',
  ],
}

/** 직업에 딱 맞는 답이 따로 있는 사람 (가게·사무실 사람들) */
export const THANKS_BY_PERSON: Record<string, string[]> = {
}

const SHOP_IDS = ['courier']
const OFFICE_IDS = ['grain-trader']

/** 사람 카드가 어느 답 묶음을 쓰는지 */
export function thanksGroupOf(p: Person): ThanksGroup {
  if (p.kind === 'set') return 'legend'
  if (p.kind === 'link') return 'link'
  if (p.kind === 'hidden') return 'hidden'
  if (SHOP_IDS.includes(p.id)) return 'shop'
  if (OFFICE_IDS.includes(p.id)) return 'office'
  if (p.kind === 'quiz') return 'expert'
  const job = p.job
  if (PLACES[p.placeId]?.continent === 'sea' || job.includes('선원')) return 'sea'
  if (/광부|광산|유전/.test(job)) return 'mine'
  if (/농부|농가|수확자|어민|양식장 직원|목장|낙농가|농장|벌목|채취자|조림지/.test(job)) return 'farm'
  if (/항만|하역|크레인|수출 담당|화물|조업원/.test(job)) return 'port'
  if (/기사|운전사/.test(job)) return 'drive'
  if (/경매사|유통인|저장고|저장소|선별원|숙성실|비축/.test(job)) return 'market'
  return 'factory'
}

/** 세트 하나의 멤버와 보상 카드 모두에게 고마움을 전하면 한 번 보여 주는 장면 */
export const SET_THANKS_SCENES: Record<string, string[]> = {
  'set-sea': [
    '항구에 배가 닿자 선원들이 갑판으로 나와 손을 흔들어요.',
    '긴 항해 끝에 받은 고맙다는 말이 파도 소리보다 크게 들려요.',
  ],
  'set-soil': [
    '밭과 농장의 사람들이 잠시 허리를 펴고 하늘을 올려다봐요.',
    '심은 씨앗 하나가 누군가의 하루에 닿았다는 걸 이제 알게 됐어요.',
  ],
  'set-underground': [
    '땅속에서 올라온 사람들이 헬멧의 불을 끄고 햇빛 아래 모여요.',
    '오늘 캐낸 돌이 누군가의 손에서 빛나고 있다는 소식을 들었어요.',
  ],
  'set-table': [
    '목장과 농장 사람들이 한 식탁에 둘러앉아요.',
    '오늘 차린 밥상 앞에서 서로에게 수고했다고 말해요.',
  ],
  'set-factory': [
    '공장의 기계가 잠시 멈추고, 사람들이 장갑을 벗어요.',
    '매일 만들던 물건이 어디로 갔는지 처음으로 듣게 됐어요.',
  ],
}

/** 모든 사람에게 고마움을 전하면 보여 주는 엔딩. {nickname}은 화면에서 닉네임으로 바꾼다 */
export const ENDING_LINES = [
  '우리의 하루는 모두 이어져 있습니다.',
  '{nickname}의 하루도, 그 하루에 닿은 모든 사람의 하루도.',
  '고단한 하루, 모두 고생하셨습니다.',
]
