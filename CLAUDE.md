# 내 하루에 닿은 사람들 (my-day-people)

> 오늘 당신만 그런 게 아니었어요. 지구 반대편에도 당신 같은 하루를 보낸 사람이 있고, 당신은 그 사람과 원래 이어져 있었어요.

하루 한 번 저녁에 1분. 출발점은 **오늘의 나(마음)**이고, 물건은 그 사람과 나를 잇는 증거(실)다.
마음을 고르고 오늘 손에 닿은 물건을 고르면, 물건을 **재료로 분해**한 경로 위에서 같은 마음의 하루를 보낸 **한 사람**을 만나 그 사람의 이야기를 읽고 한마디를 건넨다.
기준 문서는 docs/redesign/README.md, 시안은 docs/redesign/mockups. 카드 수집·희귀도·퀴즈·세트·마을·파츠 캐릭터 화면과 코드는 지웠다(docs/redesign/unused.md).
예전 Save 필드와 사람 데이터의 예전 값(rarity·kind·look 등)은 기록 호환을 위해 남아 있다.

## 스택과 명령

- Nuxt 4 (Vue 3.5, TypeScript), `ssr: false` SPA + Nitro 서버 API. 배포는 Vercel.
- 진행 상황 원본은 브라우저 localStorage(`my-day-people:v1`). 앱을 열 때·한마디를 건넬 때 Upstash와 합친다(익명 id + 복구 코드, 로그인 없음).
  남길 기록(하루 기록·하는 일)이 생기기 전에는 서버에 익명 기록을 만들지 않는다(걷기만 보는 사람, shared/progress.ts hasProgress).
  하루의 한 줄과 직접 쓴 한마디는 기기에만(`my-day-people:today-local`).
- `npm run dev` / `npm run build` / `npm run typecheck` / `npm run check:data`(데이터 무결성 + 스모크 테스트) / `npm test`(node:test, 매칭 사례)
- 환경 변수: `NUXT_ANTHROPIC_API_KEY`, `NUXT_ANTHROPIC_MODEL`(기본 `claude-haiku-5-5`), `KV_REST_API_URL`/`KV_REST_API_TOKEN`(Upstash), `NUXT_AI_DAILY_LIMIT`, `NUXT_IP_SALT`, `CRON_SECRET`, `MEET_SNAPSHOT_MINUTES`(기본 30). 자세한 건 README

## 구조 (새 기획: 지금 화면)

