# 나의 하루 유형 기준표

"당신의 하루는 어떤 하루일까요?" 10초 테스트의 판정 규칙. shared/data(PRODUCTS, MATERIALS, PEOPLE, PLACES, TRANSPORT)만으로 계산하고 AI는 쓰지 않는다.
성격을 맞히는 테스트가 아니다. "당신은 이런 사람"이 아니라 "당신의 하루는 이런 하루"라고만 말한다.

## 1. 테스트 물건 18개 (3열 × 6줄)

americano(아이스 아메리카노), choco-bar(초콜릿), banana(바나나), smartphone(스마트폰), tuna-can(참치캔), samgak(참치마요 삼각김밥),
salmon-sushi(연어초밥), ramen(라면), burger(햄버거), samgyeopsal(삼겹살), banana-milk(바나나우유), kimchi(배추김치),
apple(사과), notebook(공책), tshirt(면 티셔츠), tofu(두부), chopsticks(나무젓가락), fried-chicken(후라이드 치킨)

3~5개를 고른다. 아이콘은 public/forms의 형태 아이콘에서 가장 가까운 것을 쓰고, 없으면 목록으로 보고한다.

## 2. 재료 분류

| 분류 | 재료 id |
|---|---|
| tropic (적도) | coffee, cacao, banana, palm-oil, rubber, sugar, orange |
| sea (바다) | tuna, squid, salmon, shrimp, laver |
| under (땅속) | cobalt, lithium, aluminum, steel, plastic |
| tech (공장 기술, 땅속에 0.8배로 합산) | chip, assembly, polyester, switch, pcb, panel, cpu, memory, sensor |
| plain (넓은 들판) | wheat, corn, soybean, cotton |
| ranch (목장) | milk, beef, pork, chicken, egg |
| home (우리 땅) | rice, cabbage, chili, apple, grape, tomato, potato, sweet-potato, radish, buckwheat, barley, red-bean, tea, glass |
| forest (숲) | pulp, wood, publishing |

새 재료가 생기면 이 표에 넣어야 한다. 분류가 없는 재료가 있으면 테스트가 실패하게 한다.

## 3. 판정

1. 고른 물건마다 materialIds를 순서대로 본다. 첫 재료는 가중치 1, 나머지는 0.5. 다만 첫 재료가 아닌 plastic, pulp(포장재)는 0.2.
2. 분류별 가중치 합을 전체 합으로 나눠 비율을 구한다. tech 비율은 0.8을 곱해 under에 더한다.
3. 특별 유형 점수
   - world: 고른 물건 전체의 출발·경유 대륙(korea, sea 제외)이 africa, asia, europe, oceania, americas 5개를 모두 채우면 0.34
   - sky: TRANSPORT가 air인 사람이 있는 물건을 2개 이상 고르면 0.6
4. 가장 높은 점수의 유형. 같으면 world, sky, under, sea, tropic, ranch, plain, forest, home 순서로 앞의 것.

## 4. 유형 9개

| id | 이름 | 설명 (예시 문장) | 대표 주민 | 배경색 |
|---|---|---|---|---|
| world | 지구 한 바퀴 하루 | 다섯 대륙의 손을 거쳐 오늘 아침 당신에게 닿았어요 | sea-crew 컨테이너선 선원 | #1F5A73 |
| sky | 하늘길로 온 하루 | 비행기를 타고 서둘러 당신에게 온 하루예요 | air-cargo 항공화물 조업원 | #3E5C8A |
| under | 땅속에서 온 하루 | 깊은 땅속에서 캐낸 것들이 당신 하루를 움직여요 | cobalt-miner 코발트 광부 | #5A4A3E |
| sea | 바다에서 건진 하루 | 먼바다와 바닷가 사람들이 당신 하루를 채웠어요 | tuna-fisher 원양어선 선원 | #2E6E8E |
| tropic | 적도에서 온 하루 | 적도 근처 뜨거운 땅에서 시작해 당신에게 닿았어요 | coffee-picker 커피 체리 수확자 | #A0522D |
| ranch | 목장에서 온 하루 | 새벽 목장 사람들이 당신 하루를 든든하게 했어요 | dairy-farmer 낙농가 | #7A6A3A |
| plain | 넓은 들판의 하루 | 끝없는 들판에서 자란 것들이 당신 하루가 됐어요 | wheat-farmer 밀 농부 | #8A7A2E |
| forest | 숲에서 온 하루 | 멀리 숲에서 온 나무가 당신 손에 있어요 | eucalyptus 유칼립투스 조림지 작업자 | #3E6B3A |
| home | 우리 땅에서 자란 하루 | 가까운 들과 밭 사람들이 당신 하루를 지었어요 | rice-farmer 벼농사 농부 | #6F9A5C |

배경색은 흰 글씨와 4.5:1 이상인지 확인하고 모자라면 어둡게 조정한다. 문장은 해요체, 이모지 없음, 착취·고생 같은 단어 없음.

## 5. 결과 카드의 숫자

- 닿은 사람: 고른 물건들의 재료(중복 제거) 기본 경로 stages의 사람 수(중복 제거)
- 나라: 그 사람들의 PLACES.country 수(빈 값 제외)
- 거리: 재료(중복 제거)마다 기본 경로를 대권거리로 이은 합. 40,075km로 나눠 "지구 반 바퀴"(0.4~0.6), "지구 한 바퀴"(0.9~1.1), "지구 N바퀴"(그 밖, 0.5 단위 반올림)로 보여 준다. 0.4보다 짧으면 "3,200km"처럼 km로.
- 출발지 변형(origins)은 쓰지 않고 기본 경로만 쓴다. 같은 선택이면 항상 같은 결과가 나와야 공유가 성립한다.

## 6. 분포 (3~5개를 고르는 12,444가지 조합 전체)

| 유형 | 비율 |
|---|---|
| ranch | 18.4% |
| world | 15.6% |
| under | 15.1% |
| tropic | 13.3% |
| home | 10.7% |
| plain | 10.2% |
| sea | 8.8% |
| sky | 5.6% |
| forest | 2.3% |

sky와 forest는 드문 유형이라 "드문 하루" 표시를 붙여도 좋다. 테스트 물건이나 분류를 바꾸면 분포를 다시 돌려서 한 유형이 25%를 넘지 않는지 확인한다.

## 7. 예시

| 고른 물건 | 유형 | 사람 · 나라 |
|---|---|---|
| 배추김치, 사과, 삼각김밥 | home | 25명 · 3개 나라 |
| 삼겹살, 바나나우유, 햄버거 | ranch | 26명 · 5개 나라 |
| 공책, 나무젓가락, 면 티셔츠 | forest | 18명 · 5개 나라 |
| 라면, 두부, 면 티셔츠 | plain | 24명 · 7개 나라 |
| 연어초밥, 스마트폰, 참치캔 | sky | 29명 · 8개 나라 |
| 아메리카노, 초콜릿, 스마트폰, 삼겹살, 배추김치 | world | 48명 · 13개 나라 |
