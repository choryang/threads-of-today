<script setup lang="ts">
import { computed, ref } from 'vue'
import { mysteryOptions } from '../../shared/logic'
import { MOTION } from '../utils/motion'

const game = useGame()
const router = useRouter()
const options = mysteryOptions(game.todayKey)
const log = game.mystery
const answer = game.mysteryAnswer
const hints = game.mysteryHintList
const copied = ref(false)

const shownHints = computed(() => hints.slice(0, log.value.revealed))

function guess(id: string) {
  game.guessMystery(id)
}

function bonus() {
  const existing = game.mysteryJourney.value
  if (existing) return router.push(`/journey/${existing.id}`)
  const j = game.startJourney({ name: answer.name, materialIds: [...answer.materialIds] }, 'mystery')
  if (j) router.push(`/journey/${j.id}`)
}

const shareText = computed(() => {
  const squares = hints.map((_, i) => {
    if (i >= log.value.guesses.length) return '□'
    return log.value.solved && i === log.value.guesses.length - 1 ? '■' : '×'
  }).join('')
  const [, m, d] = game.todayKey.split('-')
  const result = log.value.solved ? `${log.value.guesses.length}번 만에 맞힘` : '못 맞힘'
  return `내 하루에 닿은 사람들 · 미스터리 ${Number(m)}/${Number(d)}\n${squares} ${result}\n${location.origin}`
})

async function share() {
  try {
    if (navigator.share) {
      await navigator.share({ text: shareText.value })
      return
    }
    await navigator.clipboard.writeText(shareText.value)
    copied.value = true
    setTimeout(() => (copied.value = false), MOTION.noticeMs)
  } catch {
    // 사용자가 공유를 취소한 경우
  }
}
</script>

<template>
  <main class="page">
    <header class="head">
      <p class="mono muted kicker">TODAY'S MYSTERY</p>
      <h1 class="display title">오늘의 미스터리 물건</h1>
      <p class="muted small">힌트가 하나씩 열려요. 적은 힌트로 맞힐수록 좋아요. 맞히면 보너스 여정이 열려요.</p>
    </header>

    <ol class="hints">
      <li v-for="(h, i) in shownHints" :key="i" class="hint panel">
        <span class="mono n">HINT {{ i + 1 }}</span>
        <span>{{ h }}</span>
      </li>
      <li v-for="i in hints.length - shownHints.length" :key="`locked${i}`" class="hint locked">
        <span class="mono n">HINT {{ shownHints.length + i }}</span>
        <span>틀리면 열려요</span>
      </li>
    </ol>

    <section v-if="!log.finished" aria-label="보기">
      <h2 class="h2">이 물건은 무엇일까요?</h2>
      <div class="opts">
        <button
          v-for="o in options"
          :key="o.id"
          class="opt"
          :class="{ wrong: log.guesses.includes(o.id) }"
          :disabled="log.guesses.includes(o.id)"
          @click="guess(o.id)"
        >
          {{ o.name }}
        </button>
      </div>
    </section>

    <section v-else class="result panel" :class="{ solved: log.solved }">
      <p class="mono kicker" :class="log.solved ? 'ok' : 'bad'">{{ log.solved ? 'SOLVED' : 'TRY AGAIN TOMORROW' }}</p>
      <p class="r-title">정답은 <strong>{{ answer.name }}</strong></p>
      <p class="muted small">{{ log.solved ? `${log.guesses.length}번 만에 맞혔어요!` : '내일 새로운 미스터리가 열려요.' }}</p>
      <button v-if="log.solved" class="btn btn-primary btn-block" @click="bonus">
        {{ game.mysteryJourney.value ? '보너스 여정 이어 가기' : '보너스 여정 떠나기 →' }}
      </button>
      <button class="btn btn-block" @click="share">{{ copied ? '복사했어요' : '결과 공유하기' }}</button>
    </section>
  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 8px; }
.kicker { margin: 0; font-size: 11px; letter-spacing: 1.5px; }
.title { font-size: 30px; }
.small { margin: 0; font-size: 13px; line-height: 1.55; }
.h2 { margin: 0 0 10px; font-size: 15px; }

.hints { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.hint { display: flex; flex-direction: column; gap: 4px; font-size: 15px; line-height: 1.5; animation: rise var(--motion-enter) var(--motion-ease); }
.hint .n { font-size: 11px; color: var(--accent); }
.hint.locked { padding: 14px 16px; border-radius: 18px; border: 1px dashed var(--line); color: var(--faint); font-size: 14px; }
.hint.locked .n { color: var(--faint); }

.opts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.opt { min-height: 56px; padding: 8px 12px; border-radius: 14px; background: var(--surface); border: 1px solid var(--line); font-size: 15px; }
.opt.wrong { background: #3a1f22; border-color: var(--bad); color: var(--muted); text-decoration: line-through; cursor: default; }

.result { display: flex; flex-direction: column; gap: 10px; animation: pop-in var(--motion-enter) var(--motion-ease); }
.result.solved { border-color: var(--ok); }
.ok { color: var(--ok); }
.bad { color: var(--bad); }
.r-title { margin: 0; font-size: 20px; }
.r-title strong { color: var(--accent); }
</style>
