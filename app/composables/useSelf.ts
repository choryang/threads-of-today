import { ref } from 'vue'

/**
 * 길 위의 "나": 이 앱을 쓰는 진짜 사람(Person.user)이 자기 칸을 "이건 나예요"로 표시하면 기억한다.
 * 이 기기에만 남긴다(서버·동기화·공유에 보내지 않는다). 걷기에서 그 사람이 길 위에 있으면 매듭·한 줄·끝 요약이 달라진다.
 */
const KEY = 'my-day-people:self'
const selfId = ref<string | null>(null)
let loaded = false

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    selfId.value = window.localStorage.getItem(KEY)
  } catch {
    selfId.value = null
  }
}

export function useSelf() {
  load()
  function setSelf(personId: string | null) {
    selfId.value = personId
    try {
      if (personId) window.localStorage.setItem(KEY, personId)
      else window.localStorage.removeItem(KEY)
    } catch {
      // 저장이 막히면 이번 방문 동안만
    }
  }
  return { selfId, setSelf }
}
