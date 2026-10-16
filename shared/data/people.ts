import type { Face, FactSource, Hair, Hat, Outfit, Person, Prop, Rarity } from '../types'
import { hash } from '../random'
import { nameOf } from './names'
import { RESIDENCE } from './village'

const HAIRS: Hair[] = ['short', 'bob', 'tied', 'curly', 'gray']

/** prop이 drop인 사람의 방울 색. 없으면 기름(검은색) */
const DROP_TINT: Record<string, string> = {
  'milk-collector': '#FFFFFF',
  'rubber-tapper': '#FFFFFF',
  'palm-mill': '#E8A33A',
  'oil-food-plant': '#F2C14E',
  'brine-engineer': '#BFE3F2',
  'cn-tomato-paste': '#D2463A',
  'ketchup-maker': '#D2463A',
}

function p(
  id: string,
  job: string,
  placeId: string,
  story: string,
  hat: Hat,
  prop: Prop,
  outfit: Outfit,
  face: Face,
  rarity: Rarity = 'common',
  kind: Person['kind'] = 'stage',
): Person {
  // 머리 모양은 id 해시로 정한다. 사람을 더 넣어도 기존 사람의 머리는 그대로다
  const hair = HAIRS[hash(id) % HAIRS.length]!
  const tint = DROP_TINT[id]
  // 구역·일터는 village.ts에 사람마다 적어 두었다 (없으면 check:data가 잡는다)
  const [zone, workplace] = RESIDENCE[id] ?? ['town', 'office']
  return { id, job, placeId, story, look: { hat, prop, outfit, hair, face, ...(tint ? { tint } : {}) }, rarity, kind, zone, workplace }
}

