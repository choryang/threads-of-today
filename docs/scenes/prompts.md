# 장면 그림 프롬프트 (다시 기획 1차: 13명)

새 기획(오늘의 나 → 물건 → 같은 마음의 한 사람)에서 이야기가 있는 13명의 장면이다. 한 사람에 한 장면.
- 모든 프롬프트는 같은 틀이다: 첫 줄 + Scene + Style + Avoid. Style·Avoid는 바꾸지 않는다(실내는 하늘 문구만 soft natural daylight).
- 참고 이미지: art/style-ref.png (시다마 커피 밭 그림). 요청마다 함께 첨부한다.
- 결과: art/scenes/<장면 id>.png → npm run scenes → public/scenes/<장면 id>.webp
- '있음'은 이미 만든 그림이라 생성하지 않는다(art/scenes에 넣기만).
- '확인 필요'는 생성 뒤 사람이 꼭 한 번 본다.

## sidama-coffee-farm

- 사람: coffee-picker (알마즈 · 커피 체리 수확자)
- 대체 글: 비탈진 언덕에 커피 나무가 줄지어 선 시다마의 커피 밭
- 상태: 있음

## container-ship-sea

- 사람: sea-crew (로널드 · 컨테이너선 선원)
- 대체 글: 넓은 바다 위를 지나는 컨테이너선 갑판
- 상태: 있음

## busan-port

- 사람: busan-crane (진호 · 부산항 크레인 기사)
- 대체 글: 크레인이 늘어선 부산항 부두
- 상태: 있음

## huila-coffee-slope

- 사람: co-coffee-farmer (이사벨 · 콜롬비아 커피 농부)
- 대체 글: 안개 낀 안데스 산비탈의 커피 밭

```text
Create a 4:3 landscape illustration.

Scene: A steep coffee farm on the Andean slopes of Huila, Colombia. Rows of coffee shrubs with ripe red cherries clinging to a very steep green hillside, banana plants giving light shade between them, folded mountain ridges with thin drifting mist in the distance, a small farmhouse with a red tin roof far down the slope. In the middle ground, a farmer in a straw hat and long-sleeved shirt seen from behind, a woven basket tied at the waist, picking ripe cherries one by one.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, clear midday light with short soft shadows, open sky in the top third, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## daklak-coffee-yard

- 사람: vn-coffee-farmer (마인 · 베트남 로부스타 커피 농부)
- 대체 글: 붉은 흙 고원의 커피 나무와 열매를 말리는 마당

```text
Create a 4:3 landscape illustration.

Scene: A Robusta coffee farm in the Central Highlands of Dak Lak, Vietnam. Red basalt soil, rows of dense coffee trees with clusters of red and green cherries, a few tall pepper vines climbing wooden poles between them, a wide concrete yard in the foreground with coffee cherries spread thinly to dry in the sun, a simple house with a corrugated metal roof behind. In the middle ground, a farmer in a wide sun hat and long sleeves seen from behind, turning the drying cherries with a long wooden rake.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, clear midday light with short soft shadows, open sky in the top third, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## minas-coffee-farm

- 사람: br-coffee-farmer (주앙 · 브라질 커피 농부)
- 대체 글: 완만한 언덕을 따라 끝없이 이어진 커피 밭

```text
Create a 4:3 landscape illustration.

Scene: A large coffee farm in Minas Gerais, Brazil. Long straight rows of coffee shrubs running over gently rolling hills to the horizon, a tall mechanical coffee harvester parked at the end of a row, a red-earth farm track, a few tall trees on the ridge. In the middle ground, a farm manager in a cap and work shirt seen from behind, walking between the rows and checking the ripeness of the cherries on a branch.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, clear midday light with short soft shadows, open sky in the top third, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## neighborhood-cafe

- 사람: barista (예은 · 바리스타)
- 대체 글: 문 열기 전 아침, 동네 카페의 커피 머신 앞

```text
Create a 4:3 landscape illustration.

Scene: Inside a small neighborhood cafe in Seoul in the morning before opening. An espresso machine and grinder on a wooden counter, ceramic cups stacked beside it, a small menu board with no readable text, a large window with soft morning daylight and a quiet street with a ginkgo tree outside. In the middle ground, a barista in an apron seen from behind, tasting the first shot from a small cup next to the machine.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, soft natural daylight, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## neighborhood-mart

