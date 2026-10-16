import HOLIDAYS from './holidays.json'

/**
 * 나라별 달력: 주말과 공휴일. 여정 화면 '지금은 아마 …'과 시계 상자의 '오늘은 ○○이에요'에 쓴다.
 * 공휴일은 holidays.json (scripts/build-holidays.ts가 date-holidays 패키지로 만든다. npm run holidays).
 * 바다 위처럼 나라가 없는 장소는 주말·공휴일이 없다.
 */

/** shared/data/places.ts의 country(한국어) → ISO 나라 코드 */
export const COUNTRY_CODE: Record<string, string> = {
  대한민국: 'KR',
  중국: 'CN',
  베트남: 'VN',
  인도네시아: 'ID',
  필리핀: 'PH',
  인도: 'IN',
  방글라데시: 'BD',
  태국: 'TH',
  말레이시아: 'MY',
  사우디아라비아: 'SA',
  에티오피아: 'ET',
  지부티: 'DJ',
  코트디부아르: 'CI',
  가나: 'GH',
  콩고민주공화국: 'CD',
  네덜란드: 'NL',
  노르웨이: 'NO',
  스페인: 'ES',
  호주: 'AU',
  뉴질랜드: 'NZ',
  미국: 'US',
  브라질: 'BR',
  콜롬비아: 'CO',
  칠레: 'CL',
  대만: 'TW',
}

/**
 * 주말 요일 (0 일요일 ~ 6 토요일). 적지 않은 나라는 토·일.
 * 사우디아라비아(2013년부터)·방글라데시·지부티는 금·토. 공식 근무 주를 기준으로 했고, 공장·농장은 다를 수 있다
 */
const WEEKEND: Record<string, number[]> = {
  SA: [5, 6],
  BD: [5, 6],
  DJ: [5, 6],
}
const SAT_SUN = [0, 6]

const DAYS = (HOLIDAYS as { years: number[]; days: Record<string, Record<string, string>> }).days
/** 공휴일 데이터가 있는 해 (check:data가 올해·내년이 있는지 본다) */
export const HOLIDAY_YEARS: number[] = (HOLIDAYS as { years: number[] }).years

export function codeOf(country: string): string | undefined {
  return COUNTRY_CODE[country]
}

/** 그 나라의 그날 공휴일 이름 ('YYYY-MM-DD'는 그곳 날짜) */
export function holidayOf(country: string, ymd: string): string | undefined {
  const code = codeOf(country)
  return code ? DAYS[code]?.[ymd] : undefined
}

export function isWeekend(country: string, weekday: number): boolean {
  const code = codeOf(country)
  if (!code) return false
  return (WEEKEND[code] ?? SAT_SUN).includes(weekday)
}

export function holidayCountries(): string[] {
  return Object.keys(DAYS)
}
