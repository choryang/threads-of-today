import { motionCssVars } from '../utils/motion'

/** utils/motion.ts의 시간 값을 CSS 변수로 :root에 넣는다. CSS의 애니메이션 길이는 모두 이 변수를 쓴다 */
export default defineNuxtPlugin(() => {
  const root = document.documentElement
  for (const [name, value] of Object.entries(motionCssVars())) root.style.setProperty(name, value)
})
