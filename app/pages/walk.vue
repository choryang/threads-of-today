<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { sceneOf } from '../../shared/data/scenes'
import { clockAt, clockLabel, dayInfo, doingLine } from '../../shared/local-time'
import { seoulDateKey, withJosa } from '../../shared/logic'
import { placeLabel } from '../../shared/rewind'
import { rememberWalk, walkJourneyId, walkPath, type Walk } from '../../shared/walk'
import { MOTION } from '../utils/motion'
import { resolveItem } from '../utils/resolve-item'

/**
 * 실 따라 걷기 (docs/redesign/README.md): 물건 입력 → 그 물건이 지나온 길을 세로 실로. 재료가 여럿이면 재료마다 갈래, 끝에 가게 사람.
 * 칸마다 장소 · 지금 그곳 시각(해·달 점) · 일 이름과 이름 · 카드 문구 한 줄 · 지금은 아마 … · (있으면) 작은 장면 그림. 누르면 들여다보기 시트.
 * 아무것도 쌓지 않는다: 하루 기록·만난 사람·이어진 실에 넣지 않고 점수·개수도 없다. 최근 걸어 본 물건 5개만 이 기기에(localStorage)
 */
useHead({ htmlAttrs: { class: 'today-ui' }, title: '실 따라 걷기' })

const CHOICES = ['아이스 아메리카노', '스마트폰', '참치마요 삼각김밥', '라면', '운동화', '면 티셔츠']
const RECENT_KEY = 'my-day-people:walk-recent'

const recent = ref<string[]>([])
onMounted(() => {
  try {
    const v = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]')
    recent.value = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 5) : []
  } catch {
    recent.value = []
  }
})
function remember(name: string) {
  recent.value = rememberWalk(recent.value, name)
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value))
  } catch {
    // 저장이 막히면 이번 방문 동안만
  }
}

const query = ref('')
const busy = ref(false)
const error = ref('')
const item = ref<{ name: string; materialIds: string[] } | null>(null)
const walk = ref<Walk | null>(null)
const peeking = ref<string | null>(null)

/** 걸을 때마다 출발지가 달라진다 */
function newWalk() {
  if (!item.value) return
  walk.value = walkPath(item.value.materialIds, walkJourneyId(seoulDateKey()), item.value.name)
  window.scrollTo({ top: 0 })
}
async function go(name: string) {
  const v = name.trim()
  if (!v || busy.value) return
  busy.value = true
  error.value = ''
  const res = await resolveItem(v)
  busy.value = false
  if ('error' in res) {
    error.value = res.error
    return
  }
  item.value = res
  query.value = res.name
  remember(res.name)
  newWalk()
}
function back() {
  item.value = null
  walk.value = null
}

// 그곳 시각은 1분마다 다시 (칸마다 따로 세지 않고 한 번에)
const tick = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => { tick.value = Date.now() }, MOTION.peekTickMs) })
onBeforeUnmount(() => clearInterval(timer))

function stopOf(personId: string) {
  const p = PEOPLE[personId]!
  const place = PLACES[p.placeId]!
  const now = new Date(tick.value)
  const c = clockAt(place.tz, now)
  return {
    personId,
    where: placeLabel(place),
    time: clockLabel(c),
    day: c.h >= 6 && c.h < 18,
    hour: c.h,
    who: p.name ? `${p.job} · ${p.name}` : p.job,
    story: p.story,
    doing: doingLine(personId, c.h, dayInfo(place.country, place.tz, now)),
    scene: !!sceneOf(personId),
  }
}
const branches = computed(() => (walk.value ? walk.value.branches.map((b) => ({ ...b, stops: b.stops.map(stopOf) })) : []))
const hand = computed(() => (walk.value ? walk.value.hand.map(stopOf) : []))
</script>

