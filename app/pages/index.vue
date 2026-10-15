<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { repliesFor } from '../../shared/data/replies'
import type { MoodId } from '../../shared/data/moods'
import { resolveItem } from '../utils/resolve-item'

/**
 * 첫 화면: 오늘 흐름 (docs/redesign/README.md, 시안 V2Mood → V2Item → V2Thread → V2Person → V2Reply).
 * 마음 → 물건 → 같은 순간 다른 시각 → 그 사람의 오늘 → 한마디.
 */
useHead({ htmlAttrs: { class: 'today-ui' }, title: '내 하루에 닿은 사람들' })

const today = useToday()
const d = today.draft

/** 자주 고르는 것 (시안 V2Item) */
const CHOICES = ['아이스 아메리카노', '스마트폰', '참치마요 삼각김밥', '라면', '운동화', '면 티셔츠']

const busy = ref(false)
const itemError = ref('')

onMounted(() => today.open())

/** 오늘의 결과에 보이는 건넨 말 */
const saidText = computed(() => {
  const r = d.reply
  if (!r || !d.mood) return ''
  return r.kind === 'own' ? r.text : repliesFor(d.mood)[r.index] ?? ''
})

function pickMood(mood: MoodId) {
  today.chooseMood(mood)
}
async function chooseItem(name: string) {
  busy.value = true
  itemError.value = ''
  const res = await resolveItem(name)
  busy.value = false
  if ('error' in res) {
    itemError.value = res.error
    return
  }
  if (!today.chooseItem(res)) {
    itemError.value = '이 물건이 지나온 길은 아직 준비 중이에요. 다른 물건을 골라 주세요'
    return
  }
  today.go('thread')
}

watch(() => d.step, () => window.scrollTo({ top: 0 }))
const tightTop = computed(() => d.step === 'item' || d.step === 'person' || d.step === 'done')
</script>

<template>
  <main class="today" :class="{ 'tight-top': tightTop }">
    <TodayMoodScreen
      v-if="d.step === 'mood'"
      :date="d.date"
      :mood="d.mood"
      :note="d.note"
      @pick="pickMood"
      @note="today.setNote"
      @next="today.go('item')"
    />
    <TodayItemScreen
      v-else-if="d.step === 'item' && d.mood"
      :mood="d.mood"
      :choices="CHOICES"
      :busy="busy"
      :error="itemError"
      :initial="d.item?.name"
      @back="today.go('mood')"
      @next="chooseItem"
    />
    <TodayThreadScreen
      v-else-if="d.step === 'thread' && d.mood && d.item && d.pick"
      :mood="d.mood"
      :item-name="d.item.name"
      :person-id="d.pick.personId"
      :hands="d.pick.hands.length"
      @next="today.go('person')"
    />
    <TodayPersonScreen
      v-else-if="d.step === 'person' && d.mood && d.item && d.pick"
      :mood="d.mood"
      :item-name="d.item.name"
      :person-id="d.pick.personId"
      :episode="d.pick.episode"
      :memory="d.memory"
      action="한마디 건네기"
      @next="today.go('reply')"
    />
    <TodayReplyScreen
      v-else-if="d.step === 'reply' && d.mood && d.pick"
      :mood="d.mood"
      :person-id="d.pick.personId"
      :reply="d.reply"
      @reply="today.giveReply"
    >
      <template #actions>
        <button class="t-btn" @click="today.go('done')">다 했어요</button>
      </template>
    </TodayReplyScreen>
    <!-- 하루 한 번: 오늘 기록이 있으면 오늘의 결과 -->
    <TodayPersonScreen
      v-else-if="d.step === 'done' && d.mood && d.item && d.pick"
      :mood="d.mood"
      :item-name="d.item.name"
      :person-id="d.pick.personId"
      :episode="d.pick.episode"
      :memory="d.memory"
    >
      <div class="done">
        <p v-if="d.note" class="done-note"><span class="t-dot" aria-hidden="true" />{{ d.note }}</p>
        <p v-if="saidText" class="done-said">당신이 건넨 말: {{ saidText }}</p>
        <p class="done-bye">내일 저녁에 또 만나요</p>
      </div>
    </TodayPersonScreen>
  </main>
</template>

<style scoped>
.done { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
.done-note { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 15px; color: var(--t-quiet); word-break: keep-all; }
.done-said { margin: 0; font-size: 14px; color: var(--t-sub); word-break: keep-all; }
.done-bye { margin: 12px 0 0; font-size: 17px; font-weight: 700; text-align: center; }
</style>
