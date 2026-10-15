<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { UNLOCK, factOf } from '../../shared/friendship'
import { placeLabel as labelOf } from '../../shared/rewind'
import { thanksReply } from '../../shared/thanks'
import { todayMeetLine } from '../../shared/today'
import { badgeOf } from '../utils/labels'

/** noArt: 여정 화면처럼 위에 하늘(PlaceSky)이 캐릭터를 그릴 때는 카드 안 그림을 빼고 '새로'를 머리에 단다 */
const props = defineProps<{ personId: string; isNew?: boolean; number?: number; noArt?: boolean }>()
const person = computed(() => PEOPLE[props.personId]!)
const place = computed(() => PLACES[person.value.placeId]!)
const placeLabel = computed(() => labelOf(place.value))

const game = useGame()
const met = computed(() => game.owns(props.personId))
/** 고마워요는 하루(서울 기준) 한 번 */
const thanked = computed(() => game.thankedToday(props.personId))
const reply = computed(() => (thanked.value ? thanksReply(props.personId) : ''))
/**
 * 사람 카드는 단계별로 보인다 (shared/unlocks.ts): 처음엔 이름·하는 일·이야기·고마워요만.
 * 등급 배지·일하는 사실은 여정 3번, 다른 사람들의 고마움·모두의 오늘은 여정 5번, 소개하기는 첫 단짝 뒤.
 * 친구가 소개해 준 분이라는 한 줄은 받은 쪽(링크)이라 늘 보인다
 */
const showBadge = computed(() => game.opens('rarity-badge'))
const showFact = computed(() => game.opens('work-fact'))
const showOthers = computed(() => game.opens('others-thanks'))
const showToday = computed(() => game.opens('today-count'))
const showIntro = computed(() => game.opens('intro'))
/** 일하는 사실은 친해진 정도 50%에 열린다 */
const fact = computed(() => (met.value && showFact.value && game.friendship(props.personId).percent >= UNLOCK.fact ? factOf(props.personId) : undefined))

// 다른 사람들의 고마움: 만난 사람 카드에서만, 열린 뒤에만 읽는다
const gratitude = useGratitude()
watch([() => props.personId, met], ([id, isMet]) => { if (isMet && showOthers.value) void gratitude.load(id) }, { immediate: true })
const others = computed(() => gratitude.counts[props.personId])

// 사람 카드 소개: 보내기 버튼, 그리고 친구가 소개해 준 분이면 그 한 줄
const share = useShare()
const introOpen = ref(false)
const introducedBy = computed(() => (met.value ? share.introducedBy(props.personId) : ''))

// 모두의 오늘: 오늘 이 분을 만난 사람 수
const meets = useTodayMeets()
watch([() => props.personId, met], ([, isMet]) => { if (isMet && showToday.value) void meets.load() }, { immediate: true })
const todayLine = computed(() => {
  if (!showToday.value) return ''
  const n = meets.countOf(props.personId)
  const mine = meets.metToday(props.personId)
  return n === undefined && !mine ? '' : todayMeetLine(n ?? 0, mine)
})

/** 일의 크기 한 줄을 누르면 출처를 펼친다 */
const showSource = ref(false)