const list: Person[] = [
  // ── 여러 여정이 함께 지나가는 사람들 (연결의 중심) ──
  p('sea-crew', '컨테이너선 선원', 'sea', '수천 개의 컨테이너를 싣고 몇 주씩 바다를 건너요. 오늘 내 물건도 이 배의 어느 칸에 있었을 거예요.', 'beanie', 'anchor', 'sailor', 'smile'),
  p('bulk-crew', '벌크선 선원', 'sea', '곡물이나 광석처럼 포장하지 않은 화물을 배 안 거대한 화물칸에 통째로 싣고 바다를 건너요.', 'beanie', 'anchor', 'sailor', 'sleepy'),
  p('tanker-crew', '탱커선 선원', 'sea', '원유나 기름 같은 액체 화물을 탱크에 가득 싣고 항해해요.', 'beanie', 'drop', 'sailor', 'smile'),
  p('reefer-crew', '냉동 운반선 선원', 'sea', '얼린 수산물이 녹지 않도록 영하의 화물칸을 지키며 바다를 건너요.', 'beanie', 'fish', 'sailor', 'sleepy'),
  p('busan-crane', '부산항 크레인 기사', 'kr-busan', '높은 조종석에서 배 위의 컨테이너를 하나씩 들어 땅에 내려놓아요.', 'safetyHelmet', 'crane', 'vest', 'focus'),
  p('air-cargo', '항공화물 조업원', 'kr-incheon', '비행기에서 내린 화물을 빠르게 분류해 다음 차량으로 보내요. 신선한 것일수록 시간 싸움이에요.', 'headset', 'box', 'vest', 'sleepy'),
  p('warehouse', '물류센터 작업자', 'kr-gyeonggi', '전국으로 갈 상자를 고르고 나눠 담아요. 내가 산 물건이 마지막으로 거치는 창고예요.', 'cap', 'box', 'vest', 'sleepy'),
  p('courier', '택배 기사', 'kr-seoul', '하루에도 수백 개의 상자를 들고 계단을 오르내리며 문 앞까지 가져다줘요.', 'cap', 'box', 'rider', 'smile'),
  p('vn-factory', '베트남 공장 노동자', 'vn', '긴 생산 라인에서 부품을 조립하거나 원단을 재봉해요. 휴대폰도, 운동화도 이곳을 거쳐 와요.', 'cap', 'gear', 'coverall', 'smile'),
  p('cn-refinery', '광물 정련 공장 기술자', 'cn', '광석에서 배터리에 쓸 만큼 순도 높은 금속을 뽑아내요.', 'helmet', 'flask', 'coverall', 'smile'),
  p('kr-battery', '배터리 공장 엔지니어', 'kr-chungbuk', '정련된 금속을 배터리 소재와 셀로 만들어요.', 'hood', 'chip', 'cleanroom', 'focus'),
  p('santos-port', '산투스 항만 노동자', 'br-santos', '브라질 내륙에서 기차와 트럭으로 온 화물을 배에 싣는 남미 최대급 항구에서 일해요.', 'safetyHelmet', 'box', 'vest', 'smile'),

  // ── 커피 ──
  p('coffee-picker', '커피 체리 수확자', 'et-sidama', '커피 열매는 체리처럼 붉게 익어요. 익는 속도가 제각각이라 잘 익은 것만 골라 손으로 따요.', 'scarf', 'cherry', 'farm', 'smile'),
  p('washing-station', '워싱 스테이션 작업자', 'et-sidama', '체리 과육을 벗겨 물에 발효시키고 씻은 뒤, 햇볕에 말려 생두를 얻어요.', 'cap', 'basket', 'farm', 'smile'),
  p('djibouti-docker', '지부티 항만 노동자', 'dj', '에티오피아는 바다가 없는 나라라서 커피는 이웃 나라 지부티 항구를 통해 세계로 나가요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  p('roaster', '커피 로스터', 'kr-seoul', '초록빛 생두를 볶아 우리가 아는 갈색 원두와 향을 만들어요.', 'cap', 'cup', 'apron', 'smile'),
  p('cupper', '커피 감별사', 'et-addis', '원두를 갈아 물을 붓고 향과 맛을 비교하는 커핑으로 커피의 등급을 매겨요.', 'none', 'cup', 'lab', 'focus', 'rare', 'quiz'),

  // ── 카카오 ──
  p('cacao-farmer', '카카오 농부', 'ci', '나무줄기에 달린 카카오 꼬투리를 따서 갈라 하얀 과육에 싸인 콩을 꺼내요.', 'straw', 'pod', 'farm', 'smile'),
  p('cacao-dryer', '카카오 발효·건조 담당', 'ci', '콩을 바나나 잎으로 덮어 며칠 발효시킨 뒤 햇볕에 말려요. 초콜릿 맛은 여기서 시작돼요.', 'scarf', 'leaf', 'farm', 'smile'),
  p('abidjan-docker', '아비장 항만 노동자', 'ci-abidjan', '마른 카카오콩 자루를 컨테이너에 실어 유럽과 아시아로 보내요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  p('cocoa-grinder', '코코아 가공 공장 작업자', 'nl-amsterdam', '카카오콩을 볶고 갈아 코코아 매스와 코코아버터로 나눠요. 네덜란드는 카카오를 가장 많이 가공하는 나라 중 하나예요.', 'chef', 'gear', 'lab', 'smile'),
  p('cacao-grader', '카카오 품질 검사원', 'ci', '콩을 반으로 잘라 속 색깔로 발효가 잘 됐는지 확인해요.', 'none', 'magnifier', 'lab', 'focus', 'rare', 'quiz'),

  // ── 설탕 ──
  p('cane-harvester', '사탕수수 수확기 운전사', 'au-qld', '호주의 사탕수수밭은 대부분 커다란 수확기로 거둬들여요.', 'cap', 'leaf', 'farm', 'smile'),
  p('raw-sugar-mill', '원당 공장 작업자', 'au-qld', '사탕수수 즙을 짜서 끓이고 졸여 갈색 결정인 원당을 만들어요.', 'helmet', 'gear', 'coverall', 'smile'),
  p('sugar-refinery', '제당 공장 작업자', 'kr-ulsan', '수입한 원당을 녹여 불순물을 걸러 내고 다시 결정으로 만들어 하얀 설탕을 얻어요.', 'chef', 'flask', 'lab', 'smile'),
  p('sugar-qc', '제당 공장 품질관리원', 'kr-ulsan', '설탕 결정의 크기와 색, 순도를 매일 검사해요.', 'hood', 'clipboard', 'cleanroom', 'focus', 'rare', 'quiz'),

  // ── 밀 ──
  p('wheat-farmer', '밀 농부', 'us-plains', '끝없는 밀밭을 콤바인으로 한 번에 베고 탈곡해요.', 'cap', 'wheat', 'farm', 'smile'),
  p('grain-elevator', '곡물 저장소 관리인', 'us-plains', '수확한 밀을 거대한 저장탑에 모으고 품질별로 나눠 보관해요.', 'cap', 'clipboard', 'coverall', 'smile'),
  p('pnw-port', '곡물 수출항 작업자', 'us-pnw', '기차에 실려 온 밀을 아시아로 갈 배에 옮겨 담아요.', 'safetyHelmet', 'wheat', 'vest', 'smile'),
  p('flour-mill', '제분소 작업자', 'kr-gyeonggi', '밀알을 곱게 갈고 체에 쳐서 밀가루를 만들어요.', 'chef', 'wheat', 'lab', 'smile'),
  p('grain-inspector', '곡물 검정관', 'us-pnw', '배에 싣기 전 밀의 수분과 단백질, 이물질을 검사해 등급을 매겨요.', 'none', 'magnifier', 'lab', 'focus', 'rare', 'quiz'),

  // ── 팜유 ──
  p('palm-harvester', '기름야자 수확자', 'id', '긴 장대 끝의 낫으로 높이 달린 열매 송이를 잘라 내요.', 'straw', 'leaf', 'farm', 'smile'),
  p('palm-mill', '팜유 착유 공장 작업자', 'id', '열매를 쪄서 부드럽게 만든 뒤 눌러 기름을 짜내요.', 'helmet', 'drop', 'coverall', 'smile'),
  p('oil-food-plant', '식용유지 공장 작업자', 'kr-gyeonggi', '팜유를 정제해 라면을 튀기거나 과자를 만드는 기름으로 만들어요.', 'chef', 'drop', 'lab', 'smile'),
  p('palm-smallholder', '소규모 기름야자 농가', 'id', '인도네시아 기름야자밭의 상당수는 가족 단위 소농이 일궈요.', 'straw', 'seed', 'farm', 'smile', 'rare', 'quiz'),

  // ── 쌀 ──
  p('rice-farmer', '벼농사 농부', 'kr-jeonbuk', '봄에 모를 심고 여름 내내 물을 대서 가을에 벼를 거둬요.', 'straw', 'wheat', 'farm', 'smile'),
  p('rice-mill', '미곡종합처리장 작업자', 'kr-jeonbuk', '벼를 말리고 껍질을 벗기는 도정을 거쳐 하얀 쌀로 만들어요.', 'cap', 'gear', 'coverall', 'smile'),
  p('rice-breeder', '벼 품종 연구원', 'kr-jeonbuk', '더 맛있고 병에 강한 벼를 만들려고 여러 해에 걸쳐 품종을 교배해요.', 'none', 'seed', 'lab', 'focus', 'rare', 'quiz'),

  // ── 김 ──
  p('laver-farmer', '김 양식 어민', 'kr-jeonnam', '추운 겨울 바다에 김발을 띄워 김을 키우고 배를 타고 나가 거둬요.', 'beanie', 'leaf', 'sailor', 'smile'),
  p('laver-processor', '마른김 가공장 작업자', 'kr-jeonnam', '거둔 김을 씻어 잘게 썰고 발 위에 얇게 떠서 말려요.', 'chef', 'leaf', 'lab', 'smile'),
  p('laver-auctioneer', '수산물 위판장 경매사', 'kr-jeonnam', '새벽 위판장에서 그날 거둔 물김의 값을 경매로 정해요.', 'cap', 'clipboard', 'office', 'sleepy', 'rare', 'quiz'),

  // ── 참치 ──
  p('tuna-fisher', '원양어선 선원', 'pacific', '집을 떠나 몇 달씩 태평양에서 참치 떼를 쫓아요.', 'beanie', 'fish', 'sailor', 'smile'),
  p('cannery', '통조림 공장 작업자', 'kr-gyeongnam', '참치를 찌고 살을 발라 기름과 함께 캔에 담아 밀봉해요.', 'chef', 'fish', 'apron', 'smile'),
  p('fishery-observer', '조업 감시원', 'pacific', '어선에 함께 타서 무엇을 얼마나 잡았는지 기록해 바다 자원을 지켜요.', 'cap', 'clipboard', 'sailor', 'focus', 'rare', 'quiz'),

  // ── 연어 ──
  p('salmon-farmer', '연어 양식장 직원', 'no', '피오르의 차가운 바닷물에 띄운 가두리에서 연어를 키워요.', 'beanie', 'fish', 'sailor', 'smile'),
  p('salmon-processor', '연어 가공장 작업자', 'no', '연어를 손질해 얼음과 함께 상자에 담아요.', 'chef', 'fish', 'apron', 'smile'),
  p('oslo-air', '오슬로 공항 화물 담당', 'no-oslo', '신선한 연어 상자를 아시아로 가는 화물기에 실어요.', 'headset', 'box', 'vest', 'smile'),
  p('fish-vet', '양식장 수의사', 'no', '가두리 속 물고기들이 병에 걸리지 않았는지 살펴요.', 'none', 'flask', 'lab', 'focus', 'rare', 'quiz'),

  // ── 바나나 ──
  p('banana-farmer', '바나나 농부', 'ph-mindanao', '바나나 송이에 비닐을 씌워 보호하고, 초록색일 때 통째로 베어 거둬요.', 'straw', 'banana', 'farm', 'smile'),
  p('banana-packer', '바나나 포장 작업자', 'ph-mindanao', '송이를 씻고 작게 나눠 상자에 담아요. 멍이 들지 않게 조심조심.', 'scarf', 'box', 'farm', 'smile'),
  p('davao-port', '다바오 항만 노동자', 'ph-davao', '바나나 상자를 차갑게 유지되는 냉장 컨테이너에 실어요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  p('ripening', '바나나 숙성실 관리자', 'kr-gyeonggi', '초록색으로 도착한 바나나에 에틸렌 가스를 써서 노랗게 익혀요.', 'cap', 'banana', 'coverall', 'smile'),
  p('banana-scientist', '바나나 병해 연구원', 'ph-mindanao', '바나나를 말려 죽이는 곰팡이병을 막는 방법을 연구해요.', 'none', 'flask', 'lab', 'focus', 'rare', 'quiz'),

  // ── 면 ──
  p('cotton-farmer', '목화 농부', 'in-gujarat', '하얗게 터진 목화솜을 따서 모아요.', 'scarf', 'leaf', 'farm', 'smile'),
  p('cotton-gin', '조면 공장 작업자', 'in-gujarat', '목화솜에서 씨를 빼내고 솜을 꾹꾹 눌러 커다란 덩어리로 묶어요.', 'cap', 'gear', 'coverall', 'smile'),
  p('spinner', '방적 공장 작업자', 'in', '솜을 길게 늘이고 꼬아서 실을 만들어요.', 'scarf', 'spool', 'coverall', 'smile'),
  p('garment-sewer', '봉제 공장 재봉사', 'bd-dhaka', '재단된 원단을 재봉틀로 이어 티셔츠 한 장을 완성해요. 방글라데시는 손꼽히는 의류 수출국이에요.', 'scarf', 'spool', 'apron', 'focus'),
  p('chittagong-port', '치타공 항만 노동자', 'bd-chittagong', '완성된 옷 상자를 컨테이너에 실어 세계로 보내요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  p('cotton-classer', '면화 등급 감정사', 'in-gujarat', '솜의 길이와 색, 섬세함을 살펴 등급을 매겨요.', 'none', 'magnifier', 'lab', 'focus', 'rare', 'quiz'),

  // ── 폴리에스터 ──
  p('poly-fiber', '합성섬유 공장 작업자', 'cn-zhejiang', '석유에서 나온 원료를 녹여 가는 실로 뽑아내요.', 'hood', 'spool', 'cleanroom', 'smile'),
  p('vn-port', '호찌민 항만 노동자', 'vn-hcm', '베트남 공장에서 만든 옷과 신발을 컨테이너에 실어요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  p('pet-sorter', '페트병 재활용 선별원', 'kr-gyeonggi', '투명 페트병을 골라내요. 깨끗한 페트는 다시 실이 되어 옷이 돼요.', 'cap', 'recycle', 'coverall', 'smile', 'rare', 'quiz'),

  // ── 플라스틱(석유) ──
  p('oil-worker', '유전 기술자', 'sa', '땅속 깊은 곳의 원유를 뽑아 올리는 설비를 관리해요.', 'helmet', 'drop', 'coverall', 'smile'),
  p('ulsan-refinery', '정유 공장 운전원', 'kr-ulsan', '원유를 가열해 휘발유, 경유, 나프타 같은 성분으로 나눠요.', 'helmet', 'gear', 'coverall', 'smile'),
  p('yeosu-chem', '석유화학 공장 운전원', 'kr-yeosu', '나프타를 잘게 분해해 플라스틱의 원료를 만들어요.', 'helmet', 'flask', 'coverall', 'smile'),
  p('injection', '사출 공장 작업자', 'kr-gyeonggi', '플라스틱 알갱이를 녹여 틀에 부어 컵이나 포장재 모양으로 굳혀요.', 'cap', 'gear', 'coverall', 'smile'),
  p('refinery-safety', '정유 공장 안전관리자', 'kr-ulsan', '거대한 설비가 사고 없이 돌아가도록 매일 점검해요.', 'safetyHelmet', 'clipboard', 'vest', 'focus', 'rare', 'quiz'),

  // ── 천연고무 ──
  p('rubber-tapper', '고무나무 수액 채취자', 'th-south', '동트기 전 나무껍질에 비스듬히 홈을 내고 흘러나오는 하얀 라텍스를 모아요.', 'scarf', 'drop', 'farm', 'smile'),
  p('rubber-processor', '고무 가공 공장 작업자', 'th-south', '라텍스를 굳혀 판이나 블록 모양의 고무로 만들어요.', 'cap', 'gear', 'coverall', 'smile'),
  p('laemchabang-port', '렘차방 항만 노동자', 'th-laemchabang', '태국에서 가장 큰 항구에서 고무 블록을 컨테이너에 실어요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  p('latex-tester', '라텍스 품질 검사원', 'th-south', '고무의 탄성과 불순물을 시험해 등급을 정해요.', 'none', 'flask', 'lab', 'focus', 'rare', 'quiz'),

  // ── 코발트 ──
  p('cobalt-miner', '코발트 광부', 'cd-katanga', '구리와 함께 묻혀 있는 코발트 광석을 캐요. 세계 코발트의 대부분이 이 지역에서 나와요.', 'minerLamp', 'pickaxe', 'miner', 'focus'),
  p('battery-recycler', '폐배터리 재활용 기술자', 'kr', '다 쓴 배터리에서 코발트와 리튬을 다시 뽑아내요.', 'hood', 'recycle', 'cleanroom', 'smile', 'rare', 'quiz'),

  // ── 리튬 ──
  p('lithium-miner', '리튬 광산 기술자', 'au-wa', '리튬이 든 광석인 스포듀민을 캐서 잘게 부숴요.', 'minerLamp', 'pickaxe', 'miner', 'focus'),
  p('brine-engineer', '염호 리튬 기술자', 'cl-atacama', '사막의 소금 호수 물을 햇볕에 증발시켜 리튬을 모아요.', 'straw', 'drop', 'coverall', 'smile', 'rare', 'quiz'),

  // ── 반도체 ──
  p('fab-engineer', '클린룸 엔지니어', 'kr-gyeonggi', '먼지 하나 없는 클린룸에서 방진복을 입고 웨이퍼 위에 회로를 새겨요.', 'hood', 'chip', 'cleanroom', 'focus'),
  p('osat', '반도체 후공정 작업자', 'my-penang', '완성된 칩을 포장하고 하나하나 테스트해요.', 'hood', 'chip', 'cleanroom', 'focus'),
  p('litho-engineer', '반도체 장비 엔지니어', 'nl-veldhoven', '빛으로 아주 작은 회로를 그리는 노광 장비를 만들어요.', 'hood', 'gear', 'cleanroom', 'focus', 'rare', 'quiz'),

  // ── 휴대폰 조립 ──
  p('hanoi-air', '하노이 공항 화물 담당', 'vn-hanoi', '완성된 휴대폰 상자를 화물기에 실어 세계로 보내요.', 'headset', 'phone', 'vest', 'smile'),
  p('phone-tester', '휴대폰 품질 테스트 엔지니어', 'vn', '떨어뜨리고, 누르고, 물에 담가 보며 휴대폰이 잘 버티는지 시험해요.', 'none', 'phone', 'lab', 'focus', 'rare', 'quiz'),

  // ── 알루미늄 ──
  p('bauxite-miner', '보크사이트 광부', 'au-qld', '붉은 흙처럼 생긴 보크사이트 광석을 캐요.', 'minerLamp', 'pickaxe', 'miner', 'focus'),
  p('smelter', '알루미늄 제련소 작업자', 'au-qld', '광석에서 뽑은 알루미나에 전기를 흘려 알루미늄 덩어리를 만들어요.', 'helmet', 'gear', 'coverall', 'smile'),
  p('can-factory', '캔 공장 작업자', 'kr-gyeonggi', '얇은 알루미늄 판을 눌러 순식간에 음료 캔 모양으로 만들어요.', 'cap', 'cup', 'coverall', 'smile'),
  p('can-recycler', '캔 재활용 작업자', 'kr-gyeonggi', '모은 캔을 압축해 다시 녹일 수 있게 보내요. 알루미늄은 몇 번이고 다시 쓸 수 있어요.', 'cap', 'recycle', 'coverall', 'smile', 'rare', 'quiz'),

  // ── 펄프·종이 ──
  p('eucalyptus', '유칼립투스 조림지 작업자', 'br', '종이 원료가 될 유칼립투스 나무를 심고 가꿔요.', 'straw', 'leaf', 'farm', 'smile'),
  p('pulp-mill', '펄프 공장 작업자', 'br', '나무를 잘게 부수고 삶아 섬유만 남긴 펄프를 만들어요.', 'helmet', 'gear', 'coverall', 'smile'),
  p('paper-mill', '제지 공장 작업자', 'kr', '펄프를 물에 풀어 얇게 펴고 말려 종이를 만들어요.', 'cap', 'clipboard', 'coverall', 'smile'),
  p('forest-auditor', '산림 인증 심사원', 'br', '나무를 베어 낸 만큼 다시 심는지, 숲을 지키며 쓰는지 확인해요.', 'none', 'clipboard', 'office', 'focus', 'rare', 'quiz'),

  // ── 오렌지 ──
  p('orange-picker', '오렌지 수확자', 'br-sp', '사다리를 타고 올라 잘 익은 오렌지를 따서 커다란 자루에 담아요.', 'straw', 'orange', 'farm', 'smile'),
  p('juice-plant', '농축 주스 공장 작업자', 'br-sp', '오렌지를 짜서 물기를 날려 진한 농축액으로 만들어요. 그래야 멀리 보내기 쉬워요.', 'chef', 'orange', 'lab', 'smile'),
  p('beverage-plant', '음료 공장 작업자', 'kr-gyeonggi', '농축액에 물을 다시 넣어 주스로 만들고 병과 팩에 담아요.', 'chef', 'cup', 'lab', 'smile'),
  p('citrus-scientist', '감귤 병해 연구원', 'br-sp', '오렌지 나무를 병들게 하는 감귤 그리닝병을 막는 방법을 연구해요.', 'none', 'flask', 'lab', 'focus', 'rare', 'quiz'),

  // ── 대두 ──
  p('soy-farmer', '콩 농부', 'br-mt', '드넓은 콩밭에서 기계로 콩을 거둬요.', 'cap', 'seed', 'farm', 'smile'),
  p('tofu-maker', '두부 공장 작업자', 'kr-gyeonggi', '불린 콩을 갈아 끓이고 간수를 넣어 두부로 굳혀요.', 'chef', 'box', 'lab', 'smile'),
  p('soy-breeder', '콩 종자 연구원', 'br-mt', '더운 기후에서도 잘 자라는 콩 품종을 연구해요.', 'none', 'seed', 'lab', 'focus', 'rare', 'quiz'),

  // ── 철강 ──
  p('iron-miner', '철광석 광산 기술자', 'au-wa', '붉은 땅에서 거대한 트럭과 기계로 철광석을 캐요.', 'minerLamp', 'pickaxe', 'miner', 'focus'),
  p('hedland-port', '포트헤들랜드 항만 노동자', 'au-hedland', '기차에 실려 온 철광석을 컨베이어로 배에 쏟아부어요.', 'safetyHelmet', 'crane', 'vest', 'smile'),
  p('steel-mill', '제철소 고로 운전원', 'kr-pohang', '철광석과 석탄을 거대한 용광로에 넣어 쇳물을 만들어요.', 'helmet', 'gear', 'coverall', 'focus'),
  p('scrap-worker', '고철 재활용 작업자', 'kr-pohang', '버려진 철을 모아 다시 녹일 수 있게 분류해요.', 'safetyHelmet', 'recycle', 'coverall', 'smile', 'rare', 'quiz'),

  // ── 우유 ──
  p('dairy-farmer', '낙농가', 'kr-gyeonggi', '새벽부터 젖소를 돌보고 우유를 짜요.', 'cap', 'cup', 'farm', 'smile'),
  p('milk-collector', '집유 탱크로리 기사', 'kr-gyeonggi', '여러 농가를 돌며 갓 짠 우유를 차가운 탱크에 모아 공장으로 가요.', 'cap', 'drop', 'rider', 'sleepy'),
  p('dairy-plant', '유가공 공장 작업자', 'kr-gyeonggi', '우유를 살균하고 팩에 담아요.', 'chef', 'cup', 'lab', 'smile'),
  p('cow-vet', '젖소 수의사', 'kr-gyeonggi', '농장을 돌며 젖소들의 건강을 살펴요.', 'none', 'flask', 'lab', 'focus', 'rare', 'quiz'),

  // ── 고춧가루 ──
  p('chili-farmer', '고추 농부', 'cn-shandong', '붉게 익은 고추를 따서 햇볕에 펼쳐 말려요.', 'straw', 'basket', 'farm', 'smile'),
  p('chili-mill', '고추 분쇄 공장 작업자', 'cn-shandong', '마른 고추의 꼭지를 따고 곱게 빻아 고춧가루로 만들어요.', 'cap', 'gear', 'coverall', 'smile'),
  p('qingdao-port', '칭다오 항만 노동자', 'cn-qingdao', '한국으로 가는 배에 고춧가루 포대를 실어요. 칭다오에서 인천까지는 배로 금방이에요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  p('incheon-port', '인천항 하역 노동자', 'kr-incheon-port', '중국과 가까운 서해의 관문. 곡물과 목재, 식품이 이 부두로 들어와요.', 'safetyHelmet', 'crane', 'vest', 'smile'),
  p('chili-breeder', '고추 품종 연구원', 'kr', '병에 강하고 맛있는 고추를 만들려고 수많은 고추를 교배하고 길러 봐요.', 'none', 'seed', 'lab', 'focus', 'rare', 'quiz'),

  // ── 배추·김치 ──
  p('cabbage-farmer', '고랭지 배추 농부', 'kr-gangwon', '여름에도 서늘한 높은 산 밭에서 배추를 길러요. 한여름 김치는 이 밭에서 와요.', 'straw', 'leaf', 'farm', 'smile'),
  p('cabbage-trader', '산지 유통인', 'kr-gangwon', '밭에서 거둔 배추를 모아 트럭에 가득 싣고 공장과 시장으로 날라요.', 'cap', 'box', 'rider', 'smile'),
  p('kimchi-maker', '김치 공장 작업자', 'kr', '배추를 소금물에 절이고 씻어 양념에 버무려요. 하루에 수천 포기씩.', 'chef', 'leaf', 'lab', 'smile'),
  p('kimchi-scientist', '김치 연구원', 'kr-gwangju', '김치가 익어 가는 동안 유산균이 어떻게 변하는지 연구해요.', 'hood', 'flask', 'cleanroom', 'focus', 'rare', 'quiz'),

  // ── 유리 ──
  p('glass-furnace', '유리 용해로 운전원', 'kr', '모래(규사)와 소다회, 석회석을 1,500도 가까운 불에 녹여요.', 'helmet', 'flask', 'coverall', 'focus'),
  p('glass-bottle', '유리병 성형 작업자', 'kr', '녹은 유리 방울을 틀에 넣고 공기를 불어 병 모양을 만들어요.', 'cap', 'cup', 'coverall', 'smile'),
  p('glass-recycler', '유리병 재활용 선별원', 'kr', '색깔별로 유리병을 나눠요. 깨진 유리는 다시 녹여 새 병이 돼요.', 'cap', 'recycle', 'coverall', 'smile', 'rare', 'quiz'),

  // ── 목재 ──
  p('nz-logger', '벌목 작업자', 'nz', '수십 년 키운 소나무를 베어 통나무로 잘라요.', 'safetyHelmet', 'leaf', 'vest', 'smile'),
  p('tauranga-port', '타우랑가 항만 노동자', 'nz-tauranga', '뉴질랜드에서 가장 큰 수출항에서 통나무를 배에 쌓아 올려요.', 'safetyHelmet', 'crane', 'vest', 'smile'),
  p('sawmill', '제재소 작업자', 'kr-incheon-port', '통나무를 판자와 각목으로 켜고 말려요.', 'cap', 'gear', 'coverall', 'smile'),
  p('furniture-maker', '가구 공장 작업자', 'kr', '나무를 자르고 다듬고 조립해 책상과 의자를 만들어요.', 'cap', 'wrench', 'coverall', 'smile'),
  p('nz-forester', '조림지 산림 관리인', 'nz', '베어 낸 자리에 다시 어린 나무를 심고 숲을 가꿔요.', 'straw', 'seed', 'farm', 'smile', 'rare', 'quiz'),

  // ── 소고기 ──
  p('cattle-rancher', '소 목장 주인', 'au-qld', '끝없는 초원에 소를 풀어 키워요. 말이나 오토바이를 타고 소 떼를 몰아요.', 'straw', 'leaf', 'farm', 'smile'),
  p('meatworks', '소고기 가공장 작업자', 'au-qld', '고기를 부위별로 나눠 진공 포장하고 차갑게 보관해요.', 'chef', 'box', 'apron', 'smile'),
  p('beef-grader', '소고기 등급 판정사', 'au-qld', '고기의 마블링과 색, 지방을 보고 등급을 매겨요.', 'none', 'magnifier', 'lab', 'focus', 'rare', 'quiz'),

  // ── 돼지고기 ──
  p('pig-farmer', '양돈 농장 직원', 'es', '돼지들이 먹고 자는 축사를 돌보고 건강을 살펴요.', 'cap', 'basket', 'farm', 'smile'),
  p('pork-plant', '돼지고기 가공장 작업자', 'es', '고기를 부위별로 나눠 냉동 컨테이너에 실을 준비를 해요.', 'chef', 'box', 'apron', 'smile'),
  p('valencia-port', '발렌시아 항만 노동자', 'es-valencia', '지중해의 큰 항구에서 냉동 컨테이너를 아시아행 배에 실어요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  p('butcher', '정육 기술자', 'kr-seoul', '큰 덩어리 고기를 삼겹살, 목살처럼 우리가 아는 모양으로 손질해요.', 'chef', 'box', 'apron', 'smile', 'rare', 'quiz'),

  // ── 닭 ──
  p('broiler-farmer', '육계 농장주', 'kr-jeonbuk', '병아리를 한 달 남짓 키워요. 온도와 환기에 하루 종일 신경 써요.', 'cap', 'seed', 'farm', 'smile'),
  p('chicken-plant', '닭고기 가공장 작업자', 'kr-jeonbuk', '닭을 손질하고 부위별로 나눠 차갑게 포장해요.', 'chef', 'box', 'apron', 'smile'),
  p('chicken-shop', '치킨집 사장님', 'kr-seoul', '반죽을 입혀 바삭하게 튀기고, 배달 기사님께 건네요.', 'chef', 'cup', 'apron', 'smile'),
  p('poultry-officer', '가축 방역관', 'kr-jeonbuk', '조류인플루엔자 같은 병이 퍼지지 않도록 농장을 살피고 소독해요.', 'hood', 'clipboard', 'cleanroom', 'smile', 'rare', 'quiz'),

  // ── 달걀 ──
  p('egg-farmer', '산란계 농장 직원', 'kr-gyeonggi', '닭들이 낳은 달걀을 매일 아침 모아요.', 'cap', 'basket', 'farm', 'smile'),
  p('egg-gp', '달걀 선별포장 작업자', 'kr-gyeonggi', '달걀을 씻고 금 간 것을 골라내고, 껍데기에 번호를 찍어 포장해요.', 'hood', 'box', 'cleanroom', 'smile'),
  p('egg-inspector', '달걀 품질 검사원', 'kr-gyeonggi', '빛을 비춰 달걀 속을 들여다보고 신선도를 확인해요.', 'none', 'magnifier', 'lab', 'focus', 'rare', 'quiz'),

  // ── 옥수수 ──
  p('corn-farmer', '옥수수 농부', 'us-midwest', '사람 키보다 큰 옥수수밭을 콤바인으로 거둬요.', 'cap', 'wheat', 'farm', 'smile'),
  p('barge-crew', '바지선 선원', 'us-mississippi', '곡물을 실은 바지선 수십 척을 줄줄이 묶어 미시시피강을 따라 내려가요.', 'beanie', 'anchor', 'sailor', 'sleepy'),
  p('nola-port', '곡물 수출항 작업자', 'us-nola', '강을 따라 내려온 옥수수를 바다를 건널 큰 배에 옮겨 담아요.', 'safetyHelmet', 'wheat', 'vest', 'smile'),
  p('starch-plant', '전분당 공장 작업자', 'kr', '옥수수에서 전분을 뽑아 물엿이나 과자 원료로 만들어요.', 'helmet', 'flask', 'lab', 'smile'),
  p('grain-trader', '곡물 무역 트레이더', 'kr-seoul', '어느 나라 곡물을 언제 사서 배에 실을지 하루 종일 시세를 보며 정해요.', 'none', 'phone', 'office', 'smile', 'rare', 'quiz'),

  // ── 새우 ──
  p('shrimp-farmer', '새우 양식 농부', 'vn-mekong', '강과 바다가 만나는 연못에서 새우를 키워요.', 'straw', 'fish', 'farm', 'smile'),
  p('shrimp-processor', '새우 가공 공장 작업자', 'vn-mekong', '새우 껍질을 벗기고 손질해 얼려요. 섬세한 손이 필요한 일이에요.', 'chef', 'fish', 'apron', 'smile'),
  p('water-keeper', '양식장 수질 관리사', 'vn-mekong', '연못 물의 소금기와 산소를 재며 새우가 살기 좋은지 확인해요.', 'none', 'flask', 'lab', 'focus', 'rare', 'quiz'),

  // ── 녹차 ──
  p('tea-farmer', '차 농부', 'kr-boseong', '봄에 막 돋은 여린 찻잎을 손으로 따요.', 'straw', 'leaf', 'farm', 'smile'),
  p('tea-roaster', '녹차 덖음 장인', 'kr-boseong', '뜨거운 솥에 찻잎을 넣고 손으로 뒤적이며 볶고 비벼요.', 'none', 'cup', 'apron', 'smile'),
  p('tea-taster', '차 품질 감별사', 'kr-boseong', '찻잎의 모양과 향, 우린 물의 색을 보고 차의 등급을 매겨요.', 'none', 'cup', 'lab', 'focus', 'rare', 'quiz'),

  // ── 출발지 변형 (4단계) ──
  // 커피: 콜롬비아. 우일라는 대표 산지 중 하나이고, 콜롬비아 커피 수출의 60% 넘게가 태평양 쪽 부에나벤투라 항구로 나간다.
  //   출처: Portafolio(2025) "Crecen exportaciones de café colombiano en 2025 con Huila y Antioquia al frente",
  //        Forbes Colombia "Exportaciones de café se frenan por bloqueos en la vía a Buenaventura" (Asoexport 인용)
  p('co-coffee-farmer', '커피 농부', 'co-huila', '안데스 산비탈에서 아라비카 커피를 길러요. 비탈이 가팔라서 익은 열매를 손으로 하나씩 따요.', 'straw', 'cherry', 'farm', 'smile'),
  p('co-buenaventura-docker', '부에나벤투라 항만 노동자', 'co-buenaventura', '콜롬비아의 태평양 쪽 항구예요. 이 나라 커피가 가장 많이 떠나는 곳이라 생두 자루가 끝없이 실려요.', 'safetyHelmet', 'box', 'vest', 'smile'),
  // 커피: 베트남. 중부 고원의 닥락은 대표적인 커피 산지이고, 베트남 커피는 대부분 로부스타다. 호찌민 항구가 가장 큰 수출 관문.
  //   출처: Viet Nam News Bizhub "Dak Lak Province's coffee exports enjoy robust growth",
  //        Oxford Business Group "Vietnam 2017 report: coffee looks to remain a major player"
  p('vn-coffee-farmer', '로부스타 커피 농부', 'vn-daklak', '중부 고원의 붉은 흙에서 쓴맛이 진한 로부스타 커피를 길러요. 수확한 열매는 마당에 펼쳐 햇볕에 말려요.', 'straw', 'cherry', 'farm', 'smile'),
  p('vn-coffee-port', '호찌민 커피 수출 담당', 'vn-hcm', '고원에서 트럭으로 내려온 생두 자루를 검사하고 컨테이너에 실어 보내요.', 'safetyHelmet', 'clipboard', 'vest', 'smile'),
  // 커피: 브라질. 미나스제라이스주가 브라질 커피 생산의 절반 가까이를 차지하는 최대 산지이고 아라비카가 중심이다.
  //   커피 수출은 산투스 항구가 가장 많고(2026년 1~4월 74.7%), 리우데자네이루 항만이 그다음(21.3%)이다.
  //   출처: Rádio Itatiaia(2026-02-23) "Minas Gerais assume quase 50% da produção de café no Brasil" (Conab 1차 조사 인용),
  //        Datamar News(2026-05-18) "Cecafé: Coffee exports rise as Santos handles nearly 75% of shipments" (Cecafé 수치 인용)
  p('br-coffee-farmer', '아라비카 커피 농부', 'br-mg', '브라질에서 커피를 가장 많이 기르는 미나스제라이스주에서 아라비카 커피를 길러요.', 'straw', 'cherry', 'farm', 'smile'),
  p('br-santos-coffee', '산투스 커피 수출 담당', 'br-santos', '브라질 커피가 가장 많이 떠나는 항구예요. 내륙 농장에서 온 생두를 검사하고 컨테이너에 실어 보내요.', 'safetyHelmet', 'clipboard', 'vest', 'smile'),
  // 카카오: 가나. 서부 주가 큰 산지이고, 카카오는 주로 서부의 타코라디 항구와 동부의 테마 항구로 나간다.
  //   출처: Citi Newsroom(2019/20 Cocoa Marketing Company 수치 인용: 타코라디 52%, 테마 42%),
  //        MyJoyOnline "COCOBOD re-routes cocoa"
  p('gh-cacao-farmer', '카카오 농부', 'gh-western', '꼬투리에서 꺼낸 콩을 바나나 잎으로 덮어 며칠 동안 발효시켜요. 그래야 초콜릿 향이 살아나요.', 'straw', 'pod', 'farm', 'smile'),
  p('gh-takoradi-docker', '타코라디 항만 노동자', 'gh-takoradi', '가나 서부의 항구예요. 마른 카카오콩 자루를 배에 실어 바다 건너로 보내요.', 'safetyHelmet', 'box', 'vest', 'smile'),

  // ── 국산 농산물이 함께 지나는 도매시장 ──
  // 근거: 허재욱 외「고구마 생산농가의 판매경로 결정요인」(한국산학기술학회 2023, 도매시장에서는 도매법인이 경매로 판매),
  //       KREI 농업관측 감자 2025년 4월호(가락시장 등급별 경락가격·반입량)
  p('garak-auctioneer', '도매시장 경매사', 'kr-garak', '새벽 도매시장에서 산지에서 올라온 농산물의 값을 경매로 정해요.', 'cap', 'clipboard', 'office', 'sleepy'),

  // ── 팥 ──
  // 공급: 2023년 국내 생산 약 6천 톤, 수입 약 2만 톤(KREI 식품수급표 2023). 2023년 팥(HS 071332) 수입 21,654톤 중 중국 20,315톤(약 94%)(UN Comtrade).
  // 재배: 6~7월 파종, 9~10월 수확. 꼬투리가 고르게 익지 않아 기계화가 어렵다. 꼬투리당 6~10알(콩은 1~3알).
  //       앙금은 팥을 삶아 으깬 뒤 껍질을 걸러 만든다. 출처: 농촌진흥청 RDA 인테러뱅 91호「팥, 그 낭만에 대하여」(2012)
  p('redbean-farmer', '팥 농부', 'kr', '6~7월에 씨를 뿌려 9~10월에 거둬요. 꼬투리가 한꺼번에 익지 않아서 기계로 거두기가 어려워요.', 'straw', 'seed', 'farm', 'smile'),
  p('cn-redbean-farmer', '중국 팥 농부', 'cn', '우리나라에 들어오는 팥은 대부분 중국에서 와요. 마른 팥알을 자루에 담아 보내요.', 'straw', 'seed', 'farm', 'smile'),
  p('anko-maker', '앙금 공장 작업자', 'kr', '팥을 삶아 으깬 뒤 껍질을 걸러 내 고운 앙금을 만들어요. 붕어빵과 단팥빵 속이 여기서 나와요.', 'chef', 'gear', 'lab', 'smile'),
  p('redbean-breeder', '팥 연구원', 'kr', '팥 꼬투리를 열어 씨앗을 세어 봐요. 콩 꼬투리보다 씨앗이 훨씬 많이 들어 있어요.', 'none', 'seed', 'lab', 'focus', 'rare', 'quiz'),

  // ── 메밀 ──
  // 공급: 2023년 국내 2,975톤(54.1%), 수입 2,520톤. 재배면적의 62.2%·생산량의 57.2%가 제주. 제주는 봄·가을 두 번 재배.
  //       메밀은 주로 가루로 빻아 면·묵·전 등으로 먹는다. 출처: 제주특별자치도「제3차 제주메밀 산업 육성 기본계획」(2025, KOSIS 인용)
  // 수입: 2023년 메밀(HS 100810) 중국 1,236톤, 미국 739톤. 2025년 미국 723톤, 중국 655톤(UN Comtrade)
  // 가공: 메밀 가공 용도의 96% 이상이 면류(김수정 외「메밀의 국내외 생산동향과 전망」, 한국국제농업개발학회지 2017)
  // 식물: 마디풀과 한해살이풀, 생육기간이 짧고 가뭄·추위에 강하다(한국민족문화대백과「메밀」)
  p('jeju-buckwheat-farmer', '메밀 농부', 'kr-jeju', '제주는 우리나라에서 메밀을 가장 많이 기르는 곳이에요. 봄과 가을, 한 해에 두 번 기를 수 있어요.', 'straw', 'seed', 'farm', 'smile'),
  p('cn-buckwheat-farmer', '중국 메밀 농부', 'cn', '바다 건너 들어오는 메밀은 중국과 미국에서 가장 많이 와요.', 'straw', 'seed', 'farm', 'smile'),
  p('us-buckwheat-farmer', '미국 메밀 농부', 'us', '바다 건너 들어오는 메밀은 미국과 중국에서 가장 많이 와요.', 'cap', 'seed', 'farm', 'smile'),
  p('noodle-maker', '메밀국수 공장 작업자', 'kr', '메밀을 곱게 빻아 가루로 만들고 국수를 뽑아요. 메밀은 대부분 국수가 돼요.', 'chef', 'gear', 'lab', 'smile'),
  p('buckwheat-researcher', '메밀 연구원', 'kr', '메밀은 이름에 밀이 들어가지만 밀과는 다른 마디풀과 식물이에요. 짧은 기간에 자라고 추위와 가뭄에 강해요.', 'none', 'flask', 'lab', 'focus', 'rare', 'quiz'),

  // ── 감자 ──
  // 생산: 2024년 전국 19,449ha·524,012톤. 고랭지감자의 99.8%가 강원(강원특별자치도 식량작물 감자 통계)
  // 수확 후: 상처 치유 12~18℃·10~14일, 저장 3~4℃(농촌진흥청「감자 수확 후 관리」). 저장한 감자가 이듬해 봄까지 출하된다(KREI 농업관측 감자 2025년 4월호)
  // 수입: 냉동조제감자는 미국·유럽에서 1차 가공해 들어오며 주로 미국산(농림축산식품부 보도자료 2022-06-02).
  //       미국산 감자 수입은 연 12만 톤 안팎(한국농어민신문 2026-02-03, KREI 유찬희 보고서 인용)
  // 씨감자: 바이러스 오염을 막으려고 기본종을 시설·수경재배로 생산(농촌진흥청 웹진 2021-12)
  p('potato-farmer', '고랭지 감자 농부', 'kr-gangwon', '여름에도 서늘한 높은 밭에서 감자를 길러요. 우리나라 고랭지감자는 거의 다 강원에서 나요.', 'straw', 'basket', 'farm', 'smile'),
  p('potato-storage', '감자 저장고 관리인', 'kr', '캐낸 감자의 상처를 며칠 아물게 한 뒤 3~4℃ 저장고에 두고, 이듬해 봄까지 조금씩 내보내요.', 'beanie', 'box', 'coverall', 'smile'),
  p('us-fries-plant', '냉동 감자튀김 공장 작업자', 'us', '감자를 썰어 감자튀김 모양으로 가공하고 꽁꽁 얼려 보내요. 수입 냉동 감자튀김은 주로 미국에서 와요.', 'hood', 'gear', 'cleanroom', 'smile'),
  p('seed-potato-researcher', '씨감자 연구원', 'kr', '병에 걸리지 않은 첫 씨감자를 얻으려고 온실이나 물로만 키우는 수경재배로 씨감자를 길러요.', 'hood', 'seed', 'cleanroom', 'focus', 'rare', 'quiz'),

  // ── 고구마 ──
  // 생산: 2021년 재배면적 전남 26.7%로 최대, 전북 16.1%(허재욱 외 2023, 통계청 농작물생산조사 인용).
  //       식용 고구마 자급률 100%(이재웅 외, 한국작물학회 2020)
  // 재배: 씨고구마를 시설에서 30~35℃로 싹 틔워 자란 모를 잘라 심는다(뉴스서울 2024-02-19, 농촌진흥청 인용)
  // 큐어링: 수확 후 일주일 안에 30~33℃·습도 90~95%에서 4일, 저장 12~15℃(농촌진흥청「고구마 수확 후 관리기술」)
  p('sweetpotato-farmer', '고구마 농부', 'kr-honam', '씨고구마에서 키운 싹(모)을 잘라 밭에 심어요. 고구마밭은 전라남도에 가장 넓게 있어요.', 'straw', 'basket', 'farm', 'smile'),
  p('curing-worker', '고구마 큐어링 담당', 'kr', '캔 고구마를 30~33℃의 습한 방에 나흘쯤 두어 상처를 아물게 해요. 그래야 저장하는 동안 썩지 않아요.', 'cap', 'box', 'coverall', 'smile'),
  p('sweetpotato-seedling', '씨고구마 육묘 담당', 'kr', '비닐 터널 안 흙을 따뜻하게 데워 씨고구마에서 싹을 고르게 틔워요.', 'none', 'leaf', 'farm', 'smile', 'rare', 'quiz'),

  // ── 무 ──
  // 작형: 봄·고랭지·가을·월동무가 철마다 산지를 옮겨 가며 나온다. 7월 고랭지, 10월 가을무, 12월 월동무, 5월 봄무로 바뀐다.
  //       가을무가 전체 생산의 약 54%. 고랭지무는 김치 공장·식자재 업체가 주로 사서 도매시장 의존도가 가장 높다.
  //       정부가 무를 수매·비축했다가 부족할 때 도매시장에 푼다. 출처: KREI 현안분석 제11호「배추·무 월별 소비량 추정 및 시사점」(2016)
  // 고랭지: 평창 진부, 홍천 내면, 정선 임계, 강릉(농업인신문 2023-08-04). 가을무 파종 7월 중순~9월 상순(농사로 작형별 출하시기)
  // 월동무: 제주 2025년 5,585ha·373,797톤(제주농산물수급관리센터)
  p('radish-farmer', '가을무 농부', 'kr', '여름 끝 무렵 씨를 뿌려 가을에 무를 거둬요. 한 해에 나는 무의 절반 넘게가 가을무예요.', 'straw', 'leaf', 'farm', 'smile'),
  p('highland-radish-farmer', '고랭지 무 농부', 'kr-gangwon', '한여름에도 서늘한 강원 높은 밭에서 무를 길러요. 여름 무는 주로 김치 공장으로 가요.', 'straw', 'leaf', 'farm', 'smile'),
  p('jeju-radish-farmer', '월동무 농부', 'kr-jeju', '겨울 내내 밭에서 자란 무를 한겨울부터 봄까지 거둬요.', 'beanie', 'leaf', 'farm', 'smile'),
  p('radish-stockpile', '농산물 비축 담당자', 'kr', '무값이 크게 오를 때를 대비해 무를 사서 저장해 두었다가 모자랄 때 도매시장에 내놓아요.', 'cap', 'clipboard', 'office', 'smile', 'rare', 'quiz'),

  // ── 사과 ──
  // 생산: 2024년 재배면적 33,313ha 중 영남 23,422ha(약 70%), 강원 1,748ha. 후지 62.0%(저장성이 강함).
  //       강원·경기 신규 산지가 2010년보다 325% 늘었고 KREI는 온난화에 따른 재배지 북상을 이유로 든다.
  //       도매시장 반입의 17.9%가 장기 저장기(4~6월). 출처: KREI「농업전망 2025」제6장(통계청 농작물생산조사 인용)
  // 수입: 생과실은 식물방역법상 원칙적 수입 금지, 수입위험분석(8단계)을 마쳐야 수입된다. 사과 수입을 요청한 11개국 중 허용된 나라는 없다
  //       (농림축산식품부 설명자료 2024-03-15, 데일리안·아주경제 2024-03-11 농식품부 인용)
  // 저장: CA저장은 저장고의 온도·습도와 산소·이산화탄소 농도를 조절한다. 산소를 낮추면 호흡과 에틸렌 생성이 줄어든다
  //       (한국농업신문 2019-08-25 농촌진흥청 인용, 한국통신학회 논문 "Determination of Low-Oxygen Limit of Fuji Apples")
  // 선별: 산지유통센터(APC)에서 무게·색·당도로 등급을 나눈다(아주경제 2018-03-26, 대구경북능금농협 APC)
  p('apple-farmer', '사과 농부', 'kr-yeongnam', '우리나라 사과밭의 70%쯤이 경상도에 있어요. 오래 두고 먹기 좋은 후지 사과를 가장 많이 길러요.', 'straw', 'basket', 'farm', 'smile'),
  p('gw-apple-farmer', '강원 사과 농부', 'kr-gangwon-land', '날이 따뜻해지면서 사과 재배지가 북쪽으로 올라오고 있어요. 강원에도 새 사과밭이 늘었어요.', 'cap', 'basket', 'farm', 'smile'),
  p('apple-apc', '산지유통센터 선별원', 'kr', '사과를 무게와 색, 당도에 따라 여러 등급으로 골라 상자에 담아요.', 'hood', 'box', 'cleanroom', 'smile'),
  p('ca-storage', 'CA 저장고 관리인', 'kr', '저장고 공기 속 산소를 낮춰 사과의 숨을 늦춰요. 그래서 봄과 초여름에도 사과를 먹을 수 있어요.', 'beanie', 'gear', 'coverall', 'smile'),
  p('apple-quarantine', '수입 위험 분석 검역관', 'kr', '외국 과일을 들여오기 전에 병해충이 함께 들어올 위험을 여러 단계로 따져 봐요.', 'none', 'magnifier', 'lab', 'focus', 'rare', 'quiz'),

  // ── 포도 ──
  // 생산: 2024년 14,649ha, 약 19만 9천 톤. 경북 8,340ha(56.9%). 샤인머스캣 43.1%, 캠벨얼리 29.3%(2015년엔 캠벨얼리 약 70%).
  // 수입: 생포도 수입 2023년산 30,178톤. 평년 국가별 비중 칠레 44.7%, 미국 25.4%, 페루 18.1%, 호주 12.2%.
  //       출처: KREI「농업전망 2025」제6장(통계청·관세청 인용)
  // 품종: 샤인머스캣은 일본 과수연구소가 1988년 교배해 2006년 등록(시마네현 농업기술센터, 오카야마현 자료)
  p('grape-farmer', '포도 농부', 'kr-yeongnam', '요즘 우리 포도밭의 절반 가까이에서 샤인머스캣을 길러요. 예전에는 캠벨얼리가 대부분이었어요.', 'straw', 'basket', 'farm', 'smile'),
  p('cl-grape-farmer', '칠레 포도 농부', 'cl', '바다 건너 들어오는 생포도는 칠레에서 가장 많이 와요. 남반구라 우리와 계절이 반대예요.', 'straw', 'basket', 'farm', 'smile'),
  p('grape-breeder', '포도 품종 연구원', 'kr', '품종마다 다른 맛과 껍질을 비교해요. 샤인머스캣은 일본에서 만든 품종이에요.', 'none', 'seed', 'lab', 'focus', 'rare', 'quiz'),

  // ── 토마토 ──
  // 생산: 2024년 6,086ha, 약 32만 8천 톤. 일반토마토 최대 산지는 부산 대저(KREI「농업전망 2025」제7장, 농업경영체 등록정보 인용).
  //       KREI는 토마토를 수박·딸기와 함께 과채류(채소)로 다룬다.
  // 수입: 2024년 토마토 페이스트 34,262톤, 중국 62%·미국 24%(같은 자료, 관세청 인용)
  // 케첩: 요즘 케첩은 미국·칠레·중국산 토마토 농축액으로 만든다(한국일보 2023-05-20, 오뚜기 설명 인용)
  p('tomato-farmer', '토마토 농부', 'kr-daejeo', '부산 대저는 우리나라에서 일반 토마토를 가장 많이 기르는 곳이에요.', 'straw', 'basket', 'farm', 'smile'),
  p('cn-tomato-paste', '토마토 페이스트 공장 작업자', 'cn', '토마토를 졸여 진한 페이스트로 만들어요. 우리나라에 들어오는 토마토 페이스트는 중국산이 가장 많아요.', 'hood', 'drop', 'cleanroom', 'smile'),
  p('ketchup-maker', '케첩 공장 작업자', 'kr', '수입한 토마토 농축액으로 케첩을 만들어 병에 담아요.', 'chef', 'drop', 'lab', 'smile'),
  p('crop-forecaster', '농업관측 연구원', 'kr', '농산물이 얼마나 나고 팔릴지 내다봐요. 통계에서 토마토는 수박·딸기와 함께 채소로 묶여요.', 'none', 'clipboard', 'office', 'focus', 'rare', 'quiz'),

  // ── 보리 ──
  // 생산: 2026년 13만 6천 톤, 전남·광주 46.1%, 전북 39.5%(국가데이터처「2026년 보리·마늘·양파 생산량조사」, 데일리안 2026-07-30)
  // 재배: 10월 파종, 겨울을 나고 5월 하순~6월 수확(농사로 일반보리 농작업일정, 한국민족문화대백과「보리」)
  // 맥아: 보리를 물에 불려 싹을 틔운 뒤 말린 것. 맥주·위스키·차에 쓴다(국립식량과학원, 푸드투데이 2025-11-25). 엿기름이라고도 한다(한국민족문화대백과)
  // 수입: 2025년 상반기 맥아 수입 58,057톤, 호주 1위 17,808톤(한국경제 2025-09-16, 한국무역협회 자료)
  p('barley-farmer', '보리 농부', 'kr-honam', '가을에 씨를 뿌려 겨울을 나고 5월 말~6월에 거둬요. 우리 보리는 대부분 전라도에서 자라요.', 'straw', 'wheat', 'farm', 'smile'),
  p('au-malt', '맥아 공장 작업자', 'au', '보리를 물에 불려 싹을 틔운 뒤 말려 맥아를 만들어요. 우리나라가 들여오는 맥아는 호주산이 가장 많아요.', 'hood', 'wheat', 'cleanroom', 'smile'),
  p('barley-researcher', '맥류 연구원', 'kr', '싹 틔운 보리, 맥아는 엿기름이라고도 해요. 곡식의 녹말을 단맛으로 바꿔 줘요.', 'none', 'wheat', 'lab', 'focus', 'rare', 'quiz'),

  // ── 오징어 ──
  // 어획: 2024년 연근해 13,545톤(역대 최저, 수온이 평년보다 2~4℃ 높아 어군이 흩어짐), 원양 63,156톤(남서대서양 어장 호조)
  //       (해양수산부 보도자료 2025-02-21, 한국경제·노컷뉴스 2025-03-05). 원양 오징어는 주로 포클랜드 근처에서 잡는다(뉴스서울 2024-03-13, 해수부 인용)
  // 채낚기: 오징어는 빛을 따라 모여들어(추광성) 밤에 집어등을 켠다. 울릉도는 밤새 잡은 오징어를 햇볕에 말린다(한국민족문화대백과「울릉도 오징어」)
  p('distant-squid-fisher', '원양 오징어잡이 선원', 'sw-atlantic', '먼 남서대서양에서 밤마다 집어등을 켜고 낚싯줄을 오르내리며 오징어를 잡아요.', 'beanie', 'fish', 'sailor', 'smile'),
  p('ulleung-squid-fisher', '울릉도 오징어잡이 어민', 'kr-ulleung', '오징어는 빛을 따라 모여들어요. 밤바다에 집어등을 환하게 켜고 오징어를 잡아요.', 'beanie', 'fish', 'sailor', 'smile'),
  p('squid-dryer', '오징어 말리는 사람', 'kr-ulleung', '밤새 잡아 온 오징어를 햇볕에 말려요.', 'scarf', 'fish', 'apron', 'smile'),
  p('squid-researcher', '수산 자원 연구원', 'kr', '바닷물이 평소보다 따뜻해지면 오징어 떼가 흩어져요. 우리 바다의 오징어가 왜 줄었는지 살펴요.', 'none', 'fish', 'lab', 'focus', 'rare', 'quiz'),

  // ── 손에 닿기 직전: 가게·사무실 사람들 (여정 맨 끝, shared/data/shops.ts) ──
  p('barista', '바리스타', 'kr-town', '원두를 갈아 에스프레소를 내리고 우유 거품을 올려요. 오늘의 첫 잔을 건네는 사람이에요.', 'none', 'cup', 'apron', 'smile'),
  p('cvs-clerk', '편의점 직원', 'kr-town', '새벽에 들어온 물건을 진열하고 날짜가 지난 건 없는지 살펴요. 밤에도 불을 켜 두고 기다려요.', 'cap', 'box', 'apron', 'sleepy'),
  p('mart-cashier', '마트 계산원', 'kr-town', '바코드를 찍고, 장바구니에 담긴 물건을 하나하나 건네요.', 'cap', 'basket', 'apron', 'smile'),
  p('delivery-rider', '배달 라이더', 'kr-town', '갓 만든 음식이 식기 전에 오토바이로 골목을 달려 문 앞까지 가져다줘요.', 'helmet', 'box', 'rider', 'smile'),
  p('clothing-clerk', '옷가게 직원', 'kr-town', '옷을 개어 크기별로 정리하고, 잘 맞는 치수를 함께 찾아 줘요.', 'none', 'spool', 'apron', 'smile'),
  p('phone-clerk', '휴대폰 매장 직원', 'kr-town', '새 휴대폰을 켜고 예전 휴대폰의 사진과 연락처를 옮겨 줘요.', 'none', 'phone', 'office', 'smile'),
  p('trade-clerk', '무역회사 수입 담당', 'kr-seoul', '배에 실린 물건이 항구에 닿기 전에 수입 서류를 챙기고 통관 준비를 해요.', 'none', 'clipboard', 'office', 'smile'),
  p('merch-md', '상품 MD', 'kr-seoul', '매장에 어떤 물건을 놓을지 골라요. 산지와 공장을 오가며 맛과 품질을 직접 확인해요.', 'none', 'magnifier', 'office', 'smile'),
  p('dispatcher', '물류 배차 담당자', 'kr-gyeonggi', '오늘 나갈 상자들을 보고 어느 차가 어느 길로 갈지 정해요.', 'headset', 'clipboard', 'office', 'sleepy'),
  p('cs-agent', '고객센터 상담원', 'kr-seoul', '주문한 물건이 어디쯤 왔는지, 어떻게 쓰는지 묻는 전화에 하나하나 답해요.', 'headset', 'phone', 'office', 'smile'),
  // 책 길 (docs/redesign/book-people-review.md): 출판사·인쇄·제본·물류는 파주출판도시에
  p('book-writer', '작가', 'kr-seoul', '책상 앞에서 한 문장을 몇 번이고 고쳐 써요. 몇 달, 길게는 몇 년 걸린 원고가 책 한 권의 시작이에요.', 'none', 'clipboard', 'office', 'focus'),
  p('book-translator', '번역가', 'kr-seoul', '다른 나라 말로 쓰인 책을 우리말로 옮겨요. 꼭 맞는 낱말 하나를 찾느라 사전을 여러 권 펼쳐 둬요.', 'none', 'magnifier', 'office', 'focus'),
  p('book-editor', '편집자', 'kr-paju', '원고를 가장 먼저 읽는 사람이에요. 작가와 함께 순서를 다듬고, 표지와 인쇄 일정까지 챙겨요.', 'none', 'clipboard', 'office', 'smile'),
  p('proofreader', '교정·교열자', 'kr-paju', '맞춤법과 띄어쓰기, 연도와 이름이 맞는지 한 줄씩 확인해요. 같은 원고를 세 번 넘게 다시 읽어요.', 'none', 'magnifier', 'office', 'focus'),
  p('cover-designer', '북디자이너', 'kr-seoul', '원고를 읽고 표지 시안을 여러 장 그려요. 서점에서 이 책이 처음 눈에 띈 건 이 사람이 고른 색과 글자 덕분이에요.', 'beanie', 'clipboard', 'office', 'glad'),
  p('typesetter', '조판 디자이너', 'kr-paju', '본문을 책 크기에 맞춰 한 쪽씩 앉혀요. 줄 끝에 글자 하나만 덩그러니 남지 않게 살펴요.', 'none', 'clipboard', 'office', 'focus'),
  p('press-operator', '인쇄 기장', 'kr-paju', '판을 걸고 잉크를 맞춰, 큰 종이 한 장에 여러 쪽을 한꺼번에 찍어요. 색이 고르게 나오는지 계속 들여다봐요.', 'cap', 'gear', 'coverall', 'focus'),
  p('binder', '제본 작업자', 'kr-paju', '인쇄된 종이를 접고 순서대로 모아 실로 꿰매거나 풀로 붙여요. 표지를 씌우고 세 면을 잘라 책 모양을 만들어요.', 'cap', 'box', 'apron', 'smile'),
  p('book-logistics', '출판 물류센터 직원', 'kr-paju', '여러 출판사의 책을 맡아 두었다가 서점 주문대로 골라 상자에 담아요. 돌아온 책도 다시 제자리에 꽂아요.', 'cap', 'box', 'vest', 'smile'),
  // 앱·노래·인터넷 길 (docs/redesign/app-song-people-review.md)
  p('app-planner', '기획자', 'kr-pangyo', '무엇을 왜 만들지 정하고, 기능을 하나씩 적어 순서를 매겨요. 오늘 누른 버튼도 이 사람의 목록에서 시작했어요.', 'none', 'clipboard', 'office', 'smile'),
  p('ux-researcher', 'UX 리서처', 'kr-seoul', '사람들에게 시안을 직접 써 보게 하고, 어디서 손이 멈추는지 옆에서 적어요.', 'none', 'magnifier', 'office', 'focus'),
  p('ui-designer', 'UI 디자이너', 'kr-seoul', '버튼 크기와 글자, 색을 정해 화면을 그려요. 손가락이 닿기 쉬운 자리를 찾느라 몇 번이고 옮겨 봐요.', 'beanie', 'phone', 'office', 'glad'),
  p('app-developer', '앱 개발자', 'vn-hcm-city', '화면 시안을 휴대폰에서 돌아가는 코드로 옮겨요. 동료가 쓴 코드도 한 줄씩 읽고 의견을 남겨요.', 'headset', 'phone', 'office', 'focus'),
  p('server-developer', '서버 개발자', 'kr-pangyo', '보낸 메시지와 주문을 받아 저장하고, 받을 사람에게 빠짐없이 건네는 프로그램을 만들어요.', 'headset', 'chip', 'office', 'focus'),
  p('qa-tester', 'QA 테스터', 'vn-hanoi-city', '여러 휴대폰으로 같은 버튼을 수없이 눌러 보며, 고장 난 곳을 찾아 알려 줘요.', 'none', 'phone', 'office', 'focus'),
  p('localizer', '현지화 담당', 'kr-seoul', '앱 속 문장을 다른 나라 말로 옮기고, 화면에서 글자가 잘리지 않는지 확인해요.', 'none', 'clipboard', 'office', 'smile'),
  p('app-reviewer', '앱 마켓 심사원', 'us-sunnyvale', '새로 올라온 앱을 직접 써 보고, 약속한 규칙을 지키는지 확인해 통과시켜요.', 'none', 'magnifier', 'office', 'smile'),
  p('content-moderator', '신고 검수원', 'kr-chuncheon', '신고된 글과 사진을 살펴, 누군가를 다치게 하는 것이 없는지 가려내요. 모두가 편히 쓰도록 보이지 않는 곳을 지켜요.', 'headset', 'magnifier', 'office', 'focus'),
  p('track-maker', '트랙메이커', 'no-trondheim', '건반과 컴퓨터로 코드와 박자를 쌓아 노래의 뼈대를 만들어요. 멀리 서울로 보낼 곡을 고르고 있어요.', 'beanie', 'chip', 'office', 'glad'),
  p('topliner', '탑라이너', 'kr-seoul', '비트를 들으며 흥얼흥얼 멜로디를 얹어요. 여러 나라 작곡가와 한 방에 모여 곡을 끝내기도 해요.', 'headset', 'clipboard', 'office', 'glad'),
  p('lyricist', '작사가', 'kr-seoul', '데모 멜로디를 수없이 들으며 음절 수에 맞는 우리말을 찾아요. 부르기 쉬운 낱말을 고르고 또 골라요.', 'none', 'clipboard', 'office', 'focus'),
  p('arranger', '편곡자', 'kr-seoul', '어떤 악기가 언제 들어올지 정해 노래의 흐름을 다듬어요.', 'headset', 'chip', 'office', 'focus'),
  p('session-player', '세션 연주자', 'kr-seoul', '기타나 현악기를 들고 녹음실에 와서, 처음 받은 악보를 그 자리에서 연주해요.', 'none', 'spool', 'office', 'glad'),
  p('vocal-director', '보컬 디렉터', 'kr-seoul', '가수 옆에서 한 소절씩 감정과 발음을 함께 다듬고, 가장 좋은 목소리를 골라요.', 'headset', 'clipboard', 'office', 'smile'),
  p('recording-engineer', '녹음 엔지니어', 'kr-seoul', '마이크를 세우고 소리를 깨끗하게 담아요. 숨소리 하나까지 들으며 녹음 버튼을 눌러요.', 'headset', 'gear', 'office', 'focus'),
  p('mixing-engineer', '믹싱 엔지니어', 'us-virginia-beach', '여러 갈래로 나뉜 소리의 크기와 자리를 맞춰 하나의 노래로 섞어요.', 'headset', 'gear', 'office', 'focus'),
  p('mastering-engineer', '마스터링 엔지니어', 'us-edgewater', '다 섞인 노래가 어떤 이어폰으로 들어도 고르게 들리도록 마지막으로 다듬어요.', 'headset', 'gear', 'office', 'smile'),
  p('album-designer', '앨범 아트 디자이너', 'kr-seoul', '노래의 분위기를 한 장의 그림으로 담아 앨범 표지를 만들어요.', 'beanie', 'clipboard', 'office', 'glad'),
  p('music-distributor', '음원 유통 담당', 'kr-seoul', '발매 날짜와 시각을 정하고, 노래와 정보를 여러 음악 앱에 빠짐없이 올려요.', 'none', 'phone', 'office', 'smile'),
  p('datacenter-tech', '데이터센터 기술자', 'kr-ansan', '서버가 가득한 방을 돌며 깜빡이는 불빛을 살펴요. 고장 난 부품은 그 자리에서 갈아 끼워요.', 'none', 'wrench', 'coverall', 'focus'),
  p('cable-repairer', '해저 케이블 수리선 선원', 'sea', '바다 밑 인터넷 선이 끊기면 배를 타고 나가 끌어올려요. 먼지 하나 없는 방에서 가는 유리 실을 한 가닥씩 이어요.', 'beanie', 'anchor', 'sailor', 'focus'),
  p('base-station', '기지국 엔지니어', 'kr-seoul', '철탑에 올라 전파를 보내는 장비를 달고 방향을 맞춰요. 휴대폰이 잘 안 터지는 곳이 있으면 달려가요.', 'safetyHelmet', 'wrench', 'vest', 'smile'),
  // 컴퓨터·주변기기 길 (docs/redesign/computer-people-review.md)
  p('switch-maker', '스위치 공장 작업자', 'cn-dongguan', '손톱만 한 플라스틱 집에 금속 접점과 스프링을 넣고 닫아요. 키보드에는 이런 스위치가 키 수만큼 들어가요.', 'cap', 'gear', 'coverall', 'focus'),
  p('switch-tester', '스위치 검사원', 'cn-dongguan', '스위치를 눌러 보며 누르는 느낌과 접점이 제대로 붙는지 시험해요. 기준에 못 미치는 건 골라내요.', 'cap', 'magnifier', 'coverall', 'focus'),
  p('keyboard-assembler', '키보드 조립원', 'cn-zhuhai', '회로기판에 스위치를 꽂고 키캡을 하나씩 씌워요. 마지막에 모든 키가 눌리는지 확인해요.', 'cap', 'box', 'coverall', 'smile'),
  p('copper-hauler', '구리 광산 트럭 운전사', 'cl-escondida', '집채만 한 트럭을 몰고 구덩이 아래에서 구리 광석을 실어 올라와요. 바퀴 하나가 어른 키보다 커요.', 'safetyHelmet', 'pickaxe', 'miner', 'smile'),
  p('copper-smelter', '구리 제련 기술자', 'kr-ulsan', '바다 건너온 구리 광석 가루를 녹이고 걸러, 순도 높은 구리판을 만들어요.', 'helmet', 'flask', 'coverall', 'focus'),
  p('ccl-maker', '동박적층판 기술자', 'kr-jeungpyeong', '유리섬유에 수지를 먹인 판에 얇은 구리막을 붙여, 회로기판의 바탕이 될 판을 만들어요.', 'cap', 'gear', 'coverall', 'smile'),
  p('pcb-maker', '회로기판 공장 기술자', 'cn', '판에 작은 구멍을 뚫고, 구리를 입히고, 필요 없는 부분을 녹여 내 회로 길만 남겨요.', 'cap', 'chip', 'coverall', 'focus'),
  p('smt-operator', '부품 장착(SMT) 기사', 'tw-taoyuan', '기계가 작은 부품을 기판 위에 놓고 납땜하는 줄을 지켜요. 부품이 빠지면 바로 멈추고 채워 넣어요.', 'cap', 'chip', 'coverall', 'focus'),
  p('glass-maker', '유리 기판 기술자', 'cn-hefei', '녹인 유리를 흘려 내려 종이보다 얇은 큰 유리판을 만들어요. 화면은 이 유리 위에서 시작해요.', 'helmet', 'magnifier', 'coverall', 'focus'),
  p('panel-engineer', '패널 공정 엔지니어', 'kr-paju', '유리 위에 빛을 조절할 아주 작은 회로를 새기고, 두 장 사이에 액정을 넣어 패널을 만들어요.', 'hood', 'chip', 'cleanroom', 'focus'),
  p('module-assembler', '모듈 조립원', 'vn-haiphong', '바다 건너온 패널에 회로와 부품을 붙여 화면 모듈로 만들어요.', 'cap', 'gear', 'coverall', 'smile'),
  p('monitor-assembler', '모니터 조립원', 'vn-shtp', '화면 모듈을 틀에 넣고 받침대를 달아 모니터를 완성해요. 켜 보고 빛이 고르게 나는지 확인해요.', 'cap', 'box', 'coverall', 'smile'),
  p('cpu-fab', 'CPU 팹 엔지니어', 'tw-tainan', '웨이퍼 위에 수백 단계를 거쳐 회로를 새겨요. 손톱만 한 칩 안에 셀 수 없이 많은 길이 들어가요.', 'hood', 'chip', 'cleanroom', 'focus'),
  p('memory-packager', '메모리 패키징 기술자', 'kr-onyang', '회로를 새긴 웨이퍼를 칩 하나하나로 자르고 포장해, 제대로 기억하는지 시험해요.', 'hood', 'chip', 'cleanroom', 'focus'),
  p('sensor-designer', '센서 칩 설계자', 'tw-hsinchu', '바닥을 아주 빠르게 찍어 마우스가 얼마나 움직였는지 계산하는 칩을 설계해요.', 'none', 'chip', 'office', 'focus'),
  p('mouse-assembler', '마우스 조립원', 'cn-suzhou', '기판에 센서와 버튼을 얹고 몸체를 닫아 마우스를 만들어요. 버튼마다 딸깍 소리를 확인해요.', 'cap', 'box', 'coverall', 'smile'),
  p('pc-builder', '조립 PC 기사', 'kr-yongsan', '주문서대로 CPU와 메모리, 메인보드를 케이스에 넣고 선을 정리해요. 처음 전원이 켜질 때까지 지켜봐요.', 'none', 'wrench', 'apron', 'smile'),
  p('bookseller', '서점 직원', 'kr-town', '새로 나온 책을 매대에 놓고, 찾는 책이 어디 있는지 알려 줘요. 오늘 이 책을 건네준 사람이에요.', 'none', 'box', 'apron', 'smile'),

  // ── 숨은 만남 (에픽, 여정 중 아주 가끔) ──
  p('ship-cook', '배 위의 요리사', 'sea', '몇 주씩 바다 위에 있는 선원들의 하루 세 끼를 책임져요. 흔들리는 주방에서도 국을 끓여요.', 'chef', 'cup', 'apron', 'smile', 'epic', 'hidden'),
  p('reefer-tech', '냉동 컨테이너 기술자', 'sea', '얼리거나 차갑게 실어야 하는 화물이 상하지 않게 냉동 컨테이너의 온도를 살펴요.', 'beanie', 'wrench', 'coverall', 'smile', 'epic', 'hidden'),
  p('lashing-worker', '컨테이너 고박 작업자', 'kr-busan', '배에 쌓인 컨테이너가 파도에 흔들려도 떨어지지 않게 쇠막대와 고리로 단단히 묶어요.', 'safetyHelmet', 'wrench', 'vest', 'focus', 'epic', 'hidden'),
  p('plant-quarantine', '식물 검역관', 'kr-busan', '외국에서 들어온 농산물에 해충이나 병이 묻어 오지 않았는지 꼼꼼히 살펴요.', 'none', 'magnifier', 'lab', 'focus', 'epic', 'hidden'),
  p('customs-officer', '세관 직원', 'kr-incheon', '나라 밖에서 들어온 물건이 신고한 내용과 맞는지 확인해요.', 'cap', 'clipboard', 'office', 'focus', 'epic', 'hidden'),

  // ── 연결 발견 카드 (에픽) ──
  p('link-sea-crew', '두 물건을 한 배로 나른 선원', 'sea', '오늘 고른 물건 두 개가 어쩌면 같은 배를 타고 왔을지도 몰라요. 바다는 서로 다른 여정이 만나는 곳이에요.', 'beanie', 'anchor', 'sailor', 'smile', 'epic', 'link'),
  p('link-bulk-crew', '곡물과 광석을 함께 아는 선원', 'sea', '밀을 실었던 배가 다음 항해에는 철광석을 싣기도 해요. 같은 바다, 다른 화물.', 'beanie', 'wheat', 'sailor', 'smile', 'epic', 'link'),
  p('link-tanker-crew', '기름의 바닷길 안내자', 'sea', '원유와 식물성 기름은 전혀 다른 곳에서 오지만 둘 다 탱크에 담겨 바다를 건너요.', 'beanie', 'drop', 'sailor', 'smile', 'epic', 'link'),
  p('link-busan-crane', '부산항의 교차로 기사', 'kr-busan', '세계 곳곳에서 출발한 여정이 이 크레인 아래에서 한 번씩 만나요.', 'safetyHelmet', 'crane', 'vest', 'smile', 'epic', 'link'),
  p('link-air-cargo', '하늘길 교차로 조업원', 'kr-incheon', '서로 다른 나라에서 출발한 화물이 같은 날 같은 활주로에 내려요. 하늘에도 교차로가 있어요.', 'headset', 'phone', 'vest', 'smile', 'epic', 'link'),
  p('link-vn-factory', '두 물건을 만든 손', 'vn', '오늘 쓴 물건 두 개가 같은 나라의 같은 공장 지대에서 만들어졌어요.', 'cap', 'spool', 'coverall', 'smile', 'epic', 'link'),
  p('link-cn-refinery', '배터리 금속의 교차로', 'cn', '콩고의 코발트와 호주의 리튬이 이곳에서 함께 정련돼 배터리가 돼요.', 'helmet', 'chip', 'coverall', 'smile', 'epic', 'link'),
  p('link-kr-battery', '두 금속을 하나로', 'kr-chungbuk', '서로 다른 대륙에서 온 금속이 이곳에서 만나 하나의 배터리가 돼요.', 'hood', 'chip', 'cleanroom', 'smile', 'epic', 'link'),
  p('link-incheon-port', '서해 관문의 교차로', 'kr-incheon-port', '바다 건너 가까운 나라와 먼 나라의 화물이 같은 부두에 내려요.', 'safetyHelmet', 'crane', 'vest', 'smile', 'epic', 'link'),
  p('link-garak', '새벽 경매장의 교차로', 'kr-garak', '서로 다른 밭에서 거둔 감자와 사과, 무가 같은 새벽 같은 경매장에서 값을 받아요.', 'cap', 'clipboard', 'office', 'sleepy', 'epic', 'link'),
  p('link-santos-port', '남미의 관문', 'br-santos', '종이가 될 펄프, 주스가 될 오렌지, 두부가 될 콩이 같은 항구에서 배에 올라요.', 'safetyHelmet', 'orange', 'vest', 'smile', 'epic', 'link'),

  // ── 세트 완성 카드 (전설) ──
  p('harbor-pilot', '항만 도선사', 'kr-busan', '거대한 배가 항구에 안전하게 들어오도록 직접 배에 올라 길을 안내해요. 바다를 건넌 모든 여정의 마지막 길잡이.', 'beanie', 'anchor', 'sailor', 'focus', 'legendary', 'set'),
  p('seed-vault', '종자 저장고 관리자', 'no-svalbard', '북극의 얼음 산속 저장고에 세계의 씨앗을 보관해요. 땅을 일구는 모든 사람의 내일을 지키는 곳이에요.', 'beanie', 'seed', 'coverall', 'smile', 'legendary', 'set'),
  p('mine-rescue', '광산 구조대원', 'au-wa', '땅속에서 사고가 나면 가장 먼저 들어가는 사람이에요. 땅속에서 일하는 모든 사람의 든든한 뒷배.', 'minerLamp', 'clipboard', 'miner', 'focus', 'legendary', 'set'),
  p('table-setter', '급식실 영양사', 'kr', '수많은 사람의 한 끼를 위해 세계 곳곳에서 온 재료로 매일 식단을 짜요. 오늘의 밥상을 차리는 사람.', 'chef', 'clipboard', 'apron', 'smile', 'legendary', 'set'),
  p('safety-inspector', '산업안전 감독관', 'kr', '공장에서 일하는 사람들이 다치지 않도록 현장을 살피고 바꿔 나가요.', 'safetyHelmet', 'clipboard', 'vest', 'focus', 'legendary', 'set'),
]

/**
 * 일의 크기를 보여 주는 한 줄. "이 사람은 힘들다"가 아니라 "이 일은 이렇게 한다"로 쓴다.
 * 임금·소득·빈곤·사고 통계는 넣지 않는다. 웹에서 출처를 확인한 숫자만 쓰고, 확인이 안 되면 비워 둔다.
 */
/**
 * human: 사람 한 명의 하루·손에 잡히는 크기의 숫자(한 시간에 25개, 하루 300상자, 한 건에 5초). 사람 카드 소개 화면은 이것만 쓴다.
 * 배·항구·공장 전체의 크기(한 척에 2만 개, 한 해 1억 톤)는 human이 아니다.
 */
const WORK_FACTS: Record<string, { fact: string; source: FactSource; human?: true }> = {
  warehouse: { fact: '큰 허브는 하루 약 170만 상자를 나눠 보낼 수 있어요.', source: { name: "이투데이 '창고혁명' CJ대한통운, 하루 170만 상자 처리", year: 2020, url: 'https://www.etoday.co.kr/news/view/1884915' } },
  'bulk-crew': { fact: '큰 벌크선 한 척에 철광석을 약 17만 톤 실어요.', source: { name: 'Marine Link, capesize 시장 보고', year: 2017, url: 'https://www.marinelink.com/news/bulkcapesize-increased422429' } },
  // 출처 수치는 TEU(20피트 컨테이너 환산 단위)라 '20피트로 치면'으로 쓴다
  'sea-crew': { fact: '큰 배 한 척에 20피트 컨테이너로 치면 약 2만 4천 개만큼 실어요.', source: { name: '데일리안 [르포] HMM, 최대 컨테이너선 12척 확보', year: 2020, url: 'https://www.dailian.co.kr/news/view/912046/' } },
  'trade-clerk': { fact: '배가 들어와 통관이 끝나기까지 보통 약 1.7일 걸려요.', source: { name: '관세청 보도자료 "수입화물 처리시간 전년대비 18% 단축"(2016년 기준)', year: 2017, url: 'https://www.kctdi.or.kr/service/board/BoardServlet?cmd=detail&type=HT4_1&sc.row_id=3296&sc.layout=left_news&sc.rowsPerPage=10&sc.boardid=B00004&sc.endRow=0&sc.startRow=0&sc.passTF=false&sc.pageNo=1' } },
  'merch-md': { fact: '대형마트에는 보통 약 3만~5만 가지 물건이 놓여요.', source: { name: '파이낸셜뉴스(뉴스1)', year: 2026, url: 'https://www.fnnews.com/news/202607270620337290' } },
  'busan-crane': { fact: '한 시간에 컨테이너를 약 25개 들어 옮겨요.', source: { name: '부산일보 [SEA&기사] 해양직업 11 초대형 크레인 기사', year: 2010, url: 'https://www.busan.com/view/busan/view.php?code=20100528000167' }, human: true },
  'tanker-crew': { fact: '초대형 유조선 한 척에 원유를 약 200만 배럴 실어요.', source: { name: 'U.S. EIA, Today in Energy', year: 2014, url: 'https://www.eia.gov/todayinenergy/detail.php?id=17991' } },
  'oil-worker': { fact: '사우디 가와르 유전에서는 원유 층이 약 2,100m 깊이에 있어요.', source: { name: 'Offshore Technology, Ghawar Oil Field', year: 2026, url: 'https://www.offshore-technology.com/projects/ghawar-oil-field/' } },
  'ulsan-refinery': { fact: '하루 약 84만 배럴의 원유를 정제해요.', source: { name: '비즈워치, SK 울산CLX 기사', year: 2023, url: 'https://news.bizwatch.co.kr/article/industry/2023/09/15/0029' } },
  'yeosu-chem': { fact: '공장 한 곳이 한 해 에틸렌을 약 200만 톤 만들 수 있어요.', source: { name: '뉴데일리경제, LG화학 여수공장 NCC 증설', year: 2021, url: 'https://biz.newdaily.co.kr/site/data/html/2021/06/25/2021062500035.html' } },
  injection: { fact: '병뚜껑은 약 3.5초마다 72개씩 찍혀 나와요.', source: { name: 'INEOS Olefins & Polymers Europe, Fakuma 시연', year: 2011, url: 'https://www.ineos.com/no/businesses/Ineos-olefinpolymerer-Europa/Nyheter/meet-us-there-ineos-olefins-polymers-europe-at-the-fakuma/' } },
  'santos-port': { fact: '한 해 약 1억 8천만 톤의 화물이 이 항구를 지나요.', source: { name: 'Datamar News, Port of Santos 2024년 화물 처리 기록', year: 2025, url: 'https://www.datamarnews.com/noticias/port-of-santos-sets-historical-record-for-cargo-throughput-in-2024/' } },
  'garak-auctioneer': { fact: '경매 한 건은 보통 약 4~5초면 끝나요.', source: { name: "서울신문 '가락시장 40년'", year: 2025, url: 'https://m.seoul.co.kr/news/2025/06/16/20250616002003' }, human: true },
  // 기사: '지난해(2024년) 인천항 벌크 물동량은 9천328만3천965t' (해운항만물류정보시스템)
  'incheon-port': { fact: '인천항에는 한 해 벌크 화물 약 9,300만 톤이 오가요.', source: { name: "경인일보 '컨테이너 물동량 역대최고' 인천항", year: 2025, url: 'https://www.kyeongin.com/article/1727839' } },
  eucalyptus: { fact: '심은 나무를 베기까지 보통 약 7년을 가꿔요.', source: { name: 'Suzano BIO, Behind our innovation, there is BIO', year: 2026, url: 'https://biopulp.suzano.com.br/news/behind-our-innovation-there-is-bio' }, human: true },
  'pulp-mill': { fact: '큰 공장 한 곳이 한 해 펄프 약 255만 톤을 만들어요.', source: { name: 'PaperAge, Suzano begins operation of new pulp mill', year: 2024, url: 'https://paperage.com/2024news/07-22-2024suzano-begins-operation-of-new-pulp-mill.html' } },
  'paper-mill': { fact: '종이가 1분에 약 660m씩 기계에서 나와요.', source: { name: "헤럴드경제 '1분에 660m' 한솔제지 천안공장", year: 2026, url: 'https://www.heraldk.com/article/2026031218570432623' } },
  courier: { fact: '하루 보통 약 250~300개의 상자를 문 앞까지 날라요.', source: { name: '바이라인네트워크, CJ대한통운 택배기사 인터뷰', year: 2019, url: 'https://byline.network/2019/05/03-9/' }, human: true },
  'cane-harvester': { fact: '수확기 한 대로 하루 약 800~1,000톤을 거둬요.', source: { name: 'Farmonline, Capacity the key to cane harvest', year: 2016, url: 'https://www.farmonline.com.au/story/4210325/capacity-the-key-to-cane-harvest/' }, human: true },
  'raw-sugar-mill': { fact: '공장 한 곳이 한 해 사탕수수 약 150만 톤을 짜요.', source: { name: 'Wikipedia, List of sugar mills in Queensland (Macknade)', year: 2026, url: 'https://en.wikipedia.org/wiki/List_of_sugar_mills_in_Queensland' } },
  // 밀 1부셸 = 60파운드 = 약 27.2kg. 50만 부셸 × 27.2kg ≈ 1만 3,600톤, 150만 부셸 × 27.2kg ≈ 4만 800톤
  'grain-elevator': { fact: '저장탑 하나에 밀을 약 1만 4천~4만 톤 담아요.', source: { name: 'Kansas Historical Society, Kansapedia "Milling and Grain Storage"', year: 2011, url: 'https://www.kansashistory.gov/kansapedia/milling-and-grain-storage/12149' } },
  // 160만 부셸 × 27.2kg ≈ 4만 3,520톤
  'pnw-port': { fact: '큰 배 한 척에 밀을 약 4만 4천 톤 실어요.', source: { name: 'Federal Reserve Bank of San Francisco, Exploring Grain Exports in Oregon', year: 2025, url: 'https://www.frbsf.org/research-and-insights/blog/around-the-district/2025/04/15/exploring-grain-exports-in-oregon/' } },
  // 출처: 밀 1부셸(60파운드)에서 밀가루 42파운드. 42 ÷ 60 = 0.7 → 밀 100kg에서 약 70kg
  'flour-mill': { fact: '밀 100kg에서 밀가루가 약 70kg 나와요.', source: { name: 'Kansas Wheat, What does a bushel of wheat mean to me?', year: 2015, url: 'https://kswheat.com/news/what-does-a-bushel-of-wheat-mean-to-me' }, human: true },
  'coffee-picker': { fact: '약 8~10일마다 나무를 돌며 익은 체리만 따요.', source: { name: 'Wikipedia, Coffee production', year: 2026, url: 'https://en.wikipedia.org/wiki/Coffee_production' }, human: true },
}

for (const person of list) {
  const w = WORK_FACTS[person.id]
  if (w) Object.assign(person, { workFact: w.fact, workFactSource: w.source, ...(w.human ? { workFactHuman: true } : {}) })
}

// 이름은 names.ts에서. 연결 카드는 원래 사람과 같은 이름을 쓴다
for (const person of list) {
  const name = nameOf(person.id)
  if (name) person.name = name
}

export const PEOPLE: Record<string, Person> = Object.fromEntries(list.map((x) => [x.id, x]))
export const PEOPLE_LIST = list
