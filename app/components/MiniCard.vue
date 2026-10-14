<script setup lang="ts">
import { computed } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'

const props = defineProps<{ personId: string; locked?: boolean; isNew?: boolean; thanked?: boolean }>()
const person = computed(() => PEOPLE[props.personId]!)
const place = computed(() => PLACES[person.value.placeId]!)
</script>

<template>
  <div class="mini" :class="[`rarity-${person.rarity}`, { locked }]">
    <span v-if="isNew" class="new mono">NEW</span>
    <svg v-if="thanked && !locked" class="thanked" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="고마움을 전함"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
    <Character :person-id="personId" :locked="locked" :size="72" />
    <span class="job">{{ locked ? '???' : person.job }}</span>
    <span class="where">{{ locked ? ' ' : place.country || '바다 위' }}</span>
  </div>
</template>

<style scoped>
.mini {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px 12px;
  border-radius: 16px;
  background: var(--surface);
  border: 2px solid var(--rarity);
  text-align: center;
  height: 100%;
}
.mini.locked { border-color: var(--line); border-style: dashed; }
.job { font-size: 12px; font-weight: 700; line-height: 1.3; word-break: keep-all; }
.where { font-size: 11px; color: var(--muted); min-height: 1em; }
.thanked { position: absolute; top: 7px; left: 7px; color: var(--bad); }
.new {
  position: absolute; top: 6px; right: 6px;
  font-size: 10px; padding: 2px 5px; border-radius: 6px;
  background: var(--bad); color: #fff;
}
</style>
