import dictionary from '../../shared/data/dictionary.json'
import { createMatcher, productEntries, type DictEntry } from '../../shared/match'

/**
 * 서버 전용 매처. 대표 물건 뒤에 미리 만든 물건 사전(shared/data/dictionary.json)을 붙인다.
 * 사전은 클라이언트 번들에 넣지 않는다. 텍스트 입력은 어차피 /api/decompose로 오기 때문에
 * 서버에서 찾으면 요청 수는 그대로이고, 사전이 커져도 앱 다운로드 크기가 늘지 않는다.
 */
const matcher = createMatcher([...productEntries(), ...(dictionary as DictEntry[])])

export const matchText = matcher.match
