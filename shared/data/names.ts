/**
 * 사람 카드의 이름. 그 사람이 일하는 나라에서 흔하고 평범한 이름(성 없이)을 쓴다.
 * 나라마다 이름 순위·인구 통계 출처를 주석으로 남긴다. 확인이 안 된 나라는 비워 둔다(카드에 직업만 보인다).
 * 한국 사람은 순위 출처에 없어도 평범한 한국 이름이면 쓴다(2026-10 사용자 결정. 출처 있는 이름이 바닥나서).
 * - 유명인 이름, 뜻이 우스꽝스럽거나 부정적인 이름, 종교적으로 민감한 이름은 피한다.
 * - 같은 나라 안에서는 겹치지 않게(check:data가 검사), 성별은 고루 섞는다.
 * - 바다 위 사람은 선원의 국적이 다양하니 여러 나라 이름을 섞는다. 카드에는 국적을 적지 않는다.
 * - 연결 카드는 원래 사람과 같은 이름을 쓴다(LINK_RULES로 찾는다).
 * 외국 이름은 국립국어원 외래어 표기법을 따라 한글로 적는다.
 */
import { LINK_RULES } from './materials'

export interface NameGroup {
  /** places.ts의 country. 바다 위 사람은 '' */
  country: string
  names: Record<string, string>
  /** 바다 위 사람의 이름을 가져온 나라. 그 나라 땅 위 사람과 겹치지 않는지 검사한다(화면에는 쓰지 않는다) */
  from?: Record<string, string>
}