<template>
  <main class="today with-nav walk">
    <template v-if="!walk || !item">
      <p class="t-kicker">언제든, 몇 번이든</p>
      <h1 class="t-title">실 따라 걷기</h1>
      <p class="lead">물건 하나가 지나온 길을 걸어 봐요. 걸을 때마다 다른 길이 나올 수 있어요.</p>
      <form class="ask" @submit.prevent="go(query)">
        <label for="walk-item" class="sr-only">물건 이름</label>
        <input id="walk-item" v-model="query" placeholder="아무 물건이나" maxlength="60" autocomplete="off" enterkeyhint="go">
      </form>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <template v-if="recent.length">
        <span class="list-title">최근 걸어 본 것</span>
        <div class="chips">
          <button v-for="name in recent" :key="`r-${name}`" class="chip" @click="go(name)">{{ name }}</button>
        </div>
      </template>
      <span class="list-title">자주 고르는 것</span>
      <div class="chips">
        <button v-for="name in CHOICES" :key="name" class="chip" @click="go(name)">{{ name }}</button>
      </div>
      <div class="t-bottom">
        <button class="t-btn" :disabled="!query.trim() || busy" @click="go(query)">{{ busy ? '길을 찾는 중…' : '걸어 보기' }}</button>
      </div>
    </template>

    <template v-else>
      <div class="top">
        <button class="t-back" aria-label="다른 물건 고르기" @click="back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button class="again" @click="newWalk">다른 길로 다시 걷기</button>
      </div>
      <h1 class="t-title">{{ withJosa(item.name, '이', '가') }}{{ '\n' }}지나온 길</h1>

      <section v-for="b in branches" :key="b.materialId" class="branch">
        <h2 class="branch-title">{{ b.name }}</h2>
        <ol class="thread">
          <li v-for="(s, i) in b.stops" :key="`${s.personId}-${i}`">
            <button class="stop" @click="peeking = s.personId">
              <span class="knot" aria-hidden="true" />
              <span class="body">
                <span class="where">{{ s.where }} <span class="time"><span class="orb" :class="{ day: s.day }" aria-hidden="true" />{{ s.time }}</span></span>
                <span class="who">{{ s.who }}</span>
                <span class="story">{{ s.story }}</span>
                <span class="doing">{{ s.doing }}</span>
              </span>
              <TodaySceneImage v-if="s.scene" class="thumb" :person-id="s.personId" :hour="s.hour" decorative />
            </button>
          </li>
        </ol>
      </section>
      <section v-if="hand.length" class="branch">
        <h2 class="branch-title">내 손에 닿기까지</h2>
        <ol class="thread">
          <li v-for="(s, i) in hand" :key="`h-${s.personId}-${i}`">
            <button class="stop" @click="peeking = s.personId">
              <span class="knot" aria-hidden="true" />
              <span class="body">
                <span class="where">{{ s.where }} <span class="time"><span class="orb" :class="{ day: s.day }" aria-hidden="true" />{{ s.time }}</span></span>
                <span class="who">{{ s.who }}</span>
                <span class="story">{{ s.story }}</span>
                <span class="doing">{{ s.doing }}</span>
              </span>
              <TodaySceneImage v-if="s.scene" class="thumb" :person-id="s.personId" :hour="s.hour" decorative />
            </button>
          </li>
          <li class="me"><span class="knot mine" aria-hidden="true" /><span class="body"><span class="who">나</span></span></li>
        </ol>
      </section>
    </template>

    <TodayPeekSheet v-if="peeking" :person-id="peeking" walk @close="peeking = null" />
  </main>
</template>

<style scoped>
.lead { margin: 12px 0 0; font-size: 15px; line-height: 1.7; color: var(--t-sub); word-break: keep-all; }
.ask input {
  margin-top: 24px; width: 100%; height: 56px; padding: 0; border: 0; border-bottom: 2px solid var(--t-text);
  background: transparent; outline: none; font-size: 22px; font-weight: 500; color: var(--t-text);
}
.ask input::placeholder { color: #a3a8b0; }
.error { margin: 10px 0 0; font-size: 14px; color: #b23a3a; word-break: keep-all; }
.list-title { margin-top: 24px; font-size: 13px; color: var(--t-sub); }
.chips { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px; }
.chip { min-height: 44px; padding: 0 16px; border: 0; border-radius: 22px; background: var(--t-button-2); color: var(--t-text); font-size: 15px; cursor: pointer; }

.top { display: flex; align-items: center; justify-content: space-between; }
.again { min-height: 44px; padding: 0 4px; border: 0; background: none; color: var(--t-sub); font-size: 14px; text-decoration: underline; cursor: pointer; }
.t-title { margin-top: 12px; }
.branch { margin-top: 28px; }
.branch-title { margin: 0 0 8px; font-size: 13px; font-weight: 500; color: var(--t-sub); }
/* 실: 아주 옅은 회색 한 줄 */
.thread { list-style: none; margin: 0; padding: 0; position: relative; }
.thread::before { content: ''; position: absolute; left: 5px; top: 12px; bottom: 12px; width: 1px; background: #e8eaee; }
.stop {
  position: relative; width: 100%; padding: 12px 0; border: 0; background: none; text-align: left; cursor: pointer;
  display: flex; align-items: flex-start; gap: 14px; color: var(--t-text); font: inherit;
}
.knot { position: relative; z-index: 1; width: 11px; height: 11px; margin-top: 4px; border-radius: 6px; background: #ffffff; border: 2px solid #c9ccd2; flex-shrink: 0; }
.knot.mine { background: #14161a; border-color: #14161a; }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.where { font-size: 13px; color: var(--t-sub); display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.time { display: inline-flex; align-items: center; gap: 5px; }
.orb { width: 7px; height: 7px; border-radius: 4px; background: #5f6b8c; }
.orb.day { background: #f2b33d; }
.who { font-size: 16px; font-weight: 700; }
.story { font-size: 14px; color: var(--t-quiet); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.doing { font-size: 13px; color: var(--t-sub); word-break: keep-all; }
.thumb { width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0; }
.me { display: flex; align-items: center; gap: 14px; padding: 12px 0; }
</style>
