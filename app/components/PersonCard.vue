<script setup lang="ts">
import { computed } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { thanksReply } from '../../shared/thanks'
import { badgeOf } from '../utils/labels'

const props = defineProps<{ personId: string; isNew?: boolean; number?: number }>()
const person = computed(() => PEOPLE[props.personId]!)
const place = computed(() => PLACES[person.value.placeId]!)

const game = useGame()
const met = computed(() => game.owns(props.personId))
const thanked = computed(() => game.thanked(props.personId))
const reply = computed(() => (thanked.value ? thanksReply(props.personId) : ''))
</script>

<template>
  <article class="card" :class="`rarity-${person.rarity}`">
    <header class="top">
      <span class="mono no">{{ number ? `No.${String(number).padStart(3, '0')}` : place.country || '바다' }}</span>
      <span class="badge">{{ badgeOf(person) }}</span>
    </header>
    <div class="art">
      <Character :person-id="personId" :size="150" bob />
      <span v-if="isNew" class="new">NEW</span>
    </div>
    <div class="body">
      <h3 class="job">{{ person.job }}</h3>
      <p class="place">{{ place.name }}<template v-if="place.country && !place.name.includes(place.country)"> · {{ place.country }}</template></p>
      <p class="story">{{ person.story }}</p>
      <div v-if="met" class="thanks" aria-live="polite">
        <button v-if="!thanked" class="thank-btn" @click="game.thank(personId)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
          고마워요
        </button>
        <template v-else>
          <p class="reply">“{{ reply }}”</p>
          <p class="thanked-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
            고마움을 전했어요
          </p>
        </template>
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
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--bad);
  color: #fff;
}
.body { padding: 14px 18px 20px; display: flex; flex-direction: column; gap: 4px; }
.job { margin: 0; font-size: 20px; }
.place { margin: 0; font-size: 13px; color: #4a4a4a; }
.story { margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: #2a2a2a; }
.thanks { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
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
