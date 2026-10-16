# 새 기획에서 지운 것

새 흐름(오늘 → 이어진 사람들 → 걷기 → 공유)에서 닿지 않던 화면과 코드를 지웠어요. 필요하면 git 기록에서 되살릴 수 있어요.
예전 주소는 첫 화면으로 보내요(app/middleware/redesign.global.ts, 예전 공유 링크 /d·/p·/v는 server/routes).

## 지운 것

- 화면: 마을, 도감, 물건 넣기, 여정, 미스터리, 하루 유형 테스트, 지난 기록·나의 실타래, 밤사이 도착, 예전 공유 링크 화면(/d·/p·/v)
- 컴포넌트: 캐릭터·사람 카드·주민 카드·마을 지도·친해진 정도·핵심 인물 여정·되감기 연출·오고 있는 물건 등 예전 화면용 전부
- 기능 코드: 오고 있는 물건(incoming), 나의 실타래(threads), 고마워요·감사 장면·엔딩(thanks), 미스터리(mystery), 기능 열림 순서(unlocks),
  하루 유형(day-type), 사람 소개(intro), 마을·꽃(village·visit·data/village), 다음 여정 추천(next), 파츠 캐릭터(character-svg)
- 서버: 공유 링크의 답·고마워요·소개 고마워요·내용 고치기, 고마움 수(api/thanks), 마을 꽃(api/village), 사람별 모두의 오늘 보내기(api/meet)
- 공유 종류: day·person·village. 지금은 thread(/t)만
- 그림·스크립트: 예전 OG(하루 유형·사람 소개·마을 초대), 마을 지도와 생성기, 형태 아이콘(public/forms)·formIcon, 캐릭터 파츠,
  build-og·build-map-overview·day-type-dist·sync-prop-icons

## 남겨 둔 것

- `shared/progress.ts`의 예전 Save 필드(카드·여정·마을·잠금 해제 등): 다른 기기·서버 기록과 합칠 때 잃지 않게 모양은 그대로 둔다(README "저장")
- 사람 데이터의 예전 값(rarity·kind·look): 화면에서 쓰지 않는다
- `shared/journey.ts`: 경로 시드 계산(한 사람 고르기·걷기가 쓴다). 퀴즈·이야기·숨은 만남 부분도 같은 시드 계산에 섞여 있어 그대로 둔다
- `shared/friendship.ts`: 출처 있는 사실(factOf, 걷기)과 예전 사람별 기록 합치기
- 복구 코드로 이어 하기(`/api/profile/restore`, `useSync().restore`): 화면은 없고 서버와 함수만 남아 있다
