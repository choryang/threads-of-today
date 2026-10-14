# 내 하루에 닿은 사람들 (my-day-people)

오늘 쓴 물건이 내 손에 오기까지 거쳐 온 사람들을 만나는 수집 게임.
사용자가 물건(또는 아무 말)을 입력하면 **재료로 분해**하고, 재료마다 직접 작성한 여정을 따라가며 사람 카드를 모은다.

## 스택과 명령

- Nuxt 4 (Vue 3.5, TypeScript), `ssr: false` SPA + Nitro 서버 API. 배포는 Vercel.
- 진행 상황 원본은 브라우저 localStorage(`my-day-people:v1`). 앱을 열 때·여정을 마칠 때만 Upstash와 합친다(익명 id + 복구 코드, 로그인 없음).
- `npm run dev` / `npm run build` / `npm run check:data`(데이터 무결성 + 스모크 테스트) / `npm test`(node:test, 매칭 사례)
- 환경 변수: `NUXT_ANTHROPIC_API_KEY`, `NUXT_ANTHROPIC_MODEL`(기본 `claude-haiku-5-5`), `KV_REST_API_URL`/`KV_REST_API_TOKEN`(Upstash), `NUXT_AI_DAILY_LIMIT`, `NUXT_IP_SALT`. 자세한 건 README

## 구조

```
shared/                 앱과 서버가 상대 경로로 함께 import (Nuxt 자동 import 대상 아님)
  types.ts              Person, Material, Product, LinkRule, CardSet 타입
  data/places.ts        장소 (country, continent → 캐릭터 몸 색)
  data/people.ts        사람 카드. kind: stage | quiz | link | set | hidden, rarity: common | rare | epic | legendary
  data/materials.ts     재료 여정(stages = 사람 id 순서), 출발지 변형(originHead, origins), 퀴즈(quiz + extraQuizzes), 대표 물건(PRODUCTS), 연결 규칙, 세트
  data/synonyms.ts      동의어 묶음 (첫 단어가 대표 표기)
  data/journey-extras.ts 여정 이벤트(EVENTS, '이야기')·숨은 만남 규칙(HIDDEN_RULES)
  data/shops.ts         여정 마지막 장면의 가게·사무실 사람. closingKind(물건 이름, 재료)로 종류를 정한다
  data/thanks.ts        고마워요 답·세트 감사 장면·엔딩 문구
  data/mystery.ts       미스터리 힌트 1·2번(대표 물건별 쓰임새 한 줄·분류). 대표 물건을 추가하면 여기도 채운다(check:data)
  data/dictionary.json  미리 만든 물건 사전 (scripts/build-dictionary.ts가 생성). 서버에서만 import
  data/dictionary-client.json 앱용 사전(한마디 하나만, scripts/build-client-dictionary.ts). 화면에서 바로 매칭할 때 쓴다
  safety.ts             looksFactual: AI 문구에 숫자·나라 이름이 섞였는지 검사
  progress.ts           Save 타입, mergeSaves(카드·물건 합집합, 날짜 기록 30일), sanitizeSave(서버 입력 검사)
  nickname.ts           기본 닉네임 조합·normalizeNickname(1~12자)
  recovery.ts           복구 코드 '낱말-낱말-숫자4' 생성·정규화
  voice.ts              voice의 {name} 자리표시자 검사·renderVoice (AI에 닉네임을 보내지 않는다)
  match/                AI 없는 매칭. normalize → exact → synonym → typo(자모 편집 거리) → compound → partial, 결과에 via
  journey.ts            buildTimeline(materialIds, journeyId): 여정 id 시드로 출발지·이야기·숨은 만남·퀴즈 변형. '-꼬리' 없는 예전 id는 기본 경로
  random.ts             hash / mix32 / seeded
  logic.ts              sanitizeMaterialIds / dayStats(여정별 실제 경로) / findLinkCards / 미스터리 등 순수 함수
  mystery.ts            미스터리 힌트 5개. 3·4번은 보기의 다른 물건과 겹치지 않는 사람·출발지를 고른다
  thanks.ts             고마워요 답(카드 id 시드)·세트 감사 장면·엔딩 판정. 문구는 data/thanks.ts
  threads.ts            나의 실타래: 재료별 누적(backfillThreads·addJourneyToThreads)과 나라 매듭 방사형 배치(buildTapestry)
server/
  api/decompose.post.ts 텍스트·사진 → 재료 id. 로컬 매칭 → 공유 캐시 → (IP별 하루 한도 안에서) Claude → 캐시 저장
  api/profile/          index(익명 id·복구 코드 발급) · sync · restore
  plugins/kv.ts         useStorage('kv'): Upstash(env 있을 때) / 개발 .data/kv 파일 / 그 밖 메모리
  utils/kv.ts           incrementCounter(INCR+EXPIRE), incrementScores(ZINCRBY), setIfAbsent, hashIp. 키는 Redis에서 mdp: 아래
  utils/ai-cache.ts     캐시 읽기·쓰기(hits, firstSeen), allowAiCall(한국 자정 기준), countMissing(준비 중 재료 집계)
  utils/users.ts        user:{id}(메타+진행 상황 한 값), code:{code}→id. 나중 로그인 연결 구조 주석
  utils/matcher.ts      대표 물건 + 물건 사전으로 만든 서버 매처 (사전을 클라이언트 번들에 넣지 않으려고 서버에 둔다)
  utils/decompose.ts    Claude Messages API 호출. SYSTEM·buildTool을 사전 스크립트와 공유. voice/twist는 looksFactual로 거름
                        주재료가 목록에 없으면 대신하지 않고 missing_ingredients로 받는다 → 화면에 "○○의 여정은 아직 준비 중이에요"
app/
  composables/useGame.ts  게임 상태·규칙 (effectScope로 저장 watch, 하루 여정 3번, 미스터리 보너스, 닉네임)
  composables/useSync.ts  서버 동기화·복구 코드로 이어 하기 (plugins/sync.client.ts가 호출)
  components/             NicknameEditor(도감) · DeviceTransfer(도감 "다른 기기에서 이어 하기") · RecordTabs(기록 탭 안 오늘/나의 실타래 전환)
  pages/                  index(물건 타일 + 직접 쓰기·사진) · journey/[id] · mystery · dex(통계) · result(기록: 오늘 여정·html-to-image 공유) · threads(기록 안 나의 실타래)
                          하단 탭은 4개(오늘·미스터리·도감·기록)
  utils/motion.ts         모든 시간 값(전환 0.3초·토스트·고마워요 손 흔들기·자동 넘김 3~6초). CSS는 plugins/motion.client.ts가 넣는 --motion-* 변수
  utils/local-match.ts    대표 물건 + 앱용 사전으로 서버 없이 즉시 분해
  utils/character.ts      모자(hat)·소품(prop) 파츠를 조합한 SVG 콩 캐릭터
  utils/product-icon.ts   메인 물건 타일 아이콘. 대표 물건을 추가하면 여기도 그린다(없으면 상자 모양)
scripts/check-data.ts     데이터 검사. 모든 변경 후 반드시 통과시킬 것
scripts/build-dictionary.ts  data/seeds/*.txt → Message Batches API → dictionary.json + data/review/dictionary.csv (--dry-run, --limit, --resume)
scripts/import-foodsafety.ts (선택, 실행 보류) 식품안전나라 원재료 → 재료 규칙 연결 뼈대
scripts/update-origins.ts (실행 보류) 관세청 수출입실적 → 출발지 가중치 제안 뼈대
scripts/time-ai.ts        AI 분해 응답 시간 재기 (node --env-file=.env --import tsx scripts/time-ai.ts)
scripts/export-cache.ts   AI 캐시를 조회 수 순으로 data/review/cache.csv (사용자 입력이 들어 있어 커밋하지 않음)
tests/                    node:test + tsx 단위 테스트
```

