import { reactive } from 'vue'
import { dateKey } from '../../shared/logic'
import { mergeSaves, type Save } from '../../shared/progress'
import { replaceSave, snapshotSave } from './useGame'

/**
 * 진행 상황 서버 동기화. localStorage가 원본이고, 앱을 열 때와 여정을 마칠 때만 서버(Upstash)와 합친다.
 * 이 기기의 익명 id·기기 비밀값·복구 코드는 진행 상황과 따로 저장한다.
 */
interface Profile {
  id: string
  secret: string
  code: string
}

type ApiFail = { ok: false; reason?: string; message?: string }
type ProfileResponse = ({ ok: true; save: Save } & Profile) | ApiFail
type SyncResponse = { ok: true; save: Save; code: string } | ApiFail

const PROFILE_KEY = 'my-day-people:profile'

function loadProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    const p = raw ? JSON.parse(raw) : null
    return p?.id && p?.secret && p?.code ? p : null
  } catch {
    return null
  }
}

function saveProfile(p: Profile | null) {
  try {
    if (p) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    else window.localStorage.removeItem(PROFILE_KEY)
  } catch {
    // 저장 공간이 막힌 환경에서는 이번 방문 동안만 유지
  }
}

const status = reactive({
  profile: null as Profile | null,
  loaded: false,
  syncing: false,
  /** 서버 저장을 쓸 수 없는 배포(Upstash 미설정)인지 */
  unavailable: false,
  lastSyncedAt: 0,
})

let running: Promise<void> | null = null
let again = false

/** 서버에서 돌아온 기록을 지금 기기 기록과 다시 합친다. 요청이 오가는 사이 바뀐 내용도 잃지 않는다 */
function apply(server: Save) {
  replaceSave(mergeSaves(server, snapshotSave(), dateKey()))
  status.lastSyncedAt = Date.now()
}

async function post<T>(url: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    return (await $fetch(url, { method: 'POST', body })) as T
  } catch {
    return null // 오프라인 등: 다음 기회에 다시
  }
}

async function runSync() {
  if (!status.profile) {
    const res = await post<ProfileResponse>('/api/profile', { save: snapshotSave() })
    if (!res) return
    if (!res.ok) {
      status.unavailable = res.reason === 'unavailable'
      return
    }
    status.profile = { id: res.id, secret: res.secret, code: res.code }
    saveProfile(status.profile)
    apply(res.save)
    return
  }
  const res = await post<SyncResponse>('/api/profile/sync', { ...status.profile, save: snapshotSave() })
  if (!res) return
  if (res.ok) {
    status.unavailable = false
    apply(res.save)
    return
  }
  status.unavailable = res.reason === 'unavailable'
  if (res.reason === 'unknown-user') {
    // 서버 기록이 만료됐거나 지워졌다: 이 기기 기록으로 새로 시작한다
    status.profile = null
    saveProfile(null)
    await runSync()
  }
}

export function useSync() {
  if (!status.loaded && typeof window !== 'undefined') {
    status.profile = loadProfile()
    status.loaded = true
  }

  /** 동기화. 이미 돌고 있으면 끝난 뒤 한 번 더 돈다 */
  async function sync(): Promise<void> {
    if (running) {
      again = true
      return running
    }
    status.syncing = true
    running = (async () => {
      do {
        again = false
        await runSync()
      } while (again)
    })().finally(() => {
      running = null
      status.syncing = false
    })
    return running
  }

  /** 다른 기기의 복구 코드로 이어 하기. 이 기기의 기록은 합쳐진다 */
  async function restore(code: string): Promise<{ ok: boolean; message: string }> {
    if (running) await running
    const res = await post<ProfileResponse>('/api/profile/restore', { code, save: snapshotSave() })
    if (!res) return { ok: false, message: '연결이 불안정해요. 잠시 후 다시 시도해 주세요.' }
    if (!res.ok) return { ok: false, message: res.message ?? '코드를 찾지 못했어요.' }
    status.profile = { id: res.id, secret: res.secret, code: res.code }
    saveProfile(status.profile)
    apply(res.save)
    return { ok: true, message: '기록을 불러와 이 기기의 기록과 합쳤어요.' }
  }

  return { status, sync, restore }
}
