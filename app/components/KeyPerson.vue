<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { keyJoy, keyStory } from '../../shared/key-story'
import { placeLabel } from '../../shared/rewind'
import { thanksReply } from '../../shared/thanks'
import { MOTION } from '../utils/motion'

/**
 * 핵심 인물 화면 (docs/key-people.md 화면 2): 위쪽 하늘·장면 그림(PlaceSky, 그곳 시각·지금은 아마…),
 * 이름·일, 이야기, 작은 기쁨, 고마워요. '다음 사람' 버튼은 여정 화면 아래의 큰 버튼.
 * meetCount: 핵심 자리에서 만난 횟수(이번 포함). 여러 편 있는 사람은 그 횟수대로 다음 이야기
 */
const props = defineProps<{ personId: string; meetCount: number; isNew?: boolean }>()

const person = computed(() => PEOPLE[props.personId]!)
const place = computed(() => PLACES[person.value.placeId]!)
const story = computed(() => keyStory(props.personId, props.meetCount))
const joy = computed(() => keyJoy(props.personId))

const game = useGame()
const gratitude = useGratitude()
const thanked = computed(() => game.thankedToday(props.personId))
const reply = computed(() => (thanked.value ? thanksReply(props.personId) : ''))
const cardOpen = ref(false)

// 고마워요를 누르면 하늘의 캐릭터 대신 카드 쪽에서 잠깐 반가워한다
const waving = ref(false)
let waveTimer: ReturnType<typeof setTimeout> | undefined
function thank() {
  if (game.thank(props.personId) !== null) void gratitude.send(props.personId)
  waving.value = true
  clearTimeout(waveTimer)
  waveTimer = setTimeout(() => { waving.value = false }, MOTION.waveMs)
}
onBeforeUnmount(() => clearTimeout(waveTimer))
</script>

<template>
  <section class="key">
    <PlaceSky :person-id="personId" />
    <article class="key-card" :class="{ waving }">
      <header class="who">
        <h2 class="display name">{{ person.name ?? person.job }}</h2>
        <span class="job">{{ person.name ? person.job : '' }}<template v-if="person.name"> · </template>{{ placeLabel(place) }}</span>
        <span v-if="isNew" class="new">새로</span>
      </header>
      <p class="story">{{ story }}</p>
      <p v-if="joy" class="joy">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        <span><span class="joy-label">작은 기쁨</span> {{ joy }}</span>
      </p>
      <div class="actions" aria-live="polite">
        <button v-if="!thanked" class="thank-btn" @click="thank">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
          고마워요
        </button>
        <p v-else class="reply">“{{ reply }}”</p>
        <button class="card-link" @click="cardOpen = true">카드 보기</button>
      </div>
    </article>
    <Teleport to="body"><ResidentSheet v-if="cardOpen" :person-id="personId" @close="cardOpen = false" /></Teleport>
  </section>
</template>

<style scoped>
.key { display: flex; flex-direction: column; animation: pop-in var(--motion-enter) var(--motion-ease); }
.key-card {
  display: flex; flex-direction: column; gap: 10px; padding: 18px 18px 16px; border-radius: 22px;
  background: var(--paper); color: var(--ink); border: 3px solid #2a2a35;
}
.key-card.waving { animation: hop var(--motion-wave) ease-out; }
@keyframes hop { 40% { transform: translateY(-4px); } }
.who { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.name { font-size: 28px; line-height: 1.2; }
.job { font-size: 14px; color: #4a4a55; word-break: keep-all; }
.new { margin-left: auto; padding: 3px 8px; border-radius: 8px; background: var(--bad); color: #fff; font-size: 12px; font-weight: 700; }
.story { margin: 0; font-size: 15px; line-height: 1.75; color: #2a2a35; word-break: keep-all; }
.joy {
  margin: 0; display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; border-radius: 14px;
  background: var(--paper-2); font-size: 14px; line-height: 1.5; word-break: keep-all;
}
.joy svg { flex-shrink: 0; margin-top: 2px; color: #b5452f; }
.joy-label { font-weight: 700; margin-right: 4px; }
.actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.thank-btn {
  min-height: 44px; padding: 0 18px; border-radius: 22px; border: 2px solid #2a2a35; background: #fff; color: var(--ink);
  display: inline-flex; align-items: center; gap: 6px; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
}
.reply { margin: 0; flex: 1; font-size: 14px; line-height: 1.5; color: #2a2a35; word-break: keep-all; }
.card-link {
  min-height: 44px; padding: 0 8px; border: 0; background: none; color: #4a4a55;
  font: inherit; font-size: 13px; text-decoration: underline; cursor: pointer;
}
</style>