- 사람: mart-cashier (민서 · 마트 계산원)
- 대체 글: 동네 마트의 계산대와 셀프 계산대

```text
Create a 4:3 landscape illustration.

Scene: Inside a bright neighborhood supermarket in South Korea. A checkout counter with a short conveyor belt and a barcode scanner, two self-checkout kiosks at the side, shelves of colorful packaged goods with blank labels in the background, glass doors to the street letting in daylight. In the middle ground, a cashier in a store apron and cap seen from a three-quarter back view, handing a full shopping bag across the counter to an unseen customer.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, soft natural daylight, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## seoul-delivery

- 사람: courier (도현 · 택배 기사)
- 대체 글: 오래된 빌라가 모인 서울의 골목

```text
Create a 4:3 landscape illustration.

Scene: A quiet residential street in Seoul in the late morning. Low apartment buildings and small shops with blank signboards, potted plants by the doors, a parked delivery truck with its back door open, ginkgo trees along the sidewalk, an outdoor staircase leading up to an old low-rise apartment entrance. In the middle ground, a delivery worker in a cap and padded vest seen from behind, carrying a parcel up the stairs.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, clear midday light with short soft shadows, open sky in the top third, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## bulk-carrier-deck

- 사람: bulk-crew (궈량 · 벌크선 선원)
- 대체 글: 바다 위 벌크선의 커다란 화물칸 덮개

```text
Create a 4:3 landscape illustration.

Scene: On the deck of a large bulk carrier at sea. Huge closed cargo hatch covers in a long row along the deck, painted rust-red and grey, folded deck cranes standing between them, a wide calm ocean and a clean horizon, a few seabirds far in the sky. In the middle ground, a seafarer in a boiler suit and hard hat seen from behind, kneeling to check the seal at the edge of a hatch cover.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, clear midday light with short soft shadows, open sky in the top third, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## tanker-deck

- 사람: tanker-crew (위차이 · 탱커선 선원)
- 대체 글: 배관과 밸브가 가득한 탱커선 갑판

```text
Create a 4:3 landscape illustration.

Scene: On the deck of an oil tanker at sea. A long flat deck crowded with pipelines and valve wheels painted yellow and green, raised catwalks above the pipes, the white accommodation tower at the stern in the distance, calm blue sea on both sides. In the middle ground, a seafarer in an orange boiler suit and hard hat seen from behind, holding a flashlight and inspecting a valve wheel.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, clear midday light with short soft shadows, open sky in the top third, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## desert-oil-field

- 사람: oil-worker (무니라 · 유전 기술자)
- 대체 글: 사막 한가운데의 유전 설비
- 상태: 확인 필요

```text
Create a 4:3 landscape illustration.

Scene: An oil field in the desert of eastern Saudi Arabia. Pumpjacks and a cluster of pipes and wellhead valves on pale sand, a small white control cabin, low sand dunes stretching to the horizon. In the middle ground, an engineer in blue coveralls with a headscarf under a white hard hat, seen from behind, holding a tablet and listening closely to a pump.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, clear midday light with short soft shadows, open sky in the top third, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```

## kansas-wheat-harvest

- 사람: wheat-farmer (로버트 · 밀 농부)
- 대체 글: 지평선까지 펼쳐진 대평원의 밀 수확

```text
Create a 4:3 landscape illustration.

Scene: Wheat harvest on the Great Plains of Kansas, USA. Golden wheat fields stretching flat to the horizon, a combine harvester cutting through the wheat with a grain truck waiting at the edge of the field, a tall concrete grain elevator far away. In the middle ground, a farmer in a cap and work shirt seen from behind, standing at the field edge and rubbing a head of wheat between his hands to check it.

Style: editorial illustration matching the attached reference image, gouache and watercolor texture with visible soft brushstrokes, realistic proportions but gently simplified shapes, muted earthy palette with warm cream highlights, clear midday light with short soft shadows, open sky in the top third, calm and quiet mood. One worker in the middle ground absorbed in their work, face not visible, dignified and skilled, ordinary practical work clothes. No other people up close, no readable text, no logos, no flags.

Avoid: photorealistic, 3D render, glossy, neon, oversaturated, visible face, close-up portrait, crowd, poverty, exotic costume, sunset, night.
```
