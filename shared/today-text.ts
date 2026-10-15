import { MOODS, type MoodId } from './data/moods'
import type { Place } from './types'
import { withJosa } from './logic'
import { clockLabel, utcOffsetMinutes, SEOUL_TZ, type Clock } from './local-time'

/**
 * 오늘 흐름 화면 문구 (docs/redesign/README.md "화면 문구"). 순수 함수만.
 */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** '10월 15일 목요일' (서울 날짜 'YYYY-MM-DD') */
export function dateLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const weekday = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
  return `${m}월 ${d}일 ${WEEKDAYS[weekday]}요일`
}

/** '10월 15일' */
export function shortDate(ymd: string): string {
  const [, m, d] = ymd.split('-').map(Number)
  return `${m}월 ${d}일`
}

/** 장소의 짧은 이름: '에티오피아 시다마' → '시다마', '부산항' → '부산항' (띠 위 이름표·문장) */
export function placeShort(place: Place): string {
  const words = place.name.split(' ')
  return words.length > 1 && place.country && words[0] === place.country ? words.slice(1).join(' ') : place.name
}

/** 4번 머리말: '오늘 당신의 커피가 지나온 길 위의 사람' */
export function pathHeader(itemName: string): string {
  return `오늘 당신의 ${withJosa(itemName, '이', '가')} 지나온 길 위의 사람`
}

/** 4번 제목 두 줄: ['알마즈도 오늘,', '억울한 하루였어요.'] */
export function moodTitle(name: string, mood: MoodId): [string, string] {
  return [`${name}도 오늘,`, `${MOODS[mood].title}.`]
}

/** 이야기 사람이 없을 때 제목 두 줄 (마음을 지어 붙이지 않는다) */
export function plainTitle(itemName: string): [string, string] {
  return [`오늘 당신의 ${withJosa(itemName, '이', '가')} 지나온`, '길 위의 사람이에요.']
}

/** 두 시간대의 차이: '6시간' · '3시간 30분'. 같으면 '' */
export function gapText(tz: string, now: Date): string {
  const d = Math.abs(utcOffsetMinutes(tz, now) - utcOffsetMinutes(SEOUL_TZ, now))
  if (!d) return ''
  const h = Math.floor(d / 60)
  const m = d % 60
  return [h ? `${h}시간` : '', m ? `${m}분` : ''].filter(Boolean).join(' ')
}

/**
 * 3번 문장: '지금 서울은 오후 6:05, 시다마는 오후 12:05. 6시간 떨어진 그곳까지, 14명의 손이 당신의 커피를 이어 주었어요.'
 * 같은 시간대면 '지금 서울은 오후 6:05. 같은 시각, 14명의 손이 …'
 */
export function threadSentence(opts: { seoul: Clock; there: Clock; placeName: string; gap: string; hands: number; itemName: string }): string {
  const { seoul, there, placeName, gap, hands, itemName } = opts
  const tail = `${hands}명의 손이 당신의 ${withJosa(itemName, '을', '를')} 이어 주었어요.`
  if (!gap) return `지금 서울은 ${clockLabel(seoul)}. 같은 시각, ${tail}`
  return `지금 서울은 ${clockLabel(seoul)}, ${withJosa(placeName, '은', '는')} ${clockLabel(there)}. ${gap} 떨어진 그곳까지, ${tail}`
}

/** 같은 사람을 다시 만났을 때: '지난번엔 당신도 억울했다고 했죠.' */
export function memoryLine(mood: MoodId): string {
  return `지난번엔 당신도 ${MOODS[mood].memory} 했죠.`
}

/** 5번 화면 모두의 오늘: '오늘 억울했던 사람 1,203명이 지구 곳곳의 누군가와 실을 묶었어요.' */
export function togetherLine(mood: MoodId, count: number): string {
  return `오늘 ${MOODS[mood].past} 사람 ${count.toLocaleString('ko-KR')}명이 지구 곳곳의 누군가와 실을 묶었어요.`
}
