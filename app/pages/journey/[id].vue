<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { MATERIALS, PRODUCTS } from '../../../shared/data/materials'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { EVENTS } from '../../../shared/data/journey-extras'
import { buildTimeline, optionOrder, quizFor } from '../../../shared/journey'
import { dayStats, withJosa } from '../../../shared/logic'
import { lineupOf, linkPersonOf, pickTeaser } from '../../../shared/next'
import type { Product } from '../../../shared/types'
import { renderVoice } from '../../../shared/voice'
import { characterSvg } from '../../utils/character'
import { MOTION, autoDwellMs, reducedMotion } from '../../utils/motion'
import { productIconSvg } from '../../utils/product-icon'

const route = useRoute()
const router = useRouter()
const game = useGame()
const journey = computed(() => game.findJourney(String(route.params.id)))
const timeline = computed(() => (journey.value ? buildTimeline(journey.value.materialIds, journey.value.id, journey.value.name) : []))
const current = computed(() => (journey.value ? timeline.value[journey.value.step] : undefined))
const voice = computed(() => renderVoice(journey.value?.voice, game.nickname.value))
const isLast = computed(() => !!journey.value && journey.value.step >= timeline.value.length - 1)

/** 방금 얻은 카드 알림 */
const toast = shallowRef<string[]>([])

function jobNames(ids: string[]) {
  return ids.map((id) => PEOPLE[id]?.job).join(', ')
}

function jobOf(id: string) {
  return PEOPLE[id]?.job ?? ''
}

/** 연결 카드를 얻었을 때: "{이름}을(를) 또 만났어요!" (이름이 없으면 직업으로) */
function metAgain(cardId: string) {
  const p = PEOPLE[cardId]
  return `${withJosa(p?.name ?? jobOf(linkPersonOf(cardId) ?? ''), '을', '를')} 또 만났어요!`
}

const progressPct = computed(() => (journey.value && timeline.value.length ? ((journey.value.step + 1) / timeline.value.length) * 100 : 0))

const materialIndex = computed(() => {
  const mid = current.value?.materialId
  return mid ? journey.value!.materialIds.indexOf(mid) : -1
})
const material = computed(() => (current.value ? MATERIALS[current.value.materialId] : undefined))

/** 지금까지 만난 사람들 (작은 얼굴로 줄지어) */
const metFaces = computed(() => {
  if (!journey.value) return []
  return timeline.value
    .slice(0, journey.value.step + 1)
    .flatMap((t) => (t.type === 'stage' || t.type === 'hidden' ? [t.personId] : []))
})
const hasNext = computed(() => !!journey.value && timeline.value.slice(journey.value.step + 1).some((t) => t.type === 'stage' || t.type === 'hidden'))
const facesEl = ref<HTMLElement | null>(null)
watch(() => metFaces.value.length, () => {
  requestAnimationFrame(() => facesEl.value?.scrollTo({ left: facesEl.value.scrollWidth, behavior: 'smooth' }))
})

/** 지금 재료의 경유지 목록과 몇 번째까지 왔는지 (이번 여정의 출발지 변형 기준) */
const routeStops = computed(() => {
  if (!journey.value || !material.value) return []
  const mid = material.value.id
  const stagesBefore = timeline.value.slice(0, journey.value.step + 1).filter(
    (t) => t.type === 'stage' && t.materialId === mid,
  ).length
  const stages = timeline.value.flatMap((t) => (t.type === 'stage' && t.materialId === mid ? [t.personId] : []))
  return stages.map((pid, i) => {
    const place = PLACES[PEOPLE[pid]!.placeId]!
    return { pid, label: place.country || '바다', reached: i < stagesBefore, here: i === stagesBefore - 1 && current.value?.type === 'stage' }
  })
})

