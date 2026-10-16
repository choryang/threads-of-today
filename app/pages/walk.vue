<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { sceneOf } from '../../shared/data/scenes'
import { clockAt, clockLabel, dayInfo, doingLine } from '../../shared/local-time'
import { seoulDateKey, withJosa } from '../../shared/logic'
import { factOf } from '../../shared/friendship'
import { placeLabel } from '../../shared/rewind'
import { formatKm, roundKm } from '../../shared/distance'
import { branchLegs, formChanges, rememberWalk, wakeCounts, walkLegs, walkJourneyId, walkSummary, walkPath, walkPeople, type LegGap, type LegMode, type Walk } from '../../shared/walk'
import { MOTION } from '../utils/motion'
import { resolveItem } from '../utils/resolve-item'

/**
 * 실 따라 걷기 (docs/redesign/README.md): 물건 입력 → 그 물건이 지나온 길을 세로 실로. 재료가 여럿이면 재료마다 갈래, 끝에 가게 사람.
 * 맨 위에 지금 이 길 위에서 깨어 있는·자고 있는 사람 수(1분마다).
 * 칸마다 장소 · 지금 그곳 시각(해·달 점) · 일 이름과 이름 · 지금은 아마 … · (있으면) 작은 장면 그림. 누르면 들여다보기 시트(카드 문구 전문은 시트에서).
 * 칸 사이(그 칸 아래)에 그 사람 손에서 바뀌는 모습 '커피 체리 → 생두'(forms.ts 이름만, 아이콘은 쓰지 않는다)와
 * 일의 크기(workFact)가 있는 사람은 칸 아래 한 줄, 누르면 출처(PersonCard와 같은 규칙).
 * 바다·하늘·땅 구간과 대략 거리(100km 단위, walkLegs). 바다 구간은 실을 점선으로. 갈래 끝 칸 아래는 내 손 쪽 첫 사람까지.
 * 끝에 'N개 나라, 약 …km, M명의 손'과, 오늘 고를 수 있는 길에 이야기가 있는 사람이 있으면 '오늘 저녁 …'(오늘 이미 만났으면 '내일 저녁').
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
    doing: doingLine(personId, c.h, dayInfo(place.country, place.tz, now)),
    scene: !!sceneOf(personId),
    fact: factOf(personId),
  }
}
/** 출처를 펼친 칸 ('갈래-번호') */
const openSource = ref<string | null>(null)
function toggleSource(key: string) {
  openSource.value = openSource.value === key ? null : key
}
const MODE_LABEL: Record<LegMode, string> = { sea: '바다', air: '하늘', land: '땅', cross: '', net: '인터넷' }
/** 구간 첫 칸 사이에만 '바다 · 약 7,600km'(무엇에 실려 가는지 모르면 '약 2,900km'). 50km보다 짧은 땅·인터넷 구간은 적지 않는다 */
function legLabel(g: LegGap | null): string {
  if (!g?.first) return ''
  const km = roundKm(g.km) > 0 ? `약 ${formatKm(g.km)}km` : ''
  const label = MODE_LABEL[g.mode]
  // 가까운 땅·인터넷 구간(같은 도시 안 등)은 적지 않는다
  if (!km) return g.mode === 'land' || g.mode === 'net' ? '' : label
  return label ? `${label} · ${km}` : km
}
/** 칸마다 그 아래 칸 사이: 변신·이동 한 줄씩, 앞뒤가 바다 구간인지 (점선) */
function withGaps(stops: string[], gaps: (LegGap | null)[], changes: ({ from: string; to: string } | null)[] = []) {
  return stops.map((id, i) => ({
    ...stopOf(id),
    change: changes[i] ? `${changes[i]!.from} → ${changes[i]!.to}` : '',
    leg: legLabel(gaps[i] ?? null),
    seaIn: gaps[i - 1]?.mode === 'sea',
    seaOut: gaps[i]?.mode === 'sea',
  }))
}
const branches = computed(() =>
  (walk.value ? walk.value.branches.map((b) => ({
    ...b,
    stops: withGaps(b.stops, branchLegs(walk.value!, b), formChanges(b.materialId, b.stops)),
  })) : []))
