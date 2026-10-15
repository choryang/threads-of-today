import { personShareLine, personShareTitle, type PersonPayload } from '../../../shared/share'
import { defineShareRoute } from '../../utils/share-page'

/** 사람 카드 소개 링크: OG 이미지는 사람마다 미리 만든 public/og/person-{id}.png (화면은 app/pages/p/[token].vue) */
export default defineShareRoute<PersonPayload>('person', (p) => ({
  title: personShareTitle(p),
  description: personShareLine(p),
  image: `/og/person-${p.personId}.png`,
}))