/** 지금 칸의 퀴즈 (재료마다 여러 개 중 이번 여정에 나온 하나) */
const quiz = computed(() =>
  journey.value && current.value?.type === 'quiz' ? quizFor(journey.value.materialIds, journey.value.id, current.value.materialId) : undefined,
)
const quizChoice = computed(() => (journey.value && current.value?.type === 'quiz' ? journey.value.quiz[current.value.materialId] : undefined))
/** 보기를 화면에 놓는 순서. i는 데이터 인덱스라 답 저장·정답 판정은 그대로 쓴다 */
const quizOptions = computed(() => {
  const q = quiz.value
  if (!q || !journey.value || current.value?.type !== 'quiz') return []
  return optionOrder(journey.value.id, current.value.materialId, q.options.length).map((i) => ({ i, opt: q.options[i]! }))
})
const eventText = computed(() => {
  const item = current.value
  return item?.type === 'event' ? EVENTS.find((e) => e.id === item.eventId)?.text : ''
})


/** 퀴즈를 맞혀서 얻은 보상 카드 */
const quizRewards = computed(() => {
  if (!journey.value) return []
  const j = journey.value
  return j.materialIds.flatMap((mid) => {
    const q = quizFor(j.materialIds, j.id, mid)
    // 첫 여정 선물로 틀려도 받은 보상까지
    return q && j.quiz[mid] !== undefined && (j.quiz[mid] === q.answer || j.newCards.includes(q.rewardId)) ? [q.rewardId] : []
  })
})

/** 여정을 마칠 때 얻은 연결 카드 */
const linkGained = computed(() => journey.value?.newCards.filter((id) => PEOPLE[id]?.kind === 'link') ?? [])

function showToast(ids: string[]) {
  if (!ids.length) return
  toast.value = ids
  setTimeout(() => {
    if (toast.value === ids) toast.value = []
  }, MOTION.toastMs)
}

/** 다음 칸으로. 마지막 칸이면 여정을 마친다. 애니메이션 중에 눌러도 바로 넘어간다 */
function next() {
  const j = journey.value
  if (!j || j.done) return
  if (current.value?.type === 'quiz' && quizChoice.value === undefined) return
  clearTimers()
  if (isLast.value) {
    game.finishJourney(j)
    window.scrollTo({ top: 0 })
    return
  }
  showToast(game.revealNext(j))
  window.scrollTo({ top: 0 })
}

const nextLabel = computed(() => {
  if (isLast.value) return '여정 마치기'
  const after = timeline.value[(journey.value?.step ?? 0) + 1]
  return after?.type === 'stage' || after?.type === 'hidden' ? '다음 사람 만나기' : '다음'
})

function answer(i: number) {
  if (!journey.value || current.value?.type !== 'quiz') return
  const { gained } = game.answerQuiz(journey.value, current.value.materialId, i)
  showToast(gained)
}

// ── 고마워요: 손 흔드는 모습을 MOTION.waveMs 보여 준 뒤 다음 카드로 ──
let waveTimer: ReturnType<typeof setTimeout> | undefined
const currentPerson = computed(() => (current.value?.type === 'stage' || current.value?.type === 'hidden' ? current.value.personId : ''))
watch(
  () => (currentPerson.value ? game.thanked(currentPerson.value) : false),
  (now, before) => {
    if (!now || before) return
    clearTimeout(waveTimer)
    const step = journey.value?.step
    waveTimer = setTimeout(() => {
      if (journey.value?.step === step) next()
    }, reducedMotion() ? 0 : MOTION.waveMs)
  },
)

// ── 다음 사람 미리 불러오기: 캐릭터 SVG를 미리 만들어 두고, 화면 밖에 한 번 그려 둔다 ──
const nextPerson = computed(() => {
  const j = journey.value
  if (!j) return ''
  const t = timeline.value.slice(j.step + 1).find((x) => x.type === 'stage' || x.type === 'hidden')
  return t?.type === 'stage' || t?.type === 'hidden' ? t.personId : ''
})
watch(nextPerson, (id) => {
  const p = id ? PEOPLE[id] : undefined
  if (!p) return
  characterSvg(p)
  characterSvg(p, { wave: true })
}, { immediate: true })

