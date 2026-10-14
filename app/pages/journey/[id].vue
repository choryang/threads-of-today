<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { MATERIALS } from '../../../shared/data/materials'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { EVENTS } from '../../../shared/data/journey-extras'
import { quizFor } from '../../../shared/journey'
import { dayStats } from '../../../shared/logic'
import { buildTimeline } from '../../composables/useGame'
import { renderVoice } from '../../../shared/voice'

const route = useRoute()
const game = useGame()
const journey = computed(() => game.findJourney(String(route.params.id)))
const timeline = computed(() => (journey.value ? buildTimeline(journey.value.materialIds, journey.value.id) : []))
const current = computed(() => (journey.value ? timeline.value[journey.value.step] : undefined))
const voice = computed(() => renderVoice(journey.value?.voice, game.nickname.value))
const isLast = computed(() => !!journey.value && journey.value.step >= timeline.value.length - 1)

/** 방금 얻은 카드 알림 */
const toast = shallowRef<string[]>([])
const linkGained = ref<string[]>([])

function jobNames(ids: string[]) {
  return ids.map((id) => PEOPLE[id]?.job).join(', ')
}

const materialIndex = computed(() => {
  const mid = current.value?.materialId
  return mid ? journey.value!.materialIds.indexOf(mid) : -1
})
const material = computed(() => (current.value ? MATERIALS[current.value.materialId] : undefined))

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

/** 이번 여정에서 나온 퀴즈 (재료마다 여러 개 중 하나) */
const quiz = computed(() =>
  journey.value && current.value?.type === 'quiz' ? quizFor(journey.value.materialIds, journey.value.id, current.value.materialId) : undefined,
)
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
    return q && j.quiz[mid] === q.answer ? [q.rewardId] : []
  })
})

const nextLabel = computed(() => {
  if (isLast.value) return '여정 마치기'
  const after = timeline.value[(journey.value?.step ?? 0) + 1]
  if (current.value?.type === 'quiz') return '다음 재료로 →'
  if (after?.type === 'stage' || after?.type === 'hidden') return '다음 사람 만나기 →'
  return '계속 가기 →'
})

const quizChoice = computed(() => {
  if (!journey.value || current.value?.type !== 'quiz') return undefined
  return journey.value.quiz[current.value.materialId]
})

function showToast(ids: string[]) {
  if (!ids.length) return
  toast.value = ids
  setTimeout(() => {
    if (toast.value === ids) toast.value = []
  }, 2600)
}

function next() {
  if (!journey.value) return
  if (isLast.value) {
    linkGained.value = game.finishJourney(journey.value)
    window.scrollTo({ top: 0 })
    return
  }
  showToast(game.revealNext(journey.value))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function answer(i: number) {
  if (!journey.value || current.value?.type !== 'quiz') return
  const { gained } = game.answerQuiz(journey.value, current.value.materialId, i)
  showToast(gained)
}

const summary = computed(() => (journey.value ? dayStats([journey.value]) : { people: [], countries: [] }))
const metPeople = computed(() => summary.value.people)
</script>

<template>
  <main class="page">
    <div v-if="!journey" class="panel">
      <p>여정을 찾을 수 없어요.</p>
      <NuxtLink to="/" class="btn btn-primary">처음으로</NuxtLink>
    </div>

    <!-- 여정 완료 -->
    <template v-else-if="journey.done">
      <header class="head">
        <p class="mono muted kicker">JOURNEY COMPLETE</p>
        <h1 class="display title">{{ journey.name }}에<br>닿은 사람들</h1>
        <p v-if="voice" class="voice">“{{ voice }}”</p>
        <p class="big">
          <strong class="mono">{{ summary.countries.length }}</strong>개 나라,
          <strong class="mono">{{ metPeople.length }}</strong>명의 사람
        </p>
        <p class="muted small">{{ summary.countries.join(' · ') }}</p>
      </header>

      <section v-if="linkGained.length" class="link-banner">
        <p class="mono kicker gold">CONNECTION FOUND</p>
        <p class="lb-title">여정이 서로 겹쳤어요!</p>
        <p class="small">오늘 지나온 재료들이 같은 사람을 거쳐 왔어요. 에픽 카드를 얻었어요.</p>
        <div class="grid">
          <MiniCard v-for="id in linkGained" :key="id" :person-id="id" is-new />
        </div>
      </section>

      <section>
        <h2 class="h2">이번 여정에서 만난 사람</h2>
        <div class="grid">
          <MiniCard v-for="id in metPeople" :key="id" :person-id="id" :is-new="journey.newCards.includes(id)" />
          <MiniCard v-for="id in quizRewards" :key="`q-${id}`" :person-id="id" :is-new="journey.newCards.includes(id)" />
        </div>
      </section>

      <div class="actions">
        <NuxtLink to="/" class="btn btn-primary btn-block">다른 물건 고르기</NuxtLink>
        <NuxtLink to="/result" class="btn btn-block">오늘의 결과 카드</NuxtLink>
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
        <span :style="{ width: `${((journey.step + 1) / timeline.length) * 100}%` }" />
      </div>

      <ol class="route" aria-label="경유지">
        <li v-for="(stop, i) in routeStops" :key="stop.pid + i" :class="{ reached: stop.reached, here: stop.here }">
          <span class="dot" />
          <span class="label">{{ stop.reached ? stop.label : '?' }}</span>
        </li>
      </ol>

      <section v-if="current.type === 'stage'" :key="journey.step" class="stage">
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
          <button
            v-for="(opt, i) in quiz.options"
            :key="opt"
            class="opt"
            :class="{
              right: quizChoice !== undefined && i === quiz.answer,
              wrong: quizChoice === i && i !== quiz.answer,
            }"
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
          <div v-if="quizChoice === quiz.answer" class="reward">
            <MiniCard :person-id="quiz.rewardId" :is-new="journey.newCards.includes(quiz.rewardId)" />
          </div>
        </div>
      </section>

      <button
        class="btn btn-primary btn-block next"
        :disabled="current.type === 'quiz' && quizChoice === undefined"
        @click="next"
      >
        {{ nextLabel }}
      </button>
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
.big { margin: 4px 0 0; font-size: 18px; }
.big strong { color: var(--accent); font-size: 26px; font-weight: 500; }
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

.bar { display: flex; align-items: center; gap: 12px; }
.icon-btn {
  width: 44px; height: 44px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; background: var(--surface); border: 1px solid var(--line); color: var(--text);
}
.bar-title { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.progress { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--accent); transition: width 0.3s ease; }

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
.opt:disabled { cursor: default; }
.opt.right { background: #1e3a2e; border: 2px solid var(--ok); }
.opt.wrong { background: #3a1f22; border: 2px solid var(--bad); }
.mark { font-size: 12px; }
.explain { display: flex; flex-direction: column; gap: 10px; font-size: 14px; line-height: 1.55; animation: rise 0.25s ease-out; }
.explain p { margin: 0; }
.reward { width: 120px; }

.next { position: sticky; bottom: calc(84px + env(safe-area-inset-bottom)); z-index: 5; }

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
