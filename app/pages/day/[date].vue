<script setup lang="ts">
import { computed, ref } from 'vue'
import { memoryFor, replyText } from '../../../shared/today-log'
import { shortDate } from '../../../shared/today-text'
import { localDay } from '../../utils/today-local'

/**
 * 지난 하루 (나와 이어진 사람들 → 누르면): 그날의 4번 화면을 다시 본다. 한 줄·직접 쓴 말은 이 기기에 남은 것만
 */
useHead({ htmlAttrs: { class: 'today-ui' } })

const route = useRoute()
const router = useRouter()
const game = useGame()
const date = computed(() => String(route.params.date))
const record = computed(() => game.state.todays?.[date.value])
const local = computed(() => localDay(date.value))
const said = computed(() => (record.value ? replyText(record.value, local.value.own) : undefined))
const sharing = ref(false)
const memory = computed(() => (record.value ? memoryFor(game.state.todays, record.value.personId, date.value, (d) => localDay(d).own) : undefined))
function back() {
  if (window.history.length > 1) router.back()
  else router.push('/people')
}
</script>

<template>
  <main class="today tight-top with-nav">
    <div class="top">
      <button class="t-back" aria-label="뒤로" @click="back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <span class="t-kicker">{{ shortDate(date) }}</span>
    </div>
    <TodayPersonScreen
      v-if="record"
      :mood="record.mood"
      :item-name="record.item"
      :person-id="record.personId"
      :episode="record.episode"
      :memory="memory"
    >
      <div class="said">
        <p v-if="local.note" class="note"><span class="t-dot" aria-hidden="true" />{{ local.note }}</p>
        <p v-if="said" class="reply">당신이 건넨 말: {{ said }}</p>
        <button class="t-btn secondary" @click="sharing = true">카드로 남기기</button>
      </div>
    </TodayPersonScreen>
    <TodayShareSheet v-if="sharing && record" :date="date" :record="record" @close="sharing = false" />
    <p v-else class="missing">이날의 기록이 없어요.</p>
  </main>
</template>

<style scoped>
.top { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
.said { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.note { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 15px; color: var(--t-quiet); word-break: keep-all; }
.reply { margin: 0; font-size: 14px; color: var(--t-sub); word-break: keep-all; }
.missing { margin: 24px 0 0; color: var(--t-sub); }
</style>
