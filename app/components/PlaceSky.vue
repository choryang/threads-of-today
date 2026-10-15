<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { SEOUL_TZ, SKY, clockAt, clockLabel, doingLine, orbAt, parseClock, seoulDiffText, shiftToLocal, skyPhase } from '../../shared/local-time'
import { placeLabel } from '../../shared/rewind'
import { MOTION } from '../utils/motion'

/**
 * 여정 화면 사람 카드 위의 하늘(높이 380px): 그 사람 장소의 지금 시각으로 하늘색·해와 달·밤의 별, 왼쪽 위에 시계.
 * 아래에 '지금은 아마 …' 한 줄. 30초마다 다시 그린다.
 * 색과 시간대는 shared/local-time.ts의 SKY(문서 '여정 장면 스타일 가이드'의 시간대 표).
 * 개발 중에는 주소에 ?clock=05:30처럼 붙이면 그곳 시각을 바꿔 볼 수 있다
 */
const props = defineProps<{ personId: string }>()

const person = computed(() => PEOPLE[props.personId]!)
const place = computed(() => PLACES[person.value.placeId]!)
const atSea = computed(() => place.value.continent === 'sea')

const route = useRoute()
const devClock = computed(() => (import.meta.dev ? parseClock(String(route.query.clock ?? '')) : undefined))

const tick = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => { tick.value = Date.now() }, MOTION.skyTickMs) })
onBeforeUnmount(() => clearInterval(timer))

const now = computed(() => {
  const d = new Date(tick.value)
  return devClock.value ? shiftToLocal(d, place.value.tz, devClock.value) : d
})
const local = computed(() => clockAt(place.value.tz, now.value))
const seoul = computed(() => clockAt(SEOUL_TZ, now.value))
const phase = computed(() => skyPhase(local.value.h))
const look = computed(() => SKY[phase.value])
const orb = computed(() => orbAt(local.value))
const diff = computed(() => seoulDiffText(place.value.tz, now.value))
const doing = computed(() => doingLine(props.personId, local.value.h))

/** 별 자리 (가로 %, 위에서 px). 저녁 첫 별은 맨 앞 하나 */
const STARS: [number, number][] = [[85, 60], [10, 70], [31, 40], [59, 90], [72, 150]]
const stars = computed(() => STARS.slice(0, look.value.stars))
/** 해·달: 가로 30~330px(폭 390 기준)을 따라 가고, 가장 높을 때 위에서 60px */
const orbStyle = computed(() => ({ left: `${((30 + orb.value.x * 300) / 390) * 100}%`, top: `${210 - orb.value.lift * 150}px` }))
const overlayStyle = computed(() => {
  const o = look.value.overlay
  return o ? { background: o.color, mixBlendMode: o.blend, opacity: o.opacity } : undefined
})

// 흰 스티커 테두리(4px): 캐릭터 모양을 4px 부풀린 흰 그림자를 뒤에 깐다
const filterId = `sticker-${useId()}`
</script>

<template>
  <div class="place-sky">
    <div class="sky" :class="phase" :style="{ background: look.sky }">
      <svg width="0" height="0" class="defs" aria-hidden="true">
        <filter :id="filterId" x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="grown" />
          <feFlood flood-color="#fff" />
          <feComposite in2="grown" operator="in" result="outline" />
          <feMerge><feMergeNode in="outline" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </svg>
      <span v-for="([x, y], i) in stars" :key="i" class="star" :style="{ left: `${x}%`, top: `${y}px` }" aria-hidden="true" />
      <span class="orb" :class="orb.kind" :style="orbStyle" aria-hidden="true" />
      <div class="ground" :class="{ sea: atSea }" aria-hidden="true">
        <span v-if="overlayStyle" class="tint" :style="overlayStyle" />
      </div>
      <div class="figure" aria-hidden="true">
        <span class="shadow" />
        <Character :person-id="personId" :size="220" standing bob :style="{ filter: `url(#${filterId})` }" />
      </div>
      <p class="clock">
        <span class="where">지금 {{ placeLabel(place) }}</span>
        <span class="time">{{ clockLabel(local) }}</span>
        <span class="seoul">서울은 {{ clockLabel(seoul) }} ({{ diff }})</span>
      </p>
    </div>
    <p class="doing">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      <span>{{ doing }}</span>
    </p>
  </div>
</template>

<style scoped>
.place-sky { display: flex; flex-direction: column; margin: 0 -20px 12px; }
.sky {
  position: relative; height: 380px; overflow: hidden; isolation: isolate;
  transition: background var(--motion-enter) var(--motion-ease);
}
.defs { position: absolute; }
.star { position: absolute; width: 4px; height: 4px; border-radius: 2px; background: #f3f1ea; }
.orb {
  position: absolute; width: 46px; height: 46px; margin-left: -23px; border-radius: 23px;
  border: 3px solid #2a2a35; box-sizing: border-box;
}
.orb.sun { background: #f2c14e; }
.orb.moon { background: #f3f1ea; }
.ground {
  position: absolute; left: -15%; width: 130%; top: 250px; height: 220px; border-radius: 50%; overflow: hidden;
  background: #a6d187; border-top: 4px solid #2a2a35;
}
.ground.sea { background: #4f9fcf; }
.tint { position: absolute; inset: 0; }
.figure { position: absolute; left: 50%; bottom: 40px; transform: translateX(-50%); }
.shadow {
  position: absolute; left: 50%; bottom: -6px; width: 120px; height: 18px; margin-left: -60px; border-radius: 50%;
  background: rgba(26, 26, 34, 0.3); filter: blur(1px);
}
.figure :deep(svg) { position: relative; }
.clock {
  position: absolute; left: 16px; top: 16px; margin: 0; max-width: calc(100% - 32px);
  display: flex; flex-direction: column; gap: 2px; padding: 8px 12px;
  background: rgba(255, 255, 255, 0.93); color: #1a1a22; border: 3px solid #2a2a35; border-radius: 16px;
}
.where, .seoul { font-size: 12px; color: #4a4a55; word-break: keep-all; }
.seoul { font-size: 11px; }
.time { font-family: var(--font-display); font-size: 24px; line-height: 1.1; }
.doing {
  position: relative; z-index: 1; margin: -26px 20px 0; padding: 10px 14px;
  display: flex; gap: 8px; align-items: center;
  background: #fff; color: #1a1a22; border: 3px solid #2a2a35; border-radius: 16px;
  font-size: 14px; font-weight: 600; line-height: 1.4; word-break: keep-all;
}
.doing svg { flex-shrink: 0; color: #2a2a35; }
</style>
