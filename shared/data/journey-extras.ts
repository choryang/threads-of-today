import type { HiddenRule, JourneyEvent } from '../types'

/**
 * 여정 이벤트: 단계 사이에 낮은 확률로 보이는 짧은 장면. 화면에는 '이야기' 표시를 붙여 사실 정보와 구분한다.
 * 특정 날짜나 실제로 있었던 사건을 말하지 않는다. 누구에게나 있을 법한 하루의 한 장면만 쓴다.
 */
export const EVENTS: JourneyEvent[] = [
  { id: 'port-busy', text: '항구가 붐벼서 배가 하루 늦게 출발했어요.', where: 'land' },
  { id: 'rain-dry', text: '비가 와서 말리는 데 하루가 더 걸렸어요.', where: 'land' },
  { id: 'high-waves', text: '파도가 높아서 배가 천천히 나아갔어요.', where: 'sea' },
  { id: 'sunrise-deck', text: '선원 한 명이 갑판에서 해 뜨는 걸 잠깐 바라봤어요.', where: 'sea' },
  { id: 'extra-stop', text: '배가 다른 항구에 잠깐 들러 짐을 더 실었어요.', where: 'sea' },
  { id: 'wait-berth', text: '부두에 자리가 날 때까지 바다 위에서 잠시 기다렸어요.', where: 'sea' },
  { id: 'rest-stop', text: '트럭 기사가 휴게소에 들러 잠깐 쉬어 갔어요.', where: 'land' },
  { id: 'double-check', text: '창고 직원이 상자 번호를 두 번 확인했어요.', where: 'land' },
  { id: 'crane-wind', text: '바람이 세서 크레인이 바람이 잦아들기를 기다렸어요.', where: 'land' },
  { id: 'seal-check', text: '컨테이너 문에 붙은 봉인이 그대로인지 확인했어요.', where: 'any' },
  { id: 'detour', text: '길이 막혀서 트럭이 조금 돌아서 갔어요.', where: 'land' },
  { id: 'sample-open', text: '검사하는 사람이 상자 하나를 골라 열어 보았어요.', where: 'land' },
  { id: 'rewrap', text: '포장에 습기가 차지 않게 끈을 다시 단단히 묶었어요.', where: 'any' },
  { id: 'machine-check', text: '기계를 점검하느라 반나절 쉬어 갔어요.', where: 'land' },
  { id: 'warm-tea', text: '새벽부터 일한 사람이 따뜻한 차를 한 잔 마시며 숨을 돌렸어요.', where: 'any' },
  { id: 'relabel', text: '라벨이 비뚤게 붙어서 새로 붙였어요.', where: 'land' },
  { id: 'sudden-shower', text: '갑자기 소나기가 와서 짐을 서둘러 덮었어요.', where: 'land' },
  { id: 'weigh-again', text: '다음 사람에게 넘기기 전에 무게를 한 번 더 쟀어요.', where: 'land' },
  { id: 'lunch-break', text: '일하던 사람들이 점심을 먹으며 잠깐 쉬어 갔어요.', where: 'land' },
  { id: 'night-drive', text: '밤새 달린 트럭이 아침에 창고에 닿았어요.', where: 'land' },
]

/** 냉장·냉동 상태로 컨테이너선을 타는 재료 (연어는 비행기, 닭고기는 국내 여정이라 뺐다) */
const CHILLED = ['shrimp', 'beef', 'pork', 'banana']
/** 컨테이너로 부산항·인천항에 들어와 식물 검역을 받는 농산물 재료 (곡물선으로 바로 공장에 가는 밀·콩·옥수수는 이 여정에서 항구 사람을 거치지 않는다) */
const FARM = ['coffee', 'cacao', 'banana', 'orange', 'chili', 'cotton', 'wood']

/** 숨은 만남. 확률은 그 사람을 지날 때마다 따로 굴리고, 한 여정에서 많아야 한 명만 만난다. */
export const HIDDEN_RULES: HiddenRule[] = [
  { cardId: 'ship-cook', afterPersonIds: ['sea-crew', 'bulk-crew', 'tanker-crew'], chance: 0.015 },
  { cardId: 'reefer-tech', afterPersonIds: ['sea-crew'], materialIds: CHILLED, chance: 0.02 },
  { cardId: 'lashing-worker', afterPersonIds: ['busan-crane'], chance: 0.012 },
  { cardId: 'plant-quarantine', afterPersonIds: ['busan-crane', 'incheon-port'], materialIds: FARM, chance: 0.015 },
  { cardId: 'customs-officer', afterPersonIds: ['air-cargo', 'busan-crane'], chance: 0.012 },
]
