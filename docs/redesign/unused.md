# 새 기획에서 쓰지 않게 된 파일

새 흐름(오늘 → 이어진 사람들 → 공유)을 검증한 뒤 지울 목록이에요. 아직 아무것도 지우지 않았어요.
주소로 들어와도 첫 화면으로 보내고(app/middleware/redesign.global.ts, 예전 공유 링크는 server/routes/d·p·v), 메뉴에서는 뺐어요.

목록은 새 화면(app.vue, pages/index·people·day·t, BottomNav, plugins, middleware, server/routes, cron)에서
import·컴포넌트 태그·composable 호출·`/api/…` 호출을 따라가서 닿지 않는 파일을 뽑았어요.

## 1. 새 화면에서 닿지 않는 파일 (지워도 빌드에 영향 없음)

### 화면 (app/pages)
- `village.vue` 마을 (예전 첫 화면)
- `dex.vue` 도감
- `add.vue` 오늘 쓴 물건 넣기
- `journey/[id].vue` 여정(핵심 인물 셋·묶음 칸·퀴즈·숨은 만남)
- `mystery.vue` 미스터리
- `test/index.vue`, `test/result.vue` 하루 유형 테스트
- `result.vue` 지난 기록, `threads.vue` 나의 실타래
- `arrival/[id].vue` 밤사이 도착
- `d/[token].vue`, `p/[token].vue`, `v/[token].vue` 예전 공유 링크 화면

### 컴포넌트 (app/components)
Character, DayResultView, DeviceTransfer, EndScene, FlowerMark, FormBadge, FriendResidentSheet, FriendshipPanel,
IncomingCard, IntroSheet, KeyGroup, KeyIntro, KeyPerson, MeetAgain, MiniCard, NicknameEditor, PersonCard, PlaceSky,
RecordTabs, ResidentSheet, RewindReplay, SeenStories, ThanksScene, ThreadsTapestry, VillageMap

### composables · utils (app)
- composables: `useGratitude.ts`, `usePanZoom.ts`, `useShare.ts`(하루 유형·소개 링크), `useTapestry.ts`, `useVillageLink.ts`
- utils: `day-test.ts`, `image.ts`, `labels.ts`, `pan-zoom.ts`, `product-icon.ts`, `vehicle-icon.ts`

### 서버
- 공유: `api/share/[token].get.ts`, `api/share/[token]/reply.post.ts`, `api/share/[token]/thank.post.ts`,
  `api/share/intro-thanks.post.ts`, `api/share/replies.post.ts`, `api/share/update.post.ts`, `utils/intro.ts`
- 고마움 수: `api/thanks/index.get.ts`, `api/thanks/index.post.ts`
- 마을 꽃: `api/village/[token].get.ts`, `api/village/[token]/flower.post.ts`, `api/village/flowers.post.ts`, `utils/village.ts`

### shared
- `next.ts`(다음 여정 추천), `match/slim.ts`

## 2. 아직 import되지만 새 흐름에서 쓰지 않는 것

새 흐름은 `useGame`에서 저장값(state)과 동기화만 쓴다. 아래는 `useGame`(카드·여정·미스터리·마을·잠금 해제)이나
`plugins/meet.client.ts`(예전 여정에서 만난 사람 보내기)를 거쳐서만 닿는 파일이에요. `useGame`에서 예전 기능을 덜어 내면 함께 지울 수 있어요.
- `shared/village.ts`, `shared/visit.ts`, `shared/incoming.ts`, `shared/threads.ts`, `shared/thanks.ts`, `shared/mystery.ts`
- `shared/data/thanks.ts`, `shared/data/mystery.ts`
- `app/plugins/meet.client.ts`와 `server/api/meet/index.post.ts`(사람별 모두의 오늘 보내기)

다른 길로도 닿지만 새 흐름에서는 일부만 쓰는 것:
- `shared/share.ts`: 공유 종류 day·person·village(새 흐름은 thread만). `server/utils/share-page.ts`의 OG 넣기는 /t가 쓴다
- `shared/progress.ts`의 예전 Save 필드(카드·여정·마을·잠금 해제 등): README "저장"대로 지우지 않고 화면에만 쓰지 않는다
- `shared/journey.ts`: 한 사람 고르기가 timeline·keyPeople을 쓴다. 화면 목록(journeyScreens)·퀴즈·이벤트 부분은 쓰지 않음
- `shared/key-story.ts`: storyEpisodes·storyEpisodeList만 (keyMeets·nextEpisode·seenEpisodes는 쓰지 않음)
- `shared/unlocks.ts`, `shared/friendship.ts`, `shared/day-type.ts`, `shared/intro.ts`, `shared/rewind.ts`(placeLabel만), `shared/character-svg.ts`
- `app/utils/share-image.ts`: drawQuoteCard·savePng만 (하루 유형·두 사람 카드는 쓰지 않음), `app/utils/character.ts`

## 3. 파일 밖의 것
- `public/og/day-*.png`, `public/og/person-*.png`, `public/og/village.png` (예전 링크 미리보기)
- `public/village/*`(마을 지도), `public/forms/*`(형태 아이콘), `app/assets/character/*`(파츠 캐릭터)
- 스크립트: `build-og.ts`(하루 유형 OG), `build-og-cards.ts`의 village·people(thread는 씀), `build-map-overview.ts`, `gen_map2.py`·`village-layout.json`,
  `day-type-dist.ts`(npm run check:day-types), `sync-prop-icons.ts`, `key-candidates.ts`(핵심 자리 기준)
- 테스트: 예전 기능 테스트(village·unlocks·reverse·friendship·mystery·day-type·share의 day·person·village 등)는 코드를 지울 때 같이 지운다
