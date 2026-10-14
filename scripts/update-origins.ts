/**
 * (뼈대, 실행 보류) 관세청 품목별·국가별 수출입실적으로 재료 출발지 가중치(origins[].weight)를 갱신한다.
 *
 * 아직 실행하지 않았다. 실행 전에 확인할 것:
 *  - 공공데이터포털에서 관세청 품목별·국가별 수출입실적 API 활용 신청 → 인증키(CUSTOMS_API_KEY)
 *  - 요청 주소와 파라미터·응답 필드 이름(CUSTOMS_API_URL, 아래 FIELD_*)은 공식 문서에서 확인해서 넣는다. 여기서 추측해 적지 않았다.
 *
 *   CUSTOMS_API_KEY=... CUSTOMS_API_URL=... npx tsx scripts/update-origins.ts --year 2025
 *
 * 출력: 재료별 출발지의 수입량 비중과 제안 가중치. 파일은 고치지 않는다. 검토한 뒤 shared/data/materials.ts에 손으로 옮긴다.
 */
import { MATERIAL_LIST } from '../shared/data/materials'

const API_KEY = process.env.CUSTOMS_API_KEY
const API_URL = process.env.CUSTOMS_API_URL
/** 응답 행에서 국가 코드와 수입 중량이 들어 있는 필드 이름 (문서 확인 후 채운다) */
const FIELD_COUNTRY = process.env.CUSTOMS_FIELD_COUNTRY ?? ''
const FIELD_WEIGHT = process.env.CUSTOMS_FIELD_IMPORT_WEIGHT ?? ''

/** 재료 → HS 코드(4단위). 생두 커피 0901, 카카오 콩 1801 */
const HS: Record<string, string> = { coffee: '0901', cacao: '1801' }
/** 출발지 id → ISO 국가 코드 */
const COUNTRY: Record<string, string> = { et: 'ET', co: 'CO', vn: 'VN', br: 'BR', ci: 'CI', gh: 'GH' }

async function importsByCountry(hs: string, year: string): Promise<Record<string, number>> {
  const url = new URL(API_URL!)
  // 파라미터 이름은 문서에 맞춰 고친다
  url.searchParams.set('serviceKey', API_KEY!)
  url.searchParams.set('hsSgn', hs)
  url.searchParams.set('strtYymm', `${year}01`)
  url.searchParams.set('endYymm', `${year}12`)
  const json: any = await (await fetch(url)).json()
  const rows: any[] = json?.response?.body?.items?.item ?? []
  const out: Record<string, number> = {}
  for (const row of rows) out[String(row[FIELD_COUNTRY])] = (out[String(row[FIELD_COUNTRY])] ?? 0) + Number(row[FIELD_WEIGHT] ?? 0)
  return out
}

async function main() {
  const withOrigins = MATERIAL_LIST.filter((m) => m.origins?.length)
  if (!API_KEY || !API_URL || !FIELD_COUNTRY || !FIELD_WEIGHT) {
    console.log('CUSTOMS_API_KEY, CUSTOMS_API_URL, CUSTOMS_FIELD_COUNTRY, CUSTOMS_FIELD_IMPORT_WEIGHT를 문서에서 확인해 설정해 주세요.')
    for (const m of withOrigins) console.log(`${m.id} (HS ${HS[m.id] ?? '?'}): ${m.origins!.map((o) => `${o.name} ${o.weight}`).join(', ')}`)
    return
  }
  const year = process.argv[process.argv.indexOf('--year') + 1] ?? String(new Date().getFullYear() - 1)
  for (const m of withOrigins) {
    const hs = HS[m.id]
    if (!hs) continue
    const byCountry = await importsByCountry(hs, year)
    const picked = m.origins!.map((o) => ({ o, kg: byCountry[COUNTRY[o.id] ?? ''] ?? 0 }))
    const total = picked.reduce((s, x) => s + x.kg, 0) || 1
    console.log(`\n${m.name} (${year}, HS ${hs}) — 게임에 있는 출발지끼리의 비중`)
    for (const { o, kg } of picked) console.log(`  ${o.name}: ${Math.round((kg / total) * 100)}% → 제안 가중치 ${Math.max(1, Math.round((kg / total) * 10))} (지금 ${o.weight})`)
  }
}

main()
