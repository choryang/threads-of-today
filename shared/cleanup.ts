/**
 * 날짜 키 청소 (server/api/cron/cleanup, 하루 한 번 서울 새벽 4시). 기간(EXPIRE)을 따로 걸지 않는 날짜 키를
 * 이틀 지나면 지운다: 오늘과 어제 키는 남긴다.
 *   meet:{사람}:{YYYYMMDD}          모두의 오늘 (HyperLogLog)
 *   thanks:day:{YYYY-MM-DD}:{사람}  그날 고마워한 사람 수
 *   mood:{마음}:{YYYYMMDD}          그날 그 마음으로 실을 묶은 사람 (HyperLogLog)
 */
export const DATED_KEY_PATTERNS = ['meet:*', 'thanks:day:*', 'mood:*'] as const

/** 키 이름에서 서울 날짜(YYYY-MM-DD). 날짜 키가 아니면 null */
export function dateOfKey(key: string): string | null {
  let m = /^(?:meet|mood):[^:]+:(\d{4})(\d{2})(\d{2})$/.exec(key)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = /^thanks:day:(\d{4}-\d{2}-\d{2}):[^:]+$/.exec(key)
  return m ? m[1]! : null
}

/** 서울 날짜에서 n일 전 */
export function daysBefore(seoulDate: string, n: number): string {
  const d = new Date(`${seoulDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

/** 이틀 이상 지난 날짜 키인지 (어제보다 이전) */
export function expiredDatedKey(key: string, todaySeoul: string): boolean {
  const date = dateOfKey(key)
  return !!date && date < daysBefore(todaySeoul, 1)
}
