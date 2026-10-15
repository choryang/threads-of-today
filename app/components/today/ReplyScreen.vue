<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { MOODS, type MoodId } from '../../../shared/data/moods'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { OWN_REPLY_LABEL, OWN_REPLY_MAX, repliesFor } from '../../../shared/data/replies'
import { clockAt } from '../../../shared/local-time'
import { withJosa } from '../../../shared/logic'
import { MOTION, reducedMotion } from '../../utils/motion'
import type { Reply } from '../../composables/useToday'

/**
 * 5번 화면 (시안 V2Reply): 한마디 건네기 → 실을 묶었어요(매듭이 그려진다). 한 번 건네면 바꿀 수 없다.
 * 직접 쓴 말은 기기에만 남는다. 움직임을 줄이는 설정이면 매듭이 다 묶인 채로
 */
const props = defineProps<{ mood: MoodId; personId: string; reply?: Reply; together?: string }>()
const emit = defineEmits<{ reply: [reply: Reply] }>()
defineSlots<{ actions?: () => unknown }>()

const person = computed(() => PEOPLE[props.personId]!)
const name = computed(() => person.value.name ?? person.value.job)
const place = computed(() => PLACES[person.value.placeId]!)
const now = usePlaceNow(computed(() => place.value.tz))
const hour = computed(() => clockAt(place.value.tz, now.value).h)
const options = computed(() => repliesFor(props.mood))
const color = computed(() => MOODS[props.mood].color)

const writing = ref(props.reply?.kind === 'own')
const own = ref(props.reply?.kind === 'own' ? props.reply.text : '')
const ownEl = ref<HTMLInputElement | null>(null)
const given = computed(() => !!props.reply)

// 매듭: 건네는 순간 0 → 1. 이미 건넨 상태로 열면 다 묶인 채로
const knot = ref(props.reply || reducedMotion() ? 1 : 0)
let raf = 0
function tie() {
  if (reducedMotion()) {
    knot.value = 1
    return
  }
  knot.value = 0
  const start = performance.now()
  const step = (t: number) => {
    knot.value = Math.min(1, (t - start) / MOTION.knotDrawMs)
    if (knot.value < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}
onBeforeUnmount(() => cancelAnimationFrame(raf))

function pick(index: number) {
  if (given.value) return
  emit('reply', { kind: 'preset', index })
  tie()
}
async function startOwn() {
  if (given.value) return
  writing.value = true
  await nextTick()
  ownEl.value?.focus()
}
function sendOwn() {
  const text = own.value.trim().slice(0, OWN_REPLY_MAX)
  if (!text || given.value) return
  emit('reply', { kind: 'own', text })
  tie()
}
const checked = (i: number) => props.reply?.kind === 'preset' && props.reply.index === i
const KNOT = 'M0 28 C 80 28, 120 28, 158 28 C 168 28, 176 14, 171 10 C 164 6, 156 22, 171 30 C 186 38, 180 50, 171 46 C 164 42, 172 28, 184 28 C 230 28, 280 28, 342 28'
</script>

<template>
  <div class="reply-screen" :style="{ '--mood': color }">
    <TodaySceneImage class="avatar" :person-id="personId" :hour="hour" decorative />
    <h1 class="t-title">{{ name }}에게{{ '\n' }}한마디 건넬까요?</h1>

    <ul role="radiogroup" aria-label="건넬 말" class="options">
      <li v-for="(label, i) in options" :key="label">
        <button role="radio" :aria-checked="checked(i)" :class="{ on: checked(i) }" :disabled="given && !checked(i)" @click="pick(i)">
          <span>{{ label }}</span>
          <span class="ring" aria-hidden="true"><span /></span>
        </button>
      </li>
      <li>
        <button v-if="!writing" role="radio" :aria-checked="false" :disabled="given" @click="startOwn">
          <span>{{ OWN_REPLY_LABEL }}</span>
          <span class="ring" aria-hidden="true"><span /></span>
        </button>
        <form v-else class="own" @submit.prevent="sendOwn">
          <label for="today-own" class="sr-only">건넬 말 ({{ OWN_REPLY_MAX }}자까지, 이 기기에만 남아요)</label>
          <input id="today-own" ref="ownEl" v-model="own" :maxlength="OWN_REPLY_MAX" :disabled="given" placeholder="건넬 말 (이 기기에만 남아요)">
          <button v-if="!given" type="submit" class="send" :disabled="!own.trim()">건네기</button>
        </form>
      </li>
    </ul>

    <div class="knot" :class="{ shown: given }" aria-live="polite">
      <svg aria-hidden="true" viewBox="0 0 342 56" class="knot-line">
        <path :d="KNOT" fill="none" :stroke="color" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="560" :stroke-dashoffset="(560 * (1 - knot)).toFixed(0)" />
      </svg>
      <template v-if="given">
        <span class="knot-title">실을 묶었어요</span>
        <span class="knot-text">다음에 다시 만나면, {{ withJosa(name, '이', '가') }} 오늘 당신이 한 말을 기억하고 있을 거예요.</span>
        <span v-if="together" class="knot-text together">{{ together }}</span>
      </template>
    </div>

    <div v-if="given" class="t-bottom actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.reply-screen { display: flex; flex-direction: column; flex: 1; }
.avatar { width: 56px; height: 56px; border-radius: 28px; flex-shrink: 0; }
.t-title { margin-top: 16px; }
.options { list-style: none; margin: 24px 0 0; padding: 0; }
.options li { border-bottom: 1px solid var(--t-line); }
.options button[role='radio'] {
  width: 100%; height: 60px; padding: 0; border: 0; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between; font-size: 17px; text-align: left; color: var(--t-text);
}
.options button[role='radio']:disabled { color: #b5b9c0; cursor: default; }
.options button.on { font-weight: 700; color: var(--t-text); }
.ring { width: 22px; height: 22px; border-radius: 11px; border: 2px solid #cdd1d8; display: flex; align-items: center; justify-content: center; }
.ring span { width: 10px; height: 10px; border-radius: 5px; }
.on .ring { border-color: var(--mood); }
.on .ring span { background: var(--mood); }
.own { display: flex; align-items: center; gap: 8px; min-height: 60px; }
.own input { flex: 1; min-width: 0; height: 44px; border: 0; background: transparent; outline: none; font-size: 17px; color: var(--t-text); }
.own input::placeholder { color: #a3a8b0; }
.send { height: 44px; padding: 0 14px; border: 0; border-radius: 12px; background: #14161a; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
.send:disabled { background: #c9ccd2; }
.knot { margin-top: 28px; display: flex; flex-direction: column; opacity: 0; transition: opacity var(--motion-enter) var(--motion-ease); }
.knot.shown { opacity: 1; }
.knot-line { width: 100%; max-width: 342px; height: auto; }
.knot-title { margin-top: 12px; font-size: 17px; font-weight: 700; }
.knot-text { margin-top: 6px; font-size: 15px; line-height: 1.6; color: var(--t-sub); word-break: keep-all; }
.together { color: var(--t-quiet); }
.actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 10px; }
</style>