export const NAME_GROUPS: NameGroup[] = [
  {
    // 대한민국: 대법원 출생신고 이름 자료(해마다 상위 10개)를 보도한 기사들.
    //   1945·1975·2005년: 조선일보 2006-09-22 "[남] 영수 → 정훈 → 민준 [여] 영자 → 미영 → 서연"
    //   1948·1958·1968·1978·1988·1998·2008년: 파이낸셜뉴스 2009-01-25 "해방 이후 시대별 선호이름은..대법, 매 10년 10선"
    //   1995년: 매일경제 2014-07-27, 헤럴드경제 2014-07-28 https://biz.heraldcorp.com/article/169365
    //   2006년: 조선일보 2007-03-20 / 연도별 표 정리: 위키백과「한국의 성씨와 이름」
    //   시대별 대표 이름: 매일신문(연합뉴스) 2016-05-09 https://www.imaeil.com/page/view/2016050919401966046
    // 나이가 지긋한 일(농부·어민·장인)에는 1945~1958년, 젊은 일(가게·창고)에는 1995~2008년 이름을 주로 쓴다.
    country: '대한민국',
    names: {
      // 1945~1958년 상위 이름
      'rice-farmer': '영수', 'laver-farmer': '순자', 'laver-auctioneer': '정웅', 'dairy-farmer': '영숙',
      'cabbage-farmer': '영식', 'cabbage-trader': '경숙', 'broiler-farmer': '상철', 'chicken-shop': '명숙',
      'tea-farmer': '옥순', 'tea-roaster': '영길', 'garak-auctioneer': '광수', 'redbean-farmer': '춘자',
      'jeju-buckwheat-farmer': '정순', 'potato-farmer': '영호', 'sweetpotato-farmer': '경자', 'radish-farmer': '정수',
      'highland-radish-farmer': '종수', 'jeju-radish-farmer': '옥자', 'apple-farmer': '영희', 'gw-apple-farmer': '성수',
      'grape-farmer': '정희', 'tomato-farmer': '영순', 'barley-farmer': '정남', 'ulleung-squid-fisher': '영일',
      'squid-dryer': '숙자', butcher: '상호', 'potato-storage': '명자', 'ca-storage': '경수', sawmill: '중수',
      'furniture-maker': '영철', 'harbor-pilot': '정호', 'steel-mill': '성호', 'tofu-maker': '정숙',
      'milk-collector': '영환', 'rice-mill': '순옥', 'laver-processor': '화자', 'scrap-worker': '영자',
      'safety-inspector': '현숙',
      // 1968~1978년
      'busan-crane': '진호', 'glass-furnace': '재호', 'kr-battery': '성진', 'sugar-qc': '미경', 'rice-breeder': '은주',
      cannery: '미숙', ripening: '상훈', 'ulsan-refinery': '정훈', 'yeosu-chem': '현정', 'refinery-safety': '성훈',
      'cow-vet': '은정', 'chili-breeder': '성민', 'kimchi-scientist': '지영', 'poultry-officer': '상현',
      'egg-inspector': '경희', 'grain-trader': '준호', 'tea-taster': '미영', 'redbean-breeder': '영미',
      'buckwheat-researcher': '지훈', 'seed-potato-researcher': '은영', 'radish-stockpile': '영진',
      'apple-quarantine': '현주', 'grape-breeder': '은경', 'crop-forecaster': '미정', 'barley-researcher': '병철',
      'squid-researcher': '선영', 'plant-quarantine': '지연', 'customs-officer': '혜진',
      // 1988~1998년
      'fab-engineer': '지은', 'sugar-refinery': '동현', 'flour-mill': '수진', 'oil-food-plant': '현우',
      injection: '은지', 'battery-recycler': '준영', roaster: '아름', 'can-factory': '민수', 'paper-mill': '지현',
      'beverage-plant': '진우', 'dairy-plant': '보람', 'incheon-port': '재현', 'kimchi-maker': '유진',
      'glass-bottle': '성현', 'starch-plant': '민지', 'trade-clerk': '지원', 'merch-md': '승현', dispatcher: '수빈',
      'lashing-worker': '민석', 'table-setter': '현지', 'chicken-plant': '준혁', 'ketchup-maker': '예진',
      'air-cargo': '예지', 'egg-farmer': '지혜',
      // 2005~2008년
      warehouse: '민준', courier: '도현', 'pet-sorter': '서연', 'can-recycler': '민재', 'glass-recycler': '서현',
      'egg-gp': '수민', 'anko-maker': '현준', 'noodle-maker': '서영', 'curing-worker': '승민',
      'sweetpotato-seedling': '예원', 'apple-apc': '준서', barista: '예은', 'cvs-clerk': '지민', 'mart-cashier': '민서',
      'delivery-rider': '우진', 'clothing-clerk': '서윤', 'phone-clerk': '건우', 'cs-agent': '민성',
      // 책 길(2026-10): 사용자가 검토 표(docs/redesign/book-people-review.md)에서 고른 이름.
      //   하은은 2008년 상위 이름(위 파이낸셜뉴스), 도윤은 2015년 상위 이름(머니투데이 2015-12-16 https://www.mt.co.kr/society/2015/12/16/2015121616374076724)
      'book-writer': '하은', 'book-translator': '지안', 'book-editor': '도윤', proofreader: '예린', 'cover-designer': '태오',
      typesetter: '수아', 'press-operator': '한결', binder: '나래', 'book-logistics': '다온', bookseller: '소연',
      // 컴퓨터·주변기기 길: 2008년 상위 이름 중 남은 것(위 파이낸셜뉴스 2009). 그 뒤는 순위 출처 없는 평범한 이름
      'copper-smelter': '예준', 'ccl-maker': '윤서', 'panel-engineer': '지우', 'memory-packager': '혜원', 'pc-builder': '태민',
      // 앱·노래·인터넷 길 (순위 출처 없는 평범한 이름)
      'app-planner': '승우', 'ux-researcher': '다은', 'ui-designer': '재원', 'server-developer': '민호', localizer: '소희',
      'content-moderator': '가은', topliner: '유나', lyricist: '동훈', arranger: '수연', 'session-player': '경민',
      'vocal-director': '채원', 'recording-engineer': '재석', 'album-designer': '은비', 'music-distributor': '상우',
      'datacenter-tech': '성우', 'base-station': '준기',
    },
  },
  {
    // 중국: 공안부 호정관리연구센터「2019년 전국 성명 보고」(중국신문망 2020-01-20)
    //   https://cn.chinadaily.com.cn/a/202001/20/WS5e253701a3107bb6b579af3d.html
    //   가장 많은 이름 张伟·王芳·王静 등, '国' 자 이름 남자 国强, 여자 国英
    // 공안부 전국 공민신분번호 조회 서비스센터가 확인한 '동명이인 많은 이름 50'(신민망 2007-07-25)
    //   https://news.sohu.com/20070725/n251242978.shtml — 王秀英 5위, 王磊 19위, 王勇 22위, 张涛 32위
    country: '중국',
    names: {
      'cn-refinery': '웨이', // 伟
      'poly-fiber': '팡', // 芳
      'chili-farmer': '궈창', // 国强
      'chili-mill': '슈잉', // 秀英
      'qingdao-port': '레이', // 磊
      'cn-redbean-farmer': '궈잉', // 国英
      'cn-buckwheat-farmer': '융', // 勇
      'cn-tomato-paste': '징', // 静
      'keyboard-assembler': '민', // 敏 — 2019년 전국 성명 보고 상위 10에 张敏(위 중국신문망 2020-01-20)
      // 아래는 순위 출처 없는 평범한 이름 (2026-10 사용자 결정)
      'switch-maker': '쥔', 'switch-tester': '옌', 'pcb-maker': '밍', 'glass-maker': '리', 'mouse-assembler': '샤', // 军 艳 明 丽 霞
    },
  },
  {
    // 코트디부아르: NamSor "Some popular baby names of Côte d'Ivoire"(2017) https://namesorts.com/2017/06/26/ivory-coast-cote-divoire-baby-names/
    //   아칸 요일 이름은 이름·성 둘 다로 쓴다. 성 순위 Kouassi 3위·Kouadio 5위(surnam.es, 2026) https://surnam.es/ivory-coast
    country: '코트디부아르',
    names: { 'cacao-farmer': '쿠아시', 'cacao-dryer': '아주아', 'abidjan-docker': '쿠아디오', 'cacao-grader': '아키시' },
  },
  {
    // 가나: Agyekum, "The Sociolinguistic of Akan Personal Names", Nordic Journal of African Studies 15(2), 2006, 표 1
    //   https://njas.fi/njas/article/view/24 — 아칸 요일 이름(판티어 표기). 서부 주만의 빈도 자료는 찾지 못했다
    country: '가나',
    names: { 'gh-cacao-farmer': '에시', 'gh-takoradi-docker': '코조' },
  },
  {
    // 에티오피아: surnam.es 에티오피아 성 순위(2026) https://surnam.es/ethiopia — 에티오피아의 '성'은 아버지 이름이라 이름 순위로 쓴다.
    //   Tesfaye 1위, Almaz 32위, Tsehay 46위. 시다마 지역만의 자료는 찾지 못했다
    country: '에티오피아',
    names: { 'coffee-picker': '알마즈', 'washing-station': '테스파예', cupper: '체하이' },
  },
  {
    // 콩고민주공화국: surnam.es(2026, INS-RDC 참고) https://surnam.es/democratic-republic-of-the-congo — Ilunga 1위, 카탕가·카사이의 루바어 이름
    country: '콩고민주공화국',
    names: { 'cobalt-miner': '일룽가' },
  },
  {
    // 지부티: surnam.es(2026) https://surnam.es/djibouti — 성이 아버지 이름이라 남자 이름 순위로 쓴다. Farah 13위
    country: '지부티',
    names: { 'djibouti-docker': '파라' },
  },
  {
    // 미국: 사회보장국(SSA) "Top names of the 1970s" https://www.ssa.gov/oact/babynames/decades/names1970s.html
    //   1970년대 남자 Christopher 2위·Jason 3위·James 5위·Robert 7위·Brian 8위, 여자 Jennifer 1위·Amy 2위, Kimberly·Stephanie 상위 200
    country: '미국',
    names: {
      'wheat-farmer': '로버트', 'grain-elevator': '킴벌리', 'pnw-port': '제이슨', 'grain-inspector': '제니퍼', 'corn-farmer': '제임스',
      'barge-crew': '브라이언', 'nola-port': '스테퍼니', 'us-buckwheat-farmer': '에이미', 'us-fries-plant': '크리스토퍼',
      // 앱·노래 길: 순위 출처 확인 없이 평범한 이름 (2026-10 사용자 결정)
      'app-reviewer': '멜리사', 'mixing-engineer': '마이클', 'mastering-engineer': '리사',
    },
  },
  {
    // 브라질: IBGE「Nomes no Brasil」2022년 인구조사(2025-11 공개), CNN Brasil 보도
    //   https://www.cnnbrasil.com.br/nacional/brasil/ibge-revela-nomes-e-sobrenomes-mais-populares-do-brasil-veja-ranking/
    //   남자 João 2위·Antônio 3위·Francisco 4위·Carlos 6위·Paulo 9위, 여자 Ana 2위·Juliana 6위·Adriana 7위·Fernanda 8위·Márcia 9위·Patrícia 10위
    country: '브라질',
    names: {
      eucalyptus: '프란시스쿠', 'pulp-mill': '아드리아나', 'forest-auditor': '페르난다', 'orange-picker': '아나', 'juice-plant': '파울루',
      'citrus-scientist': '파트리시아', 'soy-farmer': '안토니우', 'soy-breeder': '줄리아나', 'br-coffee-farmer': '주앙',
      'br-santos-coffee': '마르시아', 'santos-port': '카를루스',
    },
  },
  {
    // 호주: NSW 출생·사망·혼인 등록청 "Popular Baby Names 1952 to 2025" https://data.nsw.gov.au/data/dataset/popular-baby-names-from-1952
    //   1965~1995년 합계 남자 Daniel 5위·Matthew 3위·Andrew 4위·Mark 7위·Scott 16위·Craig 24위, 여자 Rebecca 1위·Kylie 9위·Karen 10위·Samantha 11위·Natalie 15위·Rachel 18위
    country: '호주',
    names: {
      'cane-harvester': '매슈', 'raw-sugar-mill': '리베카', 'lithium-miner': '카일리', 'bauxite-miner': '앤드루', smelter: '캐런',
      'iron-miner': '스콧', 'hedland-port': '크레이그', 'cattle-rancher': '마크', meatworks: '서맨사', 'beef-grader': '내털리',
      'au-malt': '레이철', 'mine-rescue': '대니얼',
    },
  },
  {
    // 뉴질랜드: 내무부(DIA) 1900~2019년 역대 인기 이름, Otago Daily Times 보도 https://www.odt.co.nz/news/top-baby-names-of-all-time-compiled-v34qk7es
    //   Paul 10위, Susan 6위, Helen 7위
    country: '뉴질랜드',
    names: { 'nz-logger': '폴', 'tauranga-port': '헬렌', 'nz-forester': '수전' },
  },
  {
    // 스페인: 국립통계청(INE) 이름 인포그래픽(2024-01-01 기준) https://www.ine.es/infografias/infografia_nombres.pdf
    //   Manuel 남자 2위, Laura 여자 상위. Javier는 INE 2019년 자료(30만 7천 명)
    country: '스페인',
    names: { 'pig-farmer': '마누엘', 'pork-plant': '라우라', 'valencia-port': '하비에르' },
  },
  {
    // 노르웨이: 통계청(SSB)「De mest brukte navnene i Norge gjennom tidene」(2023) https://www.ssb.no/befolkning/navn/artikler/de-mest-brukte-navnene-i-norge-gjennom-tidene
    //   1880~2022년 역대 Lars 7위·Bjørn 8위, Ingrid 4위·Kari 7위·Marit 9위
    country: '노르웨이',
    // track-maker의 올레(Ole)는 순위 출처 없는 평범한 이름 (2026-10 사용자 결정)
    names: { 'salmon-farmer': '라르스', 'salmon-processor': '카리', 'oslo-air': '비에른', 'fish-vet': '잉리드', 'seed-vault': '마리트', 'track-maker': '올레' },
  },
  {
    // 네덜란드: 메르턴스 연구소 네덜란드 이름 은행 순위 예시(1970년 무렵 남자 Marco 4위, 여자 Sandra 5위)
    //   https://meertens.knaw.nl/v2023/wp-content/uploads/2013/06/Bijlage_-_voorbeelden_toplijsten_voornamenbank.pdf (지금은 열리지 않아 검색 발췌로 확인)
    country: '네덜란드',
    names: { 'cocoa-grinder': '산드라', 'litho-engineer': '마르코' },
  },
  {
    // 콜롬비아: El País Cali 2023-07-01, 국가등록청(Registraduría) 수치 인용(Isabel 57만, Miguel 51만)
    //   https://www.elpais.com.co/colombia/cuales-son-los-10-nombres-mas-comunes-en-colombia-y-su-significado-aqui-se-los-decimos-3055.html
    country: '콜롬비아',
    names: { 'co-coffee-farmer': '이사벨', 'co-buenaventura-docker': '미겔' },
  },
  {
    // 대만: 내정부「全國姓名統計分析」(2023년 6월 30일 호적 기준, 2023-10 발간) — 남자 家豪 1위·志明 2위, 여자 淑芬 1위
    //   https://www.ris.gov.tw/info-liferay/app/channel/pressReleaseDetail/23303697 , 신두 보도 https://newtalk.tw/news/view/2023-10-30/894420
    country: '대만',
    names: { 'smt-operator': '자하오', 'sensor-designer': '즈밍', 'cpu-fab': '수펀' },
  },
  {
    // 칠레: Emol 2019-09-18, 민사등록청(Registro Civil) 정보공개 자료 — 1970년대에 많이 지은 이름 Rodrigo, Claudia
    //   https://www.emol.com/noticias/Nacional/2019/09/18/961553/Nombres-inscritos-historicos.html
    country: '칠레',
    // José: 1970~2010년에 가장 많이 지은 남자 이름(Cooperativa 2013-09-15, 민사등록청 자료)
    //   https://cooperativa.cl/noticias/pais/servicios-publicos/registro-civil/estos-son-los-nombres-mas-inscritos-en-2/2013-09-15/105602.html
    names: { 'brine-engineer': '클라우디아', 'cl-grape-farmer': '로드리고', 'copper-hauler': '호세' },
  },
  {
    // 태국: 내무부 주민등록(ทะเบียนราษฎร์) 이름 상위 20, Sanook 2024-09-13 https://www.sanook.com/campus/1426583/
    //   Somsak 5위, Narong 6위, Pranee 16위, Kanchana 18위
    country: '태국',
    names: { 'rubber-tapper': '솜삭', 'rubber-processor': '쁘라니', 'laemchabang-port': '나롱', 'latex-tester': '깐짜나' },
  },
  {
    // 인도네시아: 내무부 주민등록국(Dukcapil) 2025-12-31 기준, Kompas 2026-03-14·CNBC Indonesia 2026-08-06 보도
    //   https://www.cnbcindonesia.com/lifestyle/20260806154303-33-757175/terungkap-nama-warga-ri-paling-pasaran-ada-nurhayati-dan-junaidi
    //   수마트라에서 가장 많은 이름 Junaidi·Nurhayati, X세대 여자 2위 Sulastri
    country: '인도네시아',
    names: { 'palm-harvester': '주나이디', 'palm-mill': '누르하야티', 'palm-smallholder': '술라스트리' },
  },
  {
    // 말레이시아: 국가등록국(JPN) 2017년 자료, New Straits Times 인용 Seasia 2018-10-04 — 여자 이름 3위 Azizah
    //   https://seasia.co/2018/10/04/malaysia-s-longest-most-popular-names-revealed (전국 자료, 페낭만의 자료는 없음)
    country: '말레이시아',
    names: { osat: '아지자' },
  },
  {
    // 인도: 구자라트 선거인 명부 이름 순위, DNA India 2013-06-23 — 여자 Hansa 2위, Manjula 4위
    //   https://www.dnaindia.com/ahmedabad/report-gita-ben-and-ramesh-bhai-most-popular-names-in-gujarat-1851815
    //   남자 Ramesh 1위(약 34만 명), Mohan은 남자아이에게 많이 짓는 이름으로 소개
    country: '인도',
    names: { 'cotton-farmer': '한사', 'cotton-gin': '라메시', spinner: '만줄라', 'cotton-classer': '모한' },
  },
  {
    // 필리핀: 통계청(PSA)「Civil Registration and Vital Statistics Trivia: Leap Year Statistics」(2016) 표 2,
    //   2월 29일에 태어난 사람(1948~2012년) 가운데 흔한 이름. PSA의 해마다 이름 발표는 2014년 이후 신생아만 다뤄 이 표를 쓴다
    //   http://web.archive.org/web/20170115211627/http://psa.gov.ph/sites/default/files/Trivia_Leap%20Year.pdf
    //   남자 Joel 5위·Reynaldo 6위·Ronald 8위, 여자 Evelyn 1위·Jocelyn 4위
    country: '필리핀',
    names: { 'banana-farmer': '조엘', 'banana-packer': '에벌린', 'davao-port': '레이날도', 'banana-scientist': '조슬린' },
  },
  {
    // 베트남: 정부 이름 통계가 없어 백과사전·학술 자료로 확인한 흔한 이름(성 없이 이름만)
    //   위키백과(베트남어)「Tên người Việt Nam」— 여자 Hương·Lan·Mai·Hoa·Hiền, 남자 Hùng·Cường, "Mạnh, Dũng, Tuấn… luôn phổ biến hơn"
    //   https://vi.wikipedia.org/wiki/Tên_người_Việt_Nam
    //   Nguyen-Viet Khoa, "The Linguistic Landscape of Gender in Vietnamese Personal Names", Names 73(2), 2025 — Hoa·Lan·Hiền을 흔한 여자 이름으로 다룸
    //   https://ans-names.pitt.edu/ans/article/view/2703
    country: '베트남',
    names: {
      'vn-factory': '흐엉', 'vn-port': '훙', 'hanoi-air': '란', 'phone-tester': '뚜언', 'shrimp-farmer': '끄엉',
      'shrimp-processor': '마이', 'water-keeper': '호아', 'vn-coffee-farmer': '마인', 'vn-coffee-port': '히엔',
      'module-assembler': '중', // Dũng
      // 아래는 순위 출처 없는 평범한 이름 (2026-10 사용자 결정)
      'monitor-assembler': '투이', 'app-developer': '린', 'qa-tester': '프엉', // Thủy, Linh, Phương
    },
  },
  {
    // 방글라데시: 정부 이름 통계를 찾지 못함
    //   Yasmin: The Daily Star「The Name Game」(2019-12-06) — 여성 셋 중 하나가 Begum·Khanam·Yasmin·Jahan·Sultana 같은 이름을 쓴다
    //   https://www.thedailystar.net/literature/news/the-name-game-1836856
    //   Shariful: Forebears 방글라데시 이름 136위(약 13만 명) https://forebears.io/forenames/shariful (상업 자료, 약함)
    country: '방글라데시',
    names: { 'garment-sewer': '야스민', 'chittagong-port': '샤리풀' },
  },
  {
    // 사우디아라비아: 정부 이름 통계를 찾지 못함. Alzamil, "Analysis of the Sociolinguistic Status of Saudi Female Personal Names",
    //   International Journal of Linguistics 12(4), 2020 — 카심 지역의 흔한 여자 이름 표본에 Muneerah
    //   https://www.macrothink.org/journal/index.php/ijl/article/download/17214/13505
    country: '사우디아라비아',
    names: { 'oil-worker': '무니라' },
  },
  {
    // 바다 위: 선원 국적이 다양해 위 출처의 나라 이름을 섞는다(그 나라 땅 위 사람과 겹치지 않게). 카드에는 국적을 적지 않는다
    //   인도네시아(Dukcapil): Wahyudi 3위, Sumiati X세대 여자 3위, Ernawati 밀레니얼 여자 3위
    //   중국: 国良(2019년 전국 성명 보고), 涛(2007년 동명이인 50) / 필리핀(PSA 윤일 통계): Ronald 남자 8위 / 태국(주민등록): Wichai 14위, Somphon 8위 / 스페인(INE): Antonio 남자 1위
    country: '',
    names: {
      'sea-crew': '로널드', 'bulk-crew': '궈량', 'tanker-crew': '위차이', 'reefer-crew': '에르나와티', 'tuna-fisher': '와휴디',
      'fishery-observer': '수미아티', 'distant-squid-fisher': '안토니오', 'ship-cook': '타오', 'reefer-tech': '솜폰',
      'cable-repairer': '하린',
    },
    from: {
      'sea-crew': '필리핀', 'bulk-crew': '중국', 'tanker-crew': '태국', 'reefer-crew': '인도네시아', 'tuna-fisher': '인도네시아',
      'fishery-observer': '인도네시아', 'distant-squid-fisher': '스페인', 'ship-cook': '중국', 'reefer-tech': '태국',
      'cable-repairer': '대한민국',
    },
  },
]

const NAMES: Record<string, string> = Object.assign({}, ...NAME_GROUPS.map((g) => g.names))

/** 사람 id의 이름. 연결 카드는 원래 사람의 이름을 쓴다 */
export function nameOf(personId: string): string | undefined {
  const origin = LINK_RULES.find((r) => r.cardId === personId)?.personId
  return NAMES[origin ?? personId]
}
