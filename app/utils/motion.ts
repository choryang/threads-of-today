/**
 * 게임의 모든 시간 값. 여기만 고치면 화면 전환·알림·자동 넘김이 함께 바뀐다.
 * CSS에서는 plugins/motion.client.ts가 :root에 넣는 변수(--motion-enter 등)로 쓴다.
 * prefers-reduced-motion 사용자는 main.css가 애니메이션을 모두 끄고, JS 대기는 reducedMotion()으로 건너뛴다.
 */
export const MOTION = {
  /** 오늘 흐름 3번: 서울에서 그곳까지 실이 이어지는 시간 (거쳐 온 손이 점으로 하나씩) */
  threadDrawMs: 1800,
  /** 오늘 흐름 5번: 한마디를 건네고 실을 묶는 시간 */
  knotDrawMs: 1100,
  /** 여정 화면 하늘(그곳의 지금 시각)을 다시 그리는 간격 */
  skyTickMs: 30_000,
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
  /** 카드를 넘길 때 지금 사람이 물건을 받아 드는 동작, 형태가 바뀌는 효과 */
  handMs: 300,
  /** 되감기 엔딩에서 사람 한 명이 지나가는 시간 */
  replayStepMs: 200,
  /** 아는 사람을 다시 만났을 때 친해진 정도 숫자가 오르는 시간 */
  friendUpMs: 900,
  /** 마을 지도에서 한 곳으로 화면을 옮기는 연출(새 주민을 마을로 모실 때) */
  panMs: 800,
  /** 친구 마을 주민에게 고마워요를 남겼을 때 꽃이 피는 시간 */
  bloomMs: 700,
  /** 단짝(친해진 정도 100%)이 된 순간: 머리 위 하트가 커졌다 작아지는 시간 */
  heartMs: 1200,
  /** 단짝 연출 문구("단짝이 됐어요 · …")가 떠 있는 시간 */
  bestFriendMs: 3500,
  /** 여정을 마치고 마을로 모실 때 이번에 만난 사람이 자리로 걸어오는 시간, 사람 사이 간격 (화면을 옮긴 뒤 시작) */
  walkInMs: 1200,
  walkStaggerMs: 120,
  /** 마을로 모시기: 마지막 주민이 자리에 선 뒤 이만큼 쉬고 기본 배율(우리 집)로 옮긴다 */
  walkSettleMs: 500,
  /** 여정 없이 마을을 열 때, 기다리는 열림 알림을 마을이 그려지고 이만큼 뒤에 띄운다 */
  unlockFirstDelayMs: 1000,
  /** 지도를 끌거나 확대하다 손을 뗀 뒤 이만큼 지나면 '움직이는 중'(will-change)을 뗀다. 그래야 지금 배율로 다시 선명하게 그린다 */
  mapSettleMs: 150,
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
    '--motion-hand': `${MOTION.handMs}ms`,
    '--motion-replay': `${MOTION.replayStepMs}ms`,
    '--motion-friend': `${MOTION.friendUpMs}ms`,
    '--motion-pan': `${MOTION.panMs}ms`,
    '--motion-bloom': `${MOTION.bloomMs}ms`,
    '--motion-heart': `${MOTION.heartMs}ms`,
    '--motion-walk': `${MOTION.walkInMs}ms`,
    '--motion-walk-stagger': `${MOTION.walkStaggerMs}ms`,
  }
}
