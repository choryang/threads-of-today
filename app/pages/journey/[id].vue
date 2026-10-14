<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { MATERIALS, PRODUCTS } from '../../../shared/data/materials'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { EVENTS } from '../../../shared/data/journey-extras'
import { quizFor } from '../../../shared/journey'
import { dayStats, withJosa } from '../../../shared/logic'
import { lineupOf, linkPersonOf, pickTeaser } from '../../../shared/next'
import type { Product } from '../../../shared/types'
import { journeySchedule, remainingMs } from '../../../shared/timing'
import { renderVoice } from '../../../shared/voice'
import { remainingLabel } from '../../utils/labels'
import { productIconSvg } from '../../utils/product-icon'

const route = useRoute()
const router = useRouter()
const game = useGame()
const journey = computed(() => game.findJourney(String(route.params.id)))
const timeline = computed(() => (journey.value ? journeySchedule(journey.value).timeline : []))
const current = computed(() => (journey.value ? timeline.value[journey.value.step] : undefined))
const voice = computed(() => renderVoice(journey.value?.voice, game.nickname.value))
const clock = computed(() => (journey.value ? game.clockOf(journey.value, game.now.value) : undefined))
const dayLabel = computed(() => `D+${Math.floor(clock.value?.day ?? 0)}`)
const timeLeft = computed(() => (clock.value ? remainingLabel(remainingMs(clock.value, game.speed.value)) : ''))

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

const progressPct = computed(() => (clock.value && clock.value.total ? (clock.value.day / clock.value.total) * 100 : 0))

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

/** 지금 칸이 답을 기다리는 퀴즈 */
const quiz = computed(() =>
  journey.value && current.value?.type === 'quiz' && clock.value?.waitingQuiz
    ? quizFor(journey.value.materialIds, journey.value.id, current.value.materialId)
    : undefined,
)
const eventText = computed(() => {
  const item = current.value
  return item?.type === 'event' ? EVENTS.find((e) => e.id === item.eventId)?.text : ''
})

/** 방금 답한 퀴즈. 시간은 바로 다시 흐르고, 결과는 닫을 때까지 장면 위에 남긴다 */
const answered = ref<{ materialId: string; choice: number } | null>(null)
const answeredQuiz = computed(() =>
  journey.value && answered.value ? quizFor(journey.value.materialIds, journey.value.id, answered.value.materialId) : undefined,
)

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
  }, 2600)
}

function answer(i: number) {
  if (!journey.value || current.value?.type !== 'quiz') return
  const materialId = current.value.materialId
  const { gained } = game.answerQuiz(journey.value, materialId, i)
  answered.value = { materialId, choice: i }
  game.advanceJourney(journey.value)
  showToast(gained)
}

/** "자리를 비운 사이" 요약. 화면에 들어올 때 한 번 정한다 */
const away = ref<{ days: number; people: string[] } | null>(null)

onMounted(() => {
  const j = journey.value
  if (!j) return
  game.advanceJourney(j)
  const summary = game.awaySummary(j)
  if (summary && (summary.people.length || summary.days >= 1)) away.value = summary
  game.markSeen(j)
})

// 화면을 켜 둔 동안: 본 칸을 기록하고, 새로 얻은 카드를 알린다
watch(() => [journey.value?.step, Math.floor(clock.value?.day ?? 0)], () => {
  if (journey.value) game.markSeen(journey.value)
})
watch(() => journey.value?.newCards.length ?? 0, (n, old) => {
  if (journey.value && n > old && !away.value) showToast(journey.value.newCards.slice(old))
})

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

    <!-- 자리를 비운 사이 -->
    <section v-else-if="away" class="away panel" aria-live="polite">
      <p class="mono kicker gold">WHILE YOU WERE AWAY</p>
      <p class="away-title">
        <template v-if="away.days >= 1">자리를 비운 사이 <span class="mono">{{ away.days }}</span>일이 흘렀어요.</template>
        <template v-else>자리를 비운 사이 여정이 조금 나아갔어요.</template>
        <template v-if="away.people.length"><br>새로 <span class="mono">{{ away.people.length }}</span>명을 만났어요.</template>
      </p>
      <div v-if="away.people.length" class="away-faces">
        <div v-for="(pid, i) in away.people" :key="pid + i" class="away-face" :style="{ animationDelay: `${i * 0.08}s` }">
          <Character :person-id="pid" :size="56" />
          <span class="small">{{ jobOf(pid) }}</span>
        </div>
      </div>
      <p v-if="journey.done" class="small gold">그리고 여정이 끝나 물건이 도착했어요.</p>
      <p v-else-if="clock?.waitingQuiz" class="small gold">퀴즈가 기다리고 있어요.</p>
      <button class="btn btn-primary btn-block" @click="away = null">{{ journey.done ? '도착한 모습 보기' : '여정 이어 보기' }}</button>
    </section>

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
        <SpeedToggle />
      </header>

      <div class="clock">
        <span class="mono day">{{ dayLabel }}</span>
        <span class="muted small">{{ clock?.waitingQuiz ? '퀴즈에 답하면 다시 시간이 흘러요' : timeLeft }}</span>
      </div>

      <div class="progress" aria-hidden="true">
        <span :style="{ width: `${progressPct}%` }" />
      </div>

      <ol ref="facesEl" class="faces" aria-label="지금까지 만난 사람">
        <li v-for="(pid, i) in metFaces" :key="pid + i" class="face" :class="{ now: i === metFaces.length - 1 }">
          <Character :person-id="pid" :size="36" />
          <span class="sr-only">{{ jobOf(pid) }}</span>
        </li>
        <li v-if="hasNext" class="face next" aria-label="다음 사람">?</li>
      </ol>

      <ol class="route" aria-label="경유지">
        <li v-for="(stop, i) in routeStops" :key="stop.pid + i" :class="{ reached: stop.reached, here: stop.here }">
          <span class="dot" />
          <span class="label">{{ stop.reached ? stop.label : '?' }}</span>
        </li>
      </ol>

      <section v-if="answeredQuiz && answered" class="quiz-result panel">
        <p class="mono kicker gold">{{ answered.choice === answeredQuiz.answer ? '정답이에요' : '아쉬워요' }}</p>
        <p class="small">정답: {{ answeredQuiz.options[answeredQuiz.answer] }}</p>
        <p class="explain-text">{{ answeredQuiz.explain }}</p>
        <p v-if="answered.choice !== answeredQuiz.answer && journey.newCards.includes(answeredQuiz.rewardId)" class="small gold">그래도 첫 여정 선물로 이 사람을 만나게 해 드릴게요.</p>
        <div v-if="answered.choice === answeredQuiz.answer || journey.newCards.includes(answeredQuiz.rewardId)" class="reward">
          <MiniCard :person-id="answeredQuiz.rewardId" :is-new="journey.newCards.includes(answeredQuiz.rewardId)" />
        </div>
        <button class="btn btn-block" @click="answered = null">확인</button>
      </section>

      <Transition name="scene" mode="out-in">
        <section v-if="current.type === 'stage'" :key="`s${journey.step}`" class="stage">
          <PersonCard :person-id="current.personId" :is-new="journey.newCards.includes(current.personId)" />
        </section>

        <section v-else-if="current.type === 'hidden'" :key="`h${journey.step}`" class="stage hidden-meet">
          <p class="mono kicker gold">숨은 만남</p>
          <PersonCard :person-id="current.personId" :is-new="journey.newCards.includes(current.personId)" />
        </section>

        <section v-else-if="current.type === 'event'" :key="`e${journey.step}`" class="story panel">
          <span class="chip story-chip">이야기</span>
          <p class="story-text">{{ eventText }}</p>
        </section>

        <section v-else-if="quiz" :key="`q${journey.step}`" class="quiz panel">
          <p class="mono kicker gold">QUIZ · 맞히면 레어 카드</p>
          <p class="q">{{ quiz.q }}</p>
          <div class="options">
            <button v-for="(opt, i) in quiz.options" :key="opt" class="opt" @click="answer(i)">
              <span>{{ opt }}</span>
            </button>
          </div>
        </section>
      </Transition>
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
  animation: pop-in 0.5s ease-out;
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
.progress span { display: block; height: 100%; background: var(--accent); transition: width 1s linear; }

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

