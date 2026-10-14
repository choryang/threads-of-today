# 내 하루에 닿은 사람들

오늘 쓴 물건 하나가 내 손에 오기까지 거쳐 온 사람들을 만나는 수집 게임.
물건을 **재료로 분해**하고, 재료마다 조사해 둔 여정을 따라가며 사람 카드를 모은다.

## 바로 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

API 키 없이도 동작한다. 이때는 대표 물건 30개와 재료 35개의 키워드로만 분해하고, 사진 인식과 '아무 말이나 잇기'는 꺼진다.

## Vercel 배포

1. 이 폴더를 GitHub 저장소로 올린다.
2. Vercel에서 저장소를 Import 한다. 프레임워크는 Nuxt로 자동 인식된다. 빌드 설정은 기본값 그대로 둔다.
3. Settings → Environment Variables에 추가한다.
   - `NUXT_ANTHROPIC_API_KEY` = Claude API 키 (자유 입력·사진 인식에 필요)
   - `NUXT_ANTHROPIC_MODEL` = `claude-haiku-5-5` (선택, 기본값)
4. Deploy.

입력이 대표 물건 이름과 완전히 같으면 API를 부르지 않는다. 자유 입력이나 사진일 때만 Claude를 한 번 호출한다.
요청 하나에 출력 토큰은 최대 500개로 제한돼 있다.

## 게임 구조

| 입력 방식 | 동작 |
| --- | --- |
| 말로 쓰기 | 뭐든지 입력. 물건이면 그대로, "고양이"·"월요일"처럼 물건이 아니면 가장 가까운 물건으로 이어 준다 (고양이 → 고양이 사료). 물건이 건네는 한마디도 함께 |
| 사진 찍기 | 사진을 768px로 줄여 Claude 비전으로 인식 → 재료 분해 |
| 골라 보기 | 대표 물건 30개 중 선택 (API 호출 없음) |
| 오늘의 미스터리 | 날짜마다 모두에게 같은 물건. 힌트로 맞히면 보너스 여정 |

- 하루 여정 3번. 미스터리 보너스 여정은 따로 센다.
- 카드 희귀도는 사람의 직업이 아니라 **발견하기 어려운 정도**로 정해진다.
  - 일반: 여정에서 만남
  - 레어: 재료 퀴즈를 맞히면 만남
  - 에픽: 하루 동안 지나온 재료들이 같은 사람(선원, 항구, 공장)을 거치면 "연결 발견"
  - 전설: 세트(바다·땅·광산·밥상·공장)를 모두 모으면 만남
- AI는 **어떤 재료로 나눌지만** 정한다. 여정의 사실 정보는 모두 `shared/data`에 직접 작성한 데이터에서만 나온다.
- 처음 분해한 물건에는 FIRST 표시가 붙고, 도감에 '분해해 본 물건' 목록이 쌓인다.
- 진행 상황은 브라우저 localStorage에 저장된다. 로그인과 DB는 없다.

## 폴더

```
app/
  pages/          index(입력) · journey/[id](여정) · mystery · dex(도감) · result(공유 카드)
  components/     Character(SVG 캐릭터) · PersonCard · MiniCard · BottomNav
  composables/    useGame.ts  게임 상태와 규칙
  utils/          character.ts  모자·소품 파츠 조합 캐릭터
server/
  api/decompose.post.ts   텍스트/사진 → 재료 id
  utils/decompose.ts      Claude 호출 (tool use로 재료 id enum 강제)
shared/
  data/           places · people · materials(재료 여정, 퀴즈, 대표 물건, 연결 규칙, 세트)
  logic.ts        분해·통계·연결·미스터리 순수 함수
scripts/check-data.ts     데이터 무결성 검사
```

## 재료·사람 추가하기

1. `shared/data/people.ts`에 사람을 추가한다. 모자(`hat`)와 소품(`prop`)을 고르면 캐릭터가 자동으로 그려진다. 몸 색은 장소의 대륙으로 정해진다.
2. `shared/data/materials.ts`에 재료와 `stages`(사람 id 순서), 퀴즈를 추가한다.
3. `npm run check:data`로 빠진 연결이나 얻을 수 없는 카드가 없는지 확인한다.

재료를 추가하면 Claude가 고를 수 있는 목록에도 자동으로 들어간다.

## 다음 확장 후보 (공공 데이터)

- 식품안전나라 품목제조보고(원재료) API: 가공식품의 실제 신고 원재료로 분해
- 식품안전나라 바코드연계제품정보 API: 바코드 스캔 입력
- 관세청 품목별·국가별 수출입실적 API: 재료별 출발 국가를 실제 수입 비중으로 뽑기

## 출시 전에 확인할 것

- 여정은 "대표 경로 예시"로 표기돼 있다. 재료 데이터의 사실관계를 한 번 더 검토하고, 출처 메모를 남기는 걸 권장한다.
- `/api/decompose`에는 인스턴스 단위의 간단한 요청 제한만 있다. 트래픽이 늘면 Vercel KV 등으로 IP별 제한을 붙이자.
