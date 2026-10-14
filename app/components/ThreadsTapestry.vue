<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { threadColor, type TapestryCountry, type TapestryLayout } from '../../shared/threads'

/**
 * '나의 실타래' 그림. 가운데 '나', 둘레에 나라 매듭.
 * interactive면 나라 매듭을 눌러 그 나라에서 만난 사람 카드를 펼치고, 카드를 누르면 open(카드 상세)을 알린다.
 * 엔딩 배경과 공유 이미지에서는 그림만 보여 준다.
 */
const props = withDefaults(defineProps<{
  layout: TapestryLayout
  nickname?: string
  interactive?: boolean
  animate?: boolean
  variant?: 'dark' | 'paper'
  /** 나라 이름 표시 */
  labels?: boolean
}>(), { nickname: '나', interactive: true, animate: true, variant: 'dark', labels: true })

const emit = defineEmits<{ open: [personId: string] }>()

const uid = useId()
const svgEl = ref<SVGSVGElement | null>(null)
const selected = ref<string | null>(null)

const S = computed(() => props.layout.size)
const C = computed(() => props.layout.center)
const anyToday = computed(() => props.layout.threads.some((t) => t.today))
const color = (materialId: string) => threadColor(materialId, props.variant)
const selectedCountry = computed(() => props.layout.countries.find((c) => c.country === selected.value))

/** 나라 이름은 매듭 바깥쪽에, 왼쪽 절반은 뒤집어 읽기 쉽게 */
function labelOf(c: TapestryCountry) {
  const rad = (c.angle * Math.PI) / 180
  const d = c.r + 5
  const x = c.x + Math.cos(rad) * d
  const y = c.y + Math.sin(rad) * d
  const left = Math.cos(rad) < -0.01
  const rotate = left ? c.angle + 180 : c.angle
  return { x, y, anchor: left ? 'end' : 'start', transform: `rotate(${rotate.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})` }
}

/** 탭: 가장 가까운 나라 매듭 (화면에서 반지름 22px 안, 즉 44px 터치 영역) */
function onTap(e: MouseEvent) {
  if (!props.interactive || !svgEl.value) return
  const rect = svgEl.value.getBoundingClientRect()
  const k = S.value / rect.width
  const x = (e.clientX - rect.left) * k
  const y = (e.clientY - rect.top) * k
  let best: TapestryCountry | null = null
  let bestD = Infinity
  for (const c of props.layout.countries) {
    const d = Math.hypot(c.x - x, c.y - y)
    if (d < Math.max(22 * k, c.r) && d < bestD) {
      best = c
      bestD = d
    }
  }
  selected.value = best && best.country !== selected.value ? best.country : null
}

const glowId = `glow-${uid}`
const ariaLabel = computed(() => `나의 실타래: 실 ${props.layout.threads.length}가닥, 나라 ${props.layout.countries.length}곳`)
</script>

