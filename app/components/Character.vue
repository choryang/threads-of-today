<script setup lang="ts">
import { computed } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { BODY_COLORS, characterSvg } from '../utils/character'

const props = withDefaults(defineProps<{ personId: string; locked?: boolean; size?: number; bob?: boolean }>(), {
  locked: false,
  size: 96,
  bob: false,
})

const svg = computed(() => {
  const person = PEOPLE[props.personId]
  if (!person) return ''
  const continent = PLACES[person.placeId]?.continent ?? 'korea'
  return characterSvg({ hat: person.look.hat, prop: person.look.prop, body: BODY_COLORS[continent], locked: props.locked })
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 120 120"
    aria-hidden="true"
    :class="{ bob }"
    v-html="svg"
  />
</template>

<style scoped>
svg { display: block; overflow: visible; }
.bob { animation: bob 2.4s ease-in-out infinite; }
</style>
