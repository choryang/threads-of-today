<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
const tightTop = computed(() => d.step === 'item' || d.step === 'person')
</script>

<template>
  <main class="today" :class="{ 'tight-top': tightTop }">
    <TodayMoodScreen
      v-if="d.step === 'mood'"
      :date="d.date"
      :mood="d.mood"
      :note="d.note"
      @pick="pickMood"
      @note="d.note = $event"
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
      action="한마디 건네기"
      @next="today.go('reply')"
    />
    <TodayReplyScreen
      v-else-if="d.step === 'reply' && d.mood && d.pick"
      :mood="d.mood"
      :person-id="d.pick.personId"
      :reply="d.reply"
      @reply="today.giveReply"
    />
  </main>
</template>