```
app/pages/index.vue       오늘 흐름: 1 마음(V2Mood) → 2 물건(V2Item) → 3 같은 순간 다른 시각(V2Thread) → 4 그 사람의 오늘(V2Person) → 5 한마디(V2Reply).
                          오늘 기록이 있으면 오늘의 결과와 "내일 저녁에 또 만나요". 화면은 app/components/today/*, 상태는 composables/useToday.ts
app/pages/people.vue      나와 이어진 사람들(V2Map): 서울 기준 방위·대권 거리 별자리 + 날짜 목록. 계산은 shared/connections.ts
app/pages/day/[date].vue  지난 하루의 4번 화면 · app/pages/t/[token].vue 오늘의 실 공유 링크 → 1번 화면으로
app/pages/walk.vue        걷기: 물건이 지나온 길 전체(shared/walk.ts). 깨어 있는 수·형태 변화·바다/하늘/땅 거리·일의 크기·끝 요약, 길 위의 "나"(useSelf, 기기에만).
                          열 때 서버를 부르지 않는다. 고유명사는 길 대신 한마디 + 지도 검색 링크(server/api/whereis.post.ts, 캐시 quip:{정규화})
app/components/BottomNav.vue 아래 메뉴 셋(오늘·이어진 사람들·걷기). 흐름 2~5번에서는 감춘다
app/middleware/redesign.global.ts 지운 화면(마을·도감·여정·미스터리·테스트 등) 주소는 첫 화면으로
app/assets/css/today.css  새 기획 디자인 기준(흰 바탕, Noto Sans KR, 56px 버튼, 강조색 없이 실의 색 = 마음의 색)
app/composables/useToday.ts 흐름 상태와 저장(Save.todays, 기기에만 남기는 한 줄·직접 쓴 말은 utils/today-local.ts)
app/composables/useThreadShare.ts 오늘의 실 공유: 링크(/t) + 앱이 그린 V2Quote 카드(utils/share-image.ts drawQuoteCard)를 og:image로 올림
app/composables/usePlaceNow.ts 그곳 지금 시각 (개발 중 ?clock=05:30·?date=YYYY-MM-DD)
app/utils/resolve-item.ts 물건 이름 → 재료 (로컬 매칭 → 서버)
shared/data/moods.ts      마음 8개(보이는 말·칸·색·제목 꼴·기억 문장 꼴·V2Mood 점 자리)
shared/data/stories.ts    이야기: 편마다 { moods, text } (사용자가 고른 문구, 묻지 않고 고치지 않는다). 열여섯 명은 10화 연재(하다체, 원고·사실 메모 docs/stories,
                          쓰는 규칙 docs/key-people.md "연재"). 예전 판 기록의 편 번호는 key-story.ts currentEpisode·coveredEpisodes(TodayRecord.rev).
                          태그 검토표 docs/redesign/mood-tags.md (npm run mood-tags)
shared/data/replies.ts    5번 화면 한마디 보기(좋은 마음이면 다른 보기). 서버에는 번호만
shared/pick.ts            한 사람 고르기: 첫 재료 경로(+가게 사람)에서 안 본 편 중 오늘의 마음 태그 → 같은 칸 → 아무나의 다음 편 → 없으면 시작한 손을 카드 문구로
shared/today-text.ts      흐름 화면 문구(날짜, 머리말·제목, 3번 문장, 기억 한 줄, 모두의 오늘)
shared/today-log.ts       하루 기록에서 지난 만남(본 편)·기억 한 줄
shared/connections.ts     이어진 사람들 자리(방위각·대권 거리·로그 반지름, 한국 안 사람·바다 위 자리, 오래된 실 흐리게)
shared/progress.ts        Save.todays[서울 날짜] = { mood, item, personId, episode, reply(번호|'own') }. mergeSaves는 한마디를 건넨 쪽
shared/share.ts           공유 종류 thread(/t, 30일): 날짜·마음·사람·편·물건만. threadQuote(첫 문장)·threadWho
shared/local-time.ts      그곳의 시각·서울과의 차이·하늘 시간대(SKY)·지금은 아마(doing.ts·calendar.ts의 주말·공휴일)
shared/today.ts           모두의 오늘 스냅샷: 마음 id별 수(moods, 8개 PFCOUNT), moodCountFor. counts는 예전 모양이라 늘 비어 있다
shared/peek.ts            지금 들여다보기 시트(이어진 사람·걷기에서 누른 사람) · shared/job.ts 하는 일 묻기(3일째 한 번, data/jobs.ts)
server/api/mood.post.ts   실을 묶으면 마음 id만 받아 mood:{마음}:{YYYYMMDD} HyperLogLog에 (스냅샷이 30분마다 센다)
server/api/share/[token]/image.post.ts 오늘의 실 카드 그림(JPEG) 올리기(링크를 만든 기기만) · server/routes/og/t/[file] 그림 주기 · server/routes/t/[token] OG
server/routes/d·p·v       예전 공유 링크 → 첫 화면
```

## 구조 (공통 데이터·서버)

