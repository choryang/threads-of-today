import { journeyMaterialIds } from '../../shared/logic'
import { matchLocal } from './local-match'

/**
 * 물건 이름 → 재료 (지금 매칭 그대로): 대표 물건·앱용 사전에서 먼저 찾고, 없으면 서버(공유 캐시 → AI).
 * API 키가 없어도 로컬 매칭으로 동작한다. 닉네임 같은 사용자 정보는 보내지 않는다(원칙 8)
 */
export interface ResolvedItem {
  name: string
  materialIds: string[]
}

type ApiResult = { ok: true; name: string; materialIds: string[]; missing?: string[]; proper?: string } | { ok: false; message: string; limited?: boolean }

/** 고유명사(회사·기관·브랜드·서비스·게임·장소): 길 대신 지도에서 찾는다 (걷기, /api/whereis) */
export interface ProperItem {
  proper: string
}

export async function resolveItem(text: string): Promise<ResolvedItem | ProperItem | { error: string }> {
  const value = text.trim().slice(0, 60)
  if (!value) return { error: '물건 이름을 적어 주세요' }
  const local = matchLocal(value)
  if (local) {
    const ids = journeyMaterialIds(local.materialIds, local.missing)
    if (ids.length) return { name: local.name, materialIds: ids }
  }
  try {
    const res = await $fetch<ApiResult>('/api/decompose', { method: 'POST', body: { text: value } })
    if (!res.ok) return { error: res.limited ? '오늘은 직접 쓴 물건을 더 찾을 수 없어요. 아래에서 골라 주세요' : res.message }
    if (res.proper) return { proper: value }
    const ids = journeyMaterialIds(res.materialIds, res.missing)
    return ids.length ? { name: res.name, materialIds: ids } : { error: '이 물건이 지나온 길은 아직 준비 중이에요. 다른 물건을 골라 주세요' }
  } catch {
    return { error: '연결이 불안정해요. 아래에서 골라 주세요' }
  }
}
