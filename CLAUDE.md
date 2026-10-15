# 내 하루에 닿은 사람들 (my-day-people)

오늘 쓴 물건이 내 손에 오기까지 거쳐 온 사람들을 만나는 수집 게임.
사용자가 물건(또는 아무 말)을 입력하면 **재료로 분해**하고, 재료마다 직접 작성한 여정을 따라가며 사람 카드를 모은다.

## 스택과 명령

- Nuxt 4 (Vue 3.5, TypeScript), `ssr: false` SPA + Nitro 서버 API. 배포는 Vercel.
- 진행 상황 원본은 브라우저 localStorage(`my-day-people:v1`). 앱을 열 때·여정을 마칠 때만 Upstash와 합친다(익명 id + 복구 코드, 로그인 없음).
- `npm run dev` / `npm run build` / `npm run typecheck` / `npm run check:data`(데이터 무결성 + 스모크 테스트) / `npm test`(node:test, 매칭 사례)
- 환경 변수: `NUXT_ANTHROPIC_API_KEY`, `NUXT_ANTHROPIC_MODEL`(기본 `claude-haiku-5-5`), `KV_REST_API_URL`/`KV_REST_API_TOKEN`(Upstash), `NUXT_AI_DAILY_LIMIT`, `NUXT_IP_SALT`, `CRON_SECRET`, `MEET_SNAPSHOT_MINUTES`(기본 30). 자세한 건 README

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
  data/village.ts       내 하루 마을: 구역 5개(이름표·대략적인 범위·발끝 자리 slots·넘칠 때 빈 땅 overflow), 일터 목록,
                        사람마다 구역·일터(RESIDENCE → Person.zone·workplace), 구역이 애매한 사람. 자리는 지도 생성기 도형으로 계산
  data/transport.ts     운송 구간 사람(배·비행기·트럭)과 '배'·'바다를 건너는 중' 같은 말
  data/forms.ts         되감기 변신: 재료별 형태 목록(실제 가공 순서, by = 그 형태를 만드는 사람, formIcon = public/forms 아이콘 slug). 재료를 추가하면 여기도 채운다(check:data)
  data/dictionary.json  미리 만든 물건 사전 (scripts/build-dictionary.ts가 생성). 서버에서만 import
  data/dictionary-client.json 앱용 사전(한마디 하나만, scripts/build-client-dictionary.ts). 화면에서 바로 매칭할 때 쓴다
  safety.ts             looksFactual: AI 문구에 숫자·나라 이름이 섞였는지 검사
  progress.ts           Save 타입, mergeSaves(카드·물건 합집합, 날짜 기록 30일, 사람별 기록 합집합·OR, 오고 있는 물건은 여정 id로·연 기록 유지, 단짝 연출 본 주민 bestSeen 합집합, 본 열림 알림 unlockSeen 합집합·연 날짜 unlockedOn 이른 날짜·없으면 없는 채로), sanitizeSave(서버 입력 검사)
  friendship.ts         친해진 정도: 사람별 기록(metItems·gratitudeDays·quizCorrect)에서 퍼센트 계산(저장하지 않음), 열리는 단계,
                        출처 있는 사실(workFact)·퀴즈(한 재료에만 나오는 사람의 일의 크기 퀴즈), 예전 기록 마이그레이션
  nickname.ts           기본 닉네임 조합·normalizeNickname(1~12자)
  recovery.ts           복구 코드 '낱말-낱말-숫자4' 생성·정규화
  voice.ts              voice의 {name} 자리표시자 검사·renderVoice (AI에 닉네임을 보내지 않는다)
  match/                AI 없는 매칭. normalize → exact → synonym → typo(자모 편집 거리) → compound → partial, 결과에 via
  journey.ts            buildTimeline(materialIds, journeyId): 여정 id 시드로 출발지·이야기·숨은 만남·퀴즈 변형. '-꼬리' 없는 예전 id는 기본 경로
                        첫 여정('-first')은 사람 카드만(퀴즈·경유지 맞히기·이야기·같은 길·숨은 만남 없음), 두 번째 여정('-second')에 숨은 만남·퀴즈 선물 보장
                        id에 '-r'이 붙은 새 여정은 reverseTimeline(내 손 → 원산지). forwardTimeline을 재배치만 해서 판정은 정방향과 같다
  distance.ts           거리 계산기: 장소 좌표로 대권 거리 누적(바다는 건너뜀), 100km 단위 반올림
  incoming.ts           오고 있는 물건: 운송 구간(data/transport.ts)이 있고 못 만난 평범한 사람이 남으면 생김(최대 3), 다음 날 6시(서울) 도착,
                        진행 비율, 여정 데이터의 경유지 문구. 데려올 사람은 stage 사람만(희소도를 건드리지 않게)
  day-type.ts           나의 하루 유형(10초 테스트): docs/day-types.md 기준표 그대로. 테스트 물건 18개, 재료 분류, 판정·숫자 3개(기본 경로만)
  share.ts              공유 링크 공통 구조: 종류(day /d · person /p · village /v)별 TTL·주소·내용 검사, 발급·조회·재발급(이전 링크 닫기)·답.
                        링크를 만든 기기의 관리 키 해시만 저장. 복구 코드·사용자 id는 토큰·저장 값·응답·로그 어디에도 넣지 않는다
  visit.ts              마을에 놀러 가서 꽃 남기기: 꽃(닉네임·주민·날짜) 색(구역별)·하루 한 송이·새 꽃 알림 문구, 못 만난 주민의 힌트 물건(없으면 세트 보상: setRewardOf)
  intro.ts              사람 카드 소개: 정해진 문구 4개(맛있어서는 먹는 대표 물건만), 소개 화면의 사람 크기 사실(workFactHuman), 보낸 사람 알림 문구
  unlocks.ts            기능을 여는 순서 (docs/screen-cleanup.md 표 그대로): 단계·조건(마친 여정 수·첫 단짝)·알림 문구, 순수 판정 함수.
                        화면은 game.opens(기능)만 보고 보여 준다. 잠긴 단계도 stepState·nextLocked로 남은 조건을 보여 준다(마을 한 줄·메뉴 열리는 기능·도감 탭). 열림은 서울 날짜로 하루에 하나씩(연 날짜 Save.unlockedOn, 이른 날짜). 본 알림은 Save.unlockSeen(합집합). 링크로 들어온 화면(/d·/p·/v)은 조건과 상관없이
  today.ts              모두의 오늘: 숫자 포맷, "오늘 1,203명이 이 분을 만났어요"·여정 끝 합 문구, 사람마다 하루 한 번만 보내기, 스냅샷(MEET_SNAPSHOT_MINUTES, 기본 30분)·스냅샷 뒤 내 몫 더하기
  cleanup.ts            날짜 키 청소 규칙: 기간 없이 두는 meet:*·thanks:day:* 중 어제보다 이전 것
  character-svg.ts      캐릭터 SVG 조립(순수 함수)과 피부색. 앱(app/utils/character.ts)과 OG 스크립트가 같이 쓴다
  village.ts            마을 자리 배정(먼저 만난 사람부터 hash(id) 자리, 모자라면 빈 땅), 빈 집터, 주민 나라 수
  rewind.ts             거꾸로 가는 여정 연출: 칸마다 형태(formsAlong), 문구, '이 전엔 어디 있었을까요?', 되감기 엔딩 순서
  random.ts             hash / mix32 / seeded
  logic.ts              sanitizeMaterialIds / dayStats(여정별 실제 경로) / findLinkCards / 미스터리 등 순수 함수
  mystery.ts            미스터리 힌트 5개. 3·4번은 보기의 다른 물건과 겹치지 않는 사람·출발지를 고른다
  thanks.ts             고마워요 답(카드 id 시드)·세트 감사 장면·엔딩 판정. 문구는 data/thanks.ts
  threads.ts            나의 실타래: 재료별 누적(backfillThreads·addJourneyToThreads)과 나라 매듭 방사형 배치(buildTapestry)