```
shared/                 앱과 서버가 상대 경로로 함께 import (Nuxt 자동 import 대상 아님)
  types.ts              Person, Material, Product, MaterialForm 타입
  data/places.ts        장소 (country, continent, tz → 그곳의 시각)
  data/people.ts        사람. user: 이 앱을 쓰는 진짜 사람(USERS, 화면에서 이름 옆 점). rarity·kind·look은 예전 값(화면에서 쓰지 않음)
  data/names.ts         사람 이름(나라별 출처는 주석)
  data/materials.ts     재료 경로(stages = 사람 id 순서), 출발지 변형(originHead, origins), 대표 물건(PRODUCTS)
  data/synonyms.ts      동의어 묶음 (첫 단어가 대표 표기)
  data/journey-extras.ts 예전 여정 이벤트·숨은 만남 규칙(경로 시드 계산이 아직 같이 쓴다)
  data/shops.ts         길 마지막의 가게·사무실 사람. closingKind(물건 이름, 재료)로 종류를 정한다(가게가 없는 종류는 [])
  data/stories.ts       이야기(사용자가 쓴 문구라 고치지 않는다). 규칙은 docs/key-people.md
  data/doing.ts         '지금은 아마 …': 사람마다 일·저녁(일 끝나고 4시간)·잠 문구, 일하는 시간(hours, 기본 7~18시),
                        평일에만 일하는 사람(days: 'weekdays'). 없으면 일반 문구(check:data)
  data/calendar.ts      나라 코드·주말 요일·공휴일 찾기. 공휴일은 holidays.json(npm run holidays가 date-holidays로 3년치 생성,
                        한국어 이름표는 scripts/build-holidays.ts). check:data가 올해·내년이 있는지 본다
  data/transport.ts     운송 구간 사람(배·비행기·트럭)과 '배'·'바다를 건너는 중' 같은 말
  data/scenes.ts        장면 그림 목록(public/scenes/{id}.webp, 대체 글)과 사람 → 장면. 원본은 art/scenes에 두고 npm run scenes
  data/forms.ts         재료별 형태 목록(실제 가공 순서, by = 그 형태를 만드는 사람). 걷기의 형태 변화. 재료를 추가하면 여기도 채운다(check:data)
  data/work-quizzes.ts  일의 크기 숫자(출처·계산식 주석). friendship.ts factOf가 걷기에 내준다
  data/dictionary.json  미리 만든 물건 사전 (scripts/build-dictionary.ts가 생성). 서버에서만 import
  data/dictionary-client.json 앱용 사전(한마디 하나만, scripts/build-client-dictionary.ts, match/slim.ts). 화면에서 바로 매칭할 때 쓴다
  safety.ts             looksFactual: AI 문구에 숫자·나라 이름이 섞였는지 검사
  progress.ts           Save 타입, mergeSaves·sanitizeSave(예전 필드도 합치고 검사한다), hasProgress(서버 기록을 만들지)
  friendship.ts         출처 있는 사실(factOf)·예전 사람별 기록 합치기(Save 호환)
  nickname.ts · recovery.ts(복구 코드 '낱말-낱말-숫자4') · voice.ts({name} 자리표시자, AI에 닉네임을 보내지 않는다)
  match/                AI 없는 매칭. normalize → exact → synonym → typo(자모 편집 거리, 세 글자 이상) → compound → partial, 결과에 via.
                        입력이 들어 있는 다른 물건(딸기 → 딸기 우유)으로는 잡지 않는다(widen.ts, 서버 AI 결과·캐시도 같은 규칙)
  journey.ts            경로 시드 계산(buildTimeline·keyPeople·materialRoute). 한 사람 고르기와 걷기가 쓴다
  key-story.ts          이야기 편(storyEpisodes, 예전 판 편 번호 옮기기)
  distance.ts           장소 좌표로 대권 거리, 100km 단위 반올림
  rewind.ts             placeLabel('에티오피아 시다마')
  cleanup.ts            날짜 키 청소 규칙: 기간 없이 두는 mood:*(예전 meet:*·thanks:day:*) 중 어제보다 이전 것
  local-time.ts         그곳의 시각·서울과의 차이·하늘 시간대·'지금은 아마'
  random.ts             hash / mix32 / seeded
  logic.ts              sanitizeMaterialIds / findLinkCards / withJosa / seoulDateKey / 고유명사(PROPER_KINDS) 등 순수 함수
server/
  api/decompose.post.ts 텍스트·사진 → 재료 id. 로컬 매칭 → 공유 캐시 → (IP별 하루 한도 안에서) Claude → 캐시 저장
  api/profile/          index(익명 id·복구 코드 발급, 오늘 기록이 생긴 뒤에만) · sync · restore(지금은 화면 없음)
  api/share/            오늘의 실 링크 만들기(POST) · [token]/image(카드 그림)
  routes/t/[token].get.ts /t/{token}: SPA 껍데기 HTML에 그 링크의 OG meta(utils/share-page.ts defineShareRoute). 예전 /d·/p·/v는 첫 화면으로
  api/today-snapshot.get.ts 모두의 오늘 읽기: 마음 수 스냅샷 한 키(meet-snapshot, MEET_SNAPSHOT_MINUTES 기본 30분). CDN s-maxage도 같은 값
  api/cron/cleanup.get.ts Vercel Cron(서울 새벽 4시, nuxt.config의 nitro.vercel.config.crons). CRON_SECRET Bearer 검사 후 이틀 지난 날짜 키 SCAN·DEL
  plugins/kv.ts         useStorage('kv'): Upstash(env 있을 때) / 개발 .data/kv 파일 / 그 밖 메모리
  utils/kv.ts           incrementCounter, incrementScores(ZINCRBY), setIfAbsent, hllAdd/hllCount, scanKeys/deleteKeys, hashIp. 키는 Redis에서 mdp: 아래
  utils/ai-cache.ts     캐시 읽기·쓰기(hits, firstSeen), allowAiCall(한국 자정 기준), countMissing(준비 중 재료 집계)
  utils/visitor.ts      visitorKey: 하루 한 번 세기의 '누가'(사용자 id 해시, 없으면 IP 해시)
  utils/users.ts        user:{id}(메타+진행 상황 한 값), code:{code}→id. 나중 로그인 연결 구조 주석
  utils/matcher.ts      대표 물건 + 물건 사전으로 만든 서버 매처 (사전을 클라이언트 번들에 넣지 않으려고 서버에 둔다)
  utils/decompose.ts    Claude Messages API 호출. SYSTEM·buildTool을 사전 스크립트와 공유. voice/twist는 looksFactual로 거름
app/
  composables/useGame.ts  저장소(localStorage + effectScope watch). replaceSave·snapshotSave
  composables/useSync.ts  서버 동기화·복구 코드로 이어 하기 (plugins/sync.client.ts가 앱을 열 때 호출)
  composables/useTodayMeets.ts 모두의 오늘: 마음 묶기(tieMood)·스냅샷 읽기
  utils/share-image.ts    오늘의 실 카드(drawQuoteCard)·savePng
  utils/motion.ts         모든 시간 값. CSS는 plugins/motion.client.ts가 넣는 --motion-* 변수
  utils/local-match.ts    대표 물건 + 앱용 사전으로 서버 없이 즉시 분해
scripts/check-data.ts     데이터 검사. 모든 변경 후 반드시 통과시킬 것
scripts/key-candidates.ts 핵심 자리에 올 수 있는 사람 목록 → docs/key-candidates.md (npm run key-candidates)
scripts/build-og-cards.ts 오늘의 실 공통 OG(public/og/thread.png)를 resvg로. 글꼴은 scripts/fonts의 Pretendard OTF(OFL) (npm run build:og-cards)
scripts/build-scenes.ts   장면 그림을 webp, 가로 1200px 이하로 (npm run scenes, sharp)
scripts/build-dictionary.ts  data/seeds/*.txt → Message Batches API → dictionary.json + data/review/dictionary.csv (--dry-run, --limit, --resume)
scripts/import-foodsafety.ts (선택, 실행 보류) 식품안전나라 원재료 → 재료 규칙 연결 뼈대
scripts/update-origins.ts (실행 보류) 관세청 수출입실적 → 출발지 가중치 제안 뼈대
scripts/time-ai.ts        AI 분해 응답 시간 재기 (node --env-file=.env --import tsx scripts/time-ai.ts)
scripts/export-cache.ts   AI 캐시를 조회 수 순으로 data/review/cache.csv (사용자 입력이 들어 있어 커밋하지 않음)
scripts/user-stats.ts     운영 사용자 현황 집계(npm run stats). .env.stats(vercel env pull .env.stats --environment=production)만 읽어 SCAN·MGET만, 숫자만 출력. 집계는 scripts/user-stats-summary.ts
tests/                    node:test + tsx 단위 테스트
```

