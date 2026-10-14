<script setup lang="ts">
import { SPEEDS } from '../../shared/timing'

const game = useGame()
</script>

<template>
  <div class="speed" role="radiogroup" aria-label="여정 배속">
    <button
      v-for="v in SPEEDS"
      :key="v"
      type="button"
      role="radio"
      class="mono"
      :class="{ on: game.speed.value === v }"
      :aria-checked="game.speed.value === v"
      @click="game.setSpeed(v)"
    >
      {{ v }}배
    </button>
  </div>
</template>

<style scoped>
.speed {
  display: inline-flex; flex-shrink: 0; padding: 2px; gap: 2px;
  border-radius: 999px; background: var(--surface); border: 1px solid var(--line);
}
button {
  min-width: 44px; min-height: 44px; padding: 0 8px;
  border: 0; border-radius: 999px; background: transparent; color: var(--muted); font-size: 13px;
}
button.on { background: var(--accent); color: var(--accent-ink); font-weight: 700; }
</style>
