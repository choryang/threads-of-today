/**
 * 재료별 형태 목록(되감기 변신). 실제 가공 순서대로 쓰고, 여정을 거꾸로 갈 때는 뒤에서부터 보여 준다.
 * by: 이 사람의 손을 거치면 이 형태가 된다. 출발지 변형(origins)의 사람도 함께 적는다.
 * prop은 새 아이콘을 그리기 전까지 쓰는 임시 소품이다(새로 그릴 목록은 README '나중에 할 일').
 * check:data가 모든 by가 그 재료의 여정에 있는 사람인지, 어느 경로로 가도 형태가 뒤로 돌아가지 않는지 검사한다.
 */
import type { MaterialForm } from '../types'

export const FORMS: Record<string, MaterialForm[]> = {
  coffee: [
    { name: '커피 체리', prop: 'cherry' },
    // 콜롬비아·베트남·브라질 농가는 농장에서 과육을 벗기고 말려 생두로 넘긴다
    { name: '생두', prop: 'seed', by: ['washing-station', 'co-coffee-farmer', 'vn-coffee-farmer', 'br-coffee-farmer'] },
    { name: '생두 자루', prop: 'box', by: ['djibouti-docker', 'co-buenaventura-docker', 'vn-coffee-port', 'br-santos-coffee'] },
    { name: '볶은 원두', prop: 'cup', by: ['roaster'] },
  ],
  cacao: [
    { name: '카카오 꼬투리', prop: 'pod' },
    { name: '말린 카카오 콩', prop: 'seed', by: ['cacao-dryer', 'gh-cacao-farmer'] },
    { name: '카카오 콩 자루', prop: 'box', by: ['abidjan-docker', 'gh-takoradi-docker'] },
    { name: '코코아 원료', prop: 'drop', by: ['cocoa-grinder'] },
  ],
  sugar: [
    { name: '사탕수수', prop: 'leaf' },
    { name: '갈색 원당', prop: 'seed', by: ['raw-sugar-mill'] },
    { name: '하얀 설탕', prop: 'box', by: ['sugar-refinery'] },
  ],
  wheat: [
    { name: '밀알', prop: 'wheat' },
    { name: '밀가루', prop: 'box', by: ['flour-mill'] },
  ],
  'palm-oil': [
    { name: '기름야자 열매송이', prop: 'basket' },
    { name: '팜 원유', prop: 'drop', by: ['palm-mill'] },
    { name: '식용 유지', prop: 'flask', by: ['oil-food-plant'] },
  ],
  rice: [
    { name: '벼', prop: 'wheat' },
    { name: '쌀', prop: 'seed', by: ['rice-mill'] },
  ],
  laver: [
    { name: '물김', prop: 'leaf' },
    { name: '마른김', prop: 'box', by: ['laver-processor'] },
  ],
  tuna: [
    { name: '냉동 참치', prop: 'fish' },
    { name: '참치 통조림', prop: 'box', by: ['cannery'] },
  ],
  salmon: [
    { name: '연어', prop: 'fish' },
    { name: '손질한 연어', prop: 'box', by: ['salmon-processor'] },
  ],
  banana: [
    { name: '바나나 송이', prop: 'banana' },
    { name: '초록 바나나 상자', prop: 'box', by: ['banana-packer'] },
    { name: '노랗게 익은 바나나', prop: 'banana', by: ['ripening'] },
  ],
  cotton: [
    { name: '목화송이', prop: 'basket' },
    { name: '원면', prop: 'box', by: ['cotton-gin'] },
    { name: '면실', prop: 'spool', by: ['spinner'] },
    { name: '면 옷', prop: 'box', by: ['garment-sewer'] },
  ],
  polyester: [
    { name: '폴리에스터 실', prop: 'spool' },
    { name: '옷', prop: 'box', by: ['vn-factory'] },
  ],
  plastic: [
    { name: '원유', prop: 'drop' },
    { name: '나프타', prop: 'flask', by: ['ulsan-refinery'] },
    { name: '플라스틱 알갱이', prop: 'seed', by: ['yeosu-chem'] },
    { name: '플라스틱 제품', prop: 'recycle', by: ['injection'] },
  ],
  rubber: [
    { name: '고무 수액', prop: 'drop' },
    { name: '생고무 덩어리', prop: 'box', by: ['rubber-processor'] },
  ],
  cobalt: [
    { name: '코발트 광석', prop: 'pickaxe' },
    { name: '코발트 화합물', prop: 'flask', by: ['cn-refinery'] },
    { name: '배터리', prop: 'phone', by: ['kr-battery'] },
  ],
  lithium: [
    { name: '리튬 정광', prop: 'pickaxe' },
    { name: '리튬 화합물', prop: 'flask', by: ['cn-refinery'] },
    { name: '배터리', prop: 'phone', by: ['kr-battery'] },
  ],
  chip: [
    { name: '웨이퍼', prop: 'chip' },
    { name: '반도체 칩', prop: 'chip', by: ['osat'] },
  ],
  assembly: [
    { name: '조립한 기기', prop: 'phone' },
    { name: '택배 상자', prop: 'box', by: ['warehouse'] },
  ],
  aluminum: [
    { name: '보크사이트', prop: 'pickaxe' },
    { name: '알루미늄 덩어리', prop: 'gear', by: ['smelter'] },
    { name: '알루미늄 캔', prop: 'cup', by: ['can-factory'] },
  ],
  pulp: [
    { name: '유칼립투스 통나무', prop: 'leaf' },
    { name: '펄프', prop: 'box', by: ['pulp-mill'] },
    { name: '종이', prop: 'clipboard', by: ['paper-mill'] },
  ],
  orange: [
    { name: '오렌지', prop: 'orange' },
    { name: '농축 오렌지 주스', prop: 'drop', by: ['juice-plant'] },
    { name: '오렌지 주스', prop: 'cup', by: ['beverage-plant'] },
  ],
  soybean: [
    { name: '콩', prop: 'seed' },
    { name: '두부', prop: 'box', by: ['tofu-maker'] },
  ],
  steel: [
    { name: '철광석', prop: 'pickaxe' },
    { name: '강판', prop: 'gear', by: ['steel-mill'] },
  ],
  milk: [
    { name: '갓 짠 원유', prop: 'drop' },
    { name: '팩 우유', prop: 'cup', by: ['dairy-plant'] },
  ],
  chili: [
    { name: '붉은 고추', prop: 'cherry' },
    { name: '고춧가루', prop: 'seed', by: ['chili-mill'] },
  ],
  cabbage: [
    { name: '배추', prop: 'leaf' },
    { name: '김치', prop: 'box', by: ['kimchi-maker'] },
  ],
  glass: [
    { name: '녹은 유리', prop: 'drop' },
    { name: '유리병', prop: 'flask', by: ['glass-bottle'] },
  ],
  wood: [
    { name: '통나무', prop: 'leaf' },
    { name: '판재', prop: 'box', by: ['sawmill'] },
    { name: '가구', prop: 'box', by: ['furniture-maker'] },
  ],
  beef: [
    { name: '소', prop: 'basket' },
    { name: '냉장 소고기', prop: 'box', by: ['meatworks'] },
  ],
  pork: [
    { name: '돼지', prop: 'basket' },
    { name: '냉장 돼지고기', prop: 'box', by: ['pork-plant'] },
  ],
  chicken: [
    { name: '닭', prop: 'basket' },
    { name: '손질한 닭', prop: 'box', by: ['chicken-plant'] },
    { name: '치킨', prop: 'box', by: ['chicken-shop'] },
  ],
  egg: [
    { name: '달걀', prop: 'basket' },
    { name: '달걀 한 판', prop: 'box', by: ['egg-gp'] },
  ],
  corn: [
    { name: '옥수수알', prop: 'wheat' },
    { name: '전분·물엿', prop: 'drop', by: ['starch-plant'] },
  ],
  shrimp: [
    { name: '새우', prop: 'fish' },
    { name: '냉동 새우', prop: 'box', by: ['shrimp-processor'] },
  ],
  tea: [
    { name: '찻잎', prop: 'leaf' },
    { name: '덖은 녹차', prop: 'cup', by: ['tea-roaster'] },
  ],
  'red-bean': [
    { name: '팥', prop: 'seed' },
    { name: '팥앙금', prop: 'box', by: ['anko-maker'] },
  ],
  buckwheat: [
    { name: '메밀', prop: 'seed' },
    { name: '메밀국수', prop: 'box', by: ['noodle-maker'] },
  ],
  potato: [
    { name: '감자', prop: 'basket' },
    { name: '냉동 감자튀김', prop: 'box', by: ['us-fries-plant'] },
  ],
  'sweet-potato': [
    { name: '고구마', prop: 'basket' },
    { name: '큐어링한 고구마', prop: 'basket', by: ['curing-worker'] },
  ],
  radish: [
    { name: '무', prop: 'leaf' },
  ],
  apple: [
    { name: '사과', prop: 'orange' },
    { name: '선별한 사과 상자', prop: 'box', by: ['apple-apc'] },
  ],
  grape: [
    { name: '포도송이', prop: 'cherry' },
  ],
  tomato: [
    { name: '토마토', prop: 'cherry' },
    { name: '토마토 페이스트', prop: 'drop', by: ['cn-tomato-paste'] },
    { name: '케첩', prop: 'flask', by: ['ketchup-maker'] },
  ],
  barley: [
    { name: '보리', prop: 'wheat' },
    { name: '맥아', prop: 'seed', by: ['au-malt'] },
  ],
  squid: [
    { name: '오징어', prop: 'fish' },
    { name: '마른오징어', prop: 'fish', by: ['squid-dryer'] },
  ],
}

/** 이 재료가 이 사람의 손을 떠날 때의 형태. route는 이번 여정에서 이 재료가 지나는 사람(가공 순서) */
export function formAt(materialId: string, route: string[], personId: string): MaterialForm | undefined {
  const forms = FORMS[materialId]
  if (!forms?.length) return undefined
  let index = 0
  for (const id of route) {
    const made = forms.findIndex((f) => f.by?.includes(id))
    if (made > index) index = made
    if (id === personId) break
  }
  return forms[index]
}
