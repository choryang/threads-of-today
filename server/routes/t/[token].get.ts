import { threadShareLine, threadShareTitle, type ThreadPayload } from '../../../shared/share'
import { defineShareRoute } from '../../utils/share-page'

/** 오늘의 실 링크: OG 이미지는 링크를 만든 기기가 올린 카드(V2Quote). 화면은 1번 화면으로 바로 (app/pages/t/[token].vue) */
export default defineShareRoute<ThreadPayload>('thread', (p, token) => ({
  title: threadShareTitle(p),
  description: threadShareLine(p),
  image: `/og/t/${token}.jpg`,
  imageWidth: 1080,
  imageHeight: 1350,
}))
