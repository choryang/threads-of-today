<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { MOODS, type MoodId } from '../../../shared/data/moods'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { SEOUL_TZ, clockAt, clockLabel } from '../../../shared/local-time'
import { withJosa } from '../../../shared/logic'
import { gapText, placeShort, threadSentence } from '../../../shared/today-text'
import { MOTION, reducedMotion } from '../../utils/motion'

/**
 * 3번 화면 (시안 V2Thread): 같은 순간, 다른 시각에서. 하루 24시간 띠 위에 나(서울)와 그 사람의 지금 시각,
 * 두 곳을 잇는 실(오늘 마음의 색)이 그려지며 거쳐 온 손이 점으로 하나씩. 움직임을 줄이는 설정이면 다 그려진 채로.
 */
const props = defineProps<{ mood: MoodId; itemName: string; personId: string; hands: number }>()
const emit = defineEmits<{ next: [] }>()

const W = 342
const BAND_Y = 292
const color = computed(() => MOODS[props.mood].color)
const person = computed(() => PEOPLE[props.personId]!)
const place = computed(() => PLACES[person.value.placeId]!)
const where = computed(() => placeShort(place.value))

const now = usePlaceNow(computed(() => place.value.tz))
const seoul = computed(() => clockAt(SEOUL_TZ, now.value))
const there = computed(() => clockAt(place.value.tz, now.value))
const x = (c: { h: number; m: number }) => ((c.h + c.m / 60) / 24) * W
const xS = computed(() => x(seoul.value))
const xE = computed(() => x(there.value))

/**
 * 실: 서울에서 그곳까지 위로 휘는 곡선(3차 베지어). 멀수록 높이(최대 230), 가까우면 낮은 둥근 고리로 벌려서
 * 같은 시간대(같은 자리)여도 실이 보이게 한다
 */
const curve = computed(() => {
  const a = xS.value
  const b = xE.value
  const dist = Math.abs(b - a)
  const height = Math.min(230, Math.max(90, dist * 1.4))
  const spread = dist < 80 ? (80 - dist) / 2 + 12 : 0
  const dir = b >= a ? 1 : -1
  const top = BAND_Y - height * (4 / 3)
  const c1 = { x: a - dir * spread, y: top }
  const c2 = { x: b + dir * spread, y: top }
  const pt = (t: number) => {
    const u = 1 - t
    return {
      x: u ** 3 * a + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * b,
      y: u ** 3 * BAND_Y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * BAND_Y,
    }
  }
  let len = 0
  let prev = pt(0)
  for (let i = 1; i <= 60; i++) {
    const q = pt(i / 60)
    len += Math.hypot(q.x - prev.x, q.y - prev.y)
    prev = q
  }
  const f = (n: number) => n.toFixed(1)
  return { d: `M${f(a)} ${BAND_Y} C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(b)} ${BAND_Y}`, len, pt }
})
/** 거쳐 온 손: 실 위에 고르게 (너무 많으면 스무 개까지) */
const dots = computed(() => {
  const n = Math.min(props.hands, 20)
  return Array.from({ length: n }, (_, k) => {
    const t = (k + 1) / (n + 1)
    return { t, ...curve.value.pt(t) }
  })
})

