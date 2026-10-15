<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { WORKPLACES } from '../../shared/data/village'
import { thanksReply } from '../../shared/thanks'
import { todayMeetLine } from '../../shared/today'
import { MOTION } from '../utils/motion'

/** 주민 카드: 마을에서 주민을 누르면 아래에서 올라온다. 친해진 정도와 고마워요 */
const props = defineProps<{ personId: string }>()
const emit = defineEmits<{ close: [] }>()
const game = useGame()
const gratitude = useGratitude()

const person = computed(() => PEOPLE[props.personId]!)
const where = computed(() => {
  const country = PLACES[person.value.placeId]?.country || '바다'
  return `${country} · ${WORKPLACES[person.value.workplace]}`
})
const thankedToday = computed(() => game.thankedToday(props.personId))
const reply = computed(() => (thankedToday.value ? thanksReply(props.personId) : ''))
const others = computed(() => gratitude.counts[props.personId])
const meets = useTodayMeets()
watch(() => props.personId, (id) => { void gratitude.load(id); void meets.load([id]) }, { immediate: true })
const todayLine = computed(() => {
  const n = meets.counts[props.personId]
  const mine = meets.metToday(props.personId)
  return n === undefined && !mine ? '' : todayMeetLine(n ?? 0, mine)
})

const waving = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
function thank() {
  if (game.thank(props.personId) === null) return
  void gratitude.send(props.personId)
  waving.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { waving.value = false }, MOTION.waveMs)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="`${person.name ?? person.job} 주민 카드`">
      <span class="grip" aria-hidden="true" />
      <button class="close" aria-label="닫기" @click="emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <div class="who">
        <div class="art">
          <Character :person-id="personId" :size="132" standing :wave="waving" />
        </div>
        <div class="names">
          <span class="where">{{ where }}</span>
          <h2 class="name display">{{ person.name ?? person.job }}</h2>
          <span v-if="person.name" class="job">{{ person.job }}</span>
        </div>
      </div>

      <p v-if="todayLine" class="today-line">{{ todayLine }}</p>
      <FriendshipPanel :person-id="personId" />

      <p v-if="reply" class="reply">“{{ reply }}”</p>
      <div class="thanks-row">
        <div class="counts">
          <template v-if="others && others.total">
            <strong>오늘 {{ others.today.toLocaleString('ko-KR') }}명이 고마워했어요</strong>
            <span>지금까지 {{ others.total.toLocaleString('ko-KR') }}번</span>
          </template>
        </div>
        <button class="thank" :disabled="thankedToday" @click="thank">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
          {{ thankedToday ? '오늘 전했어요' : '고마워요' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; justify-content: center; background: rgba(5, 10, 20, 0.55); }
.sheet {
  position: relative; width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 16px;
  padding: 14px 22px calc(24px + env(safe-area-inset-bottom)); border-radius: 28px 28px 0 0;
  background: var(--paper); color: var(--ink);
  animation: sheet-up var(--motion-enter) var(--motion-ease);
}
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.grip { width: 44px; height: 5px; border-radius: 3px; background: #c9c4b5; align-self: center; }
.close {
  position: absolute; right: 12px; top: 12px; width: 44px; height: 44px; border-radius: 22px;
  display: flex; align-items: center; justify-content: center; border: 0; background: none; color: #5a5a66; cursor: pointer;
}
.who { display: flex; gap: 14px; align-items: flex-end; }
.art { width: 116px; height: 140px; flex-shrink: 0; border-radius: 20px; background: #ddefd0; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; }
.names { display: flex; flex-direction: column; gap: 4px; padding-bottom: 6px; min-width: 0; }
.where { font-size: 12px; font-weight: 700; color: #4e7a3e; }
.name { margin: 0; font-size: 26px; line-height: 1.2; word-break: keep-all; }
.job { font-size: 14px; color: #4a4a55; }
.today-line { margin: 0; font-size: 14px; font-weight: 700; color: #2f5a73; }
.reply { margin: 0; padding: 10px 14px; border-radius: 14px; background: #fff; font-size: 14px; line-height: 1.5; }
.thanks-row { display: flex; align-items: center; gap: 12px; }
.counts { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.counts strong { font-size: 15px; }
.counts span { font-size: 12px; color: #4a4a55; }
.thank {
  height: 52px; padding: 0 20px; border: 0; border-radius: 18px; flex-shrink: 0;
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  background: #e0705f; color: #fff; font: inherit; font-size: 16px; font-weight: 700;
}
.thank:disabled { background: #c9c4b5; color: #4a4a55; cursor: default; }
</style>
