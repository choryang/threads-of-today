<script setup lang="ts">
import { computed, useId } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { BODY_COLORS, CHARACTER_VIEWBOX, STANDING_VIEWBOX, characterSvg } from '../utils/character'

/**
 * standing: 마을처럼 발끝에 맞춰 세울 때. 높이 size, 폭은 그 0.737배(190 → 140)이고 발끝이 상자 아래 끝에 온다.
 * 아니면 size×size 정사각형(카드·얼굴).
 */
const props = withDefaults(defineProps<{ personId: string; locked?: boolean; size?: number; bob?: boolean; wave?: boolean; standing?: boolean }>(), {
  locked: false,
  size: 96,
  bob: false,
  wave: false,
  standing: false,
})
const box = computed(() => (props.standing ? { w: Math.round((props.size * 440) / 597), h: props.size, vb: STANDING_VIEWBOX } : { w: props.size, h: props.size, vb: CHARACTER_VIEWBOX }))

// outfit-sailor의 clipPath id가 한 페이지에서 겹치지 않게 그릴 때마다 접미사를 붙인다
const uid = useId()

const person = computed(() => PEOPLE[props.personId])
const skin = computed(() => {
  if (!person.value || props.locked) return undefined
  return `--skin:${BODY_COLORS[PLACES[person.value.placeId]?.continent ?? 'korea']}`
})
const svg = computed(() => {
  const p = person.value
  if (!p) return ''
  const s = characterSvg(p, { locked: props.locked, wave: props.wave && !props.locked })
  return p.look.outfit === 'sailor' ? s.replace(/clip-sailor/g, `clip-sailor-${uid}`) : s
})
</script>

<template>
  <svg
    :width="box.w"
    :height="box.h"
    :viewBox="box.vb"
    aria-hidden="true"
    :class="{ bob, wave: wave && !locked }"
    :style="skin"
    v-html="svg"
  />
</template>

<style scoped>
svg { display: block; overflow: visible; }
.bob { animation: bob var(--motion-bob) ease-in-out infinite; }
/* body-wave는 왼팔이 rotate(100 196 388)만큼 올라가 있다. 옷의 왼쪽 소매도 같이 돌린다 */
.wave :deep(.sleeve-l) { transform: rotate(100deg); transform-origin: 196px 388px; }
.wave { animation: hop var(--motion-wave) ease-out; }
.bob.wave { animation: hop var(--motion-wave) ease-out, bob var(--motion-bob) ease-in-out infinite; }
@keyframes hop {
  0%, 100% { translate: 0 0; }
  40% { translate: 0 -8%; }
}
</style>
