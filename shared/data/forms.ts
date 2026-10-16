/**
 * 재료별 형태 목록(되감기 변신). 실제 가공 순서대로 쓰고, 여정을 거꾸로 갈 때는 뒤에서부터 보여 준다.
 * by: 이 사람의 손을 거치면 이 형태가 된다. 출발지 변형(origins)의 사람도 함께 적는다.
 * formIcon: public/forms/<formIcon>.svg 아이콘(public/forms/index.json의 slug). 이름이 index.json의 ko와 같은 것을 골랐고,
 * 따로 그리지 않은 7가지(커피 체리·카카오 꼬투리·바나나·오렌지·칩·실·밀알)는 캐릭터 소품을 옮긴 prop-* 아이콘이다(scripts/sync-prop-icons.ts).
 * check:data가 모든 by가 그 재료의 여정에 있는 사람인지, 어느 경로로 가도 형태가 뒤로 돌아가지 않는지 검사한다.
 */
import type { MaterialForm } from '../types'

export const FORMS: Record<string, MaterialForm[]> = {
  coffee: [
    { name: '커피 체리', formIcon: 'prop-cherry' },
    // 콜롬비아·베트남·브라질 농가는 농장에서 과육을 벗기고 말려 생두로 넘긴다
    { name: '생두', formIcon: 'green-coffee-beans', by: ['washing-station', 'co-coffee-farmer', 'vn-coffee-farmer', 'br-coffee-farmer'] },
    { name: '생두 자루', formIcon: 'green-coffee-sack', by: ['djibouti-docker', 'co-buenaventura-docker', 'vn-coffee-port', 'br-santos-coffee'] },
    { name: '볶은 원두', formIcon: 'roasted-coffee-beans', by: ['roaster'] },
  ],
  cacao: [
    { name: '카카오 꼬투리', formIcon: 'prop-pod' },
    { name: '말린 카카오 콩', formIcon: 'dried-cacao-beans', by: ['cacao-dryer', 'gh-cacao-farmer'] },
    { name: '카카오 콩 자루', formIcon: 'cacao-bean-sack', by: ['abidjan-docker', 'gh-takoradi-docker'] },
    { name: '코코아 원료', formIcon: 'cocoa-liquor', by: ['cocoa-grinder'] },
  ],
  sugar: [
    { name: '사탕수수', formIcon: 'sugarcane' },
    { name: '갈색 원당', formIcon: 'raw-sugar', by: ['raw-sugar-mill'] },
    { name: '하얀 설탕', formIcon: 'white-sugar', by: ['sugar-refinery'] },
  ],
  wheat: [
    { name: '밀알', formIcon: 'prop-wheat' },
    { name: '밀가루', formIcon: 'flour', by: ['flour-mill'] },
  ],
  'palm-oil': [
    { name: '기름야자 열매송이', formIcon: 'palm-fruit-bunch' },
    { name: '팜 원유', formIcon: 'crude-palm-oil', by: ['palm-mill'] },
    { name: '식용 유지', formIcon: 'edible-oil', by: ['oil-food-plant'] },
  ],
  rice: [
    { name: '벼', formIcon: 'rice-paddy' },
    { name: '쌀', formIcon: 'rice', by: ['rice-mill'] },
  ],
  laver: [
    { name: '물김', formIcon: 'wet-laver' },
    { name: '마른김', formIcon: 'dried-laver', by: ['laver-processor'] },
  ],
  tuna: [
    { name: '냉동 참치', formIcon: 'frozen-tuna' },
    { name: '참치 통조림', formIcon: 'tuna-can', by: ['cannery'] },
  ],
  salmon: [
    { name: '연어', formIcon: 'salmon' },
    { name: '손질한 연어', formIcon: 'salmon-fillet', by: ['salmon-processor'] },
  ],
  banana: [
    { name: '바나나 송이', formIcon: 'prop-banana' },
    { name: '초록 바나나 상자', formIcon: 'green-banana-box', by: ['banana-packer'] },
    { name: '노랗게 익은 바나나', formIcon: 'prop-banana', by: ['ripening'] },
  ],
  cotton: [
    { name: '목화송이', formIcon: 'cotton-boll' },
    { name: '원면', formIcon: 'raw-cotton-bale', by: ['cotton-gin'] },
    { name: '면실', formIcon: 'prop-spool', by: ['spinner'] },
    { name: '면 옷', formIcon: 'cotton-clothes', by: ['garment-sewer'] },
  ],
  polyester: [
    { name: '폴리에스터 실', formIcon: 'prop-spool' },
    { name: '옷', formIcon: 'clothes', by: ['vn-factory'] },
  ],
  plastic: [
    { name: '원유', formIcon: 'crude-oil' },
    { name: '나프타', formIcon: 'naphtha', by: ['ulsan-refinery'] },
    { name: '플라스틱 알갱이', formIcon: 'plastic-pellets', by: ['yeosu-chem'] },
    { name: '플라스틱 제품', formIcon: 'plastic-product', by: ['injection'] },
  ],
  rubber: [
    { name: '고무 수액', formIcon: 'latex' },
    { name: '생고무 덩어리', formIcon: 'rubber-block', by: ['rubber-processor'] },
  ],
  cobalt: [
    { name: '코발트 광석', formIcon: 'cobalt-ore' },
    { name: '코발트 화합물', formIcon: 'cobalt-compound', by: ['cn-refinery'] },
    { name: '배터리', formIcon: 'battery', by: ['kr-battery'] },
  ],
  lithium: [
    { name: '리튬 정광', formIcon: 'lithium-concentrate' },
    { name: '리튬 화합물', formIcon: 'lithium-compound', by: ['cn-refinery'] },
    { name: '배터리', formIcon: 'battery', by: ['kr-battery'] },
  ],
  chip: [
    { name: '웨이퍼', formIcon: 'prop-chip' },
    { name: '반도체 칩', formIcon: 'prop-chip', by: ['osat'] },
  ],
  assembly: [
    { name: '조립한 기기', formIcon: 'assembled-device' },
    { name: '택배 상자', formIcon: 'parcel-box', by: ['warehouse'] },
  ],
  aluminum: [
    { name: '보크사이트', formIcon: 'bauxite' },
    { name: '알루미늄 덩어리', formIcon: 'aluminum-ingot', by: ['smelter'] },
    { name: '알루미늄 캔', formIcon: 'aluminum-can', by: ['can-factory'] },
  ],
  pulp: [
    { name: '유칼립투스 통나무', formIcon: 'eucalyptus-log' },
    { name: '펄프', formIcon: 'pulp-bale', by: ['pulp-mill'] },
    { name: '종이', formIcon: 'paper', by: ['paper-mill'] },
  ],
  orange: [
    { name: '오렌지', formIcon: 'prop-orange' },
    { name: '농축 오렌지 주스', formIcon: 'oj-concentrate', by: ['juice-plant'] },
    { name: '오렌지 주스', formIcon: 'orange-juice', by: ['beverage-plant'] },
  ],
  soybean: [
    { name: '콩', formIcon: 'soybeans' },
    { name: '두부', formIcon: 'tofu', by: ['tofu-maker'] },
  ],
  steel: [
    { name: '철광석', formIcon: 'iron-ore' },
    { name: '강판', formIcon: 'steel-coil', by: ['steel-mill'] },
  ],
  milk: [
    { name: '갓 짠 원유', formIcon: 'raw-milk' },
    { name: '팩 우유', formIcon: 'milk-carton', by: ['dairy-plant'] },
  ],
  chili: [
    { name: '붉은 고추', formIcon: 'red-chili' },
    { name: '고춧가루', formIcon: 'chili-powder', by: ['chili-mill'] },
  ],
  cabbage: [
    { name: '배추', formIcon: 'napa-cabbage' },
    { name: '김치', formIcon: 'kimchi', by: ['kimchi-maker'] },
  ],
  glass: [
    { name: '녹은 유리', formIcon: 'molten-glass' },
    { name: '유리병', formIcon: 'glass-bottle', by: ['glass-bottle'] },
  ],
  wood: [
    { name: '통나무', formIcon: 'log' },
    { name: '판재', formIcon: 'planks', by: ['sawmill'] },
    { name: '가구', formIcon: 'furniture', by: ['furniture-maker'] },
  ],
  beef: [
    { name: '소', formIcon: 'cow' },
    { name: '냉장 소고기', formIcon: 'chilled-beef', by: ['meatworks'] },
  ],
  pork: [
    { name: '돼지', formIcon: 'pig' },
    { name: '냉장 돼지고기', formIcon: 'chilled-pork', by: ['pork-plant'] },
  ],
  chicken: [
    { name: '닭', formIcon: 'chicken' },
    { name: '손질한 닭', formIcon: 'dressed-chicken', by: ['chicken-plant'] },
    { name: '치킨', formIcon: 'fried-chicken', by: ['chicken-shop'] },
  ],
  egg: [
    { name: '달걀', formIcon: 'egg' },
    { name: '달걀 한 판', formIcon: 'egg-tray', by: ['egg-gp'] },
  ],
  corn: [
    { name: '옥수수알', formIcon: 'corn-kernels' },
    { name: '전분·물엿', formIcon: 'starch-syrup', by: ['starch-plant'] },
  ],
  shrimp: [
    { name: '새우', formIcon: 'shrimp' },
    { name: '냉동 새우', formIcon: 'frozen-shrimp', by: ['shrimp-processor'] },
  ],
  tea: [
    { name: '찻잎', formIcon: 'tea-leaves' },
    { name: '덖은 녹차', formIcon: 'roasted-green-tea', by: ['tea-roaster'] },
  ],
  'red-bean': [
    { name: '팥', formIcon: 'red-beans' },
    { name: '팥앙금', formIcon: 'red-bean-paste', by: ['anko-maker'] },
  ],
  buckwheat: [
    { name: '메밀', formIcon: 'buckwheat' },
    { name: '메밀국수', formIcon: 'buckwheat-noodles', by: ['noodle-maker'] },
  ],
  potato: [
    { name: '감자', formIcon: 'potato' },
    { name: '냉동 감자튀김', formIcon: 'frozen-fries', by: ['us-fries-plant'] },
  ],
  'sweet-potato': [
    { name: '고구마', formIcon: 'sweet-potato' },
    { name: '큐어링한 고구마', formIcon: 'cured-sweet-potato', by: ['curing-worker'] },
  ],
  radish: [
    { name: '무', formIcon: 'radish' },
  ],
  apple: [
    { name: '사과', formIcon: 'apple' },
    { name: '선별한 사과 상자', formIcon: 'apple-box', by: ['apple-apc'] },
  ],
  grape: [
    { name: '포도송이', formIcon: 'grapes' },
  ],
  tomato: [
    { name: '토마토', formIcon: 'tomato' },
    { name: '토마토 페이스트', formIcon: 'tomato-paste', by: ['cn-tomato-paste'] },
    { name: '케첩', formIcon: 'ketchup', by: ['ketchup-maker'] },
  ],
  barley: [
    { name: '보리', formIcon: 'barley' },
    { name: '맥아', formIcon: 'malt', by: ['au-malt'] },
  ],
  // 게임 (아이콘 없음)
  game: [
    { name: '아이디어' },
    { name: '기획서', by: ['game-designer'] },
    { name: '세계와 대사', by: ['game-writer'] },
    { name: '콘셉트 그림', by: ['concept-artist'] },
    { name: '3D 캐릭터', by: ['game-3d-artist'] },
    { name: '움직이는 캐릭터', by: ['game-animator'] },
    { name: '반짝이는 효과', by: ['vfx-designer'] },
    { name: '놀 수 있는 맵', by: ['level-designer'] },
    { name: '화면 속 게임', by: ['client-programmer'] },
    { name: '함께 노는 서버', by: ['server-programmer'] },
    { name: '소리 든 게임', by: ['sound-designer'] },
    { name: '테스트 빌드', by: ['game-qa'] },
    { name: '업데이트된 게임', by: ['live-ops'] },
  ],
  // 애니메이션 (아이콘 없음)
  'anime-jp': [
    { name: '원작' },
    { name: '기획서', by: ['anime-producer'] },
    { name: '각본', by: ['anime-scriptwriter'] },
    { name: '그림 콘티', by: ['storyboard-director'] },
    { name: '원화', by: ['key-animator'] },
    { name: '고친 원화', by: ['animation-director'] },
    { name: '동화', by: ['inbetweener'] },
    { name: '검사 마친 동화', by: ['inbetween-checker'] },
    { name: '칠한 그림', by: ['ink-painter'] },
    { name: '배경 든 그림', by: ['background-artist'] },
    { name: '촬영된 컷', by: ['compositor-jp'] },
    { name: '목소리 든 영상', by: ['voice-actor'] },
    { name: '완성 에피소드', by: ['sound-director'] },
    { name: '한국어 자막판', by: ['subtitle-translator'] },
  ],
  'anime-kr': [
    { name: '아이디어' },
    { name: '기획서', by: ['kids-anime-pd'] },
    { name: '시나리오', by: ['kids-scriptwriter'] },
    { name: '캐릭터 설정화', by: ['character-designer'] },
    { name: '스토리보드', by: ['storyboard-artist'] },
    { name: '3D 모델', by: ['modeler-3d'] },
    { name: '움직일 수 있는 모델', by: ['rigger'] },
    { name: '움직임', by: ['animator-3d'] },
    { name: '조명 든 장면', by: ['lighting-artist'] },
    { name: '그림 한 장 한 장', by: ['render-wrangler'] },
    { name: '완성 영상', by: ['compositor-kr'] },
    { name: '목소리 든 영상', by: ['dubbing-actor'] },
    { name: '완성 에피소드', by: ['kids-music'] },
  ],
  // 영화·드라마 (아이콘 없음)
  film: [
    { name: '아이디어' },
    { name: '시나리오', by: ['screenwriter'] },
    { name: '촬영 장소 목록', by: ['location-manager'] },
    { name: '세트', by: ['set-builder'] },
    { name: '현장 소리', by: ['boom-operator'] },
    { name: '촬영 원본', by: ['gaffer'] },
    { name: '편집본', by: ['film-editor'] },
    { name: '합성본', by: ['vfx-artist'] },
    { name: '색보정본', by: ['colorist'] },
    { name: '효과음 든 영상', by: ['foley-artist'] },
    { name: '완성본', by: ['sound-mixer'] },
    { name: '상영 파일', by: ['film-distributor'] },
  ],
  drama: [
    { name: '아이디어' },
    { name: '회차별 대본', by: ['drama-writer'] },
    { name: '편성이 정해진 대본', by: ['scheduler'] },
    { name: '촬영 장소 목록', by: ['location-manager'] },
    { name: '세트', by: ['studio-set-builder'] },
    { name: '촬영 원본', by: ['cinematographer'] },
    { name: '정리된 촬영 데이터', by: ['dit'] },
    { name: '회차 편집본', by: ['drama-editor'] },
    { name: '합성본', by: ['vfx-artist'] },
    { name: '음악 든 영상', by: ['music-director'] },
    { name: '회차 완성본', by: ['sound-mixer'] },
    { name: '스트리밍 파일', by: ['encoding-engineer'] },
  ],
  // 앱·노래·인터넷 (아이콘 없음)
  app: [
    { name: '아이디어' },
    { name: '기획서', by: ['app-planner'] },
    { name: '사용성 테스트 기록', by: ['ux-researcher'] },
    { name: '화면 시안', by: ['ui-designer'] },
    { name: '앱 코드', by: ['app-developer'] },
    { name: '서버와 이어진 앱', by: ['server-developer'] },
    { name: '테스트 빌드', by: ['qa-tester'] },
    { name: '여러 언어로 된 앱', by: ['localizer'] },
    { name: '심사 통과한 앱', by: ['app-reviewer'] },
  ],
  song: [
    { name: '코드와 박자' },
    { name: '비트', by: ['track-maker'] },
    { name: '데모', by: ['topliner'] },
    { name: '가사 붙은 데모', by: ['lyricist'] },
    { name: '편곡', by: ['arranger'] },
    { name: '악기 녹음', by: ['session-player'] },
    { name: '보컬 녹음', by: ['recording-engineer'] },
    { name: '믹스', by: ['mixing-engineer'] },
    { name: '마스터 음원', by: ['mastering-engineer'] },
    { name: '등록된 음원', by: ['music-distributor'] },
  ],
  internet: [
    { name: '데이터' },
    { name: '서버 속 데이터', by: ['datacenter-tech'] },
    { name: '바다 밑 빛 신호', by: ['cable-repairer'] },
    { name: '전파', by: ['base-station'] },
  ],
  // 컴퓨터·주변기기 부품 (아이콘 없음)
  switch: [
    { name: '플라스틱 알갱이', formIcon: 'plastic-pellets' },
    { name: '스위치', by: ['switch-maker'] },
    { name: '검사 마친 스위치', by: ['switch-tester'] },
    { name: '키보드', by: ['keyboard-assembler'] },
  ],
  pcb: [
    { name: '구리 광석' },
    { name: '구리판', by: ['copper-smelter'] },
    { name: '동박적층판', by: ['ccl-maker'] },
    { name: '빈 회로기판', by: ['pcb-maker'] },
    { name: '부품 붙은 기판', by: ['smt-operator'] },
  ],
  panel: [
    { name: '유리 기판' },
    { name: '패널', by: ['panel-engineer'] },
    { name: '디스플레이 모듈', by: ['module-assembler'] },
    { name: '모니터', by: ['monitor-assembler'] },
  ],
  cpu: [
    { name: '웨이퍼' },
    { name: '회로 새긴 웨이퍼', by: ['cpu-fab'] },
    { name: 'CPU', by: ['osat'] },
  ],
  memory: [
    { name: '웨이퍼' },
    { name: '회로 새긴 웨이퍼', by: ['fab-engineer'] },
    { name: '메모리 칩', by: ['memory-packager'] },
  ],
  sensor: [
    { name: '센서 칩' },
    { name: '마우스', by: ['mouse-assembler'] },
  ],
  // 책 만들기: 원고가 손을 거치며 바뀌는 모습 (아이콘 없음)
  publishing: [
    { name: '원고' },
    { name: '다듬은 원고', by: ['book-editor'] },
    { name: '교정지', by: ['proofreader'] },
    { name: '인쇄용 파일', by: ['typesetter'] },
    { name: '인쇄된 종이', by: ['press-operator'] },
    { name: '책', by: ['binder'] },
  ],
  squid: [
    { name: '오징어', formIcon: 'squid' },
    { name: '마른오징어', formIcon: 'dried-squid', by: ['squid-dryer'] },
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