server/
  api/decompose.post.ts 텍스트·사진 → 재료 id. 로컬 매칭 → 공유 캐시 → (IP별 하루 한도 안에서) Claude → 캐시 저장
  api/profile/          index(익명 id·복구 코드 발급) · sync · restore
  api/share/            공유 링크: POST(만들기·다시 만들기) · GET [token] · POST [token]/reply('보여주기') · POST replies(관리 키로 답 읽기)
  routes/d/[token].get.ts  /d/{token}: SPA 껍데기 HTML에 그 링크의 OG meta를 넣어 돌려준다(ssr: false라 크롤러용). utils/share-page.ts
  api/village/          [token] GET(공개용: 닉네임·주민 id·최근 꽃만) · [token]/flower POST(하루 한 송이, 감사 수 B에도) · flowers POST(주인, 관리 키)
  routes/p/[token].get.ts  /p/{token}: 사람 카드 소개 OG(사람별 og/person-{id}.png)
  api/share/[token]/thank  소개받은 사람의 고마워요(가입 없이, 링크마다 한 번, 감사 수 B에도) · api/share/intro-thanks(보낸 사람, 관리 키 목록). utils/intro.ts
  routes/v/[token].get.ts  /v/{token}: 마을 초대 OG(공통 이미지 og/village.png). /d·/v·/p는 utils/share-page.ts의 defineShareRoute 하나로
  utils/village.ts      마을 꽃 저장(village-flowers:{주인 해시} 최근 200개·60일, village-flower-day 하루 한 송이)
  api/meet/             모두의 오늘 보내기: POST(만난 사람들, PFADD meet:{사람}:{YYYYMMDD}, EXPIRE 없음). utils/meet.ts
  api/today-snapshot.get.ts 모두의 오늘 읽기: 사람 전체 수를 한 번에 센 스냅샷 한 키(meet-snapshot, MEET_SNAPSHOT_MINUTES 기본 30분 지나면 다시 셈). CDN s-maxage도 같은 값
  api/cron/cleanup.get.ts Vercel Cron(서울 새벽 4시, nuxt.config의 nitro.vercel.config.crons). CRON_SECRET Bearer 검사 후 이틀 지난 날짜 키 SCAN·DEL
  api/thanks/           다른 사람들의 고마움: POST(고마워요 1번 세기, 같은 기기·같은 날·같은 사람은 한 번) · GET ?ids=(오늘 수·누적 수)
  plugins/kv.ts         useStorage('kv'): Upstash(env 있을 때) / 개발 .data/kv 파일 / 그 밖 메모리
  utils/kv.ts           incrementCounter(INCR, EXPIRE는 처음 한 번만·없으면 청소가 지움), incrementScores(ZINCRBY), setIfAbsent, hllAdd/hllCount, scanKeys/deleteKeys, hashIp. 키는 Redis에서 mdp: 아래
  utils/ai-cache.ts     캐시 읽기·쓰기(hits, firstSeen), allowAiCall(한국 자정 기준), countMissing(준비 중 재료 집계)
  utils/gratitude.ts    고마움 수 키(thanks:day·thanks:total·thanks:seen). 사람 한 명씩만 읽고 순위는 만들지 않는다
  utils/users.ts        user:{id}(메타+진행 상황 한 값), code:{code}→id. 나중 로그인 연결 구조 주석
  utils/matcher.ts      대표 물건 + 물건 사전으로 만든 서버 매처 (사전을 클라이언트 번들에 넣지 않으려고 서버에 둔다)
  utils/decompose.ts    Claude Messages API 호출. SYSTEM·buildTool을 사전 스크립트와 공유. voice/twist는 looksFactual로 거름
                        주재료가 목록에 없으면 대신하지 않고 missing_ingredients로 받는다 → 화면에 "○○의 여정은 아직 준비 중이에요"
