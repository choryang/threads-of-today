<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { MATERIALS, PRODUCTS } from '../../../shared/data/materials'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { EVENTS } from '../../../shared/data/journey-extras'
import { buildTimeline, forwardTimeline, isReverseJourney, optionOrder, quizFor, reverseTimeline } from '../../../shared/journey'
import { dayStats, withJosa } from '../../../shared/logic'
import { formatKm, reverseDistances, roundKm } from '../../../shared/distance'
import { journeyMeetLine } from '../../../shared/today'
import { formsAlong, placeLabel, replayFrames, reverseKicker, stopQuestion } from '../../../shared/rewind'
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
/** 내 손에서 원산지로 거슬러 올라가는 여정 ('-r' id). 예전 여정은 예전 순서 그대로 */
const reverse = computed(() => isReverseJourney(journey.value?.id))
const reduced = reducedMotion()

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
/** 거꾸로 가는 여정에서 가게·사무실 사람 칸 (재료가 갈라지기 전, 내 손 가까이) */
const atClosing = computed(() => reverse.value && current.value?.type === 'stage' && !!current.value.closing)
const barSub = computed(() =>
  atClosing.value ? '내 손 가까이' : `재료 ${materialIndex.value + 1}/${journey.value?.materialIds.length ?? 0} · ${material.value?.name ?? ''}`,
)

// ── 되감기 변신: 칸마다 물건의 형태 ──
const forms = computed(() => (journey.value ? formsAlong(timeline.value, journey.value.materialIds, journey.value.id, journey.value.name) : []))
const currentForm = computed(() => forms.value[journey.value?.step ?? 0])
const kicker = computed(() => (reverse.value && journey.value ? reverseKicker(timeline.value, forms.value, journey.value.step) : ''))

// ── 거리 계산기: 내 손에서 거슬러 올라간 거리. 예전 여정은 같은 여정을 뒤집어서 잰다 ──
const distances = computed(() => {
  const j = journey.value
  if (!j) return { at: [] as number[], total: 0 }
  return reverseDistances(reverse.value ? timeline.value : reverseTimeline(j.materialIds, j.id, j.name))
})
const kmSoFar = computed(() => (reverse.value && journey.value ? distances.value.at[journey.value.step] ?? 0 : 0))

// ── 다음 정거장 맞히기: 항구·바다 칸에서 보기 2개. 맞히면 반짝임만, 보상 없음. 저장하지 않는다 ──
const stop = computed(() => (reverse.value && journey.value && current.value?.type === 'stage' ? stopQuestion(timeline.value, journey.value.step, journey.value.id) : null))
const stopPick = ref<number | null>(null)
watch(() => journey.value?.step, () => { stopPick.value = null })

/** 같은 길 칸: 다시 지나는 곳들 */
const passPlaces = computed(() => {
  const t = current.value
  if (t?.type !== 'pass') return ''
  return [...new Set(t.personIds.map((id) => placeLabel(PLACES[PEOPLE[id]!.placeId]!)))].join(' · ')
})
const passPeople = computed(() => (current.value?.type === 'pass' ? current.value.personIds : []))

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
  const step = journey.value.step
  // 거꾸로 가는 여정은 가게·사무실 사람을 빼고, 같은 길 칸의 사람도 경유지로 그린다
  const stops = timeline.value.flatMap((t, i) => {
    if (t.materialId !== mid) return []
    if (t.type === 'stage' && !(reverse.value && t.closing)) return [{ pid: t.personId, i }]
    if (t.type === 'pass') return t.personIds.map((pid) => ({ pid, i }))
    return []
  })
  return stops.map(({ pid, i }) => {
    const place = PLACES[PEOPLE[pid]!.placeId]!
    return { pid, label: place.country || '바다', reached: i <= step, here: i === step && (current.value?.type === 'stage' || current.value?.type === 'pass') }
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
    // 두 번째 여정 선물로 틀려도 받은 보상까지
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
    // 거꾸로 가는 여정은 원산지에서 다시 내 손까지 빨리 감아 본 뒤 끝 장면으로
    if (reverse.value) replaying.value = true
    window.scrollTo({ top: 0 })
    return
  }
  showToast(game.revealNext(j))
  window.scrollTo({ top: 0 })
}