.stage { animation: pop-in 0.4s ease-out; }

.story { display: flex; flex-direction: column; gap: 10px; animation: rise 0.25s ease-out; }
.story-chip { align-self: flex-start; color: var(--accent); }
.story-text { margin: 0; font-size: 17px; line-height: 1.6; }
.hidden-meet { display: flex; flex-direction: column; gap: 6px; }
.hidden-meet .kicker { margin: 0; }
.quiz { display: flex; flex-direction: column; gap: 12px; animation: rise 0.25s ease-out; }
.q { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.45; }
.options { display: flex; flex-direction: column; gap: 8px; }
.opt {
  display: flex; justify-content: space-between; align-items: center;
  min-height: 52px; padding: 0 16px; border-radius: 14px;
  background: var(--ground); border: 1px solid var(--line); font-size: 15px; text-align: left;
}
.reward { width: 120px; }

.touched { margin: 0; font-size: 17px; line-height: 1.5; word-break: keep-all; }
.touched strong { color: var(--accent); font-size: 22px; font-weight: 500; }

.teaser {
  display: flex; flex-direction: column; gap: 10px;
  padding: 16px; border-radius: 18px; background: var(--surface); border: 1px solid var(--line);
  animation: rise 0.4s ease-out 0.9s both;
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
  animation: pop-in 0.5s ease-out;
}
.reunion-title { font-size: 28px; word-break: keep-all; }
.reunion-text { margin: 0; font-size: 15px; line-height: 1.5; word-break: keep-all; }
.reunion-card { width: 140px; }

.clock { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: -10px; }
.day { font-size: 24px; color: var(--accent); }

.faces {
  list-style: none; margin: 0; padding: 2px 0;
  display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
}
.face {
  flex: 0 0 auto; width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; background: var(--surface); border: 1px solid var(--line);
  animation: pop-in 0.4s ease-out;
}
.face.now { border-color: var(--accent); }
.face.next { color: var(--faint); font-family: var(--font-mono); font-size: 18px; border-style: dashed; }

.away { display: flex; flex-direction: column; gap: 12px; animation: rise 0.3s ease-out; }
.away-title { margin: 0; font-size: 19px; line-height: 1.5; font-weight: 700; }
.away-faces { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.away-face {
  display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center;
  animation: pop-in 0.4s ease-out both;
}
.away-face .small { font-size: 12px; line-height: 1.3; word-break: keep-all; }

.quiz-result { display: flex; flex-direction: column; gap: 8px; animation: rise 0.25s ease-out; }
.explain-text { margin: 0; font-size: 14px; line-height: 1.55; }

.scene-enter-active { transition: opacity 0.6s ease, transform 0.6s ease; }
.scene-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.scene-enter-from { opacity: 0; transform: translateX(24px); }
.scene-leave-to { opacity: 0; transform: translateX(-24px); }

.toast {
  position: fixed; left: 50%; top: max(16px, env(safe-area-inset-top));
  transform: translateX(-50%);
  max-width: calc(100% - 32px); width: max-content;
  padding: 12px 16px; border-radius: 14px;
  background: var(--accent); color: var(--accent-ink); font-weight: 700; font-size: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); z-index: 30;
}
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -10px); }
</style>
