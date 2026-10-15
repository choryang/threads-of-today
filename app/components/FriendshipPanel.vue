<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UNLOCK, factOf, friendshipParts, nextUnlockHint, quizOf } from '../../shared/friendship'
import { optionOrder } from '../../shared/journey'

/**
 * 친해진 정도: 큰 퍼센트, 진행 막대(50%·75% 눈금), 무엇으로 채웠는지, 그리고 열린 것들.
 * 25% 이름·하는 일(카드 머리에서) / 50% 일하는 사실 / 75% 퀴즈·만난 물건 목록 / 100% 마을의 일터
 */
const props = defineProps<{ personId: string }>()
const game = useGame()

const f = computed(() => game.friendship(props.personId))
const parts = computed(() => friendshipParts(f.value))
const log = computed(() => game.state.people?.[props.personId])
const fact = computed(() => (f.value.percent >= UNLOCK.fact ? factOf(props.personId) : undefined))
const quiz = computed(() => (f.value.percent >= UNLOCK.quiz ? quizOf(props.personId) : undefined))
const items = computed(() => (f.value.percent >= UNLOCK.items ? log.value?.metNames ?? [] : []))
const hint = computed(() => nextUnlockHint(props.personId, f.value.percent))
/** 100%: 단짝 (막대를 금색으로 채운다) */
const best = computed(() => f.value.percent >= UNLOCK.workplace)

/** 보기 순서는 사람 id 시드로 섞는다(데이터는 작은 수부터) */
const quizOptions = computed(() => {
  const q = quiz.value
  return q ? optionOrder(`friend:${props.personId}`, q.materialId, q.options.length).map((i) => ({ i, opt: q.options[i]! })) : []
})
const wrong = ref<number | null>(null)
const showSource = ref(false)
watch(() => props.personId, () => { wrong.value = null; showSource.value = false })

function pick(i: number) {
  wrong.value = game.answerFriendQuiz(props.personId, i) ? null : i
}
</script>

<template>
  <section class="friend" aria-label="친해진 정도">
    <div class="head">
      <span class="label">친해진 정도</span>
      <span class="pct-wrap"><span class="pct display">{{ f.percent }}%</span><span v-if="best" class="best">단짝</span></span>
    </div>
    <div class="bar" role="progressbar" :aria-valuenow="f.percent" aria-valuemin="0" aria-valuemax="100" aria-label="친해진 정도">
      <span class="fill" :class="{ gold: best }" :style="{ width: `${f.percent}%` }" />
      <span class="tick" style="left: 50%" />
      <span class="tick" style="left: 75%" />
    </div>
    <p v-if="parts.length" class="parts">{{ parts.join(' · ') }}</p>

    <div v-if="items.length" class="items" aria-label="만난 물건">
      <span v-for="name in items" :key="name" class="item">{{ name }}</span>
    </div>

    <div v-if="fact" class="box">
      <span class="kicker">50%에서 열렸어요 · 일하는 사실</span>
      <p class="fact">{{ fact.fact }}</p>
      <button class="link" :aria-expanded="showSource" @click="showSource = !showSource">출처 {{ showSource ? '접기' : '보기' }}</button>
      <p v-if="showSource" class="source">
        {{ fact.source.name }} ({{ fact.source.year }})
        <a :href="fact.source.url" target="_blank" rel="noopener noreferrer">자료 보기</a>
      </p>
    </div>

    <div v-if="quiz" class="box">
      <span class="kicker">75%에서 열렸어요 · 퀴즈</span>
      <p class="q">{{ quiz.q }}</p>
      <template v-if="!log?.quizCorrect">
        <div class="options">
          <button
            v-for="{ i, opt } in quizOptions"
            :key="opt"
            class="opt"
            :class="{ wrong: wrong === i }"
            @click="pick(i)"
          >
            {{ opt }}
          </button>
        </div>
        <p v-if="wrong !== null" class="retry" role="status">아니에요. 다시 골라 보세요</p>
      </template>
      <template v-else>
        <p class="right" role="status">맞혔어요 · 퀴즈 10%</p>
        <p class="explain">{{ quiz.explain }}</p>
      </template>
    </div>

    <p v-if="f.percent >= UNLOCK.workplace" class="done">마을에 이 분의 일터가 생겼어요</p>
    <div v-else-if="hint" class="lock">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
      <span>{{ hint }}</span>
    </div>
  </section>
</template>

<style scoped>
.friend { display: flex; flex-direction: column; gap: 10px; color: var(--ink); }
.head { display: flex; justify-content: space-between; align-items: baseline; }
.label { font-size: 14px; font-weight: 700; }
.pct-wrap { display: flex; align-items: baseline; gap: 8px; }
.pct { font-size: 32px; line-height: 1; }
.best { padding: 2px 10px; border-radius: 12px; border: 2px solid #2a2a35; background: #f2c14e; color: #1a1a22; font-size: 13px; font-weight: 700; }
.bar { position: relative; height: 12px; border-radius: 6px; background: #ddd8ca; }
.fill { display: block; height: 100%; border-radius: 6px; background: var(--accent); transition: width var(--motion-friend) var(--motion-ease); }
.fill.gold { background: #f2c14e; box-shadow: inset 0 0 0 2px #2a2a35; }
.tick { position: absolute; top: -3px; width: 3px; height: 18px; margin-left: -1px; background: var(--paper); }
.parts { margin: 0; font-size: 12px; color: #4a4a55; line-height: 1.5; }
.items { display: flex; flex-wrap: wrap; gap: 6px; }
.item { font-size: 12px; padding: 4px 10px; border-radius: 12px; background: #fff; border: 1px solid #ddd8ca; }
.box { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; border-radius: 16px; background: #fff; }
.kicker { font-size: 12px; font-weight: 700; color: #4e7a3e; }
.fact, .q { margin: 0; font-size: 15px; line-height: 1.6; font-weight: 700; word-break: keep-all; }
.link { align-self: flex-start; min-height: 44px; padding: 0 2px; border: 0; background: none; color: #6b4e00; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.source { margin: 0; font-size: 12px; color: #4a4a4a; line-height: 1.5; word-break: keep-all; }
.source a { display: inline-flex; align-items: center; min-height: 44px; color: #6b4e00; font-weight: 700; }
.options { display: flex; flex-direction: column; gap: 6px; }
.opt {
  min-height: 48px; padding: 0 14px; border-radius: 12px; text-align: left;
  border: 1px solid #ddd8ca; background: var(--paper); color: var(--ink); font: inherit; font-size: 15px; cursor: pointer;
}
.opt.wrong { border: 2px solid var(--bad); }
.retry { margin: 0; font-size: 13px; color: var(--bad); }
.right { margin: 0; font-size: 14px; font-weight: 700; color: #2f7a4e; }
.explain { margin: 0; font-size: 13px; line-height: 1.55; color: #4a4a4a; }
.done { margin: 0; padding: 12px 16px; border-radius: 16px; background: #fff3cf; font-size: 14px; font-weight: 700; }
.lock { display: flex; gap: 12px; align-items: center; padding: 14px 16px; border: 2px dashed #c9c4b5; border-radius: 16px; font-size: 14px; color: #4a4a55; line-height: 1.5; }
.lock svg { flex-shrink: 0; color: #6a6a75; }
</style>
