<script setup lang="ts">
import { computed } from 'vue'
import { MOODS, type MoodId } from '../../../shared/data/moods'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { clockAt, clockLabel, dayInfo, doingLine } from '../../../shared/local-time'
import { storyEpisodes } from '../../../shared/key-story'
import { placeLabel } from '../../../shared/rewind'
import { moodTitle, pathHeader, plainTitle } from '../../../shared/today-text'

/**
 * 4번 화면 (시안 V2Person): 그 사람의 오늘. 장면 그림(그곳 시각으로 물든), 머리말(마음 색), 제목, 이야기, 이름·일·지금은 아마.
 * episode가 null이면(경로에 이야기 사람이 없을 때) 카드 문구를 보여 주고 제목에 마음을 붙이지 않는다.
 * memory: 같은 사람을 다시 만났을 때 이야기 위 한 줄. action이 없으면 아래 버튼 없이(오늘의 결과로 다시 볼 때)
 */
const props = defineProps<{
  mood: MoodId
  itemName: string
  personId: string
  episode: number | null
  memory?: string
  action?: string
}>()
const emit = defineEmits<{ next: [] }>()

const person = computed(() => PEOPLE[props.personId]!)
const place = computed(() => PLACES[person.value.placeId]!)
const now = usePlaceNow(computed(() => place.value.tz))
const local = computed(() => clockAt(place.value.tz, now.value))
const day = computed(() => local.value.h >= 6 && local.value.h < 18)
const doing = computed(() => doingLine(props.personId, local.value.h, dayInfo(place.value.country, place.value.tz, now.value)))
const name = computed(() => person.value.name ?? person.value.job)
const story = computed(() => (props.episode === null ? person.value.story : storyEpisodes(props.personId)[props.episode] ?? person.value.story))
const title = computed(() => (props.episode === null ? plainTitle(props.itemName) : moodTitle(name.value, props.mood)))
</script>

<template>
  <div class="person-screen" :style="{ '--mood': MOODS[mood].color }">
    <div class="where">
      <span>{{ placeLabel(place) }}</span>
      <span class="clock"><span class="orb" :class="{ day }" aria-hidden="true" />지금 {{ clockLabel(local) }}</span>
    </div>

    <TodaySceneImage class="scene" :person-id="personId" :hour="local.h" />

    <p v-if="episode !== null" class="header">{{ pathHeader(itemName) }}</p>
    <h1 class="title" :class="{ plain: episode === null }">{{ title[0] }}<br>{{ title[1] }}</h1>
    <p v-if="memory" class="memory">{{ memory }}</p>
    <p class="t-body story">{{ story }}</p>
    <p class="fiction">이야기 속 사람들은 실제 일을 바탕으로 지어낸 사람이에요.</p>

    <div class="who">
      <div class="who-name">
        <span class="name">{{ name }}</span>
        <span class="job">{{ person.name ? person.job : '' }}</span>
      </div>
      <span class="doing">{{ doing }}</span>
    </div>
    <button v-if="action" class="t-btn" @click="emit('next')">{{ action }}</button>
  </div>
</template>

<style scoped>
.person-screen { display: flex; flex-direction: column; flex: 1; }
.where { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; color: var(--t-sub); }
.clock { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.orb { width: 8px; height: 8px; border-radius: 4px; background: #5f6b8c; }
.orb.day { background: #f2b33d; }
.scene { margin-top: 12px; width: 100%; aspect-ratio: 342 / 228; border-radius: 20px; }
.header { margin: 24px 0 0; font-size: 13px; font-weight: 500; color: var(--mood); word-break: keep-all; }
.title { margin: 6px 0 0; font-size: 24px; font-weight: 700; line-height: 1.4; letter-spacing: -0.01em; word-break: keep-all; }
.title.plain { margin-top: 24px; }
.memory { margin: 14px 0 0; font-size: 14px; line-height: 1.6; color: var(--mood); word-break: keep-all; }
.story { margin-top: 16px; }
.fiction { margin: 10px 0 24px; font-size: 12px; color: var(--t-faint); word-break: keep-all; }
.who {
  margin-top: auto; padding: 14px 0; border-top: 1px solid var(--t-line);
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.who-name { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
.name { font-size: 15px; font-weight: 700; }
.job { font-size: 13px; color: var(--t-sub); }
.doing { max-width: 190px; text-align: right; font-size: 13px; line-height: 1.5; color: var(--t-sub); word-break: keep-all; }
.t-btn { margin-top: 8px; }
</style>
