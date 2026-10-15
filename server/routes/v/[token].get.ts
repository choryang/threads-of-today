import { villageShareTitle, type VillagePayload } from '../../../shared/share'
import { defineShareRoute } from '../../utils/share-page'

/** 마을 초대 링크: OG 이미지는 공통 한 장 (화면은 app/pages/v/[token].vue) */
export default defineShareRoute<VillagePayload>('village', (p) => ({
  title: villageShareTitle(p),
  description: p.open ? `주민 ${p.residents.length}명이 사는 마을이에요. 주민에게 고마워요를 남겨 보세요` : '지금은 방문을 받지 않는 마을이에요',
  image: '/og/village.png',
}))
