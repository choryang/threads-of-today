# 내 하루에 닿은 사람들 (my-day-people)

오늘 쓴 물건이 내 손에 오기까지 거쳐 온 사람들을 만나는 수집 게임.
사용자가 물건(또는 아무 말)을 입력하면 **재료로 분해**하고, 재료마다 직접 작성한 여정을 따라가며 사람 카드를 모은다.

## 스택과 명령

- Nuxt 4 (Vue 3.5, TypeScript), `ssr: false` SPA + Nitro 서버 API. 배포는 Vercel.
- 진행 상황은 브라우저 localStorage(`my-day-people:v1`). 로그인·DB 없음.
- `npm run dev` / `npm run build` / `npm run check:data`(데이터 무결성 + 스모크 테스트) / `npm test`(node:test, 매칭 사례)
- 환경 변수: `NUXT_ANTHROPIC_API_KEY`, `NUXT_ANTHROPIC_MODEL`(기본 `claude-haiku-5-5`)

## 구조

```
shared/                 앱과 서버가 상대 경로로 함께 import (Nuxt 자동 import 대상 아님)
  types.ts              Person, Material, Product, LinkRule, CardSet 타입
  data/places.ts        장소 (country, continent → 캐릭터 몸 색)
  data/people.ts        사람 카드. kind: stage | quiz | link | set, rarity: common | rare | epic | legendary
  data/materials.ts     재료 여정(stages = 사람 id 순서), 퀴즈, 대표 물건(PRODUCTS), 연결 규칙, 세트
  data/synonyms.ts      동의어 묶음 (첫 단어가 대표 표기)
  match/                AI 없는 매칭. normalize → exact → synonym → typo(자모 편집 거리) → compound → partial, 결과에 via
  logic.ts              sanitizeMaterialIds / dayStats / findLinkCards / 미스터리 등 순수 함수
server/
  api/decompose.post.ts 텍스트·사진 → 재료 id. shared/match로 잡히면 끝, 아니면 Claude (키 없으면 안내 문구)
  utils/decompose.ts    Claude Messages API 호출. tool_choice로 report_materials 강제, material_ids는 enum
app/
  composables/useGame.ts  게임 상태·규칙 (effectScope로 저장 watch, 하루 여정 3번, 미스터리 보너스)
  pages/                  index(입력 3방식) · journey/[id] · mystery · dex · result(html-to-image 공유)
  utils/character.ts      모자(hat)·소품(prop) 파츠를 조합한 SVG 콩 캐릭터
scripts/check-data.ts     데이터 검사. 모든 변경 후 반드시 통과시킬 것
tests/                    node:test + tsx 단위 테스트
```

## 꼭 지킬 원칙

1. **사실 정보는 `shared/data`에만.** AI는 "어떤 재료로 나눌지"와 재미 문구(twist, voice)만 만든다. 국가·통계·경로를 AI가 지어내 화면에 내보내지 않는다.
2. 여정은 "무역·생산 구조를 바탕으로 한 대표 경로 예시"다. 확신 없는 사실은 넣지 말고, 새 사실을 넣을 땐 근거를 주석으로 남긴다. 존재하지 않는 통계 수치를 만들지 않는다.
3. **희귀도는 발견 난이도로 정한다.** 고된 노동일수록 희귀하게 만드는 식으로 실제 사람의 노동을 뽑기 대상화하지 않는다.
4. UI 문구는 한국어 해요체. 이모지 금지(아이콘은 인라인 SVG). 터치 영역 44px 이상.
5. 한 글자 별칭('김', '면', '차')은 다른 단어에 섞여 오매칭된다. 부분 일치 매칭에는 2글자 이상만 쓴다.
6. API 키 없이도 앱이 동작해야 한다(로컬 매칭으로 폴백).
7. 사람 카드를 추가하면 어떤 경로로든 얻을 수 있어야 한다(check:data가 검사).

## 알려진 상태

- `npm install`, `npm run build`, `npm run check:data`, `npx nuxt typecheck`(vue-tsc 필요) 모두 통과.
- `package-lock.json`을 커밋해 둔다. lock 파일 없이 npm 10.9로 설치하면 npm 자체 버그(`Cannot read properties of null (reading 'edgesOut')`)로 실패한다.
- Vue 템플릿 안 화살표 함수에서 `MATERIALS[id]`처럼 공유 데이터를 인덱싱하면 vue-tsc가 잘못된 타입 오류를 낸다. 스크립트 쪽 함수로 빼서 쓴다.
