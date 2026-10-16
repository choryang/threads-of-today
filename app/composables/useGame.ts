import { effectScope, reactive, watch } from 'vue'
import { sanitizeJob } from '../../shared/job'
import { emptySave, type Save } from '../../shared/progress'

export type { Save } from '../../shared/progress'

/**
 * 진행 상황 저장소. 원본은 이 기기의 localStorage(`my-day-people:v1`)이고, 서버와는 useSync가 합친다.
 * 새 기획은 하루 기록(todays)·하는 일(job)·이야기 판(keyMeets)만 쓴다. 예전 기획의 필드(카드·여정·마을 등)는
 * Save 모양을 지키려고 그대로 두고(shared/progress.ts mergeSaves·sanitizeSave), 화면에서만 쓰지 않는다.
 */
const KEY = 'my-day-people:v1'

function load(): Save {
  if (typeof window === 'undefined') return emptySave()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptySave()
    const parsed = JSON.parse(raw)
    if (parsed?.v !== 1) return emptySave()
    const save: Save = { ...emptySave(), ...parsed }
    // 하는 일: 예전 id(만들기 make)는 제조로, 모르는 값은 버린다 (shared/job.ts)
    if (parsed.job) {
      const job = sanitizeJob(parsed.job)
      if (job) save.job = job
      else delete save.job
    }
    return save
  } catch {
    return emptySave()
  }
}

let state: Save | null = null

function getState(): Save {
  if (state) return state
  state = reactive(load()) as Save
  // 페이지가 바뀌어도 저장이 멈추지 않도록 컴포넌트와 분리된 범위에서 감시한다
  effectScope(true).run(() => {
    watch(
      () => state,
      (value) => {
        try {
          window.localStorage.setItem(KEY, JSON.stringify(value))
        } catch {
          // 저장 공간이 막힌 환경(시크릿 모드 등)에서는 이번 방문 동안만 유지
        }
      },
      { deep: true },
    )
  })
  return state
}

/** 서버와 합친 진행 상황으로 바꾼다. 반응형 객체는 그대로 두고 내용만 바꿔 화면이 따라 바뀌게 한다(모든 필드) */
export function replaceSave(next: Save) {
  Object.assign(getState(), next)
}

/** 지금 진행 상황의 복사본 (서버로 보낼 때) */
export function snapshotSave(): Save {
  return JSON.parse(JSON.stringify(getState()))
}

export function useGame() {
  return { state: getState() }
}
