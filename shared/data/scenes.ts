/**
 * 여정 화면 하늘 영역(PlaceSky)에 까는 장면 그림. 기준은 문서 '여정 장면 스타일 가이드'.
 * 장면 목록·대체 글·사람은 docs/scenes/prompts.md(장면마다 생성 프롬프트)를 옮겨 적은 것이다.
 * 그림은 public/scenes/{id}.webp (4:3, 가로 1200px 이하). 원본을 art/scenes/{id}.png|jpg|webp에 두고 npm run scenes로 만든다
 * (원본 생성은 npm run scenes:gen, scripts/gen-scenes.ts).
 * 그림 파일이 아직 없거나 못 읽으면 지금처럼 단색 하늘과 땅을 그린다.
 * 시간대 덧씌우기(색·섞는 방식)는 shared/local-time.ts의 SKY. 해·달·별은 앱이 그린다.
 */

export interface Scene {
  id: string
  /** 화면 읽기 프로그램용 대체 글 */
  alt: string
}

export const SCENES: Record<string, Scene> = {
  'sidama-coffee-farm': { id: 'sidama-coffee-farm', alt: '비탈진 언덕에 커피 나무가 줄지어 선 시다마의 커피 밭' },
  'container-ship-sea': { id: 'container-ship-sea', alt: '넓은 바다 위를 지나는 컨테이너선 갑판' },
  'busan-port': { id: 'busan-port', alt: '크레인이 늘어선 부산항 부두' },
  'huila-coffee-slope': { id: 'huila-coffee-slope', alt: '안개 낀 안데스 산비탈의 커피 밭' },
  'daklak-coffee-yard': { id: 'daklak-coffee-yard', alt: '붉은 흙 고원의 커피 나무와 열매를 말리는 마당' },
  'minas-coffee-farm': { id: 'minas-coffee-farm', alt: '완만한 언덕을 따라 끝없이 이어진 커피 밭' },
  'neighborhood-cafe': { id: 'neighborhood-cafe', alt: '문 열기 전 아침, 동네 카페의 커피 머신 앞' },
  'neighborhood-mart': { id: 'neighborhood-mart', alt: '동네 마트의 계산대와 셀프 계산대' },
  'seoul-delivery': { id: 'seoul-delivery', alt: '오래된 빌라가 모인 서울의 골목' },
  'bulk-carrier-deck': { id: 'bulk-carrier-deck', alt: '바다 위 벌크선의 커다란 화물칸 덮개' },
  'tanker-deck': { id: 'tanker-deck', alt: '배관과 밸브가 가득한 탱커선 갑판' },
  'desert-oil-field': { id: 'desert-oil-field', alt: '사막 한가운데의 유전 설비' },
  'kansas-wheat-harvest': { id: 'kansas-wheat-harvest', alt: '지평선까지 펼쳐진 대평원의 밀 수확' },
}

/** 사람 → 장면 (docs/scenes/prompts.md의 '사람') */
export const PERSON_SCENE: Record<string, string> = {
  'coffee-picker': 'sidama-coffee-farm',
  'sea-crew': 'container-ship-sea',
  'busan-crane': 'busan-port',
  'co-coffee-farmer': 'huila-coffee-slope',
  'vn-coffee-farmer': 'daklak-coffee-yard',
  'br-coffee-farmer': 'minas-coffee-farm',
  barista: 'neighborhood-cafe',
  'mart-cashier': 'neighborhood-mart',
  courier: 'seoul-delivery',
  'bulk-crew': 'bulk-carrier-deck',
  'tanker-crew': 'tanker-deck',
  'oil-worker': 'desert-oil-field',
  'wheat-farmer': 'kansas-wheat-harvest',
}

export function sceneSrc(id: string): string {
  return `/scenes/${id}.webp`
}

export function sceneOf(personId: string): Scene | undefined {
  const id = PERSON_SCENE[personId]
  return id ? SCENES[id] : undefined
}
