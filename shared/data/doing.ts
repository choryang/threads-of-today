/**
 * 여정 화면 '지금은 아마 …고 있을 거예요'. 그곳 시각으로 일하는 시간(hours, 기본 7~18시) work,
 * 일이 끝나고 4시간 eve(기본이면 18~22시 저녁), 그 밖 sleep.
 * 직접 쓴 짐작이라 '아마'를 붙인다. 숫자·나라 이름은 넣지 않는다(check:data). 앞의 '지금은 아마 '는 shared/local-time.ts가 붙인다.
 * eve·sleep이 없으면 DOING_DEFAULT의 일반 문구. 배 위에서 지내는 사람처럼 저녁·잠자리가 다른 사람만 따로 쓴다.
 * hours를 기본과 다르게 둔 사람(밤·새벽에 일하는 사람)은 eve·sleep도 그 시간에 맞게 쓴다(check:data).
 * days: 'weekdays'인 사람(사무실·낮 근무 공장)은 그 나라의 주말·공휴일(shared/data/calendar.ts)에 일하는 시간이면 쉬는 문구.
 * 농장·배·항구·가게처럼 날마다 돌아가는 일은 days를 두지 않는다.
 * 사람이 없거나 문구가 없는 사람도 DOING_DEFAULT로 보인다.
 */

export type DoingBucket = 'work' | 'eve' | 'sleep'
export type Doing = {
  work: string
  eve?: string
  sleep?: string
  /** 일하는 시간 [시작, 끝) 그곳 시각(시). 끝이 시작보다 작으면 자정을 넘긴다. 없으면 DEFAULT_HOURS */
  hours?: [number, number]
  /** 'weekdays': 주말·공휴일에 쉰다 */
  days?: 'weekdays'
}

export const DEFAULT_HOURS: [number, number] = [7, 18]
/** 일이 끝나고 eve 문구를 보여 주는 시간 */
export const EVE_HOURS = 4

export const DOING_DEFAULT: Record<DoingBucket | 'off', string> = {
  work: '일하고 있을 거예요',
  eve: '일을 마치고 저녁을 먹고 있을 거예요',
  sleep: '자고 있을 거예요',
  /** 주말에 일하는 시간. 이 문구는 '지금은 아마'를 붙이지 않고 그대로 (공휴일은 '오늘은 ○○이라 아마 쉬고 있을 거예요') */
  off: '오늘은 쉬는 날이라 아마 집에서 쉬고 있을 거예요',
}

/** 낮 근무, 주말·공휴일에 쉬는 사람 */
const WEEKDAYS = { days: 'weekdays' } as const

/** 배에서 지내는 사람들의 잠자리. 쉬는 시간(eve)은 사람마다 다르게 쓴다 (이야기가 있는 사람은 그 이야기에서) */
const ABOARD = { sleep: '선실에서 자고 있을 거예요' }