// 고마워요를 누르면 잠깐 손을 흔들며 반가워한다
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
  <article class="card" :class="`rarity-${person.rarity}`">
    <header class="top">
      <span class="mono no">{{ number ? `No.${String(number).padStart(3, '0')}` : place.country || '바다' }}</span>
      <span class="top-right">
        <span v-if="noArt && isNew" class="new inline">새로</span>
        <span v-if="showBadge" class="badge">{{ badgeOf(person) }}</span>
      </span>
    </header>
    <div v-if="!noArt" class="art">
      <Character :person-id="personId" :size="150" bob :wave="waving" />
      <span v-if="isNew" class="new">새로</span>
    </div>
    <div class="body">
      <h3 class="who">
        <template v-if="person.name"><span class="name">{{ person.name }}</span> · </template>{{ person.job }}<span class="place"> · {{ placeLabel }}</span>
      </h3>
      <p class="story">{{ person.story }}</p>
      <div v-if="fact" class="fact">
        <button class="fact-btn" :aria-expanded="showSource" @click="showSource = !showSource">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
          <span>{{ fact.fact }}</span>
        </button>
        <p v-if="showSource" class="fact-source">
          출처: {{ fact.source.name }} ({{ fact.source.year }})
          <a :href="fact.source.url" target="_blank" rel="noopener noreferrer">자료 보기</a>
        </p>
      </div>
      <div v-if="met" class="thanks" aria-live="polite">
        <button v-if="!thanked" class="thank-btn" @click="thank">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
          고마워요
        </button>
        <template v-else>
          <p class="reply">“{{ reply }}”</p>
          <p class="thanked-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
            오늘 {{ person.name ? `${person.name}에게 ` : '' }}고마움을 전했어요
          </p>
        </template>
        <p v-if="introducedBy" class="introduced">{{ introducedBy }}님이 소개해준 분이에요</p>
        <p v-if="todayLine" class="today-line">{{ todayLine }}</p>
        <button v-if="showIntro" class="intro-btn" @click="introOpen = true">이 분 소개하기</button>
        <Teleport to="body"><IntroSheet v-if="introOpen" :person-id="personId" @close="introOpen = false" /></Teleport>
        <p v-if="showOthers && others && others.total" class="others">
          <strong>오늘 {{ others.today.toLocaleString('ko-KR') }}명이 고마워했어요</strong>
          <span>지금까지 {{ others.total.toLocaleString('ko-KR') }}번</span>
        </p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: var(--paper);
  color: var(--ink);
  border-radius: 22px;
  overflow: hidden;
  border: 3px solid var(--rarity);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.rarity-legendary { box-shadow: 0 0 0 4px rgba(242, 193, 78, 0.25), 0 10px 30px rgba(0, 0, 0, 0.35); }
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--rarity);
  color: var(--ink);
}
.no { font-size: 12px; }
.badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--rarity);
}
.art {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 18px 0 10px;
  background: radial-gradient(circle at 50% 60%, #fff 0, var(--paper-2) 70%);
}
.new {
  position: absolute;
  top: 12px;
  right: 14px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--bad);
  color: #fff;
}
.top-right { display: inline-flex; align-items: center; gap: 6px; }
.new.inline { position: static; }
.body { padding: 14px 18px 20px; display: flex; flex-direction: column; gap: 4px; }
.who { margin: 0; font-size: 20px; line-height: 1.35; word-break: keep-all; }
.who .place { font-size: 13px; font-weight: 400; color: #4a4a4a; }
.story { margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: #2a2a2a; }
.fact { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.fact-btn {
  display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 12px;
  border: 1px dashed #b9b2a0; border-radius: 12px; background: var(--paper-2);
  color: var(--ink); font: inherit; font-size: 14px; font-weight: 600; text-align: left; cursor: pointer;
}
.fact-btn svg { flex-shrink: 0; }
.fact-source { margin: 0; padding: 0 4px; font-size: 12px; line-height: 1.5; color: #4a4a4a; word-break: keep-all; }
.fact-source a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px; color: #6b4e00; font-weight: 700; }
.thanks { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.introduced { margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #6b4e00; }
.intro-btn { min-height: 44px; padding: 0 14px; border-radius: 14px; border: 2px solid var(--ink); background: none; color: var(--ink); font-size: 14px; font-weight: 700; cursor: pointer; align-self: flex-start; }
.today-line { margin: 2px 0 0; font-size: 13px; font-weight: 700; color: #2f5a73; }
.others { margin: 2px 0 0; display: flex; flex-wrap: wrap; gap: 2px 8px; align-items: baseline; font-size: 13px; color: #4a4a4a; }
.others strong { color: var(--ink); font-size: 14px; }
.thank-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 44px; padding: 0 18px; align-self: flex-start;
  border-radius: 999px; border: 2px solid var(--ink); background: transparent; color: var(--ink);
  font: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
}
.thank-btn:active { transform: scale(0.97); }
.reply {
  margin: 0; padding: 10px 14px; border-radius: 14px 14px 14px 4px;
  background: var(--paper-2); font-size: 14px; line-height: 1.5; color: #2a2a2a;
  animation: rise 0.25s ease-out;
}
.thanked-note { margin: 0; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--bad); }
</style>
