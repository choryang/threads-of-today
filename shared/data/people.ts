import type { Hat, Person, Prop, Rarity } from '../types'

function p(
  id: string,
  job: string,
  placeId: string,
  story: string,
  hat: Hat,
  prop: Prop,
  rarity: Rarity = 'common',
  kind: Person['kind'] = 'stage',
): Person {
  return { id, job, placeId, story, look: { hat, prop }, rarity, kind }
}

const list: Person[] = [
  // ── 여러 여정이 함께 지나가는 사람들 (연결의 중심) ──
  p('sea-crew', '컨테이너선 선원', 'sea', '수천 개의 컨테이너를 싣고 몇 주씩 바다를 건너요. 오늘 내 물건도 이 배의 어느 칸에 있었을 거예요.', 'beanie', 'anchor'),
  p('bulk-crew', '벌크선 선원', 'sea', '곡물이나 광석처럼 포장하지 않은 화물을 배 안 거대한 화물칸에 통째로 싣고 바다를 건너요.', 'beanie', 'anchor'),
  p('tanker-crew', '탱커선 선원', 'sea', '원유나 기름 같은 액체 화물을 탱크에 가득 싣고 항해해요.', 'beanie', 'drop'),
  p('reefer-crew', '냉동 운반선 선원', 'sea', '얼린 수산물이 녹지 않도록 영하의 화물칸을 지키며 바다를 건너요.', 'beanie', 'fish'),
  p('busan-crane', '부산항 크레인 기사', 'kr-busan', '높은 조종석에서 배 위의 컨테이너를 하나씩 들어 땅에 내려놓아요.', 'safetyHelmet', 'crane'),
  p('air-cargo', '항공화물 조업원', 'kr-incheon', '비행기에서 내린 화물을 빠르게 분류해 다음 차량으로 보내요. 신선한 것일수록 시간 싸움이에요.', 'headset', 'box'),
  p('warehouse', '물류센터 작업자', 'kr-gyeonggi', '전국으로 갈 상자를 고르고 나눠 담아요. 내가 산 물건이 마지막으로 거치는 창고예요.', 'cap', 'box'),
  p('courier', '택배 기사', 'kr-seoul', '하루에도 수백 개의 상자를 들고 계단을 오르내리며 문 앞까지 가져다줘요.', 'cap', 'box'),
  p('vn-factory', '베트남 공장 노동자', 'vn', '긴 생산 라인에서 부품을 조립하거나 원단을 재봉해요. 휴대폰도, 운동화도 이곳을 거쳐 와요.', 'cap', 'gear'),
  p('cn-refinery', '광물 정련 공장 기술자', 'cn', '광석에서 배터리에 쓸 만큼 순도 높은 금속을 뽑아내요.', 'helmet', 'flask'),
  p('kr-battery', '배터리 공장 엔지니어', 'kr-chungbuk', '정련된 금속을 배터리 소재와 셀로 만들어요.', 'hood', 'chip'),
  p('santos-port', '산투스 항만 노동자', 'br-santos', '브라질 내륙에서 기차와 트럭으로 온 화물을 배에 싣는 남미 최대급 항구에서 일해요.', 'safetyHelmet', 'box'),

  // ── 커피 ──
  p('coffee-picker', '커피 체리 수확자', 'et-sidama', '커피 열매는 체리처럼 붉게 익어요. 익는 속도가 제각각이라 잘 익은 것만 골라 손으로 따요.', 'scarf', 'cherry'),
  p('washing-station', '워싱 스테이션 작업자', 'et-sidama', '체리 과육을 벗겨 물에 발효시키고 씻은 뒤, 햇볕에 말려 생두를 얻어요.', 'cap', 'basket'),
  p('djibouti-docker', '지부티 항만 노동자', 'dj', '에티오피아는 바다가 없는 나라라서 커피는 이웃 나라 지부티 항구를 통해 세계로 나가요.', 'safetyHelmet', 'box'),
  p('roaster', '커피 로스터', 'kr-seoul', '초록빛 생두를 볶아 우리가 아는 갈색 원두와 향을 만들어요.', 'cap', 'cup'),
  p('cupper', '커피 감별사', 'et-addis', '원두를 갈아 물을 붓고 향과 맛을 비교하는 커핑으로 커피의 등급을 매겨요.', 'none', 'cup', 'rare', 'quiz'),

  // ── 카카오 ──
  p('cacao-farmer', '카카오 농부', 'ci', '나무줄기에 달린 카카오 꼬투리를 따서 갈라 하얀 과육에 싸인 콩을 꺼내요.', 'straw', 'pod'),
  p('cacao-dryer', '카카오 발효·건조 담당', 'ci', '콩을 바나나 잎으로 덮어 며칠 발효시킨 뒤 햇볕에 말려요. 초콜릿 맛은 여기서 시작돼요.', 'scarf', 'leaf'),
  p('abidjan-docker', '아비장 항만 노동자', 'ci-abidjan', '마른 카카오콩 자루를 컨테이너에 실어 유럽과 아시아로 보내요.', 'safetyHelmet', 'box'),
  p('cocoa-grinder', '코코아 가공 공장 작업자', 'nl-amsterdam', '카카오콩을 볶고 갈아 코코아 매스와 코코아버터로 나눠요. 네덜란드는 카카오를 가장 많이 가공하는 나라 중 하나예요.', 'chef', 'gear'),
  p('cacao-grader', '카카오 품질 검사원', 'ci', '콩을 반으로 잘라 속 색깔로 발효가 잘 됐는지 확인해요.', 'none', 'magnifier', 'rare', 'quiz'),

  // ── 설탕 ──
  p('cane-harvester', '사탕수수 수확기 운전사', 'au-qld', '호주의 사탕수수밭은 대부분 커다란 수확기로 거둬들여요.', 'cap', 'leaf'),
  p('raw-sugar-mill', '원당 공장 작업자', 'au-qld', '사탕수수 즙을 짜서 끓이고 졸여 갈색 결정인 원당을 만들어요.', 'helmet', 'gear'),
  p('sugar-refinery', '제당 공장 작업자', 'kr-ulsan', '수입한 원당을 녹여 불순물을 걸러 내고 다시 결정으로 만들어 하얀 설탕을 얻어요.', 'chef', 'flask'),
  p('sugar-qc', '제당 공장 품질관리원', 'kr-ulsan', '설탕 결정의 크기와 색, 순도를 매일 검사해요.', 'hood', 'clipboard', 'rare', 'quiz'),

  // ── 밀 ──
  p('wheat-farmer', '밀 농부', 'us-plains', '끝없는 밀밭을 콤바인으로 한 번에 베고 탈곡해요.', 'cap', 'wheat'),
  p('grain-elevator', '곡물 저장소 관리인', 'us-plains', '수확한 밀을 거대한 저장탑에 모으고 품질별로 나눠 보관해요.', 'cap', 'clipboard'),
  p('pnw-port', '곡물 수출항 작업자', 'us-pnw', '기차에 실려 온 밀을 아시아로 갈 배에 옮겨 담아요.', 'safetyHelmet', 'wheat'),
  p('flour-mill', '제분소 작업자', 'kr-gyeonggi', '밀알을 곱게 갈고 체에 쳐서 밀가루를 만들어요.', 'chef', 'wheat'),
  p('grain-inspector', '곡물 검정관', 'us-pnw', '배에 싣기 전 밀의 수분과 단백질, 이물질을 검사해 등급을 매겨요.', 'none', 'magnifier', 'rare', 'quiz'),

  // ── 팜유 ──
  p('palm-harvester', '기름야자 수확자', 'id', '긴 장대 끝의 낫으로 높이 달린 열매 송이를 잘라 내요.', 'straw', 'leaf'),
  p('palm-mill', '팜유 착유 공장 작업자', 'id', '열매를 쪄서 부드럽게 만든 뒤 눌러 기름을 짜내요.', 'helmet', 'drop'),
  p('oil-food-plant', '식용유지 공장 작업자', 'kr-gyeonggi', '팜유를 정제해 라면을 튀기거나 과자를 만드는 기름으로 만들어요.', 'chef', 'drop'),
  p('palm-smallholder', '소규모 기름야자 농가', 'id', '인도네시아 기름야자밭의 상당수는 가족 단위 소농이 일궈요.', 'straw', 'seed', 'rare', 'quiz'),

  // ── 쌀 ──
  p('rice-farmer', '벼농사 농부', 'kr-jeonbuk', '봄에 모를 심고 여름 내내 물을 대서 가을에 벼를 거둬요.', 'straw', 'wheat'),
  p('rice-mill', '미곡종합처리장 작업자', 'kr-jeonbuk', '벼를 말리고 껍질을 벗기는 도정을 거쳐 하얀 쌀로 만들어요.', 'cap', 'gear'),
  p('rice-breeder', '벼 품종 연구원', 'kr-jeonbuk', '더 맛있고 병에 강한 벼를 만들려고 여러 해에 걸쳐 품종을 교배해요.', 'none', 'seed', 'rare', 'quiz'),

  // ── 김 ──
  p('laver-farmer', '김 양식 어민', 'kr-jeonnam', '추운 겨울 바다에 김발을 띄워 김을 키우고 배를 타고 나가 거둬요.', 'beanie', 'leaf'),
  p('laver-processor', '마른김 가공장 작업자', 'kr-jeonnam', '거둔 김을 씻어 잘게 썰고 발 위에 얇게 떠서 말려요.', 'chef', 'leaf'),
  p('laver-auctioneer', '수산물 위판장 경매사', 'kr-jeonnam', '새벽 위판장에서 그날 거둔 물김의 값을 경매로 정해요.', 'cap', 'clipboard', 'rare', 'quiz'),

  // ── 참치 ──
  p('tuna-fisher', '원양어선 선원', 'pacific', '집을 떠나 몇 달씩 태평양에서 참치 떼를 쫓아요.', 'beanie', 'fish'),
  p('cannery', '통조림 공장 작업자', 'kr-gyeongnam', '참치를 찌고 살을 발라 기름과 함께 캔에 담아 밀봉해요.', 'chef', 'fish'),
  p('fishery-observer', '조업 감시원', 'pacific', '어선에 함께 타서 무엇을 얼마나 잡았는지 기록해 바다 자원을 지켜요.', 'cap', 'clipboard', 'rare', 'quiz'),

  // ── 연어 ──
  p('salmon-farmer', '연어 양식장 직원', 'no', '피오르의 차가운 바닷물에 띄운 가두리에서 연어를 키워요.', 'beanie', 'fish'),
  p('salmon-processor', '연어 가공장 작업자', 'no', '연어를 손질해 얼음과 함께 상자에 담아요.', 'chef', 'fish'),
  p('oslo-air', '오슬로 공항 화물 담당', 'no-oslo', '신선한 연어 상자를 아시아로 가는 화물기에 실어요.', 'headset', 'box'),
  p('fish-vet', '양식장 수의사', 'no', '가두리 속 물고기들이 병에 걸리지 않았는지 살펴요.', 'none', 'flask', 'rare', 'quiz'),

  // ── 바나나 ──
  p('banana-farmer', '바나나 농부', 'ph-mindanao', '바나나 송이에 비닐을 씌워 보호하고, 초록색일 때 통째로 베어 거둬요.', 'straw', 'banana'),
  p('banana-packer', '바나나 포장 작업자', 'ph-mindanao', '송이를 씻고 작게 나눠 상자에 담아요. 멍이 들지 않게 조심조심.', 'scarf', 'box'),
  p('davao-port', '다바오 항만 노동자', 'ph-davao', '바나나 상자를 차갑게 유지되는 냉장 컨테이너에 실어요.', 'safetyHelmet', 'box'),
  p('ripening', '바나나 숙성실 관리자', 'kr-gyeonggi', '초록색으로 도착한 바나나에 에틸렌 가스를 써서 노랗게 익혀요.', 'cap', 'banana'),
  p('banana-scientist', '바나나 병해 연구원', 'ph-mindanao', '바나나를 말려 죽이는 곰팡이병을 막는 방법을 연구해요.', 'none', 'flask', 'rare', 'quiz'),

  // ── 면 ──
  p('cotton-farmer', '목화 농부', 'in-gujarat', '하얗게 터진 목화솜을 따서 모아요.', 'scarf', 'leaf'),
  p('cotton-gin', '조면 공장 작업자', 'in-gujarat', '목화솜에서 씨를 빼내고 솜을 꾹꾹 눌러 커다란 덩어리로 묶어요.', 'cap', 'gear'),
  p('spinner', '방적 공장 작업자', 'in', '솜을 길게 늘이고 꼬아서 실을 만들어요.', 'scarf', 'spool'),
  p('garment-sewer', '봉제 공장 재봉사', 'bd-dhaka', '재단된 원단을 재봉틀로 이어 티셔츠 한 장을 완성해요. 방글라데시는 손꼽히는 의류 수출국이에요.', 'scarf', 'spool'),
  p('chittagong-port', '치타공 항만 노동자', 'bd-chittagong', '완성된 옷 상자를 컨테이너에 실어 세계로 보내요.', 'safetyHelmet', 'box'),
  p('cotton-classer', '면화 등급 감정사', 'in-gujarat', '솜의 길이와 색, 섬세함을 살펴 등급을 매겨요.', 'none', 'magnifier', 'rare', 'quiz'),

  // ── 폴리에스터 ──
  p('poly-fiber', '합성섬유 공장 작업자', 'cn-zhejiang', '석유에서 나온 원료를 녹여 가는 실로 뽑아내요.', 'hood', 'spool'),
  p('vn-port', '호찌민 항만 노동자', 'vn-hcm', '베트남 공장에서 만든 옷과 신발을 컨테이너에 실어요.', 'safetyHelmet', 'box'),
  p('pet-sorter', '페트병 재활용 선별원', 'kr-gyeonggi', '투명 페트병을 골라내요. 깨끗한 페트는 다시 실이 되어 옷이 돼요.', 'cap', 'recycle', 'rare', 'quiz'),

  // ── 플라스틱(석유) ──
  p('oil-worker', '유전 기술자', 'sa', '땅속 깊은 곳의 원유를 뽑아 올리는 설비를 관리해요.', 'helmet', 'drop'),
  p('ulsan-refinery', '정유 공장 운전원', 'kr-ulsan', '원유를 가열해 휘발유, 경유, 나프타 같은 성분으로 나눠요.', 'helmet', 'gear'),
  p('yeosu-chem', '석유화학 공장 운전원', 'kr-yeosu', '나프타를 잘게 분해해 플라스틱의 원료를 만들어요.', 'helmet', 'flask'),
  p('injection', '사출 공장 작업자', 'kr-gyeonggi', '플라스틱 알갱이를 녹여 틀에 부어 컵이나 포장재 모양으로 굳혀요.', 'cap', 'gear'),
  p('refinery-safety', '정유 공장 안전관리자', 'kr-ulsan', '거대한 설비가 사고 없이 돌아가도록 매일 점검해요.', 'safetyHelmet', 'clipboard', 'rare', 'quiz'),

  // ── 천연고무 ──
  p('rubber-tapper', '고무나무 수액 채취자', 'th-south', '동트기 전 나무껍질에 비스듬히 홈을 내고 흘러나오는 하얀 라텍스를 모아요.', 'scarf', 'drop'),
  p('rubber-processor', '고무 가공 공장 작업자', 'th-south', '라텍스를 굳혀 판이나 블록 모양의 고무로 만들어요.', 'cap', 'gear'),
  p('laemchabang-port', '렘차방 항만 노동자', 'th-laemchabang', '태국에서 가장 큰 항구에서 고무 블록을 컨테이너에 실어요.', 'safetyHelmet', 'box'),
  p('latex-tester', '라텍스 품질 검사원', 'th-south', '고무의 탄성과 불순물을 시험해 등급을 정해요.', 'none', 'flask', 'rare', 'quiz'),

  // ── 코발트 ──
  p('cobalt-miner', '코발트 광부', 'cd-katanga', '구리와 함께 묻혀 있는 코발트 광석을 캐요. 세계 코발트의 대부분이 이 지역에서 나와요.', 'minerLamp', 'pickaxe'),
  p('battery-recycler', '폐배터리 재활용 기술자', 'kr', '다 쓴 배터리에서 코발트와 리튬을 다시 뽑아내요.', 'hood', 'recycle', 'rare', 'quiz'),

  // ── 리튬 ──
  p('lithium-miner', '리튬 광산 기술자', 'au-wa', '리튬이 든 광석인 스포듀민을 캐서 잘게 부숴요.', 'minerLamp', 'pickaxe'),
  p('brine-engineer', '염호 리튬 기술자', 'cl-atacama', '사막의 소금 호수 물을 햇볕에 증발시켜 리튬을 모아요.', 'straw', 'drop', 'rare', 'quiz'),

  // ── 반도체 ──
  p('fab-engineer', '클린룸 엔지니어', 'kr-gyeonggi', '먼지 하나 없는 클린룸에서 방진복을 입고 웨이퍼 위에 회로를 새겨요.', 'hood', 'chip'),
  p('osat', '반도체 후공정 작업자', 'my-penang', '완성된 칩을 포장하고 하나하나 테스트해요.', 'hood', 'chip'),
  p('litho-engineer', '반도체 장비 엔지니어', 'nl-veldhoven', '빛으로 아주 작은 회로를 그리는 노광 장비를 만들어요.', 'hood', 'gear', 'rare', 'quiz'),

  // ── 휴대폰 조립 ──
  p('hanoi-air', '하노이 공항 화물 담당', 'vn-hanoi', '완성된 휴대폰 상자를 화물기에 실어 세계로 보내요.', 'headset', 'phone'),
  p('phone-tester', '휴대폰 품질 테스트 엔지니어', 'vn', '떨어뜨리고, 누르고, 물에 담가 보며 휴대폰이 잘 버티는지 시험해요.', 'none', 'phone', 'rare', 'quiz'),

  // ── 알루미늄 ──
  p('bauxite-miner', '보크사이트 광부', 'au-qld', '붉은 흙처럼 생긴 보크사이트 광석을 캐요.', 'minerLamp', 'pickaxe'),
  p('smelter', '알루미늄 제련소 작업자', 'au-qld', '광석에서 뽑은 알루미나에 전기를 흘려 알루미늄 덩어리를 만들어요.', 'helmet', 'gear'),
  p('can-factory', '캔 공장 작업자', 'kr-gyeonggi', '얇은 알루미늄 판을 눌러 순식간에 음료 캔 모양으로 만들어요.', 'cap', 'cup'),
  p('can-recycler', '캔 재활용 작업자', 'kr-gyeonggi', '모은 캔을 압축해 다시 녹일 수 있게 보내요. 알루미늄은 몇 번이고 다시 쓸 수 있어요.', 'cap', 'recycle', 'rare', 'quiz'),

  // ── 펄프·종이 ──
  p('eucalyptus', '유칼립투스 조림지 작업자', 'br', '종이 원료가 될 유칼립투스 나무를 심고 가꿔요.', 'straw', 'leaf'),
  p('pulp-mill', '펄프 공장 작업자', 'br', '나무를 잘게 부수고 삶아 섬유만 남긴 펄프를 만들어요.', 'helmet', 'gear'),
  p('paper-mill', '제지 공장 작업자', 'kr', '펄프를 물에 풀어 얇게 펴고 말려 종이를 만들어요.', 'cap', 'clipboard'),
  p('forest-auditor', '산림 인증 심사원', 'br', '나무를 베어 낸 만큼 다시 심는지, 숲을 지키며 쓰는지 확인해요.', 'none', 'clipboard', 'rare', 'quiz'),

  // ── 오렌지 ──
  p('orange-picker', '오렌지 수확자', 'br-sp', '사다리를 타고 올라 잘 익은 오렌지를 따서 커다란 자루에 담아요.', 'straw', 'orange'),
  p('juice-plant', '농축 주스 공장 작업자', 'br-sp', '오렌지를 짜서 물기를 날려 진한 농축액으로 만들어요. 그래야 멀리 보내기 쉬워요.', 'chef', 'orange'),
  p('beverage-plant', '음료 공장 작업자', 'kr-gyeonggi', '농축액에 물을 다시 넣어 주스로 만들고 병과 팩에 담아요.', 'chef', 'cup'),
  p('citrus-scientist', '감귤 병해 연구원', 'br-sp', '오렌지 나무를 병들게 하는 감귤 그리닝병을 막는 방법을 연구해요.', 'none', 'flask', 'rare', 'quiz'),

  // ── 대두 ──
  p('soy-farmer', '콩 농부', 'br-mt', '드넓은 콩밭에서 기계로 콩을 거둬요.', 'cap', 'seed'),
  p('tofu-maker', '두부 공장 작업자', 'kr-gyeonggi', '불린 콩을 갈아 끓이고 간수를 넣어 두부로 굳혀요.', 'chef', 'box'),
  p('soy-breeder', '콩 종자 연구원', 'br-mt', '더운 기후에서도 잘 자라는 콩 품종을 연구해요.', 'none', 'seed', 'rare', 'quiz'),

  // ── 철강 ──
  p('iron-miner', '철광석 광산 기술자', 'au-wa', '붉은 땅에서 거대한 트럭과 기계로 철광석을 캐요.', 'minerLamp', 'pickaxe'),
  p('hedland-port', '포트헤들랜드 항만 노동자', 'au-hedland', '기차에 실려 온 철광석을 컨베이어로 배에 쏟아부어요.', 'safetyHelmet', 'crane'),
  p('steel-mill', '제철소 고로 운전원', 'kr-pohang', '철광석과 석탄을 거대한 용광로에 넣어 쇳물을 만들어요.', 'helmet', 'gear'),
  p('scrap-worker', '고철 재활용 작업자', 'kr-pohang', '버려진 철을 모아 다시 녹일 수 있게 분류해요.', 'safetyHelmet', 'recycle', 'rare', 'quiz'),

  // ── 우유 ──
  p('dairy-farmer', '낙농가', 'kr-gyeonggi', '새벽부터 젖소를 돌보고 우유를 짜요.', 'cap', 'cup'),
  p('milk-collector', '집유 탱크로리 기사', 'kr-gyeonggi', '여러 농가를 돌며 갓 짠 우유를 차가운 탱크에 모아 공장으로 가요.', 'cap', 'drop'),
  p('dairy-plant', '유가공 공장 작업자', 'kr-gyeonggi', '우유를 살균하고 팩에 담아요.', 'chef', 'cup'),
  p('cow-vet', '젖소 수의사', 'kr-gyeonggi', '농장을 돌며 젖소들의 건강을 살펴요.', 'none', 'flask', 'rare', 'quiz'),

  // ── 연결 발견 카드 (에픽) ──
  p('link-sea-crew', '두 물건을 한 배로 나른 선원', 'sea', '오늘 고른 물건 두 개가 어쩌면 같은 배를 타고 왔을지도 몰라요. 바다는 서로 다른 여정이 만나는 곳이에요.', 'beanie', 'anchor', 'epic', 'link'),
  p('link-bulk-crew', '곡물과 광석을 함께 아는 선원', 'sea', '밀을 실었던 배가 다음 항해에는 철광석을 싣기도 해요. 같은 바다, 다른 화물.', 'beanie', 'wheat', 'epic', 'link'),
  p('link-tanker-crew', '기름의 바닷길 안내자', 'sea', '원유와 식물성 기름은 전혀 다른 곳에서 오지만 둘 다 탱크에 담겨 바다를 건너요.', 'beanie', 'drop', 'epic', 'link'),
  p('link-busan-crane', '부산항의 교차로 기사', 'kr-busan', '세계 곳곳에서 출발한 여정이 이 크레인 아래에서 한 번씩 만나요.', 'safetyHelmet', 'crane', 'epic', 'link'),
  p('link-air-cargo', '하늘길 교차로 조업원', 'kr-incheon', '서로 다른 나라에서 출발한 화물이 같은 날 같은 활주로에 내려요. 하늘에도 교차로가 있어요.', 'headset', 'phone', 'epic', 'link'),
  p('link-vn-factory', '두 물건을 만든 손', 'vn', '오늘 쓴 물건 두 개가 같은 나라의 같은 공장 지대에서 만들어졌어요.', 'cap', 'spool', 'epic', 'link'),
  p('link-cn-refinery', '배터리 금속의 교차로', 'cn', '콩고의 코발트와 호주의 리튬이 이곳에서 함께 정련돼 배터리가 돼요.', 'helmet', 'chip', 'epic', 'link'),
  p('link-kr-battery', '두 금속을 하나로', 'kr-chungbuk', '서로 다른 대륙에서 온 금속이 이곳에서 만나 하나의 배터리가 돼요.', 'hood', 'chip', 'epic', 'link'),
  p('link-santos-port', '남미의 관문', 'br-santos', '종이가 될 펄프, 주스가 될 오렌지, 두부가 될 콩이 같은 항구에서 배에 올라요.', 'safetyHelmet', 'orange', 'epic', 'link'),

  // ── 세트 완성 카드 (전설) ──
  p('harbor-pilot', '항만 도선사', 'kr-busan', '거대한 배가 항구에 안전하게 들어오도록 직접 배에 올라 길을 안내해요. 바다를 건넌 모든 여정의 마지막 길잡이.', 'beanie', 'anchor', 'legendary', 'set'),
  p('seed-vault', '종자 저장고 관리자', 'no-svalbard', '북극의 얼음 산속 저장고에 세계의 씨앗을 보관해요. 땅을 일구는 모든 사람의 내일을 지키는 곳이에요.', 'beanie', 'seed', 'legendary', 'set'),
  p('mine-rescue', '광산 구조대원', 'au-wa', '땅속에서 사고가 나면 가장 먼저 들어가는 사람이에요. 땅속에서 일하는 모든 사람의 든든한 뒷배.', 'minerLamp', 'clipboard', 'legendary', 'set'),
  p('safety-inspector', '산업안전 감독관', 'kr', '공장에서 일하는 사람들이 다치지 않도록 현장을 살피고 바꿔 나가요.', 'safetyHelmet', 'clipboard', 'legendary', 'set'),
]

export const PEOPLE: Record<string, Person> = Object.fromEntries(list.map((x) => [x.id, x]))
export const PEOPLE_LIST = list
