import { hashIp } from './kv'

/**
 * 하루 한 번 세기에 쓰는 '누가'. 익명 사용자 id가 있으면 그 해시, 없으면 IP 해시.
 * 사용자 id 원문은 키·로그에 남기지 않는다.
 */
export function visitorKey(userId: unknown, ip: string): string {
  return typeof userId === 'string' && /^u_[A-Za-z0-9_-]{24}$/.test(userId) ? hashIp(`user:${userId}`) : hashIp(ip)
}
