/*
 * 운영 Upstash의 사용자 현황을 읽기만 하는 집계 (npm run stats).
 *
 * - 접속 정보는 .env.stats 하나만 읽는다: vercel env pull .env.stats --environment=production 으로 받은 운영 KV_REST_API_URL / KV_REST_API_TOKEN
 *   (또는 UPSTASH_REDIS_REST_*). 개발용 .env는 읽지 않는다. .env.stats는 .gitignore(.env.*)라 커밋되지 않는다.
 * - 쓰는 명령은 SCAN과 MGET 두 가지뿐이다. 아무것도 쓰거나 지우지 않는다.
 * - 숫자만 출력한다. 닉네임·익명 id·복구 코드·기기 정보·키 이름·접속 주소는 출력하지 않는다.
 *
 * 집계
 *   사용자(mdp:user:*): 전체 수, 만든 날짜(createdAt)별 수, 여정을 1번 이상 마친 수, 마을 주민 수 분포
 *   공유 링크(mdp:share:*): 종류별(/d 하루 유형 · /p 사람 소개 · /v 마을 초대) 살아 있는 링크 수
 *   하루 유형 테스트: 진행 상황에 기록하지 않아 사용자별로는 셀 수 없다. 대신 /d 링크 수(결과를 공유한 수)를 함께 보여 준다
 */
import { existsSync, readFileSync } from 'node:fs'
import { Redis } from '@upstash/redis'
import { summarize, type UserRow } from './user-stats-summary'

const PREFIX = 'mdp'

const ENV_FILE = '.env.stats'
if (!existsSync(ENV_FILE)) {
  console.error(`${ENV_FILE}가 없어요. 먼저 vercel env pull ${ENV_FILE} --environment=production`)
  process.exit(1)
}
// 셸에 있던 값과 섞이지 않게 이 파일의 값만 쓴다
const env: Record<string, string> = {}
for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
  if (m) env[m[1]!] = m[2]!.replace(/^(["'])(.*)\1$/, '$2')
}
const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL
const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN
if (!url || !token) {
  console.error(`${ENV_FILE}에 KV_REST_API_URL·KV_REST_API_TOKEN이 없어요`)
  process.exit(1)
}
// 읽기만 하는 클라이언트 (SCAN·MGET만 부른다)
const redis = new Redis({ url, token })
let commands = 0

async function scanAll(pattern: string): Promise<string[]> {
  const keys: string[] = []
  let cursor: string | number = 0
  do {
    const [next, batch]: [string | number, string[]] = await redis.scan(cursor, { match: pattern, count: 1000 })
    commands++
    keys.push(...batch)
    cursor = next
  } while (String(cursor) !== '0')
  return keys
}

async function readAll<T>(keys: string[]): Promise<Array<T | null>> {
  const out: Array<T | null> = []
  for (let i = 0; i < keys.length; i += 100) {
    const values = await redis.mget<Array<T | string | null>>(...keys.slice(i, i + 100))
    commands++
    for (const v of values) out.push(typeof v === 'string' ? (JSON.parse(v) as T) : (v as T | null))
  }
  return out
}

/** 숫자만 담은 표 */
function table(title: string, rows: Array<[string, number | string]>) {
  const w = Math.max(...rows.map(([k]) => [...k].length), 4)
  console.log(`\n${title}`)
  for (const [k, v] of rows) console.log(`  ${k}${' '.repeat(w - [...k].length)}  ${typeof v === 'number' ? v.toLocaleString('ko-KR') : v}`)
}

async function main() {
  // 사용자: user:{id} 키만 (code: 등 다른 키는 세지 않는다)
  const userKeys = (await scanAll(`${PREFIX}:user:*`)).filter((k) => /^mdp:user:u_[A-Za-z0-9_-]{24}$/.test(k))
  const users = await readAll<UserRow>(userKeys)
  // 공유 링크: share:{token} (share-owner:·share-replies:는 빼고)
  const shareKeys = (await scanAll(`${PREFIX}:share:*`)).filter((k) => /^mdp:share:[^:]+$/.test(k))
  const shares = await readAll<{ kind?: string }>(shareKeys)
  const sum = summarize(users, shares)

  table('사용자', [
    ['전체', sum.users],
    ['하루 기록을 1번 이상 남긴 사용자', sum.recorded],
  ])
  table('만든 날짜별 사용자', sum.byDate)
  table('하루 기록을 남긴 날 수', Object.entries(sum.days))
  table('살아 있는 공유 링크', [
    ['/t 오늘의 실', sum.shares.thread],
    ['예전 링크(/d /p /v)', sum.shares.old],
  ])
  console.log(`\n읽기 명령 ${commands}번 (SCAN·MGET만, 쓰기 0번)`)
}

main().catch((err: unknown) => {
  // 오류에 접속 주소·키가 섞여 나오지 않게 메시지 종류만
  console.error('집계 실패:', err instanceof Error ? err.name : 'unknown')
  process.exit(1)
})