export const DOING: Record<string, Doing> = {
  // 운송
  'sea-crew': { work: '갑판에서 짐을 살피고 있을 거예요', eve: '식당에서 동료들과 고향 음식을 나눠 먹고 있을 거예요', ...ABOARD },
  'bulk-crew': { work: '화물칸 덮개가 잘 닫혔는지 살피고 있을 거예요', eve: '갑판에 앉아 수첩에 오늘 바다를 그리고 있을 거예요', ...ABOARD },
  'tanker-crew': { work: '배관 밸브를 하나씩 점검하고 있을 거예요', eve: '낮에 들은 기계 소리를 수첩에 옮겨 적고 있을 거예요', ...ABOARD },
  'reefer-crew': { work: '냉동 창고 온도를 확인하고 있을 거예요', eve: '휴게실에서 동료들과 카드놀이를 하고 있을 거예요', ...ABOARD },
  'ship-cook': { work: '선원들 밥을 짓고 있을 거예요', hours: [5, 19], eve: '설거지를 마치고 내일 장거리를 세고 있을 거예요', sleep: ABOARD.sleep },
  'reefer-tech': { work: '냉동 컨테이너 전원을 하나씩 확인하고 있을 거예요', eve: '다음 항구에서 받을 부품 목록을 정리하고 있을 거예요', ...ABOARD },
  'lashing-worker': { work: '컨테이너를 쇠막대로 단단히 묶고 있을 거예요' },
  'barge-crew': { work: '강물을 따라 바지선을 밀고 있을 거예요', eve: '강가 불빛을 보며 저녁을 먹고 있을 거예요', ...ABOARD },
  'tuna-fisher': { work: '갑판에서 낚싯줄을 감고 있을 거예요', eve: '낚싯바늘을 손질하며 동료와 이야기하고 있을 거예요', ...ABOARD },
  // 오징어는 밤에 집어등을 켜고 잡는다
  'distant-squid-fisher': { work: '집어등 불빛 아래서 오징어를 끌어올리고 있을 거예요', hours: [18, 5], eve: '잡은 오징어를 상자에 담아 얼리고 있을 거예요', sleep: '밤 조업을 앞두고 선실에서 자고 있을 거예요' },
  'ulleung-squid-fisher': { work: '불을 밝힌 배에서 오징어를 잡고 있을 거예요', hours: [18, 4], eve: '항구로 돌아와 오징어를 내리고 있을 거예요', sleep: '밤 조업을 앞두고 자고 있을 거예요' },
  'busan-crane': { work: '크레인 조종석에서 컨테이너를 내리고 있을 거예요', eve: '교대하고 퇴근하는 길일 거예요' },
  'air-cargo': { work: '비행기 화물칸에 짐을 싣고 있을 거예요', sleep: '밤 비행기 짐을 내리고 있을지도 몰라요' },
  'oslo-air': { work: '연어 상자를 화물기에 싣고 있을 거예요' },
  'hanoi-air': { work: '반도체 상자를 화물기에 옮기고 있을 거예요' },
  warehouse: { work: '물류센터에서 상자를 분류하고 있을 거예요', sleep: '밤 근무 조라면 상자를 옮기고 있을지도 몰라요' },
  courier: { work: '골목골목 택배를 나르고 있을 거예요', hours: [7, 20], eve: '마지막 상자를 내려놓고 쉬고 있을 거예요', sleep: '아침 배송을 앞두고 자고 있을 거예요' },
  'milk-collector': { work: '목장을 돌며 우유를 모으고 있을 거예요', hours: [5, 15], eve: '탱크로리를 씻고 쉬고 있을 거예요', sleep: '새벽 집유를 앞두고 자고 있을 거예요' },
  dispatcher: { work: '트럭마다 갈 길을 짜고 있을 거예요', ...WEEKDAYS },

  // 항구
  'santos-port': { work: '부두에서 짐을 옮기고 있을 거예요' },
  'djibouti-docker': { work: '부두에서 커피 자루를 컨테이너에 싣고 있을 거예요' },
  'abidjan-docker': { work: '카카오 자루를 배에 싣고 있을 거예요' },
  'pnw-port': { work: '밀을 배에 흘려 넣고 있을 거예요' },
  'davao-port': { work: '바나나 상자를 냉동 컨테이너에 싣고 있을 거예요' },
  'chittagong-port': { work: '옷 상자가 든 컨테이너를 옮기고 있을 거예요' },
  'vn-port': { work: '부두에서 컨테이너를 정리하고 있을 거예요' },
  'laemchabang-port': { work: '고무 자루를 컨테이너에 싣고 있을 거예요' },
  'hedland-port': { work: '철광석을 배에 싣는 줄을 지켜보고 있을 거예요' },
  'qingdao-port': { work: '고춧가루 자루를 배에 싣고 있을 거예요' },
  'incheon-port': { work: '배에서 내린 짐을 옮기고 있을 거예요' },
  'tauranga-port': { work: '통나무를 배에 싣고 있을 거예요' },
  'valencia-port': { work: '냉동 컨테이너를 배에 올리고 있을 거예요' },
  'nola-port': { work: '옥수수를 큰 배에 싣고 있을 거예요' },
  'co-buenaventura-docker': { work: '커피 자루를 컨테이너에 쌓고 있을 거예요' },
  'vn-coffee-port': { work: '수출할 커피 자루의 서류를 맞추고 있을 거예요' },
  'br-santos-coffee': { work: '커피 자루마다 맛을 보고 등급을 매기고 있을 거예요' },
  'gh-takoradi-docker': { work: '카카오 자루를 배에 싣고 있을 거예요' },

  // 커피
  'coffee-picker': { work: '커피 밭에서 열매를 따고 있을 거예요', eve: '집에서 저녁을 먹고 있을 거예요' },
  'washing-station': { work: '커피 열매 껍질을 벗기고 물에 씻고 있을 거예요' },
  roaster: { work: '생두를 볶으며 소리를 듣고 있을 거예요' },
  'co-coffee-farmer': { work: '비탈진 밭에서 커피 열매를 따고 있을 거예요' },
  'vn-coffee-farmer': { work: '커피 나무에 물을 주고 있을 거예요' },
  'br-coffee-farmer': { work: '넓은 커피 밭을 둘러보고 있을 거예요' },
  barista: { work: '커피를 내리고 있을 거예요', eve: '가게 문을 닫고 기계를 닦고 있을 거예요' },

  // 카카오·설탕
  'cacao-farmer': { work: '카카오 열매를 칼로 따고 있을 거예요' },
  'gh-cacao-farmer': { work: '카카오 열매를 쪼개 씨를 꺼내고 있을 거예요' },
  'cacao-dryer': { work: '햇볕에 카카오 콩을 뒤집고 있을 거예요' },
  'cocoa-grinder': { work: '카카오 콩을 곱게 갈고 있을 거예요' },
  'cane-harvester': { work: '사탕수수 밭에서 수확기를 몰고 있을 거예요' },
  'raw-sugar-mill': { work: '사탕수수 즙을 끓이고 있을 거예요' },
  'sugar-refinery': { work: '원당을 하얗게 거르고 있을 거예요' },

  // 곡물·가루
  'wheat-farmer': { work: '밀밭을 둘러보고 있을 거예요' },
  'grain-elevator': { work: '곡물 저장고 온도를 확인하고 있을 거예요' },
  'flour-mill': { work: '밀을 빻는 기계를 살피고 있을 거예요' },
  'rice-farmer': { work: '논에 물꼬를 보고 있을 거예요' },
  'rice-mill': { work: '벼를 찧고 쌀을 고르고 있을 거예요' },
  'corn-farmer': { work: '옥수수 밭을 둘러보고 있을 거예요' },
  'starch-plant': { work: '옥수수에서 전분을 거르고 있을 거예요' },
  'barley-farmer': { work: '보리밭을 둘러보고 있을 거예요' },
  'au-malt': { work: '보리 싹을 틔우는 방을 살피고 있을 거예요' },
  'soy-farmer': { work: '콩밭을 둘러보고 있을 거예요' },
  'tofu-maker': { work: '콩물을 굳혀 두부를 만들고 있을 거예요', hours: [4, 13], eve: '일을 마치고 쉬고 있을 거예요', sleep: '새벽 두부를 앞두고 자고 있을 거예요' },
  'redbean-farmer': { work: '팥 꼬투리를 거두고 있을 거예요' },
  'cn-redbean-farmer': { work: '팥을 말리고 있을 거예요' },
  'anko-maker': { work: '팥을 삶아 앙금을 저어 주고 있을 거예요', ...WEEKDAYS },
  'jeju-buckwheat-farmer': { work: '메밀밭을 둘러보고 있을 거예요' },
  'cn-buckwheat-farmer': { work: '메밀을 털고 있을 거예요' },
  'us-buckwheat-farmer': { work: '넓은 메밀밭을 둘러보고 있을 거예요' },
  'noodle-maker': { work: '메밀 반죽을 국수로 뽑고 있을 거예요', ...WEEKDAYS },

  // 기름
  'palm-harvester': { work: '긴 장대로 기름야자 열매를 따고 있을 거예요' },
  'palm-mill': { work: '기름야자 열매를 쪄서 짜고 있을 거예요' },
  'oil-food-plant': { work: '기름을 맑게 거르고 있을 거예요' },

  // 바다·물
  // 김은 차가운 새벽 바다에서 거둔다
  'laver-farmer': { work: '김발을 살피러 배를 타고 있을 거예요', hours: [4, 13], eve: '바다 일을 마치고 쉬고 있을 거예요', sleep: '새벽 물때를 기다리며 자고 있을 거예요' },
  'laver-processor': { work: '김을 얇게 펴서 말리고 있을 거예요' },
  cannery: { work: '참치를 깡통에 담고 있을 거예요' },
  'salmon-farmer': { work: '가두리 그물 속 연어를 살피고 있을 거예요' },
  'salmon-processor': { work: '연어를 손질하고 있을 거예요' },
  'shrimp-farmer': { work: '새우 연못에 먹이를 주고 있을 거예요' },
  'shrimp-processor': { work: '새우 껍질을 까고 있을 거예요' },
  'squid-dryer': { work: '오징어를 줄에 널고 있을 거예요' },

  // 과일·채소
  'banana-farmer': { work: '바나나 송이에 봉지를 씌우고 있을 거예요' },
  'banana-packer': { work: '바나나를 씻어 상자에 담고 있을 거예요' },
  ripening: { work: '숙성실 온도를 맞추고 있을 거예요' },
  'orange-picker': { work: '사다리에 올라 오렌지를 따고 있을 거예요' },
  'juice-plant': { work: '오렌지를 짜서 졸이고 있을 거예요' },
  'beverage-plant': { work: '병에 음료가 잘 담기는지 보고 있을 거예요' },
  'chili-farmer': { work: '빨갛게 익은 고추를 따고 있을 거예요' },
  'chili-mill': { work: '마른 고추를 빻고 있을 거예요' },
  'cabbage-farmer': { work: '높은 밭에서 배추를 거두고 있을 거예요' },
  'cabbage-trader': { work: '밭을 돌며 배추 상태를 보고 있을 거예요' },
  'kimchi-maker': { work: '배추에 양념을 버무리고 있을 거예요', ...WEEKDAYS },
  // 도매시장 경매는 밤에 열린다
  'garak-auctioneer': { work: '경매장에서 손짓으로 값을 부르고 있을 거예요', hours: [22, 7], eve: '경매를 마치고 물건을 정리하고 있을 거예요', sleep: '밤 경매를 앞두고 자고 있을 거예요' },
  'potato-farmer': { work: '감자를 캐고 있을 거예요' },
  'potato-storage': { work: '감자 저장고 온도를 확인하고 있을 거예요' },
  'us-fries-plant': { work: '감자를 길게 썰어 튀기고 있을 거예요' },
  'sweetpotato-farmer': { work: '고구마를 캐고 있을 거예요' },
  'curing-worker': { work: '고구마가 따뜻한 방에서 잘 아물었는지 보고 있을 거예요' },
  'radish-farmer': { work: '무를 뽑고 있을 거예요' },
  'highland-radish-farmer': { work: '높은 밭에서 무를 뽑고 있을 거예요' },
  'jeju-radish-farmer': { work: '겨울 밭에서 무를 뽑고 있을 거예요' },
  'apple-farmer': { work: '사과 나무 가지를 살피고 있을 거예요' },
  'gw-apple-farmer': { work: '서늘한 밭에서 사과를 따고 있을 거예요' },
  'apple-apc': { work: '사과를 크기별로 고르고 있을 거예요' },
  'ca-storage': { work: '사과 저장고 공기를 맞추고 있을 거예요' },
  'grape-farmer': { work: '포도송이에 봉지를 씌우고 있을 거예요' },
  'cl-grape-farmer': { work: '포도를 따서 상자에 담고 있을 거예요' },
  'tomato-farmer': { work: '빨갛게 익은 토마토를 따고 있을 거예요' },
  'cn-tomato-paste': { work: '토마토를 졸이고 있을 거예요' },
  'ketchup-maker': { work: '케첩 병이 잘 채워지는지 보고 있을 거예요', ...WEEKDAYS },
  'tea-farmer': { work: '차밭에서 어린 잎을 따고 있을 거예요' },
  'tea-roaster': { work: '뜨거운 솥에서 찻잎을 덖고 있을 거예요' },

  // 고기·우유·달걀
  'dairy-farmer': { work: '소젖을 짜고 있을 거예요', hours: [5, 18], eve: '소들을 재우고 저녁을 먹고 있을 거예요', sleep: '새벽 젖 짜기를 앞두고 자고 있을 거예요' },
  'dairy-plant': { work: '우유를 데우고 병에 담고 있을 거예요' },
  'cattle-rancher': { work: '목장에서 소들을 돌보고 있을 거예요' },
  meatworks: { work: '소고기를 부위별로 나누고 있을 거예요' },
  'pig-farmer': { work: '돼지우리를 청소하고 있을 거예요' },
  'pork-plant': { work: '돼지고기를 손질하고 있을 거예요' },
  'broiler-farmer': { work: '닭장 온도를 확인하고 있을 거예요' },
  'chicken-plant': { work: '닭고기를 손질하고 있을 거예요' },
  'chicken-shop': { work: '치킨을 튀기고 있을 거예요', hours: [14, 2], eve: '가게 문을 닫고 정리하고 있을 거예요', sleep: '자고 있을 거예요' },
  'egg-farmer': { work: '달걀을 모으고 있을 거예요' },
  'egg-gp': { work: '달걀을 불빛에 비춰 고르고 있을 거예요' },

  // 옷·섬유
  'cotton-farmer': { work: '목화 송이를 따고 있을 거예요' },
  'cotton-gin': { work: '목화에서 씨를 빼고 있을 거예요' },
  spinner: { work: '실을 뽑는 기계를 지켜보고 있을 거예요' },
  'garment-sewer': { work: '재봉틀로 옷을 박고 있을 거예요', ...WEEKDAYS },
  'poly-fiber': { work: '합성섬유 실을 감고 있을 거예요' },
  'vn-factory': { work: '공장에서 물건을 조립하고 있을 거예요', ...WEEKDAYS },

  // 석유·화학·고무
  'oil-worker': { work: '유전 설비를 점검하고 있을 거예요' },
  'ulsan-refinery': { work: '정유 공장 계기판을 지켜보고 있을 거예요', sleep: '밤 근무 조라면 계기판을 지켜보고 있을지도 몰라요' },
  'yeosu-chem': { work: '석유화학 공장 설비를 살피고 있을 거예요', sleep: '밤 근무 조라면 설비를 살피고 있을지도 몰라요' },
  injection: { work: '사출기에서 나온 플라스틱을 고르고 있을 거예요' },
  // 고무 수액은 새벽에 가장 잘 흐른다
  'rubber-tapper': { work: '고무나무 껍질에 홈을 내고 수액을 모으고 있을 거예요', hours: [3, 12], eve: '모은 수액을 넘기고 쉬고 있을 거예요', sleep: '새벽 수액 채취를 앞두고 자고 있을 거예요' },
  'rubber-processor': { work: '고무를 눌러 판으로 만들고 있을 거예요' },

  // 광물·금속·전자
  'cobalt-miner': { work: '광산에서 돌을 캐고 있을 거예요' },
  'lithium-miner': { work: '소금물 연못을 살피고 있을 거예요' },
  'cn-refinery': { work: '광물을 녹여 거르는 설비를 지켜보고 있을 거예요' },
  'kr-battery': { work: '배터리 생산 라인을 점검하고 있을 거예요' },
  'fab-engineer': { work: '방진복을 입고 클린룸 장비를 살피고 있을 거예요', sleep: '밤 근무 조라면 클린룸을 지키고 있을지도 몰라요' },
  osat: { work: '반도체 칩을 포장하고 있을 거예요' },
  'bauxite-miner': { work: '붉은 흙에서 보크사이트를 캐고 있을 거예요' },
  smelter: { work: '알루미늄을 녹이는 전기로를 지켜보고 있을 거예요' },
  'can-factory': { work: '캔이 줄지어 나오는 걸 지켜보고 있을 거예요', ...WEEKDAYS },
  'iron-miner': { work: '거대한 트럭에 철광석이 실리는 걸 보고 있을 거예요' },
  'steel-mill': { work: '고로의 불빛을 지켜보고 있을 거예요', sleep: '밤 근무 조라면 고로를 지키고 있을지도 몰라요' },
  'glass-furnace': { work: '유리를 녹이는 용해로를 지켜보고 있을 거예요' },
  'glass-bottle': { work: '뜨거운 유리를 병 모양으로 불고 있을 거예요' },

  // 나무·종이
  eucalyptus: { work: '유칼립투스 묘목을 심고 있을 거예요' },
  'pulp-mill': { work: '나무 조각을 펄프로 풀고 있을 거예요' },
  'paper-mill': { work: '종이가 감기는 큰 롤을 지켜보고 있을 거예요' },
  'nz-logger': { work: '숲에서 나무를 베고 있을 거예요' },
  sawmill: { work: '통나무를 판자로 켜고 있을 거예요' },
  'furniture-maker': { work: '가구를 조립하고 있을 거예요', ...WEEKDAYS },

  // 가게·사무실
  'cvs-clerk': { work: '편의점 진열대를 채우고 있을 거예요', sleep: '밤 근무라면 계산대를 지키고 있을지도 몰라요' },
  'mart-cashier': { work: '계산대에서 물건을 찍고 있을 거예요' },
  'delivery-rider': { work: '음식을 싣고 달리고 있을 거예요', hours: [11, 23], eve: '배달을 마치고 쉬고 있을 거예요', sleep: '늦게까지 달린 뒤라 자고 있을 거예요' },
  'clothing-clerk': { work: '옷을 개어 진열하고 있을 거예요' },
  'phone-clerk': { work: '새 휴대폰을 개통해 드리고 있을 거예요' },
  'trade-clerk': { work: '수입 서류를 맞추고 있을 거예요', ...WEEKDAYS },
  'book-writer': { work: '원고를 고쳐 쓰고 있을 거예요', eve: '산책하며 다음 장면을 떠올리고 있을 거예요' },
  'book-translator': { work: '문장 하나를 우리말로 옮기고 있을 거예요' },
  'book-editor': { work: '작가와 다음 장 이야기를 나누고 있을 거예요', ...WEEKDAYS },
  proofreader: { work: '교정지에 빨간 펜으로 표시하고 있을 거예요', ...WEEKDAYS },
  'cover-designer': { work: '표지 글자 크기를 이리저리 바꿔 보고 있을 거예요', ...WEEKDAYS },
  typesetter: { work: '쪽을 넘기며 줄바꿈을 살피고 있을 거예요', ...WEEKDAYS },
  'press-operator': { work: '잉크 농도를 맞추고 있을 거예요' },
  binder: { work: '접은 종이 묶음의 순서를 맞추고 있을 거예요' },
  'book-logistics': { work: '주문서대로 책을 골라 담고 있을 거예요' },
  bookseller: { work: '새 책을 매대에 펼쳐 놓고 있을 거예요', eve: '서점 문을 닫고 오늘 들어온 책을 정리하고 있을 거예요' },
  'merch-md': { work: '다음에 들일 물건을 고르고 있을 거예요', ...WEEKDAYS },
  'cs-agent': { work: '전화로 문의를 받고 있을 거예요', ...WEEKDAYS },
  'plant-quarantine': { work: '들어온 과일에 벌레가 없는지 살피고 있을 거예요' },
  'customs-officer': { work: '들어온 짐의 서류를 확인하고 있을 거예요' },
}
