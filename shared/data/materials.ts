import type { CardSet, LinkRule, Material, Product } from '../types'

/**
 * 재료별 대표 여정.
 * 실제 경로는 제품·브랜드마다 다르며, 여기 담긴 것은 무역·생산 구조를 바탕으로 한 "대표 경로 예시"다.
 */
const SEA = ['sea-crew', 'busan-crane', 'warehouse']

const list: Material[] = [
  {
    id: 'coffee', name: '커피 원두', aliases: ['커피', '원두', '아메리카노', '라떼', '콜드브루', '에스프레소'],
    stages: ['coffee-picker', 'washing-station', 'djibouti-docker', ...SEA.slice(0, 2), 'roaster', 'warehouse'],
    quiz: {
      q: '에티오피아는 바다가 없는 나라예요. 커피는 어느 나라 항구를 통해 나갈까요?',
      options: ['지부티', '이집트', '남아프리카공화국'], answer: 0,
      explain: '에티오피아 수출입 화물의 대부분은 이웃 나라 지부티 항구를 거쳐요.',
      rewardId: 'cupper',
    },
  },
  {
    id: 'cacao', name: '카카오', aliases: ['초콜릿', '초코', '카카오', '코코아', '핫초코', '브라우니'],
    stages: ['cacao-farmer', 'cacao-dryer', 'abidjan-docker', 'sea-crew', 'cocoa-grinder', 'busan-crane', 'warehouse'],
    quiz: {
      q: '세계에서 카카오를 가장 많이 생산하는 나라는?',
      options: ['브라질', '코트디부아르', '인도네시아'], answer: 1,
      explain: '서아프리카의 코트디부아르가 세계 카카오 생산 1위예요. 이웃 나라 가나가 그 뒤를 이어요.',
      rewardId: 'cacao-grader',
    },
  },
  {
    id: 'sugar', name: '설탕', aliases: ['설탕', '사탕', '시럽', '탄산음료', '콜라', '사이다'],
    stages: ['cane-harvester', 'raw-sugar-mill', 'bulk-crew', 'sugar-refinery', 'warehouse'],
    quiz: {
      q: '호주에서 온 갈색 원당은 어디에서 하얀 설탕이 될까요?',
      options: ['배 위에서', '한국 제당 공장', '호주 농장'], answer: 1,
      explain: '한국은 원당을 수입해서 국내 제당 공장에서 정제해 하얀 설탕을 만들어요.',
      rewardId: 'sugar-qc',
    },
  },
  {
    id: 'wheat', name: '밀', aliases: ['밀', '밀가루', '빵', '라면', '국수', '파스타', '과자', '케이크', '피자', '만두'],
    stages: ['wheat-farmer', 'grain-elevator', 'pnw-port', 'bulk-crew', 'flour-mill', 'warehouse'],
    quiz: {
      q: '우리나라는 먹는 밀을 주로 어떻게 구할까요?',
      options: ['대부분 국내에서 기른다', '대부분 수입한다', '국산과 수입이 반반'], answer: 1,
      explain: '한국의 밀 자급률은 아주 낮아서, 먹는 밀의 대부분을 미국·호주·캐나다 등에서 수입해요.',
      rewardId: 'grain-inspector',
    },
  },
  {
    id: 'palm-oil', name: '팜유', aliases: ['팜유', '라면', '과자', '마가린', '비누', '아이스크림'],
    stages: ['palm-harvester', 'palm-mill', 'tanker-crew', 'oil-food-plant', 'warehouse'],
    quiz: {
      q: '팜유를 세계에서 가장 많이 생산하는 나라는?',
      options: ['인도네시아', '브라질', '인도'], answer: 0,
      explain: '인도네시아가 1위, 말레이시아가 2위예요. 두 나라가 세계 팜유의 대부분을 만들어요.',
      rewardId: 'palm-smallholder',
    },
  },
  {
    id: 'rice', name: '쌀', aliases: ['쌀', '밥', '김밥', '삼각김밥', '떡', '초밥', '햇반', '주먹밥', '비빔밥'],
    stages: ['rice-farmer', 'rice-mill', 'warehouse'],
    quiz: {
      q: '벼의 껍질을 벗겨 하얀 쌀로 만드는 일을 뭐라고 할까요?',
      options: ['제분', '도정', '정제'], answer: 1,
      explain: '벼의 겉껍질과 속겨를 벗겨 내는 일을 도정이라고 해요.',
      rewardId: 'rice-breeder',
    },
  },
  {
    id: 'laver', name: '김', aliases: ['김', '김밥', '삼각김밥', '조미김', '주먹밥'],
    stages: ['laver-farmer', 'laver-processor', 'warehouse'],
    quiz: {
      q: '세계에서 김을 가장 많이 수출하는 나라는?',
      options: ['일본', '중국', '한국'], answer: 2,
      explain: '한국은 세계 최대 김 수출국이에요. 김은 대표적인 효자 수출 수산물이에요.',
      rewardId: 'laver-auctioneer',
    },
  },
  {
    id: 'tuna', name: '참치', aliases: ['참치', '참치캔', '참치마요', '삼각김밥', '참치김밥'],
    stages: ['tuna-fisher', 'reefer-crew', 'cannery', 'warehouse'],
    quiz: {
      q: '참치 통조림에 가장 많이 쓰이는 참치는?',
      options: ['참다랑어', '가다랑어', '청새치'], answer: 1,
      explain: '통조림에는 주로 가다랑어(스킵잭)를 써요. 참다랑어는 비싸서 주로 회로 먹어요.',
      rewardId: 'fishery-observer',
    },
  },
  {
    id: 'salmon', name: '연어', aliases: ['연어', '연어초밥', '포케', '훈제연어', '연어덮밥'],
    stages: ['salmon-farmer', 'salmon-processor', 'oslo-air', 'air-cargo', 'warehouse'],
    quiz: {
      q: '얼리지 않은 신선한 노르웨이 연어는 무엇을 타고 한국에 올까요?',
      options: ['컨테이너선', '비행기', '기차'], answer: 1,
      explain: '신선 연어는 시간이 생명이라 항공 화물로 며칠 만에 도착해요.',
      rewardId: 'fish-vet',
    },
  },
  {
    id: 'banana', name: '바나나', aliases: ['바나나', '바나나우유'],
    stages: ['banana-farmer', 'banana-packer', 'davao-port', 'sea-crew', 'busan-crane', 'ripening', 'warehouse'],
    quiz: {
      q: '초록색으로 도착한 바나나를 노랗게 만드는 것은?',
      options: ['햇볕에 말리기', '에틸렌 가스로 숙성', '냉동 보관'], answer: 1,
      explain: '바나나는 덜 익은 초록색일 때 실어 와서, 숙성실에서 에틸렌 가스로 익혀요.',
      rewardId: 'banana-scientist',
    },
  },
  {
    id: 'cotton', name: '면', aliases: ['면', '티셔츠', '청바지', '셔츠', '양말', '수건', '에코백', '속옷', '후드티'],
    stages: ['cotton-farmer', 'cotton-gin', 'spinner', 'garment-sewer', 'chittagong-port', ...SEA],
    quiz: {
      q: '목화솜에서 씨를 빼내는 작업을 뭐라고 할까요?',
      options: ['조면', '방적', '염색'], answer: 0,
      explain: '씨를 빼는 일은 조면, 솜을 꼬아 실을 만드는 일은 방적이에요.',
      rewardId: 'cotton-classer',
    },
  },
  {
    id: 'polyester', name: '폴리에스터', aliases: ['폴리에스터', '운동복', '레깅스', '패딩', '운동화', '등산복', '바람막이', '플리스'],
    stages: ['poly-fiber', 'vn-factory', 'vn-port', ...SEA],
    quiz: {
      q: '폴리에스터 섬유의 원료는?',
      options: ['나무', '석유', '목화'], answer: 1,
      explain: '폴리에스터는 석유에서 얻은 원료로 만든 합성섬유예요. 페트병과 같은 계열의 소재예요.',
      rewardId: 'pet-sorter',
    },
  },
  {
    id: 'plastic', name: '플라스틱', aliases: ['플라스틱', '컵', '빨대', '포장', '비닐', '페트병', '생수', '칫솔', '케이스', '볼펜'],
    stages: ['oil-worker', 'tanker-crew', 'ulsan-refinery', 'yeosu-chem', 'injection', 'warehouse'],
    quiz: {
      q: '우리나라가 원유를 가장 많이 들여오는 나라는?',
      options: ['미국', '러시아', '사우디아라비아'], answer: 2,
      explain: '한국은 원유를 사우디아라비아에서 가장 많이 수입해요.',
      rewardId: 'refinery-safety',
    },
  },
  {
    id: 'rubber', name: '천연고무', aliases: ['고무', '운동화', '타이어', '자전거', '고무장갑', '슬리퍼'],
    stages: ['rubber-tapper', 'rubber-processor', 'laemchabang-port', ...SEA],
    quiz: {
      q: '천연고무를 세계에서 가장 많이 생산하는 나라는?',
      options: ['태국', '브라질', '중국'], answer: 0,
      explain: '태국이 천연고무 생산 1위예요. 고무나무는 원래 남미 아마존이 고향이에요.',
      rewardId: 'latex-tester',
    },
  },
  {
    id: 'cobalt', name: '코발트', aliases: ['코발트', '배터리', '휴대폰', '스마트폰', '노트북', '전기차', '보조배터리', '이어폰'],
    stages: ['cobalt-miner', 'cn-refinery', 'sea-crew', 'kr-battery'],
    quiz: {
      q: '세계 코발트의 대부분은 어느 나라에서 나올까요?',
      options: ['호주', '콩고민주공화국', '칠레'], answer: 1,
      explain: '세계 코발트 생산의 대부분이 콩고민주공화국에서 나와요.',
      rewardId: 'battery-recycler',
    },
  },
  {
    id: 'lithium', name: '리튬', aliases: ['리튬', '배터리', '휴대폰', '스마트폰', '노트북', '전기차', '보조배터리', '이어폰'],
    stages: ['lithium-miner', 'bulk-crew', 'cn-refinery', 'sea-crew', 'kr-battery'],
    quiz: {
      q: '리튬을 세계에서 가장 많이 캐는 나라는?',
      options: ['호주', '중국', '미국'], answer: 0,
      explain: '호주가 리튬 채굴 1위예요. 칠레와 아르헨티나는 소금 호수에서 리튬을 얻어요.',
      rewardId: 'brine-engineer',
    },
  },
  {
    id: 'chip', name: '반도체', aliases: ['반도체', '칩', '휴대폰', '스마트폰', '노트북', '컴퓨터', '태블릿', '이어폰', '스마트워치'],
    stages: ['fab-engineer', 'osat', 'air-cargo'],
    quiz: {
      q: '반도체를 만드는, 먼지가 거의 없는 방을 뭐라고 할까요?',
      options: ['클린룸', '쇼룸', '드라이룸'], answer: 0,
      explain: '아주 작은 먼지 하나도 회로를 망가뜨릴 수 있어서 반도체는 클린룸에서 만들어요.',
      rewardId: 'litho-engineer',
    },
  },
  {
    id: 'assembly', name: '기기 조립', aliases: ['휴대폰', '스마트폰', '태블릿', '스마트워치', '이어폰'],
    stages: ['vn-factory', 'hanoi-air', 'air-cargo', 'warehouse', 'courier'],
    quiz: {
      q: '한국 브랜드 휴대폰을 많이 조립하는 나라는?',
      options: ['베트남', '멕시코', '독일'], answer: 0,
      explain: '삼성전자는 휴대폰의 상당량을 베트남 공장에서 조립해요.',
      rewardId: 'phone-tester',
    },
  },
  {
    id: 'aluminum', name: '알루미늄', aliases: ['알루미늄', '캔', '콜라', '맥주', '음료수캔', '호일', '자전거', '노트북'],
    stages: ['bauxite-miner', 'smelter', 'sea-crew', 'busan-crane', 'can-factory', 'warehouse'],
    quiz: {
      q: '알루미늄을 만드는 광석의 이름은?',
      options: ['보크사이트', '철광석', '석회석'], answer: 0,
      explain: '알루미늄은 보크사이트에서 알루미나를 뽑고, 전기로 제련해 만들어요.',
      rewardId: 'can-recycler',
    },
  },
  {
    id: 'pulp', name: '종이', aliases: ['종이', '종이컵', '노트', '공책', '책', '휴지', '상자', '택배상자', '우유팩', '영수증'],
    stages: ['eucalyptus', 'pulp-mill', 'santos-port', 'bulk-crew', 'paper-mill', 'warehouse'],
    quiz: {
      q: '종이 원료인 펄프를 세계에서 가장 많이 수출하는 나라는?',
      options: ['브라질', '핀란드', '캐나다'], answer: 0,
      explain: '브라질은 빨리 자라는 유칼립투스 덕분에 세계 최대 펄프 수출국이에요.',
      rewardId: 'forest-auditor',
    },
  },
  {
    id: 'orange', name: '오렌지', aliases: ['오렌지', '오렌지주스', '주스', '환타'],
    stages: ['orange-picker', 'juice-plant', 'santos-port', ...SEA.slice(0, 2), 'beverage-plant', 'warehouse'],
    quiz: {
      q: '오렌지 주스를 세계에서 가장 많이 수출하는 나라는?',
      options: ['미국', '스페인', '브라질'], answer: 2,
      explain: '브라질이 세계 오렌지 주스 수출의 대부분을 차지해요.',
      rewardId: 'citrus-scientist',
    },
  },
  {
    id: 'soybean', name: '대두', aliases: ['콩', '대두', '두부', '두유', '간장', '된장', '식용유', '콩나물'],
    stages: ['soy-farmer', 'santos-port', 'bulk-crew', 'tofu-maker', 'warehouse'],
    quiz: {
      q: '두부를 굳힐 때 넣는 것은?',
      options: ['간수', '식초', '설탕'], answer: 0,
      explain: '끓인 콩물에 간수를 넣으면 단백질이 엉겨 두부가 돼요.',
      rewardId: 'soy-breeder',
    },
  },
  {
    id: 'steel', name: '철강', aliases: ['철', '강철', '자전거', '참치캔', '통조림', '숟가락', '냄비', '못', '자동차'],
    stages: ['iron-miner', 'hedland-port', 'bulk-crew', 'steel-mill', 'warehouse'],
    quiz: {
      q: '철광석을 녹여 쇳물을 만드는 거대한 설비는?',
      options: ['용광로', '원심분리기', '보일러'], answer: 0,
      explain: '용광로(고로)에 철광석과 석탄을 넣어 녹이면 쇳물이 나와요.',
      rewardId: 'scrap-worker',
    },
  },
  {
    id: 'milk', name: '우유', aliases: ['우유', '라떼', '치즈', '요거트', '아이스크림', '바나나우유', '버터'],
    stages: ['dairy-farmer', 'milk-collector', 'dairy-plant', 'warehouse'],
    quiz: {
      q: '아주 높은 온도로 몇 초만 살균해 오래 두고 먹을 수 있게 한 우유 방식은?',
      options: ['저온 살균', '초고온 멸균(UHT)', '냉동 살균'], answer: 1,
      explain: '초고온 멸균(UHT) 우유는 냉장하지 않아도 오래 보관할 수 있어요.',
      rewardId: 'cow-vet',
    },
  },
]