## 꼭 지킬 원칙

0. (새 기획) 하루의 한 줄과 직접 쓴 한마디는 기기에만 둔다. 서버 동기화·로그·공유(링크·카드 그림) 어디에도 보내지 않는다.
   이야기가 몇 편인지, 더 남았는지는 화면 어디에도 드러내지 않는다. 장식 없이 여백과 글자 크기로, 강조색은 오늘 마음의 색 하나.

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
12. 친해진 정도와 희소도는 별개다. 친해진 정도·감사 수로 사람 순위를 매기지 않고, 연속 출석이나 "안 하면 사라져요" 같은 잃는 장치는 넣지 않는다.
13. 작업 보고(채팅 답·마무리 보고)는 한국어 해요체로 쓴다. 파일 이름·명령·코드 식별자는 원래 표기 그대로 둔다.

## 알려진 상태

- `npm install`, `npm run build`, `npm run check:data`, `npm run typecheck`(nuxt typecheck, vue-tsc는 devDependency) 모두 통과. 시작할 때 나오는 `vue-router/volar/sfc-route-blocks` 경로 경고는 무시해도 된다(검사는 그대로 돈다).
- `package-lock.json`을 커밋해 둔다. lock 파일 없이 npm 10.9로 설치하면 npm 자체 버그(`Cannot read properties of null (reading 'edgesOut')`)로 실패한다.
- Vue 템플릿 안 화살표 함수에서 `MATERIALS[id]`처럼 공유 데이터를 인덱싱하면 vue-tsc가 잘못된 타입 오류를 낸다. 스크립트 쪽 함수로 빼서 쓴다.