<template>
  <div class="tapestry" :class="[variant, { interactive, animate }]">
    <svg ref="svgEl" :viewBox="`0 0 ${S} ${S}`" width="100%" role="img" :aria-label="ariaLabel" @click="onTap">
      <defs>
        <!-- 수평·수직 직선은 경계 상자 높이·너비가 0이라 기본 필터 영역이면 사라진다. 그림 전체를 영역으로 -->
        <filter :id="glowId" filterUnits="userSpaceOnUse" x="-20" y="-20" :width="S + 40" :height="S + 40">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <!-- 실: 바깥 나라에서 '나' 고리로 -->
      <g
        v-for="t in layout.threads"
        :key="t.materialId"
        class="thread"
        :opacity="!anyToday || t.today ? 0.95 : 0.3"
        :filter="t.fresh ? `url(#${glowId})` : undefined"
      >
        <path
          v-for="(d, i) in t.paths"
          :key="i"
          class="seg"
          :d="d"
          fill="none"
          :stroke="color(t.materialId)"
          :stroke-width="t.width"
          stroke-linecap="round"
          pathLength="1"
        />
      </g>

      <!-- 한국·바다 구간: '나' 둘레의 얇은 고리 하나 -->
      <g class="ring">
        <path v-for="r in layout.ring" :key="r.materialId" :d="r.d" fill="none" :stroke="color(r.materialId)" stroke-width="2.4" stroke-linecap="round" />
      </g>
      <g class="me">
        <circle :cx="C" :cy="C" r="8" class="me-dot" />
        <text :x="C" :y="C + layout.ringRadius + 16" text-anchor="middle" class="me-name">{{ nickname }}</text>
      </g>

      <!-- 나라 매듭 -->
      <g v-for="c in layout.countries" :key="c.country" class="knot" :class="{ dim: anyToday && !c.today, on: selected === c.country }">
        <circle :cx="c.x" :cy="c.y" :r="c.r" class="bead" />
        <circle v-if="selected === c.country" :cx="c.x" :cy="c.y" :r="c.r + 5" class="sel" />
        <text
          v-if="labels"
          class="name"
          :x="labelOf(c).x"
          :y="labelOf(c).y"
          :text-anchor="labelOf(c).anchor"
          dominant-baseline="central"
          :transform="labelOf(c).transform"
        >{{ c.country }}</text>
      </g>
    </svg>

    <section v-if="interactive && selectedCountry" class="people panel" aria-live="polite">
      <div class="people-top">
        <p class="people-title">{{ selectedCountry.country }}에서 만난 사람 <span class="mono">{{ selectedCountry.people.length }}</span></p>
        <button class="close" aria-label="닫기" @click="selected = null">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div class="people-grid">
        <button v-for="id in selectedCountry.people" :key="id" class="cell" @click="emit('open', id)">
          <MiniCard :person-id="id" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tapestry { position: relative; display: flex; flex-direction: column; gap: 12px; }
.tapestry svg { display: block; overflow: visible; }
.interactive svg { cursor: pointer; }

.bead { fill: var(--surface, #16263d); stroke: rgba(255, 255, 255, 0.75); stroke-width: 1.4; }
.knot.dim .bead { opacity: 0.55; }
.knot.on .bead { stroke: var(--accent, #f2c14e); stroke-width: 2.2; }
.sel { fill: none; stroke: var(--accent, #f2c14e); stroke-width: 1.6; stroke-dasharray: 3 3; }
.name { fill: #c6cfdb; font-size: 9.5px; }
.knot.dim .name { opacity: 0.6; }
.knot.on .name { fill: var(--accent, #f2c14e); font-weight: 700; }
.me-dot { fill: var(--accent, #f2c14e); }
.me-name { fill: currentColor; font-size: 12px; font-weight: 700; }

.paper .bead { fill: #fffaf0; stroke: #6b6355; }
.paper .name { fill: #4a4a4a; }
.paper .me-dot { fill: #b8462f; }
.paper .me-name { fill: #1b1b1b; }

.people { display: flex; flex-direction: column; gap: 10px; animation: rise 0.2s ease-out; }
.people-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.people-title { margin: 0; font-weight: 700; }
.close { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 0; background: none; color: inherit; }
.people-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.cell { padding: 0; border: 0; background: none; text-align: inherit; min-height: 44px; }

/* 처음 열 때 실이 바깥 나라에서 '나' 쪽으로 천천히 그려진다 */
.animate .seg { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.6s ease-out 0.2s forwards; }
.animate .knot { opacity: 0; animation: knot-in 0.6s ease-out 0.1s forwards; }
.animate .ring, .animate .me { opacity: 0; animation: knot-in 0.6s ease-out 1.5s forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes knot-in { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .animate .seg { animation: none; stroke-dashoffset: 0; }
  .animate .knot, .animate .ring, .animate .me { animation: none; opacity: 1; }
}
</style>
