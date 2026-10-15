<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { SEOUL_TZ, clockAt, clockLabel, dayInfo, doingLine } from '../../shared/local-time'
import { withJosa } from '../../shared/logic'
import { placeLabel } from '../../shared/rewind'
import { MOTION } from '../utils/motion'

/**
 * 핵심 인물 여정의 시작 화면 (docs/key-people.md 화면 1): 세 사람의 그곳 시각을 하루 띠(0~24시)에 핀으로, 나는 서울.
 * 아래에 세 줄 목록(이름·장소·지금은 아마…·시각)과 '그리고 N명의 손을 더 거쳐 왔어요'. 30초마다 다시 그린다
 */
const props = defineProps<{ people: string[]; itemName: string; more: number }>()

const tick = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => { tick.value = Date.now() }, MOTION.skyTickMs) })
onBeforeUnmount(() => clearInterval(timer))

const rows = computed(() => {
  const now = new Date(tick.value)
  return props.people.map((id) => {
    const p = PEOPLE[id]!
    const place = PLACES[p.placeId]!
    const c = clockAt(place.tz, now)
    return {
      id,
      who: p.name ?? p.job,
      job: p.job,
      where: placeLabel(place),
      time: clockLabel(c),
      at: (c.h + c.m / 60) / 24,
      doing: doingLine(id, c.h, dayInfo(place.country, place.tz, now)),
    }
  })
})
const me = computed(() => {
  const c = clockAt(SEOUL_TZ, new Date(tick.value))
  return { time: clockLabel(c), at: (c.h + c.m / 60) / 24 }
})

/** 띠 위 핀: 가까운 핀끼리는 층을 나눠 겹치지 않게 (나는 맨 아래 층) */
const pins = computed(() => {
  const list = [...rows.value.map((r) => ({ key: r.id, at: r.at, label: r.who, me: false })), { key: 'me', at: me.value.at, label: '나', me: true }]
  const placed: Array<(typeof list)[number] & { row: number }> = []
  for (const pin of [...list].sort((a, b) => Number(b.me) - Number(a.me) || a.at - b.at)) {
    let row = 0
    while (placed.some((q) => q.row === row && Math.abs(q.at - pin.at) < 0.13)) row++
    placed.push({ ...pin, row })
  }
  return placed
})
const title = computed(() => `이 ${withJosa(props.itemName, '을', '를')} 만든 사람들, 지금은 뭘 하고 있을까요?`)
</script>

<template>
  <section class="intro">
    <h2 class="display title">{{ title }}</h2>

    <!-- 하루 띠: 0시 ~ 24시, 밤·새벽·낮·노을 색 -->
    <div class="band" role="img" :aria-label="`지금 시각: ${rows.map((r) => `${r.who} ${r.time}`).join(', ')}, 나 ${me.time}`">
      <div class="pins">
        <span
          v-for="pin in pins"
          :key="pin.key"
          class="pin"
          :class="{ me: pin.me }"
          :style="{ left: `${pin.at * 100}%`, bottom: `${pin.row * 46}px` }"
        >
          <span v-if="pin.me" class="me-dot">나</span>
          <span v-else class="face"><Character :person-id="pin.key" :size="34" /></span>
          <span class="stick" />
        </span>
      </div>
      <div class="sky-line" />
      <div class="ticks" aria-hidden="true">
        <span v-for="h in [0, 6, 12, 18, 24]" :key="h" :style="{ left: `${(h / 24) * 100}%` }">{{ h }}시</span>
      </div>
    </div>

    <ul class="rows">
      <li v-for="r in rows" :key="r.id" class="row">
        <span class="row-face"><Character :person-id="r.id" :size="44" /></span>
        <span class="row-body">
          <span class="row-who"><strong>{{ r.who }}</strong> · {{ r.where }}</span>
          <span class="row-doing">{{ r.doing }}</span>
        </span>
        <span class="row-time mono">{{ r.time }}</span>
      </li>
    </ul>
    <p v-if="more > 0" class="more">그리고 <strong class="mono">{{ more }}</strong>명의 손을 더 거쳐 왔어요</p>
  </section>
</template>

<style scoped>
.intro { display: flex; flex-direction: column; gap: 18px; animation: pop-in var(--motion-enter) var(--motion-ease); }
.title { font-size: 24px; line-height: 1.35; word-break: keep-all; }
.band { position: relative; padding: 0 22px; }
.pins { position: relative; height: 150px; }
.pin { position: absolute; display: flex; flex-direction: column; align-items: center; transform: translateX(-50%); }
.face, .me-dot {
  width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; overflow: hidden;
  background: var(--paper); border: 2px solid #2a2a35;
}
.me-dot { background: var(--accent); color: #1a1a22; font-size: 13px; font-weight: 700; }
.stick { width: 2px; height: 8px; background: var(--faint); }
.sky-line {
  height: 12px; border-radius: 6px; border: 2px solid #2a2a35;
  /* 가이드 시간대 표: 밤 20~5 · 새벽 5~7 · 낮 7~17 · 노을 17~19 · 저녁 19~20 */
  background: linear-gradient(90deg,
    #1b2440 0 20.8%, #6b5b95 20.8% 29.2%, #9ed3ee 29.2% 70.8%, #f2a97b 70.8% 79.2%, #3e4a7a 79.2% 83.3%, #1b2440 83.3% 100%);
}
.ticks { position: relative; height: 18px; margin-top: 4px; font-size: 11px; color: var(--muted); }
.ticks span { position: absolute; transform: translateX(-50%); white-space: nowrap; }
.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.row {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px;
  background: var(--surface); border: 1px solid var(--line);
}
.row-face { width: 48px; height: 48px; border-radius: 24px; background: var(--paper); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.row-who { font-size: 13px; color: var(--muted); word-break: keep-all; }
.row-who strong { color: var(--text); font-size: 15px; }
.row-doing { font-size: 13px; line-height: 1.45; word-break: keep-all; }
.row-time { flex-shrink: 0; font-size: 13px; color: var(--accent); }
.more { margin: 0; text-align: center; font-size: 14px; color: var(--muted); }
.more strong { color: var(--text); font-weight: 500; }
</style>
