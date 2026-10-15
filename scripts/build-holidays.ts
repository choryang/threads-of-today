/**
 * 나라별 공휴일 → shared/data/holidays.json ({ 나라 코드: { 'YYYY-MM-DD': '한국어 이름' } }).
 * 출처: date-holidays 패키지(https://github.com/commenthol/date-holidays, 데이터 CC-BY-3.0)의 type 'public'만.
 * 이슬람력 명절은 계산값이라 실제 달 관측과 하루쯤 다를 수 있다(화면은 '아마'로 말한다).
 * 이름은 아래 KO 표로 옮긴다. 표에 없는 이름이 나오면 실패하니, 표를 채우고 다시 돌린다.
 * npm run holidays            올해부터 3년
 * npm run holidays -- 2027    2027년부터 3년
 */
import { writeFileSync } from 'node:fs'
import Holidays from 'date-holidays'
import { COUNTRY_CODE } from '../shared/data/calendar'

const from = Number(process.argv[2] ?? new Date().getFullYear())
const YEARS = [from, from + 1, from + 2]

/** 그 나라 공휴일로 나오지만 모두가 쉬지는 않는 날(일부만 반나절 쉬거나 군인만 쉼, 라마단 시작) */
const SKIP: Record<string, string[]> = {
  CN: ["International Women's Day", 'Youth Day', "Children's Day", 'Army Day'],
  ET: ['First day of Ramadan'],
}

/** 나라마다 다르게 부르는 날 */
const KO_BY_COUNTRY: Record<string, Record<string, string>> = {
  ET: { Epiphany: '팀캇', 'Finding of the True Cross': '메스켈', "New Year's Day": '에티오피아 새해' },
  BR: { 'Republic Day': '공화국 선포일' },
  ID: { 'Chinese New Year': '음력 설' },
  MY: { 'Chinese New Year': '음력 설' },
}