## 꼭 지킬 원칙

1. **사실 정보는 `shared/data`에만.** AI는 "어떤 재료로 나눌지"와 재미 문구(twist, voice)만 만든다. 국가·통계·경로를 AI가 지어내 화면에 내보내지 않는다.
2. 직접 쓴 여정·이야기·사람 카드는 게임이라 허구가 조금 섞여도 된다. 화면에 "대표 경로 예시" 같은 고지는 붙이지 않는다.
   실제 자료에서 가져온 사실에는 출처를 주석으로 남긴다. 단, AI가 만든 문구에 나라·숫자 같은 사실처럼 보이는 정보가 섞이지 않게 하는 원칙 1은 유지한다.
3. **희귀도는 발견 난이도로 정한다.** 고된 노동일수록 희귀하게 만드는 식으로 실제 사람의 노동을 뽑기 대상화하지 않는다.
4. UI 문구는 한국어 해요체. 이모지 금지(아이콘은 인라인 SVG). 터치 영역 44px 이상.
5. 한 글자 별칭('김', '면', '차')은 다른 단어에 섞여 오매칭된다. 부분 일치 매칭에는 2글자 이상만 쓴다.
6. API 키 없이도 앱이 동작해야 한다(로컬 매칭으로 폴백).
7. 사람 카드를 추가하면 어떤 경로로든 얻을 수 있어야 한다(check:data가 검사).
8. AI에는 닉네임 같은 사용자 정보를 보내지 않는다. 사전·캐시는 모든 사용자가 같이 쓴다.
9. 여정 이벤트(이야기)는 직접 쓴 연출이라 허구여도 된다. 화면에 '이야기' 칩만 붙이고, 연출임을 설명하는 안내 문장은 붙이지 않는다.
   문장은 현재진행형 해요체로 쓰고 숫자·나라 이름은 넣지 않는다(check:data의 looksFactual 검사). 무작위는 늘 여정 id 시드로.
10. Save 모양을 바꾸면 `shared/progress.ts`의 mergeSaves·sanitizeSave와 tests/progress.test.ts도 함께 고친다.
11. 일의 크기 숫자(workFact·work-quizzes)를 보강할 때는 시설 규모나 나라 전체 통계보다 한 사람의 하루(하루에 몇 개, 몇 시간, 몇 km)나
    한 그루·한 송이처럼 손에 잡히는 단위의 숫자를 먼저 고른다. 단위는 미터법(톤·kg·km)으로 환산하고 계산식을 주석에 남긴다.

## 알려진 상태

- `npm install`, `npm run build`, `npm run check:data`, `npx nuxt typecheck`(vue-tsc 필요) 모두 통과.
- `package-lock.json`을 커밋해 둔다. lock 파일 없이 npm 10.9로 설치하면 npm 자체 버그(`Cannot read properties of null (reading 'edgesOut')`)로 실패한다.
- Vue 템플릿 안 화살표 함수에서 `MATERIALS[id]`처럼 공유 데이터를 인덱싱하면 vue-tsc가 잘못된 타입 오류를 낸다. 스크립트 쪽 함수로 빼서 쓴다.
