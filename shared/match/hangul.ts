const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ']

/** 완성형 한글을 자모로 분해한다. '까' → 'ㄲㅏ'. 한글이 아닌 글자는 그대로 둔다. */
export function toJamo(s: string): string {
  let out = ''
  for (const ch of s) {
    const code = ch.charCodeAt(0) - 0xac00
    if (code < 0 || code > 11171) {
      out += ch
      continue
    }
    out += CHO[Math.floor(code / 588)]! + JUNG[Math.floor((code % 588) / 28)]! + JONG[code % 28]!
  }
  return out
}

/** 완성된 음절이 하나라도 있는지. 'ㅁㄴㅇㄹ' 같은 자모만의 입력을 걸러낸다. */
export function hasSyllable(s: string): boolean {
  return /[가-힣a-z0-9]/.test(s)
}

/** 편집 거리. max를 넘으면 일찍 끝내고 max + 1을 돌려준다. */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]!
}