const nextLabel = computed(() => {
  if (isLast.value) return reverse.value ? '이제 다시 내 손까지' : '여정 마치기'
  const after = timeline.value[(journey.value?.step ?? 0) + 1]
  const person = after?.type === 'stage' || after?.type === 'hidden' || after?.type === 'pass'
  if (reverse.value) return person ? '그 전으로' : '다음'
  return person ? '다음 사람 만나기' : '다음'
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
  () => (currentPerson.value ? game.thankedToday(currentPerson.value) : false),
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

// ── 모두의 오늘: 이번 여정 사람들을 오늘 만난 사람 수의 합 (끝 화면 한 줄) ──
const meets = useTodayMeets()
watch(() => journey.value?.done, (done) => { if (done) void meets.load() }, { immediate: true })
const togetherLine = computed(() => journeyMeetLine(metPeople.value.reduce((sum, id) => sum + (meets.countOf(id) ?? 0), 0)))

// ── 끝 장면 ──
const productId = computed(() => PRODUCTS.find((p) => p.name === journey.value?.name)?.id ?? '')
/** 끝 장면은 원산지 → 내 손 순서로 줄을 선다 (거꾸로 간 여정도) */
const forwardPeople = computed(() => {
  const j = journey.value
  if (!j) return []
  return [...new Set(forwardTimeline(j.materialIds, j.id, j.name).flatMap((t) => (t.type === 'stage' || t.type === 'hidden' ? [t.personId] : [])))]
})
const lineup = computed(() => lineupOf(forwardPeople.value))
const totalKm = computed(() => roundKm(distances.value.total))

// ── 빨리 감기 엔딩: 여정을 마친 그 자리에서만 (다시 열면 바로 끝 장면) ──
const replaying = ref(false)
const frames = computed(() => (journey.value ? replayFrames(journey.value.materialIds, journey.value.id, journey.value.name) : []))

/** 추천을 따라 떠나 그 사람을 다시 만났으면, 그 연결 카드를 평소보다 크게 보여 준다 */
const reunionCard = computed(() => {
  const j = journey.value
  return j?.teaser ? linkGained.value.find((id) => linkPersonOf(id) === j.teaser) : undefined
})
const reunionPerson = computed(() => (reunionCard.value ? linkPersonOf(reunionCard.value) ?? '' : ''))
const reunionOpen = ref(true)

/**
 * 다음 여정 추천 한 줄("다음엔 바나나는 어때요?"). 이 여정과 같은 날 떠나야 연결 카드가 나오므로, 오늘 떠난 여정일 때만.
 * 화면에 처음 보일 때의 카드로 한 번 정한다 (예고를 따라 떠나도 이 화면의 예고가 바뀌지 않게).
 */
const teaser = shallowRef<ReturnType<typeof pickTeaser>>(null)
watch(
  () => journey.value?.done,
  (done) => {
    const j = journey.value
    if (!done || !j || teaser.value) return
    if (j.id.slice(0, 10) !== game.todayKey) return
    teaser.value = pickTeaser(j, new Set(Object.keys(game.state.cards)))
  },
  { immediate: true },
)

function followTeaser(p: Product) {
  const t = teaser.value
  if (!t) return
  const next = game.startJourney({ name: p.name, materialIds: [...p.materialIds] }, 'pick', { teaser: t.personId })
  router.push(`/journey/${next.id}`)
}
</script>

<template>
  <main class="page">
    <div v-if="!journey" class="panel">
      <p>여정을 찾을 수 없어요.</p>
      <NuxtLink to="/" class="btn btn-primary">마을로</NuxtLink>
    </div>

    <!-- 되감기 엔딩 -->
    <template v-else-if="journey.done && replaying">
      <RewindReplay :frames="frames" :product-id="productId" :item-name="journey.name" @done="replaying = false" />
    </template>

    <!-- 도착 -->
    <template v-else-if="journey.done">
      <header class="head">
        <h1 class="display title">도착했어요</h1>
      </header>

      <EndScene :people="lineup" :product-id="productId" :item-name="journey.name" />

      <p class="touched">
        이 {{ withJosa(journey.name, '은', '는') }}
        <template v-if="totalKm">약 <strong class="mono">{{ formatKm(distances.total) }}</strong>km, </template>
        <strong class="mono">{{ metPeople.length }}</strong>명의 손을 거쳐 왔어요
      </p>
      <p class="muted small">{{ summary.countries.length }}개 나라를 지나왔어요</p>
      <p v-if="togetherLine" class="together-line">{{ togetherLine }}</p>
      <p v-if="voice" class="voice">“{{ voice }}”</p>

      <section v-if="linkGained.length && !reunionCard" class="link-banner">
        <p class="kicker gold">다시 만났어요</p>
        <p class="lb-title">여정이 서로 겹쳤어요!</p>
        <p v-for="id in linkGained" :key="id" class="lb-met">{{ metAgain(id) }}</p>
        <p class="small">오늘 지나온 재료들이 같은 사람을 거쳐 왔어요. 두 물건을 모두 거쳐 온 분이에요.</p>
        <div class="grid">
          <MiniCard v-for="id in linkGained" :key="id" :person-id="id" is-new />
        </div>
      </section>

      <details class="cards">
        <summary>만난 사람 카드 <span class="mono">{{ metPeople.length + quizRewards.length }}</span>장 보기</summary>
        <div class="grid">
          <MiniCard v-for="id in metPeople" :key="id" :person-id="id" :is-new="journey.newCards.includes(id)" />
          <MiniCard v-for="id in quizRewards" :key="`q-${id}`" :person-id="id" :is-new="journey.newCards.includes(id)" />
        </div>
      </details>

      <!-- 큰 버튼은 하나: 마을로 모시기(이번에 만난 사람들이 자리로 걸어온다). 다음 여정 추천·다른 물건은 작은 글자 버튼 -->
      <div class="actions">
        <NuxtLink :to="{ path: '/', query: { arrive: journey.id } }" class="btn btn-primary btn-block">마을로 모시기</NuxtLink>
        <button v-if="teaser?.products[0]" class="text-btn next-line" @click="followTeaser(teaser.products[0])">
          다음엔 {{ withJosa(teaser.products[0].name, '은', '는') }} 어때요?
        </button>
        <NuxtLink to="/add" class="text-btn">다른 물건 고르기</NuxtLink>
      </div>

      <!-- 추천을 따라와 다시 만난 사람: 평소 연결 카드보다 크게 -->
      <div v-if="reunionCard && reunionOpen" class="reunion-wrap" role="dialog" aria-modal="true" aria-labelledby="reunion-title">
        <div class="reunion">
          <p class="kicker gold">다시 만났어요</p>
          <Character :person-id="reunionPerson" :size="132" wave />
          <p id="reunion-title" class="reunion-title display">{{ metAgain(reunionCard) }}</p>
          <p class="reunion-text">{{ withJosa(jobOf(reunionPerson), '이', '가') }} 두 물건을 모두 날랐어요. 두 물건을 모두 거쳐 온 분이에요.</p>
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
        <NuxtLink to="/" class="icon-btn" aria-label="마을로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </NuxtLink>
        <div class="bar-title">
          <span class="name">{{ journey.name }}</span>
          <span class="mono muted small">{{ barSub }}</span>
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

      <div v-if="reverse && currentForm" class="rewind">
        <FormBadge :form="currentForm" :product-id="productId" label="지금 모습" />
        <p v-if="roundKm(kmSoFar)" class="km">벌써 약 <strong class="mono">{{ formatKm(kmSoFar) }}</strong>km를 거슬러 왔어요</p>
      </div>

      <ol v-if="!atClosing" class="route" aria-label="경유지">
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
          <p v-if="kicker" class="kicker-q">{{ kicker }}</p>
          <!-- 건네기: 지금 사람이 앞사람에게서 물건을 받아 든다 -->
          <span v-if="reverse && currentForm && (currentForm.icon || currentForm.product) && !reduced" class="handover" aria-hidden="true">
            <img v-if="currentForm.icon" :src="`/forms/${currentForm.icon}.svg`" alt="" width="40" height="40">
            <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
            <svg v-else viewBox="0 0 32 32" width="40" height="40" v-html="productIconSvg(productId)" />
          </span>
          <MeetAgain :key="`again-${journey.step}`" :person-id="current.personId" :journey-id="journey.id" :journey-name="journey.name" />
          <PersonCard :person-id="current.personId" :is-new="journey.newCards.includes(current.personId)" />
          <div v-if="stop" class="stop panel">
            <p class="stop-q">이 전엔 어디 있었을까요?</p>
            <div class="stop-options">
              <button
                v-for="(opt, i) in stop.options"
                :key="opt"
                class="opt"
                :class="{ right: stopPick !== null && i === stop.answer, wrong: stopPick === i && i !== stop.answer, sparkle: stopPick === i && i === stop.answer }"
                :disabled="stopPick !== null"
                @click="stopPick = i"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </section>

        <section v-else-if="current.type === 'pass'" class="pass panel">
          <p v-if="kicker" class="kicker-q">{{ kicker }}</p>
          <span class="chip pass-chip">같은 길</span>
          <p class="pass-title">같은 길을 지났어요</p>
          <p class="small muted">{{ passPlaces }}에서 앞 재료와 같은 사람들을 다시 지나요</p>
          <div class="pass-faces">
            <Character v-for="pid in passPeople" :key="pid" :person-id="pid" :size="56" />
          </div>
        </section>

        <section v-else-if="current.type === 'hidden'" class="stage hidden-meet">
          <p class="kicker gold">숨은 만남</p>
          <MeetAgain :key="`again-${journey.step}`" :person-id="current.personId" :journey-id="journey.id" :journey-name="journey.name" />
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
          <p class="kicker gold">퀴즈 · 맞히면 드문 분을 만나요</p>
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
            <p v-if="quizChoice !== quiz.answer && journey.newCards.includes(quiz.rewardId)" class="small gold">그래도 두 번째 여정 선물로 이 사람을 만나게 해 드릴게요.</p>
            <div v-if="quizChoice === quiz.answer || journey.newCards.includes(quiz.rewardId)" class="reward">
              <p class="small gold">아주 드물게 만나는 분이에요</p>
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
.kicker { margin: 0; font-size: 12px; font-weight: 700; }
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

.stage { position: relative; animation: pop-in var(--motion-enter) var(--motion-ease); }
.kicker-q { margin: 0 0 8px; font-family: var(--font-display); font-size: 20px; line-height: 1.35; word-break: keep-all; }

.rewind { display: flex; flex-direction: column; gap: 6px; }
.km { margin: 0; font-size: 13px; color: var(--muted); }
.km strong { color: var(--accent); font-weight: 500; }

/* 건네기: 왼쪽(앞사람 쪽)에서 물건이 날아와 지금 사람 손에 들린다 */
.handover {
  position: absolute; z-index: 2; right: 18%; top: 120px;
  display: flex; padding: 4px; border-radius: 999px; background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  animation: hand-over var(--motion-hand) var(--motion-ease) both;
}
@keyframes hand-over {
  from { transform: translateX(-140px) scale(0.7); opacity: 0; }
  to { transform: translateX(0) scale(1); opacity: 1; }
}

.pass { display: flex; flex-direction: column; gap: 8px; animation: rise var(--motion-enter) var(--motion-ease); }
.pass .kicker-q { margin: 0; }
.pass-chip { align-self: flex-start; color: var(--accent); }
.pass-title { margin: 0; font-size: 18px; font-weight: 700; }
.pass-faces { display: flex; flex-wrap: wrap; gap: 4px; }

.stop { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.stop-q { margin: 0; font-size: 16px; font-weight: 700; }
.stop-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.stop-options .opt { justify-content: center; text-align: center; padding: 8px 10px; line-height: 1.35; word-break: keep-all; }
.opt.sparkle { animation: sparkle var(--motion-enter) var(--motion-ease); }
@keyframes sparkle {
  0% { box-shadow: 0 0 0 0 rgba(242, 193, 78, 0.8); }
  100% { box-shadow: 0 0 0 12px rgba(242, 193, 78, 0); }
}

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
.reward { display: flex; flex-direction: column; gap: 6px; }
.reward p { margin: 0; }
.reward > :last-child { width: 120px; }
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

.together-line { margin: 0; font-size: 14px; font-weight: 700; color: var(--accent); word-break: keep-all; }
.touched { margin: 0; font-size: 17px; line-height: 1.5; word-break: keep-all; }
.touched strong { color: var(--accent); font-size: 22px; font-weight: 500; }

.text-btn {
  align-self: center; min-height: 44px; padding: 0 12px; border: 0; background: none; color: var(--text);
  display: inline-flex; align-items: center; justify-content: center;
  font: inherit; font-size: 15px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
}
.next-line { color: var(--accent); }

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