// ── 이야기 화면: 글자 수에 맞춰 3~6초 머문 뒤 저절로 넘어간다. 누르고 있으면 멈추고, 한 번 누르면 바로 넘어간다 ──
let storyTimer: ReturnType<typeof setTimeout> | undefined
let storyStartedAt = 0
const storyLeft = ref(0)
const storyTotal = ref(0)
const storyPaused = ref(false)

function runStory(ms: number) {
  clearTimeout(storyTimer)
  storyLeft.value = ms
  storyStartedAt = Date.now()
  storyPaused.value = false
  storyTimer = setTimeout(next, ms)
}
function pauseStory() {
  if (current.value?.type !== 'event' || storyPaused.value) return
  clearTimeout(storyTimer)
  storyLeft.value = Math.max(0, storyLeft.value - (Date.now() - storyStartedAt))
  storyPaused.value = true
}
watch(
  () => (current.value?.type === 'event' ? journey.value?.step : undefined),
  (step) => {
    clearTimeout(storyTimer)
    if (step === undefined) return
    storyTotal.value = autoDwellMs(eventText.value ?? '')
    runStory(storyTotal.value)
  },
  { immediate: true },
)

// ── 밀어서 넘기기 + 이야기 화면 누르기 ──
const SWIPE_PX = 60
const TAP_MS = 250
let press: { x: number; y: number; at: number } | null = null

function onPointerDown(e: PointerEvent) {
  press = { x: e.clientX, y: e.clientY, at: Date.now() }
  pauseStory()
}
function onPointerUp(e: PointerEvent) {
  if (!press) return
  const dx = e.clientX - press.x
  const dy = e.clientY - press.y
  const held = Date.now() - press.at
  press = null
  if (dx < -SWIPE_PX && Math.abs(dy) < Math.abs(dx)) return next()
  if (current.value?.type !== 'event') return
  if (held < TAP_MS) return next()
  runStory(storyLeft.value)
}
function onPointerCancel() {
  press = null
  if (current.value?.type === 'event' && storyPaused.value) runStory(storyLeft.value)
}

function clearTimers() {
  clearTimeout(waveTimer)
  clearTimeout(storyTimer)
}
onBeforeUnmount(clearTimers)

const summary = computed(() => (journey.value ? dayStats([journey.value]) : { people: [], countries: [] }))
const metPeople = computed(() => summary.value.people)

// ── 끝 장면 ──
const productId = computed(() => PRODUCTS.find((p) => p.name === journey.value?.name)?.id ?? '')
const lineup = computed(() => lineupOf(metPeople.value))

/** 추천을 따라 떠나 그 사람을 다시 만났으면, 그 연결 카드를 평소보다 크게 보여 준다 */
const reunionCard = computed(() => {
  const j = journey.value
  return j?.teaser ? linkGained.value.find((id) => linkPersonOf(id) === j.teaser) : undefined
})
const reunionPerson = computed(() => (reunionCard.value ? linkPersonOf(reunionCard.value) ?? '' : ''))
const reunionOpen = ref(true)

/**
 * 다음 여정 예고. 이 여정과 같은 날 떠나야 연결 카드가 나오므로, 오늘 떠난 여정이고 오늘 더 떠날 수 있을 때만.
 * 화면에 처음 보일 때의 카드로 한 번 정한다 (예고를 따라 떠나도 이 화면의 예고가 바뀌지 않게).
 */
const teaser = shallowRef<ReturnType<typeof pickTeaser>>(null)
watch(
  () => journey.value?.done,
  (done) => {
    const j = journey.value
    if (!done || !j || teaser.value) return
    if (j.id.slice(0, 10) !== game.todayKey || game.remaining.value <= 0) return
    teaser.value = pickTeaser(j, new Set(Object.keys(game.state.cards)))
  },
  { immediate: true },
)

function followTeaser(p: Product) {
  const t = teaser.value
  if (!t) return
  const next = game.startJourney({ name: p.name, materialIds: [...p.materialIds] }, 'pick', { teaser: t.personId })
  if (next) router.push(`/journey/${next.id}`)
}
</script>

