/**
 * 오늘의 미스터리 힌트 1·2번 데이터. 대표 물건(PRODUCTS)마다 하나씩.
 * use: 쓰임새 한 줄. 물건 이름·재료 이름이 드러나지 않게 해요체로 쓴다(check:data가 정답 이름을 검사).
 */
export type MysteryKind = 'drink' | 'food' | 'wear' | 'use' | 'carry' | 'ride'

export const MYSTERY_KIND_LABEL: Record<MysteryKind, string> = {
  drink: '마시는 것',
  food: '먹는 것',
  wear: '입거나 신는 것',
  use: '쓰는 것',
  carry: '들고 다니는 것',
  ride: '타는 것',
}

export const MYSTERY_INFO: Record<string, { use: string; kind: MysteryKind }> = {
  americano: { kind: 'drink', use: '아침에 자주 손이 가요. 얼음이 달그락거려요.' },
  latte: { kind: 'drink', use: '두 손으로 감싸 쥐고 천천히 마시기 좋아요.' },
  'choco-bar': { kind: 'food', use: '출출할 때 한 조각 떼어 먹어요. 더운 날엔 금방 녹아요.' },
  ramen: { kind: 'food', use: '물만 끓이면 몇 분 만에 한 끼가 돼요.' },
  samgak: { kind: 'food', use: '비닐을 번호 순서대로 벗겨서 먹어요.' },
  smartphone: { kind: 'carry', use: '하루 종일 손에서 놓지 않아요. 밤마다 충전해요.' },
  tshirt: { kind: 'wear', use: '여름에 가장 자주 꺼내 입어요.' },
  sneakers: { kind: 'wear', use: '오래 걸어도 발이 편하게 해 줘요.' },
  banana: { kind: 'food', use: '껍질을 벗겨 바로 먹어요. 며칠 지나면 까만 점이 생겨요.' },
  'salmon-sushi': { kind: 'food', use: '한 입 크기 밥 위에 주황빛 생선을 얹어 먹어요.' },
  cola: { kind: 'drink', use: '따는 소리가 시원해요. 톡 쏘는 맛이 있어요.' },
  oj: { kind: 'drink', use: '아침 식사에 한 잔 곁들여요. 새콤달콤해요.' },
  tofu: { kind: 'food', use: '찌개에 넣기도 하고 부쳐 먹기도 해요. 하얗고 말랑해요.' },
  bicycle: { kind: 'ride', use: '페달을 밟으면 두 바퀴로 달려요.' },
  notebook: { kind: 'use', use: '수업 시간에 펼쳐 두고 필기해요.' },
  'tuna-can': { kind: 'food', use: '뚜껑을 따서 밥에 얹거나 찌개에 넣어요.' },
  'banana-milk': { kind: 'drink', use: '목욕탕에 다녀온 뒤 생각나는 단지 모양 병이에요.' },
  earbuds: { kind: 'carry', use: '귀에 꽂고 음악을 들어요. 작은 케이스에 넣어 다녀요.' },
  kimchi: { kind: 'food', use: '밥상에 거의 매일 올라와요. 익을수록 새콤해져요.' },
  'kimchi-stew': { kind: 'food', use: '빨갛고 얼큰한 국물이 보글보글 끓어요.' },
  'fried-chicken': { kind: 'food', use: '바삭한 튀김옷, 늦은 밤 배달로 자주 시켜요.' },
  samgyeopsal: { kind: 'food', use: '불판 위에서 지글지글 구워 쌈에 싸 먹어요.' },
  burger: { kind: 'food', use: '둥근 번 사이에 여러 겹을 끼워 한 손에 들고 먹어요.' },
  'shrimp-snack': { kind: 'food', use: '바삭하고 짭짤한 봉지 과자예요. 갈매기도 좋아한대요.' },
  popcorn: { kind: 'food', use: '영화관에서 큰 통에 담아 먹어요.' },
  desk: { kind: 'use', use: '공부하거나 일할 때 그 앞에 앉아요.' },
  chopsticks: { kind: 'use', use: '배달 음식에 딸려 와요. 반으로 쪼개서 써요.' },
  soju: { kind: 'drink', use: '초록빛 병에 담겨 있어요. 잔을 부딪치며 마셔요.' },
  'green-tea': { kind: 'drink', use: '뜨거운 물에 우려 마셔요. 은은한 풀 향이 나요.' },
  omurice: { kind: 'food', use: '노란 이불을 덮은 볶음밥 같아요. 위에 빨간 소스로 그림을 그려요.' },
  bungeoppang: { kind: 'food', use: '겨울 길거리에서 호호 불며 먹어요. 물고기 모양이에요.' },
  makguksu: { kind: 'food', use: '시원한 국물에 말아 먹는 강원도 국수예요.' },
  'potato-chips': { kind: 'food', use: '봉지를 뜯으면 바스락 소리가 나요. 얇고 짭짤해요.' },
  'roast-sweet-potato': { kind: 'food', use: '겨울에 드럼통 화로에서 구워 파는 따끈한 간식이에요.' },
  kkakdugi: { kind: 'food', use: '설렁탕 옆에 꼭 나오는 네모난 반찬이에요.' },
  apple: { kind: 'food', use: '하루 한 알이면 의사가 멀어진다는 말이 있어요.' },
  grape: { kind: 'food', use: '송이째 달려 있어요. 한 알씩 떼어 먹어요.' },
  ketchup: { kind: 'food', use: '튀김을 찍어 먹어요. 빨간 병을 꾹 눌러 짜요.' },
  'barley-tea': { kind: 'drink', use: '물 대신 끓여 두고 마시는 구수한 차예요.' },
  soba: { kind: 'food', use: '차가운 장국에 면을 살짝 찍어 먹어요.' },
  beer: { kind: 'drink', use: '퇴근길에 하나 따면 거품이 올라와요.' },
  'squid-stir-fry': { kind: 'food', use: '쫄깃한 다리가 매콤한 양념에 버무려져 있어요.' },
}
