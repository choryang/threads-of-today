/*
 * 형태 아이콘 중 '기존 소품으로 충분'한 7개를 캐릭터 파츠(app/assets/character/prop-*.svg)에서 public/forms/prop-*.svg로 옮긴다.
 * 그림은 그대로 두고 바깥 <svg> 태그만 바꾼다: 512×640 캐릭터 캔버스에서 소품 부분만 잘라 보이게 viewBox를 좁힌다.
 * 파츠를 고치면 다시 실행한다: npx tsx scripts/sync-prop-icons.ts (tests/forms.test.ts가 그림이 같은지 검사)
 */
import { readFileSync, writeFileSync } from 'node:fs'

/** 소품마다 그림이 들어오는 정사각형 [x, y, 한 변] (캐릭터 캔버스 좌표). 브라우저 getBBox로 잰 그림 범위(+10)를 1.3배로 넓혀
 * 새 형태 아이콘(128 캔버스 안쪽 여백)과 크기를 맞췄다 */
export const PROP_ICON_CROPS: Record<string, [number, number, number]> = {
  cherry: [333, 333, 166],
  pod: [268, 282, 247],
  banana: [312, 301, 200],
  orange: [310, 342, 152],
  chip: [304, 332, 156],
  spool: [308, 332, 169],
  wheat: [285, 282, 233],
}

/** 파츠 파일에서 바깥 <svg> 태그를 뺀 그림 부분 */
export function propDrawing(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
}

if (process.argv[1]?.endsWith('sync-prop-icons.ts')) {
  for (const [prop, [x, y, size]] of Object.entries(PROP_ICON_CROPS)) {
    const drawing = propDrawing(readFileSync(`app/assets/character/prop-${prop}.svg`, 'utf8'))
    writeFileSync(`public/forms/prop-${prop}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${size} ${size}" width="128" height="128">${drawing}</svg>\n`)
  }
  console.log('prop 아이콘', Object.keys(PROP_ICON_CROPS).length, '개 → public/forms')
}
