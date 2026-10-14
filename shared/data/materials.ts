import type { CardSet, LinkRule, Material, Product } from '../types'

/**
 * 재료별 대표 여정.
 * 무역·생산 구조를 바탕으로 직접 쓴 여정이다.
 * 출발지 가중치(origins[].weight)는 게임용이다. 실제 생산·수입 비중이 아니라, 한 재료의 출발지가 고루 나오도록
 * 가장 드문 출발지도 25% 이상 나오게 정했다(2곳 3:2, 3곳 2:1:1, 4곳 1:1:1:1). 실제 통계는 각 재료 주석에 남긴다. 게임이라 허구가 조금 섞여도 되고, 실제 자료에서 가져온 사실에는 출처를 주석으로 남긴다.
 */
const SEA = ['sea-crew', 'busan-crane', 'warehouse']

const list: Material[] = [
  {
    id: 'coffee', name: '커피 원두', aliases: ['커피', '원두', '아메리카노', '라떼', '콜드브루', '에스프레소'],
    stages: ['coffee-picker', 'washing-station', 'djibouti-docker', ...SEA.slice(0, 2), 'roaster', 'warehouse'],
    // 출발지 변형. 경로 근거는 people.ts 주석. 가중치는 게임용(GAME_WEIGHTS 참고)
    originHead: 3,
    origins: [
      { id: 'et', name: '에티오피아', weight: 1, head: ['coffee-picker', 'washing-station', 'djibouti-docker'] },
      { id: 'co', name: '콜롬비아', weight: 1, head: ['co-coffee-farmer', 'co-buenaventura-docker'] },
      { id: 'vn', name: '베트남', weight: 1, head: ['vn-coffee-farmer', 'vn-coffee-port'] },
      { id: 'br', name: '브라질', weight: 1, head: ['br-coffee-farmer', 'br-santos-coffee'] },
    ],
    quiz: {
      q: '에티오피아는 바다가 없는 나라예요. 커피는 어느 나라 항구를 통해 나갈까요?',
      options: ['지부티', '이집트', '남아프리카공화국'], answer: 0,
      explain: '에티오피아 수출입 화물의 대부분은 이웃 나라 지부티 항구를 거쳐요.',
      rewardId: 'cupper',
    },
    // 근거: Britannica 'coffee'(열매 속 씨앗 두 개), Oxford Business Group 2017(베트남 커피는 대부분 로부스타)
    extraQuizzes: [
      { q: '우리가 마시는 커피 원두는 커피 열매의 어느 부분일까요?', options: ['씨앗', '껍질', '잎'], answer: 0, explain: '커피 체리 속에는 보통 씨앗이 두 개 들어 있어요. 이 씨앗을 꺼내 말리고 볶은 게 원두예요.', rewardId: 'cupper' },
      { q: '베트남에서 주로 기르는, 쓴맛이 진한 커피 품종은?', options: ['아라비카', '로부스타', '리베리카'], answer: 1, explain: '베트남 커피는 대부분 로부스타예요. 병에 강하고 쓴맛이 진해서 인스턴트커피에도 많이 쓰여요.', rewardId: 'cupper' },
    ],
  },
  {
    id: 'cacao', name: '카카오', aliases: ['초콜릿', '초코', '카카오', '코코아', '핫초코', '브라우니'],
    stages: ['cacao-farmer', 'cacao-dryer', 'abidjan-docker', 'sea-crew', 'cocoa-grinder', 'busan-crane', 'warehouse'],
    originHead: 3,
    origins: [
      { id: 'ci', name: '코트디부아르', weight: 1, head: ['cacao-farmer', 'cacao-dryer', 'abidjan-docker'] },
      { id: 'gh', name: '가나', weight: 1, head: ['gh-cacao-farmer', 'gh-takoradi-docker'] },
    ],
    quiz: {
      q: '세계에서 카카오를 가장 많이 생산하는 나라는?',
      options: ['브라질', '코트디부아르', '인도네시아'], answer: 1,
      explain: '서아프리카의 코트디부아르가 세계 카카오 생산 1위예요. 이웃 나라 가나가 그 뒤를 이어요.',
      rewardId: 'cacao-grader',
    },
    // 근거: Britannica 'cocoa'(수확 뒤 발효·건조를 거쳐 향이 생긴다)
    extraQuizzes: [
      { q: '카카오 콩은 수확한 뒤 무엇을 거쳐야 초콜릿 향이 날까요?', options: ['발효', '냉동', '소금 절임'], answer: 0, explain: '꼬투리에서 꺼낸 콩을 며칠 동안 발효시키고 말려야 초콜릿 특유의 향이 생겨요.', rewardId: 'cacao-grader' },
    ],
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
    // 근거: Britannica 'sugar beet'
    extraQuizzes: [
      { q: '사탕수수 말고 설탕을 만드는 작물은?', options: ['사탕무', '감자', '쌀'], answer: 0, explain: '추운 지방에서는 뿌리에 단맛이 많은 사탕무로 설탕을 만들어요.', rewardId: 'sugar-qc' },
    ],
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
    // 근거: Britannica 'gluten'
    extraQuizzes: [
      { q: '밀가루 반죽을 쫄깃하게 만드는 단백질은?', options: ['글루텐', '콜라겐', '케라틴'], answer: 0, explain: '밀가루에 물을 넣고 치대면 글루텐이 생겨 반죽이 늘어나고 쫄깃해져요.', rewardId: 'grain-inspector' },
    ],
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
    // 근거: 표준국어대사전 '현미', '백미'
    extraQuizzes: [
      { q: '왕겨만 벗기고 쌀겨는 남겨 둔 쌀을 뭐라고 할까요?', options: ['현미', '백미', '찹쌀'], answer: 0, explain: '왕겨만 벗긴 쌀이 현미예요. 쌀겨까지 깎아 내면 하얀 백미가 돼요.', rewardId: 'rice-breeder' },
    ],
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
    // 근거: 해양수산부·수협 김 양식 안내(가을에 그물을 내려 겨울에서 이듬해 봄까지 수확)
    extraQuizzes: [
      { q: '김은 주로 어느 때 바다에서 길러 거둘까요?', options: ['한여름', '가을부터 이듬해 봄까지', '장마철'], answer: 1, explain: '김은 찬 바다에서 잘 자라요. 가을에 그물을 내려 겨울부터 이듬해 봄까지 거둬요.', rewardId: 'laver-auctioneer' },
    ],
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
    // 근거: Britannica 'banana'(재배종은 씨가 없어 뿌리줄기의 새순으로 번식)
    extraQuizzes: [
      { q: '씨가 거의 없는 바나나는 어떻게 새 나무를 늘릴까요?', options: ['뿌리에서 돋은 새순을 옮겨 심어요', '씨앗을 뿌려요', '꽃가루를 날려요'], answer: 0, explain: '우리가 먹는 바나나는 씨가 없어서, 뿌리줄기에서 돋아난 새순을 떼어 옮겨 심어 길러요.', rewardId: 'banana-scientist' },
    ],
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
    // 근거: PET(폴리에틸렌 테레프탈레이트)는 플라스틱의 한 종류
    extraQuizzes: [
      { q: '페트병의 페트(PET)는 무엇의 이름일까요?', options: ['플라스틱의 한 종류', '유리의 한 종류', '종이의 한 종류'], answer: 0, explain: '페트는 플라스틱의 한 종류예요. 가볍고 투명해서 음료병에 많이 쓰여요.', rewardId: 'refinery-safety' },
    ],
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
    // 근거: Britannica 'rubber'(고무나무 껍질을 그어 흘러나오는 라텍스를 모은다)
    extraQuizzes: [
      { q: '천연고무는 고무나무의 무엇을 모아 만들까요?', options: ['줄기에서 흐르는 하얀 수액', '잎', '뿌리'], answer: 0, explain: '나무껍질에 얇게 홈을 내면 하얀 수액(라텍스)이 흘러나와요. 이걸 모아 굳힌 게 천연고무예요.', rewardId: 'latex-tester' },
    ],
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
    // 근거: Britannica 'integrated circuit'(실리콘 웨이퍼 위에 만든다)
    extraQuizzes: [
      { q: '반도체 칩의 바탕이 되는 원소는?', options: ['실리콘(규소)', '구리', '금'], answer: 0, explain: '모래 속 규소를 아주 깨끗하게 만든 실리콘 원판(웨이퍼) 위에 회로를 새겨요.', rewardId: 'litho-engineer' },
    ],
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
    // 근거: The Aluminum Association(알루미늄은 성질을 잃지 않고 거듭 재활용된다)
    extraQuizzes: [
      { q: '다 쓴 알루미늄 캔은 녹여서 몇 번까지 다시 쓸 수 있을까요?', options: ['한 번', '딱 열 번', '계속 되풀이해서'], answer: 2, explain: '알루미늄은 녹여도 성질이 거의 그대로라서 몇 번이고 다시 캔이 될 수 있어요.', rewardId: 'can-recycler' },
    ],
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
    // 근거: 종이컵 안쪽은 폴리에틸렌(PE) 막으로 코팅한다(환경부 일회용컵 분리배출 안내)
    extraQuizzes: [
      { q: '종이컵 안쪽이 물에 젖지 않는 까닭은?', options: ['얇은 플라스틱 막을 입혀서', '소금을 발라서', '유리를 녹여 발라서'], answer: 0, explain: '종이컵 안쪽에는 아주 얇은 플라스틱 막이 입혀져 있어서 물이 스며들지 않아요.', rewardId: 'forest-auditor' },
    ],
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
    // 근거: 농축 주스는 과즙에서 물을 증발시켜 만든다(식품의약품안전처 식품 유형 기준)
    extraQuizzes: [
      { q: '오렌지 주스 농축액은 과즙에서 무엇을 빼서 만들까요?', options: ['물', '설탕', '껍질 색'], answer: 0, explain: '과즙에서 물을 날려 보내 진하게 만든 뒤, 멀리 보낸 다음 다시 물을 섞어 주스로 만들어요.', rewardId: 'citrus-scientist' },
    ],
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
    // 근거: 표준국어대사전 '콩나물'
    extraQuizzes: [
      { q: '콩나물은 무엇을 길러 만든 걸까요?', options: ['콩을 물을 주며 싹 틔워서', '콩잎을 키워서', '콩꽃을 따서'], answer: 0, explain: '콩에 물만 주며 어두운 곳에서 싹을 틔우면 콩나물이 돼요.', rewardId: 'soy-breeder' },
    ],
  },
  {
    id: 'steel', name: '철강', aliases: ['강철', '철강', '자전거', '참치캔', '통조림', '숟가락', '냄비', '자동차', '프라이팬'],
    stages: ['iron-miner', 'hedland-port', 'bulk-crew', 'steel-mill', 'warehouse'],
    quiz: {
      q: '철광석을 녹여 쇳물을 만드는 거대한 설비는?',
      options: ['용광로', '원심분리기', '보일러'], answer: 0,
      explain: '용광로(고로)에 철광석과 석탄을 넣어 녹이면 쇳물이 나와요.',
      rewardId: 'scrap-worker',
    },
    // 근거: Britannica 'blast furnace'(철광석·코크스·석회석을 넣는다)
    extraQuizzes: [
      { q: '용광로에 철광석과 함께 넣어 불을 지피는 것은?', options: ['코크스(석탄을 구운 것)', '나무', '소금'], answer: 0, explain: '석탄을 구워 만든 코크스가 높은 열을 내고, 철광석에서 산소를 떼어 내 쇳물을 만들어요.', rewardId: 'scrap-worker' },
    ],
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
  {
    id: 'chili', name: '고춧가루', aliases: ['고춧가루', '고추', '김치', '고추장', '떡볶이', '짬뽕', '김치찌개', '라볶이', '김치볶음밥', '깍두기', '육개장'],
    stages: ['chili-farmer', 'chili-mill', 'qingdao-port', 'sea-crew', 'incheon-port', 'warehouse'],
    quiz: {
      q: '수입 고춧가루는 주로 어느 나라에서 올까요?',
      options: ['중국', '인도', '멕시코'], answer: 0,
      explain: '수입 고춧가루와 건고추는 대부분 가까운 중국에서 와요.',
      rewardId: 'chili-breeder',
    },
    // 근거: Britannica 'capsaicin'
    extraQuizzes: [
      { q: '고추의 매운맛을 내는 성분은?', options: ['캡사이신', '카페인', '카테킨'], answer: 0, explain: '고추의 매운맛은 캡사이신 때문이에요. 씨가 붙어 있는 하얀 부분에 특히 많아요.', rewardId: 'chili-breeder' },
    ],
  },
  {
    id: 'cabbage', name: '배추', aliases: ['배추', '김치', '김치찌개', '김치볶음밥', '겉절이', '보쌈김치', '배추전'],
    stages: ['cabbage-farmer', 'cabbage-trader', 'garak-auctioneer', 'kimchi-maker', 'warehouse'],
    quiz: {
      q: '더운 여름에 배추는 주로 어디에서 기를까요?',
      options: ['강원도 높은 산의 고랭지', '제주도 해안가', '도시의 비닐하우스'], answer: 0,
      explain: '배추는 더위에 약해서 여름에는 서늘한 강원도 고랭지 밭에서 길러요.',
      rewardId: 'kimchi-scientist',
    },
  },
  {
    id: 'glass', name: '유리', aliases: ['유리', '유리컵', '유리병', '맥주병', '소주병', '소주', '맥주', '안경', '거울', '창문', '향수'],
    stages: ['glass-furnace', 'glass-bottle', 'warehouse'],
    quiz: {
      q: '유리의 주원료는?',
      options: ['모래', '소금', '석유'], answer: 0,
      explain: '유리는 규사라고 부르는 고운 모래에 소다회와 석회석을 섞어 녹여 만들어요.',
      rewardId: 'glass-recycler',
    },
    // 근거: 환경부 재활용품 분리배출 안내(유리병은 색상별로 선별해 같은 색 유리로 재활용)
    extraQuizzes: [
      { q: '유리병을 재활용할 때 색깔별로 나누는 까닭은?', options: ['색이 섞이면 원하는 색의 새 유리를 만들기 어려워서', '무게가 달라서', '냄새가 달라서'], answer: 0, explain: '투명, 갈색, 초록 유리가 섞이면 새 유리의 색이 탁해져요. 그래서 색깔별로 나눠 다시 녹여요.', rewardId: 'glass-recycler' },
    ],
  },
  {
    id: 'wood', name: '목재', aliases: ['나무', '목재', '원목', '책상', '의자', '나무젓가락', '젓가락', '연필', '가구', '침대', '선반', '도마'],
    stages: ['nz-logger', 'tauranga-port', 'bulk-crew', 'incheon-port', 'sawmill', 'furniture-maker'],
    quiz: {
      q: '한국이 통나무(원목)를 가장 많이 수입하는 나라는?',
      options: ['뉴질랜드', '캐나다', '러시아'], answer: 0,
      explain: '한국에 들어오는 원목의 상당 부분은 뉴질랜드에서 키운 라디아타 소나무예요.',
      rewardId: 'nz-forester',
    },
  },
  {
    id: 'beef', name: '소고기', aliases: ['소고기', '쇠고기', '불고기', '햄버거', '스테이크', '육회', '갈비', '차돌박이', '규동', '소불고기', '버거'],
    stages: ['cattle-rancher', 'meatworks', 'sea-crew', 'busan-crane', 'warehouse'],
    quiz: {
      q: '넓은 초원에 소를 풀어 놓고 풀을 먹이며 키우는 방식은?',
      options: ['방목', '양식', '수경'], answer: 0,
      explain: '호주의 많은 목장은 넓은 초원에 소를 풀어 키우는 방목 방식이에요.',
      rewardId: 'beef-grader',
    },
  },
  {
    id: 'pork', name: '돼지고기', aliases: ['돼지고기', '삼겹살', '목살', '돈가스', '돈까스', '제육', '제육볶음', '소시지', '족발', '보쌈', '김치찌개', '탕수육', '순대국'],
    stages: ['pig-farmer', 'pork-plant', 'valencia-port', 'sea-crew', 'busan-crane', 'warehouse'],
    quiz: {
      q: '삼겹살은 돼지의 어느 부위일까요?',
      options: ['뱃살', '어깨', '다리'], answer: 0,
      explain: '삼겹살은 살과 지방이 세 겹으로 보이는 돼지의 뱃살 부위예요.',
      rewardId: 'butcher',
    },
  },
  {
    id: 'chicken', name: '닭고기', aliases: ['닭고기', '치킨', '닭가슴살', '닭갈비', '삼계탕', '닭강정', '찜닭', '후라이드', '양념치킨', '닭볶음탕', '치킨너겟'],
    stages: ['broiler-farmer', 'chicken-plant', 'warehouse', 'chicken-shop'],
    quiz: {
      q: '치킨용 닭은 병아리 때부터 얼마나 키울까요?',
      options: ['한 달 남짓', '반년', '2년'], answer: 0,
      explain: '고기용 닭(육계)은 보통 한 달 남짓 키워서 출하해요.',
      rewardId: 'poultry-officer',
    },
  },
  {
    id: 'egg', name: '달걀', aliases: ['달걀', '계란', '계란말이', '계란후라이', '오므라이스', '마요네즈', '카스테라', '에그타르트', '계란빵', '토스트'],
    stages: ['egg-farmer', 'egg-gp', 'warehouse'],
    quiz: {
      q: '달걀 껍데기에 찍힌 번호의 마지막 숫자는 무엇을 알려 줄까요?',
      options: ['닭을 키운 환경', '닭의 나이', '달걀의 무게'], answer: 0,
      explain: '마지막 숫자는 사육 환경이에요. 1은 방사, 2는 평사, 3·4는 케이지 사육이에요.',
      rewardId: 'egg-inspector',
    },
    // 근거: 달걀 껍데기 색은 닭의 품종에 따라 정해진다(농촌진흥청 축산 정보)
    extraQuizzes: [
      { q: '달걀 껍데기 색은 무엇에 따라 달라질까요?', options: ['닭의 품종', '먹이의 양', '낳은 시간'], answer: 0, explain: '껍데기가 흰지 갈색인지는 닭의 품종에 따라 정해져요. 영양 차이와는 상관없어요.', rewardId: 'egg-inspector' },
    ],
  },
  {
    id: 'corn', name: '옥수수', aliases: ['옥수수', '팝콘', '물엿', '시리얼', '콘칩', '콘플레이크', '콘버터', '옥수수수염차', '나초'],
    stages: ['corn-farmer', 'barge-crew', 'nola-port', 'bulk-crew', 'starch-plant', 'warehouse'],
    quiz: {
      q: '미국 중서부의 옥수수가 바다로 나가려고 따라 내려가는 강은?',
      options: ['미시시피강', '아마존강', '라인강'], answer: 0,
      explain: '중서부 곡물은 미시시피강 바지선을 타고 멕시코만의 항구까지 내려가요.',
      rewardId: 'grain-trader',
    },
    // 근거: Britannica 'popcorn'(알갱이 속 수분이 수증기가 되며 껍질이 터진다)
    extraQuizzes: [
      { q: '팝콘 알갱이가 터지는 까닭은?', options: ['속에 든 물이 수증기가 되어 껍질을 터뜨려서', '공기를 불어 넣어서', '기름이 끓어 넘쳐서'], answer: 0, explain: '단단한 껍질 속 물기가 뜨거워지면 수증기가 되어 부풀다가, 껍질을 뚫고 터져 나와요.', rewardId: 'grain-trader' },
    ],
  },
  {
    id: 'shrimp', name: '새우', aliases: ['새우', '새우깡', '새우튀김', '감바스', '새우버거', '칵테일새우', '쉬림프', '새우볶음밥'],
    stages: ['shrimp-farmer', 'shrimp-processor', 'vn-port', 'sea-crew', 'busan-crane', 'warehouse'],
    quiz: {
      q: '베트남에서 새우 양식이 활발한, 큰 강이 바다와 만나는 지역은?',
      options: ['메콩강 삼각주', '나일강 삼각주', '양쯔강 상류'], answer: 0,
      explain: '베트남 남부 메콩강 삼각주는 강물과 바닷물이 섞여 새우를 키우기 좋아요.',
      rewardId: 'water-keeper',
    },
  },
  {
    id: 'tea', name: '녹차', aliases: ['녹차', '말차', '녹차라떼', '티백', '말차라떼', '녹차아이스크림'],
    stages: ['tea-farmer', 'tea-roaster', 'warehouse'],
    quiz: {
      q: '찻잎을 뜨거운 솥에 넣고 볶듯이 뒤적이는 일을 뭐라고 할까요?',
      options: ['덖음', '숙성', '훈연'], answer: 0,
      explain: '덖음은 찻잎을 솥에서 볶아 풀내를 없애고 향을 살리는 과정이에요.',
      rewardId: 'tea-taster',
    },
    // 근거: Britannica 'tea'(녹차·홍차 모두 차나무 잎, 산화 여부로 갈린다)
    extraQuizzes: [
      { q: '녹차와 홍차는 같은 차나무 잎으로 만들 수 있을까요?', options: ['네, 만드는 방법이 달라요', '아니요, 다른 나무예요', '홍차는 꽃잎으로 만들어요'], answer: 0, explain: '같은 차나무 잎이라도 바로 덖으면 녹차, 잎을 산화시키면 홍차가 돼요.', rewardId: 'tea-taster' },
    ],
  },
  // ── 아래 10개 재료의 사실 근거는 people.ts의 같은 재료 주석에 있다. 수입 경로의 항구·배 종류는 확인하지 못해 넣지 않았다. ──
  {
    id: 'red-bean', name: '팥', aliases: ['팥', '단팥', '팥앙금', '팥빙수', '단팥빵', '붕어빵', '팥죽', '양갱', '시루떡'],
    stages: ['redbean-farmer', 'anko-maker', 'warehouse'],
    // 실제 공급은 중국산이 약 3/4(2023년 국내 약 6천 톤, 중국산 수입 약 2만 톤). 가중치는 게임용
    originHead: 1,
    origins: [
      { id: 'kr', name: '국산', weight: 1, head: ['redbean-farmer'] },
      { id: 'cn', name: '중국', weight: 1, head: ['cn-redbean-farmer'] },
    ],
    // 근거: 농촌진흥청 RDA 인테러뱅 91호(2012)
    quiz: {
      q: '팥 꼬투리 하나에는 보통 씨앗이 몇 알쯤 들어 있을까요?',
      options: ['1~3알', '6~10알', '20알 넘게'], answer: 1,
      explain: '콩 꼬투리에는 1~3알이 들지만, 팥 꼬투리에는 6~10알이 들어 있어요.',
      rewardId: 'redbean-breeder',
    },
  },
  {
    id: 'buckwheat', name: '메밀', aliases: ['메밀', '모밀', '메밀국수', '막국수', '소바', '메밀묵', '메밀전', '메밀차', '메밀가루'],
    stages: ['jeju-buckwheat-farmer', 'noodle-maker', 'warehouse'],
    // 실제 공급은 2023년 국내 2,975톤, 수입 중국 1,236톤·미국 739톤. 가중치는 게임용
    originHead: 1,
    origins: [
      { id: 'kr', name: '제주', weight: 1, head: ['jeju-buckwheat-farmer'] },
      { id: 'cn', name: '중국', weight: 1, head: ['cn-buckwheat-farmer'] },
      { id: 'us', name: '미국', weight: 1, head: ['us-buckwheat-farmer'] },
    ],
    // 근거: 제주특별자치도「제3차 제주메밀 산업 육성 기본계획」(2025, KOSIS 2023)
    quiz: {
      q: '우리나라에서 메밀을 가장 많이 기르는 곳은 어디일까요?',
      options: ['강원도', '제주도', '경기도'], answer: 1,
      explain: '2023년 전국 메밀 재배면적의 62%, 생산량의 57%가 제주에서 나왔어요. 제주는 봄과 가을, 두 번 메밀을 길러요.',
      rewardId: 'buckwheat-researcher',
    },
  },
  {
    id: 'potato', name: '감자', aliases: ['감자', '감자칩', '포테이토칩', '감자튀김', '프렌치프라이', '감자전', '감자탕', '알감자', '해시브라운'],
    stages: ['potato-farmer', 'potato-storage', 'garak-auctioneer', 'warehouse'],
    // 실제 공급은 국내 생산 약 52만 톤, 미국산 수입 연 12만 톤 안팎. 가중치는 게임용
    originHead: 3,
    origins: [
      { id: 'kr', name: '국산', weight: 1, head: ['potato-farmer', 'potato-storage', 'garak-auctioneer'] },
      { id: 'us', name: '미국', weight: 1, head: ['us-fries-plant'] },
    ],
    // 근거: 국립국어원「새국어생활」19-3(2009), 표준국어대사전 '감자'·'고구마'
    quiz: {
      q: '우리가 먹는 감자는 식물의 어느 부분일까요?',
      options: ['땅속 줄기가 굵어진 덩이줄기', '뿌리가 굵어진 덩이뿌리', '열매'], answer: 0,
      explain: '감자는 땅속 줄기가 굵어진 덩이줄기예요. 고구마는 뿌리가 굵어진 덩이뿌리라서 둘은 서로 다른 부분이에요.',
      rewardId: 'seed-potato-researcher',
    },
  },
  {
    id: 'sweet-potato', name: '고구마', aliases: ['고구마', '군고구마', '고구마칩', '고구마라떼', '고구마맛탕', '맛탕', '고구마말랭이', '찐고구마'],
    stages: ['sweetpotato-farmer', 'curing-worker', 'garak-auctioneer', 'warehouse'],
    // 근거: 농촌진흥청「고구마 수확 후 관리기술」
    quiz: {
      q: '고구마를 캔 뒤 따뜻하고 습한 곳에 며칠 두는 큐어링은 왜 할까요?',
      options: ['상처를 아물게 해 썩지 않게 하려고', '껍질 색을 진하게 하려고', '싹을 빨리 틔우려고'], answer: 0,
      explain: '캘 때 생긴 상처로 병균이 들어가면 썩어요. 그래서 30~33℃, 습도 90~95%에서 나흘쯤 두어 상처를 아물게 해요.',
      rewardId: 'sweetpotato-seedling',
    },
  },
  {
    id: 'radish', name: '무', aliases: ['무', '단무지', '깍두기', '무생채', '동치미', '총각김치', '무말랭이', '무국', '뭇국'],
    stages: ['radish-farmer', 'warehouse'],
    // 실제로는 가을무가 생산의 약 54%(KREI 2016). 가중치는 게임용
    originHead: 1,
    origins: [
      { id: 'autumn', name: '가을무', weight: 1, head: ['radish-farmer'] },
      { id: 'highland', name: '고랭지무', weight: 1, head: ['highland-radish-farmer', 'garak-auctioneer'] },
      { id: 'jeju', name: '제주 월동무', weight: 1, head: ['jeju-radish-farmer'] },
    ],
    // 근거: KREI 현안분석 제11호(2016, 7월 고랭지로 산지 교체·10월 가을무로 교체), 농업인신문 2023-08-04(평창 진부·정선 임계 등)
    quiz: {
      q: '한여름(8~9월)에 나오는 무는 주로 어디에서 자랄까요?',
      options: ['강원 고랭지', '제주', '전남 바닷가'], answer: 0,
      explain: '여름에는 서늘한 강원 높은 밭(평창 진부, 정선 임계 등)에서 기른 무가 나와요. 10월부터는 가을무, 12월부터는 제주 월동무가 나와요.',
      rewardId: 'radish-stockpile',
    },
  },
  {
    id: 'apple', name: '사과', aliases: ['사과', '사과주스', '애플파이', '사과잼', '사과즙', '풋사과', '부사', '홍로'],
    stages: ['apple-farmer', 'apple-apc', 'ca-storage', 'garak-auctioneer', 'warehouse'],
    // 실제 재배면적은 영남 23,422ha, 강원 1,748ha(2024). 가중치는 게임용
    originHead: 1,
    origins: [
      { id: 'yn', name: '경상도', weight: 1, head: ['apple-farmer'] },
      { id: 'gw', name: '강원', weight: 1, head: ['gw-apple-farmer'] },
    ],
    // 근거: 농림축산식품부 설명자료 2024-03-15(수입을 요청한 11개국 모두 허용 전), 식물방역법(생과실 원칙적 수입 금지)
    quiz: {
      q: '우리나라 가게에서 파는 생사과는 대부분 어디서 왔을까요?',
      options: ['국내 과수원', '미국', '뉴질랜드'], answer: 0,
      explain: '생과일은 병해충이 함께 들어올 수 있어 원칙적으로 수입을 막고, 위험 분석을 마친 나라에서만 들여와요. 2024년 기준 생사과 수입이 허용된 나라는 없어요.',
      rewardId: 'apple-quarantine',
    },
  },
  {
    id: 'grape', name: '포도', aliases: ['포도', '청포도', '샤인머스캣', '거봉', '캠벨', '캠벨얼리', '건포도', '포도주스', '와인', '포도주'],
    stages: ['grape-farmer', 'garak-auctioneer', 'warehouse'],
    // 실제로는 국내 생산(약 19만 9천 톤)이 칠레산 수입(약 1만 3천 톤)보다 훨씬 많다. 가중치는 게임용
    originHead: 2,
    origins: [
      { id: 'kr', name: '국산', weight: 1, head: ['grape-farmer', 'garak-auctioneer'] },
      { id: 'cl', name: '칠레', weight: 1, head: ['cl-grape-farmer'] },
    ],
    // 근거: 시마네현 농업기술센터·오카야마현 자료(1988년 교배, 2006년 품종 등록)
    quiz: {
      q: '샤인머스캣 품종을 처음 만든 나라는 어디일까요?',
      options: ['일본', '한국', '칠레'], answer: 0,
      explain: '샤인머스캣은 일본 과수연구소가 1988년에 교배해 2006년에 품종으로 등록했어요. 지금은 우리 포도밭의 절반 가까이에서 길러요.',
      rewardId: 'grape-breeder',
    },
  },
  {
    id: 'tomato', name: '토마토', aliases: ['토마토', '방울토마토', '대추방울토마토', '케첩', '케찹', '토마토소스', '토마토주스', '토마토파스타'],
    stages: ['tomato-farmer', 'garak-auctioneer', 'warehouse'],
    // 가중치는 게임용
    originHead: 2,
    origins: [
      { id: 'kr', name: '국산', weight: 1, head: ['tomato-farmer', 'garak-auctioneer'] },
      { id: 'cn', name: '중국 페이스트', weight: 1, head: ['cn-tomato-paste', 'ketchup-maker'] },
    ],
    // 근거: KREI「농업전망 2025」표7-27(관세청 인용)
    quiz: {
      q: '케첩을 만드는 토마토 페이스트, 우리나라에 가장 많이 들어오는 나라는?',
      options: ['중국', '이탈리아', '칠레'], answer: 0,
      explain: '2024년 수입한 토마토 페이스트의 약 62%가 중국산이고, 그다음이 미국산(약 24%)이에요.',
      rewardId: 'crop-forecaster',
    },
  },
  {
    id: 'barley', name: '보리', aliases: ['보리', '보리차', '보리밥', '보리쌀', '맥아', '엿기름', '맥주'],
    stages: ['barley-farmer', 'warehouse'],
    // 가중치는 게임용
    originHead: 1,
    origins: [
      { id: 'kr', name: '국산 보리', weight: 1, head: ['barley-farmer'] },
      { id: 'au', name: '호주 맥아', weight: 1, head: ['au-malt'] },
    ],
    // 근거: 농사로 일반보리 농작업일정, 한국민족문화대백과「보리」
    quiz: {
      q: '보리는 보통 언제 심어서 언제 거둘까요?',
      options: ['봄에 심어 가을에 거둬요', '가을에 심어 이듬해 초여름에 거둬요', '여름에 심어 겨울에 거둬요'], answer: 1,
      explain: '보리는 10월쯤 씨를 뿌려 겨울을 나고, 5월 말~6월에 거둬요.',
      rewardId: 'barley-researcher',
    },
  },
  {
    id: 'squid', name: '오징어', aliases: ['오징어', '오징어채', '진미채', '오징어볶음', '마른오징어', '오징어순대', '오징어젓'],
    stages: ['distant-squid-fisher', 'warehouse'],
    // 실제 어획은 2024년 원양 63,156톤, 연근해 13,545톤. 수입 오징어는 근거 확인이 부족해 넣지 않았다. 가중치는 게임용
    originHead: 1,
    origins: [
      { id: 'dw', name: '원양', weight: 1, head: ['distant-squid-fisher'] },
      { id: 'ul', name: '울릉도', weight: 1, head: ['ulleung-squid-fisher', 'squid-dryer'] },
    ],
    // 근거: 한국민족문화대백과「울릉도 오징어」(추광성, 집어등)
    quiz: {
      q: '오징어잡이 배가 밤바다에 환한 불(집어등)을 켜는 까닭은?',
      options: ['다른 배와 부딪히지 않으려고', '오징어가 빛을 따라 모여들어서', '그물을 말리려고'], answer: 1,
      explain: '오징어는 빛을 따라 모여드는 성질이 있어요. 그래서 밤에 집어등을 켜고 오징어를 모아 잡아요.',
      rewardId: 'squid-researcher',
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
  { id: 'kimchi', name: '배추김치', aliases: ['김치', '배추김치', '포기김치'], materialIds: ['cabbage', 'chili'] },
  { id: 'kimchi-stew', name: '김치찌개', aliases: ['김치찌개'], materialIds: ['cabbage', 'chili', 'pork'] },
  { id: 'fried-chicken', name: '후라이드 치킨', aliases: ['치킨', '후라이드', '후라이드치킨'], materialIds: ['chicken', 'wheat', 'soybean'] },
  { id: 'samgyeopsal', name: '삼겹살', aliases: ['삼겹살'], materialIds: ['pork'] },
  { id: 'burger', name: '햄버거', aliases: ['햄버거', '버거'], materialIds: ['beef', 'wheat', 'egg'] },
  { id: 'shrimp-snack', name: '새우 과자', aliases: ['새우깡', '새우과자'], materialIds: ['shrimp', 'wheat', 'palm-oil'] },
  { id: 'popcorn', name: '팝콘', aliases: ['팝콘'], materialIds: ['corn', 'palm-oil', 'pulp'] },
  { id: 'desk', name: '나무 책상', aliases: ['책상', '나무책상'], materialIds: ['wood', 'steel'] },
  { id: 'chopsticks', name: '나무젓가락', aliases: ['나무젓가락'], materialIds: ['wood'] },
  { id: 'soju', name: '소주 한 병', aliases: ['소주'], materialIds: ['glass'] },
  { id: 'green-tea', name: '녹차', aliases: ['녹차', '녹차티백'], materialIds: ['tea', 'pulp'] },
  { id: 'omurice', name: '오므라이스', aliases: ['오므라이스'], materialIds: ['egg', 'rice'] },
  { id: 'bungeoppang', name: '붕어빵', aliases: ['붕어빵', '잉어빵'], materialIds: ['red-bean', 'wheat', 'sugar'] },
  { id: 'makguksu', name: '막국수', aliases: ['막국수', '메밀국수'], materialIds: ['buckwheat', 'radish', 'chili'] },
  { id: 'potato-chips', name: '감자칩', aliases: ['감자칩', '포테이토칩'], materialIds: ['potato', 'palm-oil', 'plastic'] },
  { id: 'roast-sweet-potato', name: '군고구마', aliases: ['군고구마'], materialIds: ['sweet-potato'] },
  { id: 'kkakdugi', name: '깍두기', aliases: ['깍두기'], materialIds: ['radish', 'chili'] },
  { id: 'apple', name: '사과', aliases: ['사과'], materialIds: ['apple'] },
  { id: 'grape', name: '포도', aliases: ['포도', '샤인머스캣'], materialIds: ['grape'] },
  { id: 'ketchup', name: '케첩', aliases: ['케첩', '케찹'], materialIds: ['tomato', 'sugar', 'plastic'] },
  { id: 'barley-tea', name: '보리차', aliases: ['보리차'], materialIds: ['barley', 'plastic'] },
  { id: 'soba', name: '메밀소바', aliases: ['소바', '메밀소바', '판메밀'], materialIds: ['buckwheat', 'radish'] },
  { id: 'beer', name: '캔맥주', aliases: ['캔맥주', '맥주'], materialIds: ['barley', 'aluminum'] },
  { id: 'squid-stir-fry', name: '오징어볶음', aliases: ['오징어볶음'], materialIds: ['squid', 'chili', 'cabbage'] },
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
  { personId: 'incheon-port', cardId: 'link-incheon-port' },
  { personId: 'garak-auctioneer', cardId: 'link-garak' },
]

export const SETS: CardSet[] = [
  {
    id: 'set-sea', name: '바다를 건넌 사람들', desc: '바다 위에서 일하는 사람 다섯 명을 모두 만나 보세요.',
    memberIds: ['sea-crew', 'bulk-crew', 'tanker-crew', 'reefer-crew', 'tuna-fisher'], rewardId: 'harbor-pilot',
  },
  {
    id: 'set-soil', name: '땅을 일구는 사람들', desc: '세계 곳곳의 농부 열 명을 모두 만나 보세요.',
    memberIds: ['coffee-picker', 'cacao-farmer', 'wheat-farmer', 'rice-farmer', 'cotton-farmer', 'banana-farmer', 'soy-farmer', 'orange-picker', 'cabbage-farmer', 'tea-farmer'],
    rewardId: 'seed-vault',
  },
  {
    id: 'set-underground', name: '땅속에서 온 것들', desc: '광물을 캐는 사람 다섯 명을 모두 만나 보세요.',
    memberIds: ['oil-worker', 'cobalt-miner', 'lithium-miner', 'bauxite-miner', 'iron-miner'], rewardId: 'mine-rescue',
  },
  {
    id: 'set-table', name: '오늘의 밥상', desc: '밥상에 오르는 것들을 키우는 사람 다섯 명을 만나 보세요.',
    memberIds: ['cattle-rancher', 'pig-farmer', 'broiler-farmer', 'egg-farmer', 'shrimp-farmer'], rewardId: 'table-setter',
  },
  {
    id: 'set-factory', name: '공장의 손', desc: '물건을 만드는 공장 사람 여섯 명을 모두 만나 보세요.',
    memberIds: ['vn-factory', 'garment-sewer', 'fab-engineer', 'injection', 'cannery', 'can-factory'], rewardId: 'safety-inspector',
  },
]