const KO: Record<string, string> = {
  'ANZAC Day': '안작 데이',
  'Anzac Day': '안작 데이',
  "All Saints' Day": '모든 성인의 날',
  "All Souls' Day": '위령의 날',
  'Ambedkar Jayanti': '암베드카르 탄생일',
  'Anniversary of President Laurent Kabila': '카빌라 대통령 기념일',
  'Anniversary of Prime Minister Patrice Emery Lumumba': '루뭄바 총리 기념일',
  'Arafat Day': '아라파트의 날',
  'Army Day': '군대의 날',
  'Asalha Puja': '아살하 부차',
  'Ascension Day': '예수 승천일',
  Assumption: '성모 승천 대축일',
  'Australia Day': '오스트레일리아 데이',
  'Battle of Boyacá': '보야카 전투 기념일',
  "Bengali New Year's Day": '벵골 새해',
  'Birthday of Muhammad (Mawlid)': '무함마드 탄생일',
  'Black Awareness Day': '흑인 의식의 날',
  'Bonifacio Day': '보니파시오의 날',
  'Boxing Day': '박싱 데이',
  "Buddha's Birthday": '부처님 오신 날',
  'Buddhist Lent': '안거 시작일',
  'Chakri Memorial Day': '짜끄리 왕조 기념일',
  'Chinese New Year': '춘절',
  'Christmas Day': '크리스마스',
  'Columbus Day': '콜럼버스의 날',
  'Constitution Day': '헌법의 날',
  'Coronation Day': '대관식 기념일',
  'Corpus Christi': '성체 성혈 대축일',
  "Day after New Year's Day": '새해 다음 날',
  'Day of Ashura': '아슈라',
  'Day of Lament': '추모의 날',
  'Day of Nuzul Al-Quran': '꾸란 계시 기념일',
  'Day of Valor': '용맹의 날',
  'Day of liberating the South for national reunification': '남부 해방 기념일',
  'Day of the Martyrs': '순교자의 날',
  Deepavali: '디파발리',
  'Derg Downfall Day': '데르그 정권 몰락 기념일',
  'Dragon Boat Festival': '단오',
  'Durga Puja': '두르가 푸자',
  'Día de la Constitución Española': '헌법의 날',
  'Easter Monday': '부활절 월요일',
  'Easter Saturday': '부활절 토요일',
  'Easter Sunday': '부활절',
  'Election Day': '선거일',
  'End of Ramadan (Eid al-Fitr)': '라마단이 끝나는 명절',
  Epiphany: '주님 공현 대축일',
  'Farmers Day': '농부의 날',
  'Feast of the Sacrifice (Eid al-Adha)': '희생제 명절',
  'Fiesta Nacional de España': '국경일',
  'Finding of the True Cross': '메스켈',
  'Founders Day': '건국자의 날',
  'Founding Day': '건국 기념일',
  'Gandhi Jayanti': '간디 탄생일',
  'Good Friday': '성금요일',
  'Hung Kings Commemorations': '훙 왕 기념일',
  'Immaculate Conception': '성모 무염시태 대축일',
  'Independence Day': '독립 기념일',
  'Independence of Cartagena': '카르타헤나 독립 기념일',
  "Indigenous People's Day": '원주민의 날',
  "International Women's Day": '세계 여성의 날',
  'Islamic New Year': '이슬람 새해',
  Juneteenth: '노예 해방 기념일',
  'King Bhumibol Adulyadej Memorial Day': '푸미폰 국왕 추모일',
  "King Bhumibol Adulyadej's Birthday": '푸미폰 국왕 탄신일',
  'King Chulalongkorn Day': '쭐랄롱꼰 대왕 기념일',
  "King's Birthday": '국왕 탄신일',
  "King's Day": '국왕의 날',
  'Krishna Janmashtami': '크리슈나 탄생일',
  'Kwame Nkrumah Memorial Day': '은크루마 기념일',
  'Labour Day': '노동절',
  "Language Martyrs' Day": '언어 순교자의 날',
  "Laylat al-Mi'raj": '승천의 밤',
  'Laylat al-Qadr': '권능의 밤',
  'Liberation Day': '해방 기념일',
  'Makha Bucha': '마카 부차',
  'Malaysia Day': '말레이시아의 날',
  'Martin Luther King Jr. Day': '마틴 루서 킹 기념일',
  Matariki: '마타리키',
  'Maundy Thursday': '성목요일',
  'May Day': '노동절',
  'Memorial Day': '메모리얼 데이',
  'Mid-Autumn Festival': '중추절',
  "Mujib's Birthday & Children's Day": '무지브 탄생일',
  'National Day': '국경일',
  "National Heroes' Day": '국가 영웅의 날',
  'National Mourning Day': '국가 애도의 날',
  'National Peace Day': '평화의 날',
  'National holiday': '국경일',
  'Navy Day': '해군의 날',
  "New Year's Day": '새해 첫날',
  "New Year's Eve": '새해 전날',
  Nyepi: '녜피',
  'Our Lady of Aparecida': '아파레시다 성모 축일',
  'Our Lady of Mount Carmel': '가르멜 산의 성모 축일',
  'Pancasila Day': '판차실라의 날',
  "Parents' Day": '부모의 날',
  Pentecost: '성령 강림 대축일',
  'Qingming Festival': '청명절',
  "Queen Suthida's Birthday": '수티다 왕비 탄신일',
  'Reformation Day': '종교 개혁의 날',
  'Republic Day': '공화국의 날',
  'Rizal Day': '리살의 날',
  'Sacred Heart': '예수 성심 대축일',
  'Saint Joseph': '성 요셉 축일',
  'Saints Peter and Paul': '성 베드로와 성 바오로 대축일',
  'Songkran Festival': '송끄란',
  'Spring Festival': '춘절',
  'Thanksgiving Day': '추수감사절',
  "The Queen Mother's Birthday": '왕대비 탄신일',
  "Tiradentes' Day": '치라덴치스의 날',
  'Vesak Day': '부처님 오신 날',
  'Veterans Day': '재향 군인의 날',
  'Victory Day': '승리의 날',
  'Victory at Adwa Day': '아드와 승리 기념일',
  'Vietnamese New Year': '뗏 설날',
  'Vietnamese New Year Holidays': '뗏 설 연휴',
  'Virgin of Chiquinquirá': '치킨키라 성모 축일',
  'Waitangi Day': '와이탕이 데이',
  "Washington's Birthday": '워싱턴 탄생일',
  'Whit Monday': '성령 강림 월요일',
  "Yang di-Pertuan Agong's Birthday": '국왕 탄신일',
  'Youth Day': '청년절',
}

