/**
 * 여정 화면 하늘 영역(PlaceSky)에 까는 장면 그림. 기준은 문서 '여정 장면 스타일 가이드'.
 * 그림은 public/scenes/{id}.webp (4:3, 가로 1200px 이하). 원본을 art/scenes/{id}.png|jpg|webp에 두고 npm run scenes로 만든다.
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
}

/** 사람 → 장면 */
export const PERSON_SCENE: Record<string, string> = {
  'coffee-picker': 'sidama-coffee-farm',
  'sea-crew': 'container-ship-sea',
  'busan-crane': 'busan-port',
}

export function sceneSrc(id: string): string {
  return `/scenes/${id}.webp`
}

export function sceneOf(personId: string): Scene | undefined {
  const id = PERSON_SCENE[personId]
  return id ? SCENES[id] : undefined
}