// ── 그리기: 0 → 1 ──
const progress = ref(reducedMotion() ? 1 : 0)
let raf = 0
onMounted(() => {
  if (progress.value >= 1) return
  const start = performance.now()
  const step = (t: number) => {
    progress.value = Math.min(1, (t - start) / MOTION.threadDrawMs)
    if (progress.value < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
})

/** 이름표가 겹치면 서로 반대쪽으로 비켜 선다 */
const labels = computed(() => {
  const close = Math.abs(xS.value - xE.value) < 90
  const clamp = (v: number) => Math.min(W - 40, Math.max(40, v))
  if (!close) return { s: { x: clamp(xS.value), anchor: 'middle' }, e: { x: clamp(xE.value), anchor: 'middle' } }
  const sLeft = xS.value <= xE.value
  return {
    s: { x: xS.value + (sLeft ? -6 : 6), anchor: sLeft ? 'end' : 'start' },
    e: { x: xE.value + (sLeft ? 6 : -6), anchor: sLeft ? 'start' : 'end' },
  }
})

const sentence = computed(() =>
  threadSentence({ seoul: seoul.value, there: there.value, placeName: where.value, gap: gapText(place.value.tz, now.value), hands: props.hands, itemName: props.itemName }),
)
const name = computed(() => person.value.name ?? person.value.job)
</script>

<template>
  <div class="thread-screen" :style="{ '--mood': color }">
    <p class="t-kicker">{{ withJosa(itemName, '을', '를') }} 따라</p>
    <h1 class="t-title">같은 순간,{{ '\n' }}다른 시각에서</h1>

    <svg
      class="band"
      role="img"
      :aria-label="`하루 24시간 띠 위에 서울(${clockLabel(seoul)})과 ${where}(${clockLabel(there)})의 지금 시각이 있고, 실이 두 곳을 잇고 있어요`"
      viewBox="0 0 342 380"
    >
      <defs>
        <linearGradient id="today-day" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#39405E" />
          <stop offset="0.2" stop-color="#39405E" />
          <stop offset="0.27" stop-color="#B8A9C9" />
          <stop offset="0.34" stop-color="#EFE3C2" />
          <stop offset="0.68" stop-color="#EFE3C2" />
          <stop offset="0.76" stop-color="#E9B79D" />
          <stop offset="0.82" stop-color="#6F6E8E" />
          <stop offset="0.88" stop-color="#39405E" />
          <stop offset="1" stop-color="#39405E" />
        </linearGradient>
      </defs>
      <rect x="0" y="292" width="342" height="12" rx="6" fill="url(#today-day)" />
      <text x="0" y="326" font-size="11" fill="#8A8F98">0시</text>
      <text x="85" y="326" font-size="11" fill="#8A8F98" text-anchor="middle">6시</text>
      <text x="171" y="326" font-size="11" fill="#8A8F98" text-anchor="middle">12시</text>
      <text x="256" y="326" font-size="11" fill="#8A8F98" text-anchor="middle">18시</text>
      <text x="342" y="326" font-size="11" fill="#8A8F98" text-anchor="end">24시</text>

      <path
        :d="curve.d"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        :stroke-dasharray="curve.len.toFixed(0)"
        :stroke-dashoffset="(curve.len * (1 - progress)).toFixed(1)"
      />
      <circle v-for="(p, k) in dots" :key="k" :cx="p.x.toFixed(1)" :cy="p.y.toFixed(1)" r="3" :fill="color" :opacity="progress >= p.t ? 1 : 0" class="hand" />

      <circle :cx="xE.toFixed(1)" cy="298" r="8" fill="#FFFFFF" :stroke="color" stroke-width="3" />
      <circle :cx="xS.toFixed(1)" cy="298" r="8" fill="#14161A" />
      <text :x="labels.e.x.toFixed(1)" y="352" font-size="13" font-weight="700" fill="#14161A" :text-anchor="labels.e.anchor">{{ where }}</text>
      <text :x="labels.e.x.toFixed(1)" y="370" font-size="12" fill="#6B7079" :text-anchor="labels.e.anchor">{{ clockLabel(there) }}</text>
      <text :x="labels.s.x.toFixed(1)" y="352" font-size="13" font-weight="700" fill="#14161A" :text-anchor="labels.s.anchor">나 · 서울</text>
      <text :x="labels.s.x.toFixed(1)" y="370" font-size="12" fill="#6B7079" :text-anchor="labels.s.anchor">{{ clockLabel(seoul) }}</text>
    </svg>

    <p class="sentence">{{ sentence }}</p>

    <div class="t-bottom">
      <button class="t-btn" @click="emit('next')">{{ name }} 만나기</button>
    </div>
  </div>
</template>

<style scoped>
.thread-screen { display: flex; flex-direction: column; flex: 1; }
.band { margin-top: 28px; width: 100%; max-width: 342px; height: auto; align-self: center; overflow: visible; }
.hand { transition: opacity var(--motion-enter) var(--motion-ease); }
.sentence { margin: 32px 0 0; font-size: 16px; line-height: 1.7; color: var(--t-quiet); word-break: keep-all; }
</style>
