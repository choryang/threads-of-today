/**
 * 재료별 형태 목록. 실제 가공 순서대로 쓴다(걷기 탭의 형태 변화: shared/walk.ts formChanges).
 * by: 이 사람의 손을 거치면 이 형태가 된다. 출발지 변형(origins)의 사람도 함께 적는다.
 * check:data가 모든 by가 그 재료의 여정에 있는 사람인지, 어느 경로로 가도 형태가 뒤로 돌아가지 않는지 검사한다.
 */
import type { MaterialForm } from '../types'

export const FORMS: Record<string, MaterialForm[]> = {
  coffee: [
    { name: '커피 체리' },
    // 콜롬비아·베트남·브라질 농가는 농장에서 과육을 벗기고 말려 생두로 넘긴다
    { name: '생두', by: ['washing-station', 'co-coffee-farmer', 'vn-coffee-farmer', 'br-coffee-farmer'] },
    { name: '생두 자루', by: ['djibouti-docker', 'co-buenaventura-docker', 'vn-coffee-port', 'br-santos-coffee'] },
    { name: '볶은 원두', by: ['roaster'] },
  ],
  cacao: [
    { name: '카카오 꼬투리' },
    { name: '말린 카카오 콩', by: ['cacao-dryer', 'gh-cacao-farmer'] },
    { name: '카카오 콩 자루', by: ['abidjan-docker', 'gh-takoradi-docker'] },
    { name: '코코아 원료', by: ['cocoa-grinder'] },
  ],
  sugar: [
    { name: '사탕수수' },
    { name: '갈색 원당', by: ['raw-sugar-mill'] },
    { name: '하얀 설탕', by: ['sugar-refinery'] },
  ],
  wheat: [
    { name: '밀알' },
    { name: '밀가루', by: ['flour-mill'] },
  ],
  'palm-oil': [
    { name: '기름야자 열매송이' },
    { name: '팜 원유', by: ['palm-mill'] },
    { name: '식용 유지', by: ['oil-food-plant'] },
  ],
  rice: [
    { name: '벼' },
    { name: '쌀', by: ['rice-mill'] },
  ],
  laver: [
    { name: '물김' },
    { name: '마른김', by: ['laver-processor'] },
  ],
  tuna: [
    { name: '냉동 참치' },
    { name: '참치 통조림', by: ['cannery'] },
  ],
  salmon: [
    { name: '연어' },
    { name: '손질한 연어', by: ['salmon-processor'] },
  ],
  banana: [
    { name: '바나나 송이' },
    { name: '초록 바나나 상자', by: ['banana-packer'] },
    { name: '노랗게 익은 바나나', by: ['ripening'] },
  ],
  cotton: [
    { name: '목화송이' },
    { name: '원면', by: ['cotton-gin'] },
    { name: '면실', by: ['spinner'] },
    { name: '면 옷', by: ['garment-sewer'] },
  ],
  polyester: [
    { name: '폴리에스터 실' },
    { name: '옷', by: ['vn-factory'] },
  ],
  plastic: [
    { name: '원유' },
    { name: '나프타', by: ['ulsan-refinery'] },
    { name: '플라스틱 알갱이', by: ['yeosu-chem'] },
    { name: '플라스틱 제품', by: ['injection'] },
  ],
  rubber: [
    { name: '고무 수액' },
    { name: '생고무 덩어리', by: ['rubber-processor'] },
  ],
  cobalt: [
    { name: '코발트 광석' },
    { name: '코발트 화합물', by: ['cn-refinery'] },
    { name: '배터리', by: ['kr-battery'] },
  ],
  lithium: [
    { name: '리튬 정광' },
    { name: '리튬 화합물', by: ['cn-refinery'] },
    { name: '배터리', by: ['kr-battery'] },
  ],
  chip: [
    { name: '웨이퍼' },
    { name: '반도체 칩', by: ['osat'] },
  ],
  assembly: [
    { name: '조립한 기기' },
    { name: '택배 상자', by: ['warehouse'] },
  ],
  aluminum: [
    { name: '보크사이트' },
    { name: '알루미늄 덩어리', by: ['smelter'] },
    { name: '알루미늄 캔', by: ['can-factory'] },
  ],
  pulp: [
    { name: '유칼립투스 통나무' },
    { name: '펄프', by: ['pulp-mill'] },
    { name: '종이', by: ['paper-mill'] },
  ],
  orange: [
    { name: '오렌지' },
    { name: '농축 오렌지 주스', by: ['juice-plant'] },
    { name: '오렌지 주스', by: ['beverage-plant'] },
  ],
  soybean: [
    { name: '콩' },
    { name: '두부', by: ['tofu-maker'] },
  ],
  steel: [
    { name: '철광석' },
    { name: '강판', by: ['steel-mill'] },
  ],
  milk: [
    { name: '갓 짠 원유' },
    { name: '팩 우유', by: ['dairy-plant'] },
  ],
  chili: [
    { name: '붉은 고추' },
    { name: '고춧가루', by: ['chili-mill'] },
  ],
  cabbage: [
    { name: '배추' },
    { name: '김치', by: ['kimchi-maker'] },
  ],
  glass: [
    { name: '녹은 유리' },
    { name: '유리병', by: ['glass-bottle'] },
  ],
  wood: [
    { name: '통나무' },
    { name: '판재', by: ['sawmill'] },
    { name: '가구', by: ['furniture-maker'] },
  ],
  beef: [
    { name: '소' },
    { name: '냉장 소고기', by: ['meatworks'] },
  ],
  pork: [
    { name: '돼지' },
    { name: '냉장 돼지고기', by: ['pork-plant'] },
  ],
  chicken: [
    { name: '닭' },
    { name: '손질한 닭', by: ['chicken-plant'] },
    { name: '치킨', by: ['chicken-shop'] },
  ],
  egg: [
    { name: '달걀' },
    { name: '달걀 한 판', by: ['egg-gp'] },
  ],
  corn: [
    { name: '옥수수알' },
    { name: '전분·물엿', by: ['starch-plant'] },
  ],
  shrimp: [
    { name: '새우' },
    { name: '냉동 새우', by: ['shrimp-processor'] },
  ],
  tea: [
    { name: '찻잎' },
    { name: '덖은 녹차', by: ['tea-roaster'] },
  ],
  'red-bean': [
    { name: '팥' },
    { name: '팥앙금', by: ['anko-maker'] },
  ],
  buckwheat: [
    { name: '메밀' },
    { name: '메밀국수', by: ['noodle-maker'] },
  ],
  potato: [
    { name: '감자' },
    { name: '냉동 감자튀김', by: ['us-fries-plant'] },
  ],
  'sweet-potato': [
    { name: '고구마' },
    { name: '큐어링한 고구마', by: ['curing-worker'] },
  ],
  radish: [
    { name: '무' },
  ],
  apple: [
    { name: '사과' },
    { name: '선별한 사과 상자', by: ['apple-apc'] },
  ],
  grape: [
    { name: '포도송이' },
  ],
  tomato: [
    { name: '토마토' },
    { name: '토마토 페이스트', by: ['cn-tomato-paste'] },
    { name: '케첩', by: ['ketchup-maker'] },
  ],
  barley: [
    { name: '보리' },
    { name: '맥아', by: ['au-malt'] },
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
    { name: '플라스틱 알갱이' },
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
    { name: '오징어' },
    { name: '마른오징어', by: ['squid-dryer'] },
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