<template>
  <main class="page">
    <div v-if="!journey" class="panel">
      <p>여정을 찾을 수 없어요.</p>
      <NuxtLink to="/" class="btn btn-primary">처음으로</NuxtLink>
    </div>

    <!-- 도착 -->
    <template v-else-if="journey.done">
      <header class="head">
        <p class="mono muted kicker">ARRIVED</p>
        <h1 class="display title">도착했어요</h1>
      </header>

      <EndScene :people="lineup" :product-id="productId" :item-name="journey.name" />

      <p class="touched">
        이 {{ journey.name }}에 <strong class="mono">{{ summary.countries.length }}</strong>개 나라,
        <strong class="mono">{{ metPeople.length }}</strong>명이 닿아 있었어요
      </p>
      <p v-if="voice" class="voice">“{{ voice }}”</p>

      <section v-if="linkGained.length && !reunionCard" class="link-banner">
        <p class="mono kicker gold">CONNECTION FOUND</p>
        <p class="lb-title">여정이 서로 겹쳤어요!</p>
        <p v-for="id in linkGained" :key="id" class="lb-met">{{ metAgain(id) }}</p>
        <p class="small">오늘 지나온 재료들이 같은 사람을 거쳐 왔어요. 에픽 카드를 얻었어요.</p>
        <div class="grid">
          <MiniCard v-for="id in linkGained" :key="id" :person-id="id" is-new />
        </div>
      </section>

      <section v-if="teaser" class="teaser" aria-labelledby="next-title">
        <div class="teaser-who">
          <Character :person-id="teaser.personId" :size="72" bob />
          <div class="teaser-say">
            <p class="bubble">나는 오늘 다른 물건도 날랐어요. 뭘까요?</p>
            <p class="small muted">{{ jobOf(teaser.personId) }}</p>
          </div>
        </div>
        <h2 id="next-title" class="h2">다음 여정 추천</h2>
        <div class="next-list">
          <button v-for="p in teaser.products" :key="p.id" class="next" @click="followTeaser(p)">
            <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
            <svg class="next-icon" viewBox="0 0 32 32" width="40" height="40" aria-hidden="true" v-html="productIconSvg(p.id)" />
            <span class="next-name">{{ p.name }}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="next-go"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </section>

      <details class="cards">
        <summary>만난 사람 카드 <span class="mono">{{ metPeople.length + quizRewards.length }}</span>장 보기</summary>
        <div class="grid">
          <MiniCard v-for="id in metPeople" :key="id" :person-id="id" :is-new="journey.newCards.includes(id)" />
          <MiniCard v-for="id in quizRewards" :key="`q-${id}`" :person-id="id" :is-new="journey.newCards.includes(id)" />
        </div>
      </details>

      <div class="actions">
        <NuxtLink to="/" class="btn btn-block" :class="{ 'btn-primary': !teaser }">다른 물건 고르기</NuxtLink>
        <NuxtLink to="/result" class="btn btn-block">오늘의 결과 카드</NuxtLink>
      </div>

      <!-- 추천을 따라와 다시 만난 사람: 평소 연결 카드보다 크게 -->
      <div v-if="reunionCard && reunionOpen" class="reunion-wrap" role="dialog" aria-modal="true" aria-labelledby="reunion-title">
        <div class="reunion">
          <p class="mono kicker gold">CONNECTION FOUND</p>
          <Character :person-id="reunionPerson" :size="132" wave />
          <p id="reunion-title" class="reunion-title display">{{ metAgain(reunionCard) }}</p>
          <p class="reunion-text">{{ withJosa(jobOf(reunionPerson), '이', '가') }} 두 물건을 모두 날랐어요. 에픽 카드를 얻었어요.</p>
          <div class="reunion-card">
            <MiniCard :person-id="reunionCard" is-new />
          </div>
          <button class="btn btn-primary btn-block" @click="reunionOpen = false">반가워요</button>
        </div>
      </div>
    </template>

    <!-- 여정 진행 중 -->
    <template v-else-if="current">
      <header class="bar">
        <NuxtLink to="/" class="icon-btn" aria-label="처음으로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </NuxtLink>
        <div class="bar-title">
          <span class="name">{{ journey.name }}</span>
          <span class="mono muted small">재료 {{ materialIndex + 1 }}/{{ journey.materialIds.length }} · {{ material?.name }}</span>
        </div>
        <span class="mono muted small">{{ journey.step + 1 }}/{{ timeline.length }}</span>
      </header>

      <div class="progress" aria-hidden="true">
        <span :style="{ width: `${progressPct}%` }" />
      </div>

      <ol ref="facesEl" class="faces" aria-label="지금까지 만난 사람">
        <li v-for="(pid, i) in metFaces" :key="pid + i" class="face" :class="{ now: i === metFaces.length - 1 }">
          <Character :person-id="pid" :size="36" />
          <span class="sr-only">{{ jobOf(pid) }}</span>
        </li>
        <li v-if="hasNext" class="face next-face" aria-label="다음 사람">?</li>
      </ol>

      <ol class="route" aria-label="경유지">
        <li v-for="(stop, i) in routeStops" :key="stop.pid + i" :class="{ reached: stop.reached, here: stop.here }">
          <span class="dot" />
          <span class="label">{{ stop.reached ? stop.label : '?' }}</span>
        </li>
      </ol>

      <!-- 칸마다 key를 바꿔 등장 애니메이션만 쓴다. 나가는 애니메이션을 기다리지 않아 바로 넘어간다 -->
      <div
        :key="journey.step"
        class="scene"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <section v-if="current.type === 'stage'" class="stage">
          <PersonCard :person-id="current.personId" :is-new="journey.newCards.includes(current.personId)" />
        </section>

        <section v-else-if="current.type === 'hidden'" class="stage hidden-meet">
          <p class="mono kicker gold">숨은 만남</p>
          <PersonCard :person-id="current.personId" :is-new="journey.newCards.includes(current.personId)" />
        </section>

        <section v-else-if="current.type === 'event'" class="story panel" :class="{ paused: storyPaused }">
          <span class="chip story-chip">이야기</span>
          <p class="story-text">{{ eventText }}</p>
          <div class="story-bar" aria-hidden="true">
            <span :style="{ animationDuration: `${storyTotal}ms` }" />
          </div>
          <p class="muted small">누르고 있으면 멈추고, 한 번 누르면 넘어가요</p>
        </section>

        <section v-else-if="quiz" class="quiz panel">
          <p class="mono kicker gold">QUIZ · 맞히면 레어 카드</p>
          <p class="q">{{ quiz.q }}</p>
          <div class="options">
            <button
              v-for="{ i, opt } in quizOptions"
              :key="opt"
              class="opt"
              :class="{ right: quizChoice !== undefined && i === quiz.answer, wrong: quizChoice === i && i !== quiz.answer }"
              :disabled="quizChoice !== undefined"
              @click="answer(i)"
            >
              <span>{{ opt }}</span>
              <span class="mono mark">
                <template v-if="quizChoice !== undefined && i === quiz.answer">정답</template>
                <template v-else-if="quizChoice === i">오답</template>
              </span>
            </button>
          </div>
          <div v-if="quizChoice !== undefined" class="explain">
            <p>{{ quiz.explain }}</p>
            <p v-if="quizChoice !== quiz.answer && journey.newCards.includes(quiz.rewardId)" class="small gold">그래도 첫 여정 선물로 이 사람을 만나게 해 드릴게요.</p>
            <div v-if="quizChoice === quiz.answer || journey.newCards.includes(quiz.rewardId)" class="reward">
              <MiniCard :person-id="quiz.rewardId" :is-new="journey.newCards.includes(quiz.rewardId)" />
            </div>
          </div>
        </section>
      </div>

      <button
        class="btn btn-primary btn-block next-btn"
        :disabled="current.type === 'quiz' && quizChoice === undefined"
        @click="next"
      >
        {{ current.type === 'quiz' && quizChoice === undefined ? '답을 골라 주세요' : nextLabel }}
      </button>

      <!-- 다음 사람의 캐릭터를 화면 밖에 미리 그려 둔다 -->
      <div v-if="nextPerson" class="preload" aria-hidden="true">
        <Character :person-id="nextPerson" :size="150" />
      </div>
    </template>

    <Transition name="toast">
      <div v-if="toast.length" class="toast" role="status">
        <span class="mono">+{{ toast.length }}</span> 새 카드: {{ jobNames(toast) }}
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 8px; }
.kicker { margin: 0; font-size: 11px; letter-spacing: 1.5px; }
.gold { color: var(--accent); }
.title { font-size: 30px; line-height: 1.25; }
.voice {
  margin: 4px 0; padding: 10px 14px; border-radius: 14px 14px 14px 4px;
  background: var(--paper); color: var(--ink); font-size: 14px; line-height: 1.5; align-self: flex-start;
}
.small { margin: 0; font-size: 13px; }
.h2 { margin: 0 0 10px; font-size: 15px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.actions { display: flex; flex-direction: column; gap: 10px; }

.link-banner {
  display: flex; flex-direction: column; gap: 8px;
  padding: 16px; border-radius: 18px;
  background: linear-gradient(160deg, #2b2150, #172840);
  border: 2px solid var(--r-epic);
  animation: pop-in var(--motion-enter) var(--motion-ease);
}
.lb-title { margin: 0; font-family: var(--font-display); font-size: 22px; }
.lb-met { margin: 0; font-size: 15px; font-weight: 700; word-break: keep-all; }

.bar { display: flex; align-items: center; gap: 12px; }
.icon-btn {
  width: 44px; height: 44px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; background: var(--surface); border: 1px solid var(--line); color: var(--text);
}
.bar-title { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.progress { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--accent); transition: width var(--motion-enter) var(--motion-ease); }

.route {
  list-style: none; margin: 0; padding: 4px 0 0;
  display: flex; overflow-x: auto; gap: 0;
  scrollbar-width: none;
}
.route li {
  flex: 1 0 56px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  position: relative; font-size: 11px; color: var(--faint);
}
.route li::before {
  content: ''; position: absolute; top: 6px; left: -50%; width: 100%; height: 2px;
  background: var(--line); z-index: 0;
}
.route li:first-child::before { display: none; }
.route li.reached::before { background: var(--accent); }
.dot { width: 14px; height: 14px; border-radius: 999px; background: var(--ground); border: 2px solid var(--faint); z-index: 1; }
.reached .dot { background: var(--accent); border-color: var(--accent); }
.here .dot { box-shadow: 0 0 0 5px rgba(242, 193, 78, 0.25); }
.reached .label { color: var(--text); }
.label { white-space: nowrap; max-width: 64px; overflow: hidden; text-overflow: ellipsis; }

.stage { animation: pop-in var(--motion-enter) var(--motion-ease); }

.story { display: flex; flex-direction: column; gap: 10px; animation: rise var(--motion-enter) var(--motion-ease); cursor: pointer; user-select: none; }
.story-chip { align-self: flex-start; color: var(--accent); }
.story-text { margin: 0; font-size: 17px; line-height: 1.6; }
.hidden-meet { display: flex; flex-direction: column; gap: 6px; }
.hidden-meet .kicker { margin: 0; }
.quiz { display: flex; flex-direction: column; gap: 12px; animation: rise var(--motion-enter) var(--motion-ease); }
.q { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.45; }
.options { display: flex; flex-direction: column; gap: 8px; }
.opt {
  display: flex; justify-content: space-between; align-items: center;
  min-height: 52px; padding: 0 16px; border-radius: 14px;
  background: var(--ground); border: 1px solid var(--line); font-size: 15px; text-align: left;
}
.reward { width: 120px; }
.opt:disabled { cursor: default; }
.opt.right { background: #1e3a2e; border: 2px solid var(--ok); }
.opt.wrong { background: #3a1f22; border: 2px solid var(--bad); }
.mark { font-size: 12px; }
.explain { display: flex; flex-direction: column; gap: 10px; font-size: 14px; line-height: 1.55; animation: rise var(--motion-enter) var(--motion-ease); }
.explain p { margin: 0; }

/* 밀어서 넘길 때 세로 스크롤은 그대로 */
.scene { touch-action: pan-y; }
.story-bar { height: 3px; border-radius: 2px; background: var(--line); overflow: hidden; }
.story-bar span { display: block; height: 100%; background: var(--accent); transform-origin: left; animation: story-fill linear forwards; }
.story.paused .story-bar span { animation-play-state: paused; }
@keyframes story-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.next-btn { position: sticky; bottom: calc(84px + env(safe-area-inset-bottom)); z-index: 5; }
.preload { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }

.touched { margin: 0; font-size: 17px; line-height: 1.5; word-break: keep-all; }
.touched strong { color: var(--accent); font-size: 22px; font-weight: 500; }

.teaser {
  display: flex; flex-direction: column; gap: 10px;
  padding: 16px; border-radius: 18px; background: var(--surface); border: 1px solid var(--line);
  animation: rise var(--motion-enter) var(--motion-ease) calc(var(--motion-enter) * 3) both;
}
.teaser-who { display: flex; align-items: center; gap: 12px; }
.teaser-say { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.bubble {
  margin: 0; padding: 10px 14px; border-radius: 14px 14px 14px 4px;
  background: var(--paper); color: var(--ink); font-size: 15px; font-weight: 700; line-height: 1.45; word-break: keep-all;
}
.teaser .h2 { margin: 4px 0 0; }
.next-list { display: flex; flex-direction: column; gap: 8px; }
.next {
  display: flex; align-items: center; gap: 12px;
  min-height: 60px; padding: 8px 14px; border-radius: 14px;
  background: var(--ground); border: 1px solid var(--accent); color: var(--text); text-align: left;
}
.next:active { transform: scale(0.98); }
.next-icon { flex-shrink: 0; padding: 4px; border-radius: 999px; background: var(--paper); }
.next-name { flex: 1; font-size: 15px; font-weight: 700; }
.next-go { color: var(--accent); flex-shrink: 0; }

.cards summary {
  min-height: 44px; display: flex; align-items: center; gap: 4px; cursor: pointer;
  font-size: 15px; font-weight: 700;
}
.cards[open] summary { margin-bottom: 8px; }

.reunion-wrap {
  position: fixed; inset: 0; z-index: 40;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  background: rgba(5, 10, 20, 0.78);
}
.reunion {
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
  padding: 24px 20px; border-radius: 24px;
  background: linear-gradient(160deg, #2b2150, #172840);
  border: 2px solid var(--r-epic);
  animation: pop-in var(--motion-enter) var(--motion-ease);
}
.reunion-title { font-size: 28px; word-break: keep-all; }
.reunion-text { margin: 0; font-size: 15px; line-height: 1.5; word-break: keep-all; }
.reunion-card { width: 140px; }

.faces {
  list-style: none; margin: 0; padding: 2px 0;
  display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
}
.face {
  flex: 0 0 auto; width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; background: var(--surface); border: 1px solid var(--line);
  animation: pop-in var(--motion-enter) var(--motion-ease);
}
.face.now { border-color: var(--accent); }
.face.next-face { color: var(--faint); font-family: var(--font-mono); font-size: 18px; border-style: dashed; }

.toast {
  position: fixed; left: 50%; top: max(16px, env(safe-area-inset-top));
  transform: translateX(-50%);
  max-width: calc(100% - 32px); width: max-content;
  padding: 12px 16px; border-radius: 14px;
  background: var(--accent); color: var(--accent-ink); font-weight: 700; font-size: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); z-index: 30;
}
.toast-enter-active, .toast-leave-active { transition: all var(--motion-enter) var(--motion-ease); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -10px); }
</style>
