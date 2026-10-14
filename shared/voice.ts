/**
 * 물건의 한마디(voice)에는 닉네임 대신 {name} 자리표시자만 들어간다.
 * 사전과 캐시를 모든 사용자가 같이 쓰기 때문에 AI에 닉네임을 보내지 않고, 화면에서 끼워 넣는다.
 * {name}은 부르는 말로만 쓴다('{name}, 오늘도 수고했어요', '{name}님 안녕하세요'). 조사가 바로 붙으면
 * 닉네임 끝 글자에 따라 틀린 문장이 되므로 그런 대사는 버린다.
 */
export const NAME_SLOT = '{name}'

/** {name} 말고 다른 중괄호가 없고, {name} 뒤에는 쉼표·느낌표·물음표·물결·'님'·공백·끝만 온다 */
export function isValidVoiceTemplate(voice: string): boolean {
  const rest = voice.split(NAME_SLOT)
  if (rest.some((part) => /[{}]/.test(part))) return false
  for (let i = 1; i < rest.length; i++) {
    if (!/^($|[,!?~ ]|님)/.test(rest[i]!)) return false
    if (/[가-힣A-Za-z0-9]$/.test(rest[i - 1]!)) return false
  }
  return true
}

/** 화면에 보여 줄 문장. 닉네임이 없으면 부르는 말을 통째로 뺀다 */
export function renderVoice(voice: string | undefined, nickname: string | undefined): string {
  if (!voice) return ''
  if (nickname) return voice.split(NAME_SLOT).join(nickname)
  return voice.replace(/\{name\}(님)?[,!~]?\s*/g, '').trim()
}
