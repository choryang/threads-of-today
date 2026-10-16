<script setup lang="ts">
import { computed } from 'vue'
import { MOODS } from '../../../shared/data/moods'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { hasKeyStory } from '../../../shared/key-story'
import { clockAt, clockLabel, dayInfo, nameDoingLine, seoulDiffText } from '../../../shared/local-time'
import { withJosa } from '../../../shared/logic'
import { peekOf } from '../../../shared/peek'
import { placeShort, shortDate } from '../../../shared/today-text'
import { MOTION } from '../../utils/motion'

/**
 * 지금 들여다보기 (docs/redesign/README.md): 장면 그림(그곳 지금 시각으로 물든 것) · 지금 그곳 시각과 서울과의 차이 ·
 * "{이름}은 아마 …" · 마지막으로 만난 날과 그날의 내 마음 색 · 지난 이야기(본 편만). 1분마다 다시 그린다.
 * 하루 기록을 읽기만 한다(새 편을 열지 않는다). walk: 걷기에서 연 시트 (이름 아래 카드 문구 전문, 이야기 있는 사람이면 끝에 한 줄, 몇 편인지는 말하지 않는다)
 */
const props = defineProps<{ personId: string; walk?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const game = useGame()
const person = computed(() => PEOPLE[props.personId]!)
const place = computed(() => PLACES[person.value.placeId]!)
const name = computed(() => person.value.name ?? person.value.job)
const now = usePlaceNow(computed(() => place.value.tz), MOTION.peekTickMs)
const local = computed(() => clockAt(place.value.tz, now.value))
const diff = computed(() => seoulDiffText(place.value.tz, now.value))
const doing = computed(() => nameDoingLine(props.personId, name.value, local.value.h, dayInfo(place.value.country, place.value.tz, now.value)))
const peek = computed(() => peekOf(game.state.todays, props.personId))
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="`${name} 지금 들여다보기`">
      <button class="close" aria-label="닫기" @click="emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <TodaySceneImage class="scene" :person-id="personId" :hour="local.h" />
      <div class="who">
        <h2 class="name">{{ name }}</h2>
        <span class="job">{{ person.name ? person.job : '' }}</span>
      </div>
      <p v-if="walk" class="intro">{{ person.story }}</p>
      <p class="clock">
        지금 {{ withJosa(placeShort(place), '은', '는') }} <strong>{{ clockLabel(local) }}</strong>
        <span class="diff">(서울보다 {{ diff === '같은 시각' ? '같은 시각' : diff }})</span>
      </p>
      <p class="doing">{{ doing }}</p>
      <p v-if="peek.last" class="last">
        <span class="dot" :style="{ background: MOODS[peek.last.mood].color }" aria-hidden="true" />
        <NuxtLink :to="`/day/${peek.last.date}`">{{ shortDate(peek.last.date) }}에 만났어요</NuxtLink>
        <span class="mood">· 그날 당신은 {{ MOODS[peek.last.mood].label }}</span>
      </p>
      <details v-if="peek.seen.length" class="stories">
        <summary>지난 이야기</summary>
        <p v-for="(text, i) in peek.seen" :key="i">{{ text }}</p>
      </details>
      <p v-if="walk && hasKeyStory(personId)" class="later">이 사람의 이야기는 저녁에 '오늘'에서 만날 수 있어요.</p>
    </section>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; justify-content: center; background: rgba(20, 22, 26, 0.45); }
.sheet {
  position: relative; width: 100%; max-width: 480px; max-height: 92dvh; overflow-y: auto;
  padding: 20px 24px calc(24px + env(safe-area-inset-bottom)); border-radius: 24px 24px 0 0; background: #ffffff; color: #14161a;
  display: flex; flex-direction: column; gap: 10px; font-family: 'Noto Sans KR', system-ui, sans-serif;
}
.close {
  position: absolute; top: 28px; right: 32px; z-index: 1; width: 40px; height: 40px; border: 0; border-radius: 20px;
  background: rgba(255, 255, 255, 0.9); color: #14161a; display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.scene { width: 100%; aspect-ratio: 342 / 200; border-radius: 18px; }
.who { margin-top: 8px; display: flex; align-items: baseline; gap: 8px; }
.name { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
.job { font-size: 14px; color: #6b7079; }
.intro { margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: var(--t-body, #2a2d33); word-break: keep-all; }
.clock { margin: 0; font-size: 15px; color: #3f434a; word-break: keep-all; }
.clock strong { font-weight: 700; color: #14161a; }
.diff { font-size: 13px; color: #8a8f98; }
.doing { margin: 0; font-size: 16px; line-height: 1.7; color: #2a2d33; word-break: keep-all; }
.last { margin: 6px 0 0; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 14px; color: #6b7079; }
.last a { min-height: 44px; display: inline-flex; align-items: center; color: #14161a; font-weight: 700; }
.dot { width: 10px; height: 10px; border-radius: 5px; flex-shrink: 0; }
.stories { border-top: 1px solid #e8eaee; padding-top: 4px; }
.stories summary { min-height: 44px; display: flex; align-items: center; font-size: 15px; font-weight: 700; cursor: pointer; }
.stories p { margin: 0 0 12px; font-size: 15px; line-height: 1.8; color: #2a2d33; word-break: keep-all; white-space: pre-line; }
.later { margin: 6px 0 0; font-size: 13px; color: #6b7079; word-break: keep-all; }
</style>
