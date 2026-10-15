<script setup lang="ts">
import { computed, ref } from 'vue'
import { jobLabel, type JobId } from '../../shared/data/jobs'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { CENTER, RINGS, radiusOf, strandCount, strandsOf } from '../../shared/connections'
import { seoulDateKey } from '../../shared/logic'
import { placeLabel } from '../../shared/rewind'
import { shortDate } from '../../shared/today-text'

/**
 * 나와 이어진 사람들 (시안 V2Map): 나를 가운데 두고 실제 방향·거리로 놓은 별자리 + 날짜별 목록. 누르면 그날의 4번 화면.
 * 계산은 shared/connections.ts
 */
useHead({ htmlAttrs: { class: 'today-ui' }, title: '나와 이어진 사람들' })

const game = useGame()
const strands = computed(() => strandsOf(game.state.todays))
const kicker = computed(() => {
  const month = Number(seoulDateKey().slice(5, 7))
  const all = strands.value
  const thisMonth = all.every((s) => Number(s.date.slice(5, 7)) === month && s.date.slice(0, 4) === seoulDateKey().slice(0, 4))
  return `${thisMonth ? `${month}월` : '지금까지'} · ${strandCount(all.length)}`
})
const nameOf = (id: string) => PEOPLE[id]?.name ?? PEOPLE[id]?.job ?? ''
const placeOf = (id: string) => {
  const place = PLACES[PEOPLE[id]?.placeId ?? '']
  return place ? placeLabel(place) : ''
}
// 하는 일: 맨 아래 작은 글씨. 바꾸기 시트를 닫으면 그대로 둔다
const today = useToday()
const job = computed(() => game.state.job?.value)
const jobOpen = ref(false)
/** 지금 들여다보기: 지도 점이나 목록 줄을 누르면 */
const peeking = ref<string | null>(null)
function setJob(value: JobId | 'declined') {
  today.setJob(value)
  jobOpen.value = false
}
const rings = RINGS.map((km) => ({ km, r: radiusOf(km) }))
const label = computed(() =>
  strands.value.length ? `나를 가운데 두고, 방향과 거리에 따라 이어진 ${strands.value.length}명이 실로 연결되어 있어요` : '아직 이어진 사람이 없어요',
)
</script>

<template>
  <main class="today with-nav">
    <p class="t-kicker">{{ strands.length ? kicker : '아직 한 가닥도 없어요' }}</p>
    <h1 class="t-title">나와 이어진 사람들</h1>

    <svg class="map" role="img" :aria-label="label" viewBox="0 0 342 342">
      <g fill="none" stroke="#E3E6EB" stroke-width="1">
        <circle v-for="ring in rings" :key="ring.km" :cx="CENTER" :cy="CENTER" :r="ring.r.toFixed(1)" />
      </g>
      <text v-for="ring in rings" :key="`l-${ring.km}`" x="175" :y="(CENTER - ring.r - 3).toFixed(1)" font-size="10" fill="#A3A8B0">{{ ring.km.toLocaleString('ko-KR') }}km</text>
      <text x="171" y="12" font-size="10" fill="#A3A8B0" text-anchor="middle">북</text>
      <path v-for="s in [...strands].reverse()" :key="`p-${s.date}`" :d="s.path" fill="none" :stroke="s.color" stroke-width="1.5" stroke-linecap="round" :opacity="s.opacity" />
      <g
        v-for="s in [...strands].reverse()"
        :key="`d-${s.date}`"
        class="pin"
        role="button"
        tabindex="0"
        :aria-label="`${nameOf(s.personId)} 지금 들여다보기`"
        @click="peeking = s.personId"
        @keydown.enter.prevent="peeking = s.personId"
      >
        <circle :cx="s.x.toFixed(1)" :cy="s.y.toFixed(1)" r="22" fill="transparent" />
        <circle :cx="s.x.toFixed(1)" :cy="s.y.toFixed(1)" r="7" :fill="s.color" stroke="#FFFFFF" stroke-width="2.5" />
        <text :x="s.label.x.toFixed(1)" :y="s.label.y.toFixed(1)" font-size="12" font-weight="700" fill="#14161A" :text-anchor="s.label.anchor">{{ nameOf(s.personId) }}</text>
      </g>
      <circle :cx="CENTER" :cy="CENTER" r="6" fill="#14161A" />
      <text x="171" y="194" font-size="11" font-weight="700" fill="#14161A" text-anchor="middle">나</text>
    </svg>

    <ul v-if="strands.length" class="list">
      <li v-for="s in strands" :key="s.date">
        <button class="row" @click="peeking = s.personId">
          <span class="dot" :style="{ background: s.color }" aria-hidden="true" />
          <span class="who"><strong>{{ nameOf(s.personId) }}</strong> <span class="place">{{ placeOf(s.personId) }}</span></span>
          <span class="date">{{ shortDate(s.date) }}</span>
        </button>
      </li>
    </ul>
    <div v-else class="empty">
      <p>오늘 하루를 고르면, 같은 하루를 보낸 사람과 첫 실이 이어져요.</p>
      <NuxtLink to="/" class="t-btn">오늘 하루 고르기</NuxtLink>
    </div>

    <!-- 하는 일 바꾸기 (README "하는 일 묻기") -->
    <p class="job">
      <template v-if="job && job !== 'declined'">하는 일: {{ jobLabel(job) }} · <button @click="jobOpen = true">바꾸기</button></template>
      <button v-else @click="jobOpen = true">하는 일 알려 주기</button>
    </p>
    <TodayPeekSheet v-if="peeking" :person-id="peeking" @close="peeking = null" />
    <TodayJobSheet v-if="jobOpen" :current="job && job !== 'declined' ? job : undefined" @choose="setJob" @close="jobOpen = false" />
  </main>
</template>

<style scoped>
.map { margin-top: 20px; width: 100%; max-width: 342px; height: auto; align-self: center; background: var(--t-face); border-radius: 24px; }
.list { list-style: none; margin: 16px 0 0; padding: 0; }
.pin { cursor: pointer; outline: none; }
.pin:focus-visible circle:last-of-type { stroke: #14161a; }
.row {
  width: 100%; padding: 0; border: 0; border-top: 0; background: none; font: inherit; text-align: left; cursor: pointer;
  display: flex; align-items: center; gap: 12px; min-height: 48px; border-bottom: 1px solid var(--t-line);
  color: var(--t-text); text-decoration: none;
}
.dot { width: 10px; height: 10px; border-radius: 5px; flex-shrink: 0; }
.who { flex: 1; min-width: 0; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.who strong { font-weight: 700; }
.place { font-size: 13px; color: var(--t-sub); }
.date { font-size: 13px; color: var(--t-sub); flex-shrink: 0; }
.empty { margin-top: 20px; display: flex; flex-direction: column; gap: 16px; }
.job { margin: 24px 0 0; font-size: 13px; color: var(--t-faint); text-align: center; }
.job button { min-height: 44px; padding: 0 4px; border: 0; background: none; color: var(--t-sub); font: inherit; font-size: 13px; text-decoration: underline; cursor: pointer; }
.empty p { margin: 0; font-size: 15px; line-height: 1.7; color: var(--t-sub); word-break: keep-all; }
</style>