const hand = computed(() => (walk.value ? withGaps(walk.value.hand, walkLegs(walk.value.hand)) : []))
const metToday = useMetToday()
const summary = computed(() => {
  if (!walk.value || !item.value) return null
  const sum = walkSummary(walk.value)
  const km = roundKm(sum.km) > 0 ? `약 ${formatKm(sum.km)}km, ` : ''
  return {
    line: `이 ${withJosa(item.value.name, '은', '는')} ${sum.countries}개 나라, ${km}${sum.people}명의 손을 거쳐 왔어요.`,
    story: sum.story ? `${metToday.value ? '내일' : '오늘'} 저녁 '오늘'에서 이 길 위의 누군가를 만날 수 있어요` : '',
  }
})
const wake = computed(() => (walk.value ? wakeCounts(walkPeople(walk.value), new Date(tick.value)) : { awake: 0, asleep: 0 }))
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
      <p class="wake">지금 이 길 위에서 깨어 있는 사람 {{ wake.awake }}명, 자고 있는 사람 {{ wake.asleep }}명</p>

      <section v-for="b in branches" :key="b.materialId" class="branch">
        <h2 class="branch-title">{{ b.name }}</h2>
        <ol class="thread">
          <template v-for="(s, i) in b.stops" :key="`${s.personId}-${i}`">
            <li class="cell" :class="{ 'sea-in': s.seaIn, 'sea-out': s.seaOut }">
              <button class="stop" @click="peeking = s.personId">
                <span class="knot" aria-hidden="true" />
                <span class="body">
                  <span class="where">{{ s.where }} <span class="time"><span class="orb" :class="{ day: s.day }" aria-hidden="true" />{{ s.time }}</span></span>
                  <span class="who">{{ s.who }}</span>
                  <span class="doing">{{ s.doing }}</span>
                </span>
                <TodaySceneImage v-if="s.scene" class="thumb" :person-id="s.personId" :hour="s.hour" decorative />
              </button>
              <div v-if="s.fact" class="fact">
                <button class="fact-btn" :aria-expanded="openSource === `${b.materialId}-${i}`" @click="toggleSource(`${b.materialId}-${i}`)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg><span>{{ s.fact.fact }}</span></button>
                <p v-if="openSource === `${b.materialId}-${i}`" class="fact-source">
                  출처: {{ s.fact.source.name }} ({{ s.fact.source.year }})
                  <a :href="s.fact.source.url" target="_blank" rel="noopener noreferrer">자료 보기</a>
                </p>
              </div>
            </li>
            <li v-if="s.change || s.leg" class="gap" :class="{ sea: s.seaOut }">
              <span v-if="s.change" class="change">{{ s.change }}</span>
              <span v-if="s.leg" class="leg">{{ s.leg }}</span>
            </li>
          </template>
        </ol>
      </section>
      <!-- 노래처럼 건네주는 사람이 없으면 "나"만 -->
      <section class="branch">
        <h2 class="branch-title">내 손에 닿기까지</h2>
        <ol class="thread">
          <template v-for="(s, i) in hand" :key="`h-${s.personId}-${i}`">
            <li class="cell" :class="{ 'sea-in': s.seaIn, 'sea-out': s.seaOut }">
              <button class="stop" @click="peeking = s.personId">
                <span class="knot" aria-hidden="true" />
                <span class="body">
                  <span class="where">{{ s.where }} <span class="time"><span class="orb" :class="{ day: s.day }" aria-hidden="true" />{{ s.time }}</span></span>
                  <span class="who">{{ s.who }}</span>
                  <span class="doing">{{ s.doing }}</span>
                </span>
                <TodaySceneImage v-if="s.scene" class="thumb" :person-id="s.personId" :hour="s.hour" decorative />
              </button>
              <div v-if="s.fact" class="fact">
                <button class="fact-btn" :aria-expanded="openSource === `hand-${i}`" @click="toggleSource(`hand-${i}`)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg><span>{{ s.fact.fact }}</span></button>
                <p v-if="openSource === `hand-${i}`" class="fact-source">
                  출처: {{ s.fact.source.name }} ({{ s.fact.source.year }})
                  <a :href="s.fact.source.url" target="_blank" rel="noopener noreferrer">자료 보기</a>
                </p>
              </div>
            </li>
            <li v-if="s.leg" class="gap" :class="{ sea: s.seaOut }"><span class="leg">{{ s.leg }}</span></li>
          </template>
          <li class="me"><span class="knot mine" aria-hidden="true" /><span class="body"><span class="who">나</span></span></li>
        </ol>
      </section>
      <section v-if="summary" class="end">
        <p class="end-line">{{ summary.line }}</p>
        <p v-if="summary.story" class="end-story">{{ summary.story }}</p>
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
.wake { margin: 10px 0 0; font-size: 14px; color: var(--t-sub); word-break: keep-all; }
.branch { margin-top: 28px; }
.branch-title { margin: 0 0 8px; font-size: 13px; font-weight: 500; color: var(--t-sub); }
/* 실: 아주 옅은 회색 한 줄. 칸은 매듭 위(::before)·아래(::after) 반쪽씩 따로 그어서, 바다 구간만 점선으로 (첫 매듭에서 시작해 마지막 매듭에서 끝) */
.thread { list-style: none; margin: 0; padding: 0; }
.thread > li { position: relative; }
.thread > li::before, .thread > li.cell::after { content: ''; position: absolute; left: 5px; top: 0; bottom: 0; border-left: 1px solid #e8eaee; }
.thread > li.cell::before, .thread > li.me::before { bottom: auto; height: 21px; }
.thread > li.cell::after { top: 21px; }
.thread > li:first-child::before, .thread > li.cell:last-child::after { display: none; }
.thread > li.sea-in::before, .thread > li.sea-out::after, .thread > li.gap.sea::before { border-left: 1px dashed #c9ccd2; }
.gap { padding: 0 0 6px 25px; display: flex; flex-direction: column; gap: 2px; }
.change, .leg { font-size: 12px; color: var(--t-faint); word-break: keep-all; }
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
.doing { font-size: 13px; color: var(--t-sub); word-break: keep-all; }
.fact { padding: 0 0 6px 25px; margin-top: -10px; }
.fact-btn { min-height: 44px; padding: 0; border: 0; background: none; text-align: left; font: inherit; font-size: 13px; line-height: 1.5; color: var(--t-body); word-break: keep-all; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.fact-btn svg { flex-shrink: 0; color: var(--t-faint); }
.fact-source { margin: 0; font-size: 12px; line-height: 1.5; color: var(--t-faint); word-break: keep-all; }
.fact-source a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px; color: var(--t-sub); font-weight: 700; }
.thumb { width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0; }
.end { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--t-line); }
.end-line { margin: 0; font-size: 16px; font-weight: 700; line-height: 1.6; color: var(--t-text); word-break: keep-all; }
.end-story { margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: var(--t-sub); word-break: keep-all; }
.me { display: flex; align-items: center; gap: 14px; padding: 12px 0; }
</style>