app/
  composables/useGame.ts  게임 상태·규칙 (effectScope로 저장 watch, 여정 횟수 제한 없음(AI 입력만 서버가 IP별 하루 한도), 미스터리 여정, 닉네임, 기능 열림 opens·알림)
  composables/useTodayMeets.ts 모두의 오늘 보내기(모아서·하루 한 번)·읽기. plugins/meet.client.ts가 useGame의 onMeet에 붙인다
  composables/usePanZoom.ts 마을 지도 끌기·두 손가락·휠 확대(라이브러리 없이), 8px 이상 끌면 클릭 무시.
                          보기(위치·배율)는 반응형이 아니다: rAF로 한 프레임에 한 번 VillageMap의 paint()가 지도 요소에 직접 쓴다.
                          반응형은 far(0.25 경계) 하나. will-change는 움직이는 동안만(멈추고 150ms 뒤 뗀다, 늘 붙이면 휴대폰에서 축소 시 타일이 빈다). 지도 위에 템플릿으로 transform·배율 값을 묶지 말 것(움직일 때마다 주민 213명을 다시 그린다)
  composables/useSync.ts  서버 동기화·복구 코드로 이어 하기 (plugins/sync.client.ts가 호출)
  components/             ResidentSheet(주민 카드) · FriendshipPanel(친해진 정도) · MeetAgain(또 만났어요)
                          NicknameEditor·DeviceTransfer(마을 메뉴의 설정) · RecordTabs(지난 기록 안 오늘/나의 실타래 전환)
                          VillageMap(내 마을·친구 마을이 같이 쓰는 지도) · FriendResidentSheet · FlowerMark · IntroSheet(이 분 소개하기)
                          FormBadge(지금 물건의 형태) · RewindReplay(빨리 감기 엔딩) · IncomingCard(오고 있는 물건)
  pages/                  index(내 하루 마을: 지도·주민·주민 카드·오고 있는 물건, 처음 온 사람은 /test로) · test(10초 테스트)·test/result
                          d/[token](친구가 보낸 하루 → "당신의 하루는요?") · v/[token](친구 마을: 주민에게 고마워요 → 꽃)
                          p/[token](소개받은 사람: 15초 안에 끝나는 다섯 단계, 가입 없이 고마워요) · arrival/[id](밤사이 도착했어요) · add(오늘 쓴 물건 넣기: 물건 타일 + 직접 쓰기·사진, 미스터리로 가는 길)
                          journey/[id] · mystery · dex(통계) · result(기록: 오늘 여정·html-to-image 공유) · threads(기록 안 나의 실타래)
                          하단 탭은 2개(마을·도감). 지난 기록(/result·/threads)은 마을 메뉴에서, 미스터리는 물건 넣기 화면에서 연다.
                          도감에는 진행률·세트·카드 목록만 둔다
  utils/share-image.ts    공유 이미지 1080×1350을 캔버스로 그린다(나의 하루 유형·두 사람의 하루). 글씨는 위아래 80px 안쪽
  utils/day-test.ts       테스트 물건 18개의 아이콘(형태 아이콘, 없던 7개는 완성품 아이콘 product-*). tests/forms.test.ts가 파일·index.json을 검사
  utils/pan-zoom.ts       지도 배율(최소 = 섬 전체가 위·아래 카드 사이 영역에 들어오는 크기, 최대 1.4)·위치 제한(insets 기준, 작으면 영역 가운데), 한 점 기준 확대, 주민 누르는 영역 hitBox(140×210, 화면 최소 44px),
                          멀리 보기 FAR_SCALE 0.25 (usePanZoom.ts·VillageMap이 쓰는 순수 함수)
  utils/motion.ts         모든 시간 값(전환 0.3초·토스트·고마워요 손 흔들기·자동 넘김 3~6초). CSS는 plugins/motion.client.ts가 넣는 --motion-* 변수
  utils/local-match.ts    대표 물건 + 앱용 사전으로 서버 없이 즉시 분해
  utils/character.ts      모자(hat)·소품(prop) 파츠를 조합한 SVG 콩 캐릭터
  utils/product-icon.ts   메인 물건 타일 아이콘. 대표 물건을 추가하면 여기도 그린다(없으면 상자 모양)
