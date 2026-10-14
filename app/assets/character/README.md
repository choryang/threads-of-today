# 캐릭터 파츠 (55개)

의뢰서 규격대로 만든 SVG 파츠. 모든 파일은 512×640 같은 캔버스, 같은 원점이다.

| 종류 | 개수 | 파일 |
| --- | --- | --- |
| 몸 | 2 | body-stand, body-wave |
| 얼굴 | 4 | face-smile, face-focus, face-sleepy, face-glad |
| 머리 모양 | 5 | hair-short, hair-bob, hair-tied, hair-curly, hair-gray |
| 옷 | 10 | outfit-farm, coverall, vest, sailor, miner, lab, cleanroom, apron, office, rider |
| 모자 | 10 | hat-cap, straw, safety, chef, beanie, hood, helmet, scarf, headset, miner |
| 소품 | 24 | prop-box, clipboard, gear, leaf, seed, flask, basket, cup, fish, drop, wheat, magnifier, crane, phone, anchor, chip, recycle, spool, cherry, pickaxe, orange, wrench, banana, pod |

## 쓰는 법

- 겹치는 순서: body → outfit → face → hair → hat → prop. 모자가 없으면 hat을 빼고 머리 모양만 쓴다. hat-hood(방진복 후드)는 머리를 덮으니 hair를 빼도 된다.
- 기준점: 머리 꼭대기 (256,120) / 오른손(소품) (366,476) / 왼손 (146,476)
- **피부색**: 피부는 `var(--skin, #FFE08A)`로 칠해져 있다. SVG를 HTML에 인라인으로 넣고 감싸는 요소에 `--skin`을 지정하면 바뀐다. `<img>`로 넣으면 변수가 적용되지 않으니 인라인으로 쓸 것.
- **인사 자세(body-wave)**: 왼팔이 `rotate(100 196 388)`만큼 올라가 있다. 옷의 왼쪽 소매(`.sleeve-l`)도 같이 돌려야 한다.
  ```css
  .wave .sleeve-l { transform: rotate(100deg); transform-origin: 196px 388px; }
  ```
- outfit-sailor는 `clip-sailor`라는 clipPath id를 쓴다. 한 페이지에 여러 번 인라인해도 같은 모양이라 문제없지만, 엄격하게 하려면 인라인할 때 id에 접미사를 붙인다.
- prop-drop은 기름(검은색) 기준이다. 우유로 쓰려면 fill을 흰색으로 바꾼다.
- 미리보기: preview.html (조합 16명, 36px·72px, 남색·크림 배경, 파츠 전체 목록)
