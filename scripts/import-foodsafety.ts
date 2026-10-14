/**
 * (선택, 실행 보류) 식품안전나라 품목제조보고 원재료 데이터로 가공식품의 재료를 규칙으로 연결하는 스크립트 뼈대.
 *
 * 아직 실행하지 않았다. 실행 전에 확인할 것:
 *  - 식품안전나라 Open API 인증키 발급 (FOODSAFETY_API_KEY)
 *  - 품목제조보고(원재료) 서비스 ID와 응답 필드 이름 (FOODSAFETY_SERVICE_ID, 아래 FIELD_*).
 *    서비스 ID와 필드 이름은 공식 문서에서 확인해서 넣는다. 여기서 추측해 적지 않았다.
 *
 *   FOODSAFETY_API_KEY=... FOODSAFETY_SERVICE_ID=... npx tsx scripts/import-foodsafety.ts --limit 100
 *
 * 출력: data/review/foodsafety.csv (제품명, 원재료 원문, 연결된 재료 id). 사람이 검토한 뒤 사전에 옮긴다.
 */
import fs from 'node:fs'
import { MATERIAL_LIST } from '../shared/data/materials'

const API_KEY = process.env.FOODSAFETY_API_KEY
const SERVICE_ID = process.env.FOODSAFETY_SERVICE_ID
/** 응답 행에서 제품명·원재료 문자열이 들어 있는 필드 이름 (문서 확인 후 채운다) */
const FIELD_PRODUCT = process.env.FOODSAFETY_FIELD_PRODUCT ?? ''
const FIELD_RAW = process.env.FOODSAFETY_FIELD_RAW ?? ''

/**
 * 원재료 표기 → 재료 id 규칙. 원재료 문자열에 키워드가 들어 있으면 그 재료로 본다.
 * 재료 별칭을 그대로 쓰면 '김치'의 '김'처럼 오매칭되므로 원재료 표기에 맞춘 키워드를 따로 둔다.
 */
const RULES: Record<string, string[]> = {
  wheat: ['밀가루', '소맥분', '밀'],
  'palm-oil': ['팜유', '팜올레인유', '팜스테아린'],
  sugar: ['설탕', '백설탕', '정백당', '원당'],
  soybean: ['대두', '탈지대두', '대두유', '간장'],
  corn: ['옥수수', '옥수수전분', '물엿', '콘시럽'],
  milk: ['우유', '탈지분유', '전지분유', '유청', '버터', '치즈'],
  egg: ['계란', '달걀', '난황', '전란'],
  rice: ['쌀', '백미', '현미', '쌀가루'],
  cacao: ['카카오', '코코아', '초콜릿'],
  chili: ['고춧가루', '고추'],
  cabbage: ['배추'],
  pork: ['돼지고기', '돈육'],
  beef: ['쇠고기', '소고기', '우육'],
  chicken: ['닭고기', '계육'],
  shrimp: ['새우'],
  tuna: ['참치', '다랑어'],
  tea: ['녹차', '말차'],
  orange: ['오렌지'],
  banana: ['바나나'],
}

export function materialsFromRaw(raw: string): string[] {
  const ids: string[] = []
  for (const [id, words] of Object.entries(RULES)) {
    if (words.some((w) => raw.includes(w)) && !ids.includes(id)) ids.push(id)
  }
  return ids
}

async function main() {
  if (!API_KEY || !SERVICE_ID || !FIELD_PRODUCT || !FIELD_RAW) {
    console.log('FOODSAFETY_API_KEY, FOODSAFETY_SERVICE_ID, FOODSAFETY_FIELD_PRODUCT, FOODSAFETY_FIELD_RAW를 문서에서 확인해 설정해 주세요.')
    console.log(`재료 규칙 ${Object.keys(RULES).length}개 / 재료 ${MATERIAL_LIST.length}개`)
    return
  }
  const limit = Number(process.argv[process.argv.indexOf('--limit') + 1]) || 100
  // 식품안전나라 Open API 주소 형식(/api/{인증키}/{서비스ID}/json/{시작}/{끝})도 실행 전에 문서로 다시 확인한다
  const url = `https://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/1/${limit}`
  const json: any = await (await fetch(url)).json()
  const rows: any[] = json?.[SERVICE_ID]?.row ?? []
  const lines = ['product,raw,material_ids']
  for (const row of rows) {
    const raw = String(row[FIELD_RAW] ?? '')
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
    lines.push([String(row[FIELD_PRODUCT] ?? ''), raw, materialsFromRaw(raw).join(' ')].map(cell).join(','))
  }
  fs.mkdirSync('data/review', { recursive: true })
  fs.writeFileSync('data/review/foodsafety.csv', '﻿' + lines.join('\n') + '\n')
  console.log(`${rows.length}행 → data/review/foodsafety.csv`)
}

main()
