<script setup lang="ts">
import { computed } from 'vue'
import { TRANSPORT_ICON } from '../utils/vehicle-icon'
import { arrivalLabel, cargoName, isArrived, progressOf, transportOf, wayText } from '../../shared/incoming'
import { forwardTimeline } from '../../shared/journey'
import { withJosa } from '../../shared/logic'
import type { Incoming } from '../../shared/progress'

/** 마을 아래의 오고 있는 물건 한 줄. 도착했으면 누르면 도착 화면으로 */
const props = defineProps<{ incoming: Incoming; now: number }>()
const game = useGame()

const journey = computed(() => game.findJourney(props.incoming.journeyId))
const timeline = computed(() => (journey.value ? forwardTimeline(journey.value.materialIds, journey.value.id, journey.value.name) : []))
const kind = computed(() => transportOf(timeline.value)?.kind ?? 'ship')
const cargo = computed(() => (journey.value ? cargoName(journey.value) : '물건'))
const arrived = computed(() => isArrived(props.incoming, props.now))
const progress = computed(() => progressOf(props.incoming, props.now))
const line = computed(() => (arrived.value ? '마을에 새 주민이 와 있어요' : wayText(timeline.value, progress.value)))
</script>

<template>
  <NuxtLink v-if="arrived" :to="`/arrival/${incoming.journeyId}`" class="card arrived">
    <span class="icon" aria-hidden="true">
      <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
      <svg viewBox="0 0 40 40" width="32" height="32" v-html="TRANSPORT_ICON[kind]" />
    </span>
    <span class="main">
      <span class="row"><strong>{{ withJosa(cargo, '이', '가') }} 도착했어요</strong><span class="when">열어 보기</span></span>
      <span class="sub">{{ line }}</span>
    </span>
  </NuxtLink>
  <div v-else class="card" role="group" :aria-label="`${cargo} 오는 중`">
    <span class="icon" aria-hidden="true">
      <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
      <svg viewBox="0 0 40 40" width="32" height="32" v-html="TRANSPORT_ICON[kind]" />
    </span>
    <span class="main">
      <span class="row"><strong>{{ withJosa(cargo, '이', '가') }} 오고 있어요</strong><span class="when">{{ arrivalLabel(incoming.arriveAt, now) }}</span></span>
      <span class="sub">{{ line }}</span>
      <span class="bar" role="progressbar" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100" aria-label="오는 길">
        <span :style="{ width: `${progress * 100}%` }" />
      </span>
    </span>
  </div>
</template>

<style scoped>
.card {
  display: flex; align-items: center; gap: 14px; min-height: 44px; padding: 12px 14px; border-radius: 20px;
  background: rgba(15, 27, 45, 0.94); color: var(--text); text-decoration: none;
}
.card.arrived { border: 2px solid var(--accent); }
.icon { width: 48px; height: 48px; border-radius: 14px; background: #1e3150; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.row strong { font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.when { font-size: 12px; color: var(--accent); flex-shrink: 0; }
.sub { font-size: 12px; color: #c9cfd9; }
.bar { height: 8px; border-radius: 4px; background: #1e3150; overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 4px; background: var(--accent); }
</style>
