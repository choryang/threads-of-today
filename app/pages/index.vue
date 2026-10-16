<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { repliesFor } from '../../shared/data/replies'
import type { MoodId } from '../../shared/data/moods'
import { resolveItem } from '../utils/resolve-item'
import { togetherLine } from '../../shared/today-text'
import type { Reply } from '../composables/useToday'
import type { JobId } from '../../shared/data/jobs'
import { MOTION, reducedMotion } from '../utils/motion'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { clockAt, dayInfo, nameDoingLine } from '../../shared/local-time'

/**
 * 첫 화면: 오늘 흐름 (docs/redesign/README.md, 시안 V2Mood → V2Item → V2Thread → V2Person → V2Reply).
 * 마음 → 물건 → 같은 순간 다른 시각 → 그 사람의 오늘 → 한마디.
 */
useHead({ htmlAttrs: { class: 'today-ui' }, title: '내 하루에 닿은 사람들' })

const today = useToday()
const d = today.draft

/** 자주 고르는 것 (시안 V2Item) */
const CHOICES = ['아이스 아메리카노', '스마트폰', '참치마요 삼각김밥', '라면', '운동화', '면 티셔츠']

const route = useRoute()
const game = useGame()
/** 공유 링크로 들어온 사람: "당신의 오늘은 어땠어요?"로 시작 */
const invited = computed(() => route.query.from === 'share')
const record = computed(() => game.state.todays?.[d.date])
const sharing = ref(false)

// 모두의 오늘: 실을 묶으면 마음 id 하나만 보내고, 5번 화면에 "오늘 억울했던 사람 N명이 …"
const meets = useTodayMeets()
const together = computed(() => {
  if (!d.mood || !d.reply) return ''
  const n = meets.moodCount(d.mood)
  return n ? togetherLine(d.mood, n) : ''
})
// 오늘 결과 화면의 실시간 한 줄: "지금 마인은 아마 …" (1분마다)
const donePerson = computed(() => (d.pick ? PEOPLE[d.pick.personId] : undefined))
const donePlace = computed(() => PLACES[donePerson.value?.placeId ?? ''] ?? PLACES.kr!)
const doneNow = usePlaceNow(computed(() => donePlace.value.tz), MOTION.peekTickMs)
const nowLine = computed(() => {
  const p = donePerson.value
  if (!p || !d.pick) return ''
  const line = nameDoingLine(d.pick.personId, p.name ?? p.job, clockAt(donePlace.value.tz, doneNow.value).h, dayInfo(donePlace.value.country, donePlace.value.tz, doneNow.value))
  return line.startsWith('오늘은') ? line : `지금 ${line}`
})

// 하는 일 묻기: 3일째, 실을 묶은 뒤(매듭이 다 묶이고) 한 번만. 닫기·"말하지 않을래요"는 declined
const askingJob = ref(false)
function reply(r: Reply) {
  today.giveReply(r)
  if (d.mood) {
    void meets.tieMood(d.mood)
    void meets.load()
  }
  if (today.askJobToday()) setTimeout(() => { askingJob.value = true }, reducedMotion() ? 0 : MOTION.knotDrawMs + MOTION.enterMs * 2)
}
function chooseJob(value: JobId | 'declined') {
  today.setJob(value)
  askingJob.value = false
}

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
  if ('proper' in res) {
    itemError.value = "이 이름은 '걷기'에서 지도로 찾아볼 수 있어요. 오늘 손에 닿은 물건을 적어 주세요"
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
  <main class="today" :class="{ 'tight-top': tightTop, 'with-nav': d.step === 'mood' || d.step === 'done' }">
    <TodayMoodScreen
      v-if="d.step === 'mood'"
      :date="d.date"
      :mood="d.mood"
      :note="d.note"
      :invited="invited"
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
      :how="d.pick.how"
      :memory="d.memory"
      action="한마디 건네기"
      @next="today.go('reply')"
    />
    <TodayReplyScreen
      v-else-if="d.step === 'reply' && d.mood && d.pick"
      :mood="d.mood"
      :person-id="d.pick.personId"
      :reply="d.reply"
      :together="together"
      @reply="reply"
    >
      <template #actions>
        <button class="t-btn secondary" @click="sharing = true">카드로 남기기</button>
        <NuxtLink to="/people" class="t-btn">이어진 사람들</NuxtLink>
      </template>
    </TodayReplyScreen>
    <!-- 하루 한 번: 오늘 기록이 있으면 오늘의 결과 -->
    <TodayPersonScreen
      v-else-if="d.step === 'done' && d.mood && d.item && d.pick"
      :mood="d.mood"
      :item-name="d.item.name"
      :person-id="d.pick.personId"
      :episode="d.pick.episode"
      :how="d.pick.how"
      :memory="d.memory"
      no-doing
    >
      <div class="done">
        <p v-if="d.note" class="done-note"><span class="t-dot" aria-hidden="true" />{{ d.note }}</p>
        <p v-if="saidText" class="done-said">당신이 건넨 말: {{ saidText }}</p>
        <p class="done-now" aria-live="polite">{{ nowLine }}</p>
        <p class="done-bye">내일 저녁에 또 만나요</p>
        <button class="t-btn secondary" @click="sharing = true">카드로 남기기</button>
        <NuxtLink to="/walk" class="walk-link">오늘 만남은 여기까지예요. 다른 물건의 길을 걸어 볼래요?</NuxtLink>
      </div>
    </TodayPersonScreen>
    <TodayShareSheet v-if="sharing && record" :date="d.date" :record="record" @close="sharing = false" />
    <TodayJobSheet v-if="askingJob" @choose="chooseJob" @close="chooseJob('declined')" />
  </main>
</template>

<style scoped>
.done { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
.done-note { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 15px; color: var(--t-quiet); word-break: keep-all; }
.done-said { margin: 0; font-size: 14px; color: var(--t-sub); word-break: keep-all; }
.done-now { margin: 8px 0 0; font-size: 15px; line-height: 1.6; color: var(--t-text); word-break: keep-all; }
.walk-link { margin-top: 4px; min-height: 44px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 14px; color: var(--t-sub); text-decoration: underline; word-break: keep-all; }
.done-bye { margin: 12px 0 0; font-size: 17px; font-weight: 700; text-align: center; }
</style>