export const MATERIALS: Record<string, Material> = Object.fromEntries(list.map((m) => [m.id, m]))
export const MATERIAL_LIST = list

/** 빠른 선택과 오늘의 미스터리에 쓰는 대표 물건 */
export const PRODUCTS: Product[] = [
  { id: 'americano', name: '아이스 아메리카노', aliases: ['아메리카노', '커피', '아아'], materialIds: ['coffee', 'plastic'] },
  { id: 'latte', name: '카페라떼', aliases: ['라떼', '카페라떼'], materialIds: ['coffee', 'milk', 'pulp'] },
  { id: 'choco-bar', name: '초콜릿', aliases: ['초콜릿', '초코바'], materialIds: ['cacao', 'sugar', 'milk', 'pulp'] },
  { id: 'ramen', name: '라면', aliases: ['라면', '컵라면'], materialIds: ['wheat', 'palm-oil', 'plastic'] },
  { id: 'samgak', name: '참치마요 삼각김밥', aliases: ['삼각김밥', '참치마요'], materialIds: ['rice', 'laver', 'tuna', 'plastic'] },
  { id: 'smartphone', name: '스마트폰', aliases: ['스마트폰', '휴대폰', '핸드폰', '폰', '아이폰', '갤럭시'], materialIds: ['cobalt', 'lithium', 'chip', 'assembly', 'plastic'] },
  { id: 'tshirt', name: '면 티셔츠', aliases: ['티셔츠', '반팔', '티'], materialIds: ['cotton'] },
  { id: 'sneakers', name: '운동화', aliases: ['운동화', '스니커즈', '신발'], materialIds: ['rubber', 'polyester'] },
  { id: 'banana', name: '바나나', aliases: ['바나나'], materialIds: ['banana'] },
  { id: 'salmon-sushi', name: '연어초밥', aliases: ['연어초밥', '연어', '초밥'], materialIds: ['salmon', 'rice'] },
  { id: 'cola', name: '캔 콜라', aliases: ['콜라', '캔음료', '사이다'], materialIds: ['aluminum', 'sugar'] },
  { id: 'oj', name: '오렌지 주스', aliases: ['오렌지주스', '주스'], materialIds: ['orange', 'pulp'] },
  { id: 'tofu', name: '두부', aliases: ['두부'], materialIds: ['soybean', 'plastic'] },
  { id: 'bicycle', name: '자전거', aliases: ['자전거', '따릉이'], materialIds: ['steel', 'aluminum', 'rubber'] },
  { id: 'notebook', name: '공책', aliases: ['공책', '노트', '다이어리'], materialIds: ['pulp'] },
  { id: 'tuna-can', name: '참치캔', aliases: ['참치캔', '참치'], materialIds: ['tuna', 'steel'] },
  { id: 'banana-milk', name: '바나나우유', aliases: ['바나나우유'], materialIds: ['milk', 'sugar', 'plastic'] },
  { id: 'earbuds', name: '무선 이어폰', aliases: ['이어폰', '에어팟', '버즈'], materialIds: ['lithium', 'cobalt', 'chip', 'assembly', 'plastic'] },
]