scripts/check-data.ts     데이터 검사. 모든 변경 후 반드시 통과시킬 것
scripts/build-og-cards.ts OG 이미지를 resvg로(마을 초대 공통 한 장, 사람 카드 소개 사람마다 한 장). 글꼴은 scripts/fonts의 Pretendard OTF(OFL) (npm run build:og-cards)
scripts/build-og.ts       OG 이미지(하루 유형 9장 1200×630)를 이 컴퓨터의 Chrome·Edge로 찍어 public/og에 (npm run build:og)
scripts/day-type-dist.ts  하루 유형 분포(3~5개 조합 12,444가지). 한 유형이 25%를 넘으면 실패 (npm run check:day-types)
scripts/sync-prop-icons.ts 캐릭터 소품 7개를 형태 아이콘(public/forms/prop-*.svg)으로 옮긴다. 소품을 고치면 다시 실행
public/village/map-overview.png 지도 전체를 반 크기(1400×2100)로 미리 그린 PNG (npm run build:map-overview). 지도 SVG 아래에 깔고, 배율 0.3 미만에서는 이것만 보인다
public/village/map.svg   마을 지도 2800×4200 (scripts/gen_map2.py로 그린 그림. 출처 메타데이터 <metadata>가 붙어 있어 resvg에 넣을 때는 뺀다)
scripts/gen_map2.py       마을 지도 생성기(python). map.svg와 scripts/village-layout.json(구역 이름표·범위·자리·빈 땅)을 만든다. 값은 data/village.ts에 옮겨 적는다
public/forms/             형태 아이콘 SVG와 index.json(slug → ko·group). tests/forms.test.ts가 formIcon이 모두 있는지 검사
scripts/build-dictionary.ts  data/seeds/*.txt → Message Batches API → dictionary.json + data/review/dictionary.csv (--dry-run, --limit, --resume)
scripts/import-foodsafety.ts (선택, 실행 보류) 식품안전나라 원재료 → 재료 규칙 연결 뼈대
scripts/update-origins.ts (실행 보류) 관세청 수출입실적 → 출발지 가중치 제안 뼈대
scripts/time-ai.ts        AI 분해 응답 시간 재기 (node --env-file=.env --import tsx scripts/time-ai.ts)
scripts/export-cache.ts   AI 캐시를 조회 수 순으로 data/review/cache.csv (사용자 입력이 들어 있어 커밋하지 않음)
scripts/user-stats.ts     운영 사용자 현황 집계(npm run stats). .env.stats(vercel env pull .env.stats --environment=production)만 읽어 SCAN·MGET만, 숫자만 출력. 집계는 scripts/user-stats-summary.ts
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
12. 친해진 정도와 희소도는 별개다. 친해진 정도·감사 수로 사람 순위를 매기지 않고, 연속 출석이나 "안 하면 사라져요" 같은 잃는 장치는 넣지 않는다.
13. 작업 보고(채팅 답·마무리 보고)는 한국어 해요체로 쓴다. 파일 이름·명령·코드 식별자는 원래 표기 그대로 둔다.

## 알려진 상태

- `npm install`, `npm run build`, `npm run check:data`, `npm run typecheck`(nuxt typecheck, vue-tsc는 devDependency) 모두 통과. 시작할 때 나오는 `vue-router/volar/sfc-route-blocks` 경로 경고는 무시해도 된다(검사는 그대로 돈다).
- `package-lock.json`을 커밋해 둔다. lock 파일 없이 npm 10.9로 설치하면 npm 자체 버그(`Cannot read properties of null (reading 'edgesOut')`)로 실패한다.
- Vue 템플릿 안 화살표 함수에서 `MATERIALS[id]`처럼 공유 데이터를 인덱싱하면 vue-tsc가 잘못된 타입 오류를 낸다. 스크립트 쪽 함수로 빼서 쓴다.
