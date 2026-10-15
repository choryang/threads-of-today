import { isGoodMood, type MoodId } from './moods'

/**
 * 5번 화면 한마디 (docs/redesign/README.md "화면 문구"). 서버에는 고른 문구 번호만 보낸다.
 * 직접 쓴 말(OWN_REPLY_MAX자)은 기기에만 남기고 서버·공유 어디에도 보내지 않는다.
 */
export const REPLIES = ['저도 오늘 그랬어요', '고생 많았어요', '내일은 나을 거예요'] as const
/** 좋은 마음(기쁨·설렘·뿌듯함)일 때 */
export const GOOD_REPLIES = ['저도 오늘 좋았어요', '축하해요', '오늘 같은 날이 또 오길'] as const
export const OWN_REPLY_LABEL = '직접 쓸게요'
export const OWN_REPLY_MAX = 40

/** 그 마음일 때 보기 (번호는 이 목록의 자리) */
export function repliesFor(mood: MoodId): readonly string[] {
  return isGoodMood(mood) ? GOOD_REPLIES : REPLIES
}