/** 하루 여정에서 이 사람이 서로 다른 재료 2개 이상에 나오면 연결 카드 획득 */
export const LINK_RULES: LinkRule[] = [
  { personId: 'sea-crew', cardId: 'link-sea-crew' },
  { personId: 'bulk-crew', cardId: 'link-bulk-crew' },
  { personId: 'tanker-crew', cardId: 'link-tanker-crew' },
  { personId: 'busan-crane', cardId: 'link-busan-crane' },
  { personId: 'air-cargo', cardId: 'link-air-cargo' },
  { personId: 'vn-factory', cardId: 'link-vn-factory' },
  { personId: 'cn-refinery', cardId: 'link-cn-refinery' },
  { personId: 'kr-battery', cardId: 'link-kr-battery' },
  { personId: 'santos-port', cardId: 'link-santos-port' },
]

export const SETS: CardSet[] = [
  {
    id: 'set-sea', name: '바다를 건넌 사람들', desc: '바다 위에서 일하는 사람 다섯 명을 모두 만나 보세요.',
    memberIds: ['sea-crew', 'bulk-crew', 'tanker-crew', 'reefer-crew', 'tuna-fisher'], rewardId: 'harbor-pilot',
  },
  {
    id: 'set-soil', name: '땅을 일구는 사람들', desc: '세계 곳곳의 농부 여덟 명을 모두 만나 보세요.',
    memberIds: ['coffee-picker', 'cacao-farmer', 'wheat-farmer', 'rice-farmer', 'cotton-farmer', 'banana-farmer', 'soy-farmer', 'orange-picker'],
    rewardId: 'seed-vault',
  },
  {
    id: 'set-underground', name: '땅속에서 온 것들', desc: '광물을 캐는 사람 다섯 명을 모두 만나 보세요.',
    memberIds: ['oil-worker', 'cobalt-miner', 'lithium-miner', 'bauxite-miner', 'iron-miner'], rewardId: 'mine-rescue',
  },
  {
    id: 'set-factory', name: '공장의 손', desc: '물건을 만드는 공장 사람 여섯 명을 모두 만나 보세요.',
    memberIds: ['vn-factory', 'garment-sewer', 'fab-engineer', 'injection', 'cannery', 'can-factory'], rewardId: 'safety-inspector',
  },
]
