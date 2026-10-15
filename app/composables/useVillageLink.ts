import { computed } from 'vue'
import type { VillagePayload } from '../../shared/share'
import { UNLOCK } from '../../shared/friendship'
import { villageLayout } from '../../shared/village'
import type { Flower } from '../../shared/visit'

/**
 * 내 마을 초대 링크 (shared/share.ts의 village 종류). 링크·관리 키·방문 받기는 Save.village에 두어 내 기기들끼리 동기화한다.
 * 링크에 담는 건 닉네임, 주민 id(내 마을에서 자리를 잡는 순서 그대로), 단짝(100%) 주민 id, 방문 받기뿐이다(퍼센트는 담지 않는다).
 * 마을을 열 때 주민이 바뀌었으면 내용만 고친다(링크는 그대로, 기간은 다시 7일). 기간이 지나 사라졌으면 같은 관리 키로 새로 만든다.
 */
const SENT_KEY = 'my-day-people:village-sent'

type IssueRes = { ok: boolean; token?: string; manage?: string; path?: string }

export function useVillageLink() {
  const game = useGame()
  const link = computed(() => game.state.village)

  function payload(): VillagePayload {
    const residents = villageLayout(game.state.cards, game.state.people ?? {}).residents.map((r) => r.id)
    const bestFriends = residents.filter((id) => game.friendship(id).percent >= UNLOCK.workplace)
    return { nickname: game.nickname.value, residents, open: link.value?.open ?? true, bestFriends }
  }
  const urlOf = (token: string) => `${location.origin}/v/${token}`

  async function issue(manage?: string): Promise<boolean> {
    try {
      const res = await $fetch<IssueRes>('/api/share', { method: 'POST', body: { kind: 'village', payload: payload(), ...(manage ? { manage } : {}) } })
      if (!res.ok || !res.token || !res.manage) return false
      const now = Date.now()
      game.state.village = { token: res.token, manage: res.manage, open: link.value?.open ?? true, seenAt: link.value?.seenAt ?? now, updatedAt: now }
      remember(payload())
      return true
    } catch {
      return false
    }
  }

  function remember(p: VillagePayload) {
    try {
      window.localStorage.setItem(SENT_KEY, JSON.stringify(p))
    } catch {
      // 다음에 한 번 더 보낸다
    }
  }
  function sentBefore(): string {
    try {
      return window.localStorage.getItem(SENT_KEY) ?? ''
    } catch {
      return ''
    }
  }

  /** 초대 링크 주소 (없으면 만든다). 서버를 쓸 수 없으면 null */
  async function ensure(): Promise<string | null> {
    if (!link.value && !(await issue())) return null
    return link.value ? urlOf(link.value.token) : null
  }

  /** 마을을 열 때: 주민·닉네임·방문 받기가 바뀌었으면 링크 내용을 고친다 */
  async function refresh(force = false) {
    const cur = link.value
    if (!cur) return
    const p = payload()
    if (!force && sentBefore() === JSON.stringify(p)) return
    try {
      const res = await $fetch<{ ok: boolean; reason?: string }>('/api/share/update', { method: 'POST', body: { manage: cur.manage, payload: p } })
      if (res.ok) remember(p)
      else if (res.reason === 'not-found') await issue(cur.manage) // 7일 동안 안 열어 사라졌으면 새 링크
    } catch {
      // 다음에 열 때 다시
    }
  }

  /** 초대 링크 새로 만들기: 이전 링크는 열리지 않는다 */
  async function reissue(): Promise<string | null> {
    if (!(await issue(link.value?.manage))) return null
    return urlOf(link.value!.token)
  }

  /** 마을 방문 받기 켜기·끄기 */
  async function setOpen(open: boolean) {
    if (!link.value) return
    game.state.village = { ...link.value, open, updatedAt: Date.now() }
    await refresh(true)
  }

  /** 내 마을의 최근 꽃 */
  async function flowers(): Promise<Flower[]> {
    if (!link.value) return []
    try {
      const res = await $fetch<{ ok: boolean; flowers?: Flower[] }>('/api/village/flowers', { method: 'POST', body: { manage: link.value.manage } })
      return res.ok ? res.flowers ?? [] : []
    } catch {
      return []
    }
  }

  /** 꽃 알림을 봤다 */
  function markSeen(at = Date.now()) {
    if (link.value && at > link.value.seenAt) game.state.village = { ...link.value, seenAt: at }
  }

  return { link, ensure, refresh, reissue, setOpen, flowers, markSeen }
}
