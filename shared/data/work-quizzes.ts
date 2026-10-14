/**
 * 일의 크기를 짐작하는 퀴즈. 재료마다 하나씩 extraQuizzes 끝에 붙는다(materials.ts). 보상 카드는 그 재료의 첫 퀴즈와 같다.
 * 보기는 자릿수를 다르게 해서 정확한 값이 아니라 감을 맞히게 한다. 해설에는 정답 숫자와 출처 이름을 넣는다.
 * 웹에서 출처를 확인한 숫자만 쓴다. 출처는 항목마다 주석으로 남긴다.
 */
import type { Quiz } from '../types'

export type WorkQuiz = Omit<Quiz, 'rewardId'>

export const WORK_QUIZZES: Record<string, WorkQuiz> = {
  // Tasting Table, 2026 — https://www.tastingtable.com/2086943/how-much-coffee-does-coffee-tree-produce
  coffee: { q: '커피나무 한 그루가 1년에 맺는 체리는 몇 개쯤?', options: ['약 200개', '약 2,000개', '약 20,000개'], answer: 1, explain: '다 자란 커피나무 한 그루는 1년에 체리를 약 2,000개 맺어요. 미국 음식 매체 테이스팅 테이블의 설명이에요.' },
  // VOA Learning English(세계카카오재단 인용), 2010 — https://learningenglish.voanews.com/a/genetic-secrets-of-chocolate-bar/112113.html
  cacao: { q: '카카오 열매 하나에 카카오 콩은 몇 개쯤?', options: ['약 20~50개', '약 200~500개', '약 2,000~5,000개'], answer: 0, explain: '카카오 열매 하나에는 보통 콩이 약 20~50개 들어 있어요. 세계카카오재단(World Cocoa Foundation)의 설명이에요.' },
  // CANEGROWERS, Industry facts and figures (2023 시즌) — https://www.canegrowers.com.au/industry-facts-and-figures
  sugar: { q: '호주에서 한 해에 거두는 사탕수수는 몇 톤쯤?', options: ['약 30만 톤', '약 300만 톤', '약 3,000만 톤'], answer: 2, explain: '2023년 시즌 호주는 사탕수수를 약 2,976만 톤 거뒀어요. 호주 사탕수수 농가 단체 CANEGROWERS의 자료예요.' },
  // Kansas Wheat, 2015 — https://kswheat.com/news/what-does-a-bushel-of-wheat-mean-to-me
  //   1부셸 = 60파운드 = 약 27.2kg
  wheat: { q: '밀 약 27kg(1부셸)에 밀알은 몇 개쯤?', options: ['약 1만 개', '약 10만 개', '약 100만 개'], answer: 2, explain: '밀 약 27kg(1부셸)에는 밀알이 약 100만 개 들어 있어요. 캔자스 밀 위원회(Kansas Wheat)의 자료예요.' },
  // FAO, Feeding pigs in the tropics 4장, 1997 — https://www.fao.org/4/w3647e/W3647E04.htm
  'palm-oil': { q: '기름야자 열매송이 하나에 열매가 몇 개까지 달릴까요?', options: ['약 15개', '약 150개', '약 1,500개'], answer: 2, explain: '기름야자 열매송이 하나는 15~20kg이고, 열매가 약 1,500개까지 달려요. 유엔식량농업기구(FAO) 자료예요.' },
  // 통계청 '2024년 쌀 생산량 조사 결과'(뉴시스 보도) — https://mobile.newsis.com/view/NISX20241115_0002961160
  rice: { q: '논 1,000㎡에서 쌀은 얼마나 나올까요?', options: ['약 50kg', '약 500kg', '약 5,000kg'], answer: 1, explain: '2024년 논 10a(1,000㎡)에서 난 쌀은 약 514kg이에요. 통계청 쌀 생산량 조사 결과예요.' },
  // 경인일보(해양수산부 집계 인용), 2026 — https://www.kyeongin.com/article/1757973
  laver: { q: '우리나라에서 1년에 만드는 마른김은 몇 장쯤?', options: ['약 2억 장', '약 20억 장', '약 200억 장'], answer: 2, explain: '2025년 마른김 생산량은 약 2억 369만 속이에요. 한 속이 100장이니 약 200억 장이에요. 해양수산부 집계예요.' },
  // FAO Fisheries Circular No. 982, 2003 — https://www.fao.org/4/Y4499E/y4499e07.htm
  tuna: { q: '참치 선망선 한 척에 냉동 참치를 몇 톤까지 실을까요?', options: ['약 40톤', '약 400톤', '약 4,000톤'], answer: 2, explain: '큰 참치 선망선은 냉동 생선을 약 4,000톤까지 실을 수 있어요. 유엔식량농업기구(FAO) 자료예요.' },
  // Dyrevernalliansen, Fish farming in Norway — https://dyrevern.no/english/fish-farming-in-norway
  //   (노르웨이 정부의 가두리당 20만 마리 상한과 같다: thefishsite.com/articles/200000-fish-limit-counterproductive, 2011)
  salmon: { q: '노르웨이 연어 가두리 하나에 연어가 몇 마리까지?', options: ['약 2,000마리', '약 2만 마리', '약 20만 마리'], answer: 2, explain: '바다 가두리 하나에 연어를 약 20만 마리까지 길러요. 노르웨이 동물보호단체 연합(Dyrevernalliansen)의 자료예요.' },
  // 독일보험협회(GDV) 운송 정보 서비스 TIS 'Bananas' — https://tis-gdv.de/?p=10558
  banana: { q: '바나나 한 송이(줄기)에 바나나는 몇 개쯤?', options: ['약 20개', '약 200개', '약 2,000개'], answer: 1, explain: '바나나 한 줄기에는 손 모양 다발이 8~14개 달리고, 모두 합쳐 약 200개예요. 독일보험협회(GDV) 운송 정보 서비스의 자료예요.' },
  // National Cotton Council of America, FAQ — https://www.cotton.org/edu/faq/
  //   'One bale of cotton can make 294 pairs of men's jeans', 'A bale of cotton weighs about 500 pounds' (500 × 0.4536 ≈ 227kg)
  cotton: { q: '목화 한 곤포(약 227kg)로 청바지 몇 벌을 만들까요?', options: ['약 30벌', '약 300벌', '약 3,000벌'], answer: 1, explain: '약 227kg짜리 목화 한 곤포로 남성용 청바지를 294벌 만들 수 있어요. 미국 면화협회(National Cotton Council)의 자료예요.' },
  // TexData(Textile Exchange 'Materials Market Report 2023' 인용) — https://www.texdata.com/news/Yarn&Fiber/19899.html
  polyester: { q: '세계에서 1년에 만드는 폴리에스터 섬유는 몇 톤쯤?', options: ['약 60만 톤', '약 600만 톤', '약 6,000만 톤'], answer: 2, explain: '2022년 세계 폴리에스터 생산량은 약 6,300만 톤이에요. 섬유 업계 단체 텍스타일 익스체인지(Textile Exchange)의 자료예요.' },
  // 경남신문(창원시 자료), 2021 — https://knnews.co.kr/news/articleView.php?idxno=1461
  //   '500ml 투명페트병 15개로 반팔티셔츠 1개를 만들 수 있으며'
  plastic: { q: '500ml 투명 페트병 몇 개면 반팔 티셔츠 한 장이 될까요?', options: ['약 2개', '약 15개', '약 150개'], answer: 1, explain: '500ml 투명 페트병 약 15개를 재활용하면 반팔 티셔츠 한 장을 만들 수 있어요. 경남신문이 보도한 창원시 자료예요.' },
  // FAO, The Rubber Tree (Better Farming Series 25), 1977 — https://www.fao.org/4/AD221E/AD221E06.htm
  rubber: { q: '고무 채취꾼 한 명이 하루에 몇 그루를 탭핑할까요?', options: ['약 40그루', '약 400그루', '약 4,000그루'], answer: 1, explain: '고무 채취꾼 한 명은 하루에 고무나무 약 440그루를 탭핑할 수 있어요. 유엔식량농업기구(FAO) 자료예요.' },
  // Adamas Intelligence, 2024 — https://www.adamasintel.com/?p=12741
  cobalt: { q: '전기차 한 대 배터리에 코발트는 몇 kg쯤?', options: ['약 300g', '약 3kg', '약 30kg'], answer: 1, explain: '2023년 1~11월 전기차 한 대에 들어간 코발트는 평균 약 2.9kg이에요. 배터리 시장 조사기관 아다마스 인텔리전스의 자료예요.' },
  // Fastmarkets, 2019 — https://www.fastmarkets.com/insights/global-lithium-supply-developing-at-accelerating-pace-on-growing-demand/
  lithium: { q: '리튬 화합물 1톤에 스포듀민 정광은 몇 톤쯤?', options: ['약 0.7톤', '약 7~8톤', '약 70톤'], answer: 1, explain: '스포듀민 정광을 보통 약 7~8톤 정제해야 탄산리튬이나 수산화리튬 1톤이 나와요. 원자재 정보 업체 Fastmarkets의 자료예요.' },
  // 삼성전자 반도체 뉴스룸, 8대 공정 — https://news.samsungsemiconductor.com/kr/?p=7862
  chip: { q: '반도체 하나가 완성되기까지 몇 번의 과정을 거칠까요?', options: ['약 10번', '약 수백 번', '약 수만 번'], answer: 1, explain: '반도체는 완성되기까지 보통 수백 번의 과정을 거치고, 이를 크게 8대 공정으로 나눠요. 삼성전자 반도체 뉴스룸의 설명이에요.' },
  // Vietnam Government News(baochinhphu.vn), 2025 — https://en.baochinhphu.vn/samsung-produces-2-billionth-mobile-phone-in-viet-nam-1112508271304324.htm
  assembly: { q: '베트남 삼성 공장에서 만든 휴대폰은 모두 몇 대쯤?', options: ['약 2,000만 대', '약 2억 대', '약 20억 대'], answer: 2, explain: '베트남 삼성 휴대폰 공장은 2009년부터 2025년 6월까지 약 20억 대를 만들었어요. 베트남 정부 포털의 보도예요.' },
  // 국제알루미늄협회(IAI), The Aluminium Story 'Raw Materials' — https://alustory.international-aluminium.org/?p=1919
  aluminum: { q: '알루미늄 1톤에 보크사이트는 몇 톤쯤 들까요?', options: ['약 0.6톤', '약 6톤', '약 60톤'], answer: 1, explain: '보크사이트 약 3톤으로 알루미나 1톤을, 알루미나 약 2톤으로 알루미늄 1톤을 만들어서 보통 약 6톤이 들어요. 국제알루미늄협회(IAI) 자료예요.' },
  // 연합뉴스(파이낸셜뉴스 게재), 2025 — https://www.fnnews.com/news/202506080756049926
  pulp: { q: '종이 1톤을 만들려면 나무는 몇 그루쯤?', options: ['약 2그루', '약 17그루', '약 170그루'], answer: 1, explain: '종이 1톤을 만들려면 30년생 나무가 약 17그루 필요하다고 해요. 연합뉴스 보도에 나온 수치예요.' },
  // FreshPlaza(Fundecitrus 집계), 2026 — https://www.freshplaza.com/europe/article/9828391/brazilian-orange-crop-reaches-292-94-million-boxes/
  orange: { q: '브라질에서 한 해 수확하는 오렌지는 몇 상자쯤?', options: ['약 300만 상자', '약 3,000만 상자', '약 3억 상자'], answer: 2, explain: '브라질 주요 산지의 2025-26년 오렌지 수확은 40.8kg 상자로 약 2억 9,294만 상자였어요. 브라질 감귤 연구기관 Fundecitrus의 집계예요.' },
  // Safras & Mercado(Conab 12차 조사), 2025 — https://safras.com.br/conab-confirma-safra-recorde-de-soja-em-2024-25/
  soybean: { q: '브라질에서 한 해 거두는 대두는 몇 톤쯤?', options: ['약 170만 톤', '약 1,700만 톤', '약 1억 7천만 톤'], answer: 2, explain: '브라질의 2024/25년 대두 생산량은 약 1억 7,147만 톤이에요. 브라질 국가식량공급공사(Conab)의 집계예요.' },
  // 호주 재무부(세계철강협회 2011 인용), 2014 — https://treasury.gov.au/publication/long-run-forecasts-of-australias-terms-of-trade-2/long-run-forecasts-of-australias-terms-of-trade/4-exports-of-non-rural-bulk-commodities-iron-ore-and-metallurgical-coal
  steel: { q: '철강 1톤을 만들려면 철광석은 몇 톤쯤?', options: ['약 0.14톤', '약 1.4톤', '약 14톤'], answer: 1, explain: '용광로 방식으로 철강 1톤을 만들려면 철광석이 약 1.4톤 들어요. 세계철강협회 자료를 인용한 호주 재무부의 수치예요.' },
  // 라이브뉴스(국립축산과학원 실증시험 보도), 2026 — https://www.livesnews.com/news/article.html?no=60400
  milk: { q: '젖소 한 마리가 하루에 내는 우유는 몇 kg쯤?', options: ['약 3kg', '약 30kg', '약 300kg'], answer: 1, explain: '국립축산과학원 시험에서 젖소 한 마리가 하루 평균 약 27~29kg의 우유를 냈어요.' },
  // 기네스 세계기록(FAO 2018 자료) — https://www.guinnessworldrecords.com/world-records/634550-largest-producer-of-chillies
  chili: { q: '중국에서 한 해 나는 고추는 몇 톤쯤?', options: ['약 185만 톤', '약 1,850만 톤', '약 1억 8천만 톤'], answer: 1, explain: '중국은 생고추와 건고추를 합쳐 한 해 약 1,853만 톤을 생산해요. 기네스 세계기록이 유엔식량농업기구(FAO) 2018년 자료로 밝힌 수치예요.' },
  // 농림축산식품부 보도자료(한국농촌경제연구원 관측 인용), 2022 — https://www.mafra.go.kr/bbs/mafra/68/331594/artclView.do
  cabbage: { q: '우리나라 가을배추는 한 해 몇 톤쯤 날까요?', options: ['약 13만 톤', '약 130만 톤', '약 1,300만 톤'], answer: 1, explain: '2022년 가을배추 생산량은 약 129만 톤으로 전망됐어요. 농림축산식품부가 한국농촌경제연구원 관측을 인용해 밝힌 수치예요.' },
  // Wikipedia 'Glass production' — https://en.wikipedia.org/wiki/Glass_production
  glass: { q: '유리 원료를 녹이는 가마는 몇 도쯤까지 오를까요?', options: ['약 150도', '약 1,500도', '약 15,000도'], answer: 1, explain: '유리병을 만드는 가마는 최고 약 1,575도까지 올라가요. 위키백과 Glass production 항목의 설명이에요.' },
  // 뉴질랜드 산림소유자협회(NZFOA), Plantation Forestry — https://www.nzfoa.org.nz/94-plantation-forestry
  wood: { q: '뉴질랜드 라디아타 소나무는 몇 년 키워 벨까요?', options: ['약 3년', '약 30년', '약 300년'], answer: 1, explain: '뉴질랜드에서 기르는 라디아타 소나무는 평균 약 30년 자란 뒤 베어요. 뉴질랜드 산림소유자협회(NZFOA)의 설명이에요.' },
  // Argus Media(MLA 추정), 2025 — https://www.argusmedia.com/en/news-and-insights/latest-market-news/2727148-australia-s-cattle-herd-expands-slaughter-to-rise
  beef: { q: '호주에서 기르는 소는 모두 몇 마리쯤?', options: ['약 310만 마리', '약 3,100만 마리', '약 3억 1천만 마리'], answer: 1, explain: '호주의 소는 2025년 6월 말 약 3,100만 마리로 추정돼요. 호주 축산공사(MLA)의 추정치예요.' },
  // Agronews Castilla y León 'Censo ganadero UE 2024', 2025 — https://www.agronewscastillayleon.com/censo-ganadero-ue-2024
  pork: { q: '스페인에서 기르는 돼지는 몇 마리쯤?', options: ['약 340만 마리', '약 3,450만 마리', '약 3억 4천만 마리'], answer: 1, explain: '스페인은 2024년 약 3,450만 마리의 돼지를 길렀어요. 스페인 농업 매체 아그로뉴스가 보도한 유럽연합 가축 통계예요.' },
  // 통계청 2024년 4/4분기 가축동향조사(축산신문 보도), 2025 — https://www.chuksannews.co.kr/mobile/article.html?no=264633
  chicken: { q: '우리나라 농장의 육계는 모두 몇 마리쯤일까요?', options: ['약 90만 마리', '약 900만 마리', '약 9,000만 마리'], answer: 2, explain: '2024년 4분기 육계는 약 8,898만 마리를 기르고 있었어요. 통계청 가축동향조사 결과예요.' },
  // Poultry Hub Australia, Chicken Egg (layer) Industry — https://www.poultryhub.org/production/chicken-egg-layer-industry
  //   'Most commercial strains of hen can lay over 260 eggs per year and some improved breeds can lay over 300 eggs'
  egg: { q: '알 낳는 닭 한 마리, 1년에 달걀 몇 개쯤?', options: ['약 30개', '약 300개', '약 3,000개'], answer: 1, explain: '상업용 산란계 한 마리는 1년에 보통 260~300개쯤 알을 낳아요. 호주 가금 연구 기관 Poultry Hub Australia의 자료예요.' },
  // American Farm Bureau Federation, Market Intel, 2025 — https://www.fb.org/market-intel/low-mississippi-river-levels-again-jeopardize-farm-income
  //   'A single barge can carry roughly 1,750 tons of grain' — 미국 톤(short ton = 0.907t). 1,750 × 0.907 ≈ 1,588톤
  corn: { q: '미시시피강 바지선 한 척엔 곡물이 몇 톤쯤?', options: ['약 159톤', '약 1,590톤', '약 15,900톤'], answer: 1, explain: '바지선 한 척에 곡물을 약 1,590톤 실을 수 있어요. 미국농민연맹(American Farm Bureau Federation)의 자료예요.' },
  // FAO Cultured Aquatic Species Information Programme, Penaeus vannamei — https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_whitelegshrimp.htm
  shrimp: { q: '흰다리새우 어미 한 마리, 한 번에 알 몇 개쯤?', options: ['약 1,000개', '약 1만 개', '약 10만 개'], answer: 2, explain: '30~45g짜리 흰다리새우 어미는 한 번에 알을 약 10만~25만 개 낳아요. 유엔식량농업기구(FAO) 양식 품종 정보예요.' },
  // CAG(Citizen consumer and civic Action Group), 2024 — https://www.cag.org.in/blogs/leaf-cup-journey-through-energy-efficient-tea-processing
  tea: { q: '차 1kg을 만들려면 생찻잎은 몇 kg쯤?', options: ['약 0.5kg', '약 5kg', '약 50kg'], answer: 1, explain: '완성된 차 1kg을 만들려면 생찻잎이 약 5kg 들어가요. 인도 시민단체 CAG의 차 가공 자료예요.' },
  // 농촌진흥청 웹진 '다양한 팥 종자 개발', 2020 — https://www.rda.go.kr/webzine/2020/06/sub2-2.html
  'red-bean': { q: '우리나라에서 한 해 거두는 팥은 몇 톤쯤?', options: ['약 500톤', '약 5,000톤', '약 5만 톤'], answer: 1, explain: '국내 팥 생산량은 한 해 약 5,000톤이에요. 농촌진흥청 웹진의 설명이에요.' },
  // 국립식량과학원 고령지농업연구소, 한국작물학회 2020 추계학술대회 PA-066 — https://koreascience.kr/article/CFKO202035438156434.pdf
  buckwheat: { q: '메밀 씨앗 1,000알의 무게는 몇 g쯤?', options: ['약 3.6g', '약 36g', '약 360g'], answer: 1, explain: '강릉에서 기른 메밀 1,000알의 무게는 약 36g이었어요. 국립식량과학원 고령지농업연구소의 연구 결과예요.' },
  // 국가데이터처 2025년 농작물 생산량 조사(인사이트 보도) — https://www.insight.co.kr/news/530083
  potato: { q: '고랭지 감자밭 10a(300평)에선 몇 kg쯤 캘까요?', options: ['약 300kg', '약 3,000kg', '약 30,000kg'], answer: 1, explain: '2025년 고랭지 감자는 10a에서 약 3,171kg을 거뒀어요. 국가데이터처 농작물 생산량 조사 결과예요.' },
  // 농촌진흥청 농사로 '고구마 수확 후 관리기술' — https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=1226
  'sweet-potato': { q: '고구마 큐어링은 며칠쯤 할까요?', options: ['약 4일', '약 40일', '약 400일'], answer: 0, explain: '큐어링은 수확 뒤 일주일 안에 30~33℃, 습도 90~95%에서 보통 4일 동안 해요. 농촌진흥청 농사로의 설명이에요.' },
  // 한국경제, 2025 — https://www.hankyung.com/article/202507314752i
  radish: { q: '도매시장의 무 한 상자는 몇 kg쯤일까요?', options: ['약 2kg', '약 20kg', '약 200kg'], answer: 1, explain: '도매시장에서는 무를 약 20kg짜리 상자로 거래해요. 한국경제의 설명이에요.' },
  // 뉴데일리경제(농협유통 영농지도사 취재), 2023 — https://biz.newdaily.co.kr/site/data/html/2023/05/23/2023052300060.html
  apple: { q: '큰 사과 한 개를 키우려면 잎이 몇 장쯤?', options: ['약 5장', '약 50장', '약 500장'], answer: 1, explain: '사과처럼 큰 과일은 잎 약 40~50장마다 열매 하나를 남겨야 크고 좋은 열매가 돼요. 뉴데일리경제의 적과 작업 기사예요.' },
  // 경북농업기술원(KPI뉴스 보도), 2022 — https://www.kpinews.kr/newsView/179549062593236
  grape: { q: '샤인머스캣 한 송이엔 포도알이 몇 개쯤?', options: ['약 4개', '약 40개', '약 400개'], answer: 1, explain: '경북농업기술원은 샤인머스캣 한 송이의 포도알을 약 40~45개로 맞추길 권해요.' },
  // TNAU Agritech Portal, 토마토 가공품 — https://agritech.tnau.ac.in/agricultural_engineering/agriengg_ape_valueaddtition_tech_prod_tomato.html
  tomato: { q: '토마토 페이스트 1kg에 생토마토는 몇 kg쯤?', options: ['약 0.7kg', '약 7kg', '약 70kg'], answer: 1, explain: '생토마토의 약 14%만 페이스트로 남아서, 페이스트 1kg에 생토마토가 약 7kg 들어요. 인도 타밀나두 농업대학 자료예요.' },
  // 국가데이터처 보리 생산량조사(데일리안 보도), 2026 — https://www.dailian.co.kr/news/view/1672690/
  barley: { q: '보리밭 10a(300평)에선 보리 몇 kg쯤 거둘까요?', options: ['약 36kg', '약 365kg', '약 3,650kg'], answer: 1, explain: '보리는 10a에서 약 365kg을 거뒀어요. 국가데이터처 보리 생산량 조사 결과예요.' },
  // 국립국어원 표준국어대사전 '축' — https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=축
  squid: { q: '마른오징어 \'한 축\'은 몇 마리일까요?', options: ['2마리', '20마리', '200마리'], answer: 1, explain: '오징어 한 축은 20마리예요. 국립국어원 표준국어대사전의 풀이예요.' },
}
