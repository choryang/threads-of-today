/**
 * 게임의 모든 시간 값. 여기만 고치면 화면 전환·알림·자동 넘김이 함께 바뀐다.
 * CSS에서는 plugins/motion.client.ts가 :root에 넣는 변수(--motion-enter 등)로 쓴다.
 * prefers-reduced-motion 사용자는 main.css가 애니메이션을 모두 끄고, JS 대기는 reducedMotion()으로 건너뛴다.
 */
export const MOTION = {
  /** 화면 전환과 카드 등장. 모든 곳 같은 길이·같은 이징 */
  enterMs: 300,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  /** 버튼을 누를 때 살짝 작아지는 반응 */
  pressMs: 120,
  /** 새 카드 알림·토스트가 떠 있는 시간 */
  toastMs: 1500,
  /** '복사했어요' 같은 짧은 확인 문구 */
  noticeMs: 1500,
  /** '고마워요'를 누른 뒤 손 흔드는 모습을 보여 주는 시간. 여정에서는 이 뒤에 다음 카드로 넘어간다 */
  waveMs: 500,
  /** 사람 카드가 아닌 화면의 자동 넘김: 글자 수에 맞춰 최소~최대 */
  autoMinMs: 3000,
  autoMaxMs: 6000,
  autoMsPerChar: 80,
  /** 캐릭터가 제자리에서 둥실거리는 주기 (반복 장식, 기다림 아님) */
  bobMs: 2400,
  /** 감사 장면 문장이 하나씩 나오는 간격 */
  lineStaggerMs: 600,
  /** 실타래를 처음 열 때 실이 그려지는 시간 */
  drawMs: 1600,
} as const

/** 자동으로 넘어가는 화면이 머무는 시간. 글자 수에 비례하고 최소·최대 사이로 자른다 */
export function autoDwellMs(text: string): number {
  const chars = text.replace(/\s+/g, '').length
  return Math.min(MOTION.autoMaxMs, Math.max(MOTION.autoMinMs, chars * MOTION.autoMsPerChar))
}

/** 움직임 줄이기를 켠 사용자인지. 켜져 있으면 애니메이션을 기다리지 않고 바로 넘긴다 */
export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** :root에 넣을 CSS 변수 */
export function motionCssVars(): Record<string, string> {
  return {
    '--motion-enter': `${MOTION.enterMs}ms`,
    '--motion-ease': MOTION.easing,
    '--motion-press': `${MOTION.pressMs}ms`,
    '--motion-wave': `${MOTION.waveMs}ms`,
    '--motion-bob': `${MOTION.bobMs}ms`,
    '--motion-draw': `${MOTION.drawMs}ms`,
  }
}