const SUB = ' (substitute day)'
function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d! + n)).toISOString().slice(0, 10)
}
const out: Record<string, Record<string, string>> = {}
const unknown = new Set<string>()
for (const code of [...new Set(Object.values(COUNTRY_CODE))].sort()) {
  const days: Record<string, string> = {}
  /** 같은 날 휴일이 겹치면: 그날이 바로 그 휴일(3) > 연휴로 이어진 날(2) > 대체 휴일(1) */
  const rank: Record<string, number> = {}
  // 대한민국은 패키지의 한국어 이름을 그대로 ('3·1절 (대체공휴일)' → '3·1절 대체 휴일')
  const lang = code === 'KR' ? 'ko' : 'en'
  const hd = new Holidays(code, { languages: [lang] })
  for (const y of YEARS) {
    for (const h of hd.getHolidays(y, lang)) {
      if (h.type !== 'public') continue
      const sub = h.name.endsWith(SUB) || h.name.endsWith(' (대체공휴일)')
      const base = h.name.replace(SUB, '').replace(' (대체공휴일)', '')
      if (SKIP[code]?.includes(base)) continue
      const ko = code === 'KR' ? base : (KO_BY_COUNTRY[code]?.[base] ?? KO[base])
      if (!ko) {
        unknown.add(`${code}: ${base}`)
        continue
      }
      const date = h.date.slice(0, 10)
      const name = sub ? `${ko} 대체 휴일` : ko
      const put = (d: string, n: string, r: number) => {
        if ((rank[d] ?? 0) >= r) return
        days[d] = n
        rank[d] = r
      }
      if (code === 'KR' && (base === '설날' || base === '추석') && !sub) {
        // 공휴일에 관한 법률: 설날·추석은 전날·당일·다음 날 사흘 (패키지의 기간은 하루 밀려 있어 직접 펼친다)
        put(addDays(date, -1), `${ko} 연휴`, 2)
        put(date, ko, 3)
        put(addDays(date, 1), `${ko} 연휴`, 2)
        continue
      }
      // 여러 날에 걸친 휴일은 날마다 (start~end, 그곳 시각 기준 하루 단위)
      const n = Math.max(1, Math.round((h.end.getTime() - h.start.getTime()) / 86_400_000))
      for (let i = 0; i < n; i++) put(addDays(date, i), name, sub ? 1 : i === 0 ? 3 : 2)
    }
  }
  out[code] = Object.fromEntries(Object.entries(days).sort())
}
if (unknown.size) {
  console.error(`한국어 이름이 없는 휴일이 있어요. scripts/build-holidays.ts의 KO에 더해 주세요:\n${[...unknown].join('\n')}`)
  process.exit(1)
}
const file = new URL('../shared/data/holidays.json', import.meta.url)
writeFileSync(file, `${JSON.stringify({ years: YEARS, days: out }, null, 1)}\n`)
const total = Object.values(out).reduce((n, d) => n + Object.keys(d).length, 0)
console.log(`${YEARS.join('·')}년, ${Object.keys(out).length}개 나라, 휴일 ${total}일 → shared/data/holidays.json`)
