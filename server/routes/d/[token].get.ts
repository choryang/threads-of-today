import { DAY_TYPES } from '../../../shared/day-type'
import { dayShareTitle, type DayPayload } from '../../../shared/share'
import { defineShareRoute } from '../../utils/share-page'

/** 나의 하루 유형 공유 링크: OG meta가 들어간 HTML이 SPA를 띄운다 (화면은 app/pages/d/[token].vue) */
export default defineShareRoute<DayPayload>('day', (p) => ({
  title: dayShareTitle(p),
  description: `${DAY_TYPES[p.type].desc}. 당신의 하루는요?`,
  image: `/og/day-${p.type}.png`,
}))
