<script setup lang="ts">
import { computed } from 'vue'
import { seenEpisodes } from '../../shared/key-story'

/**
 * 사람 카드의 '이야기' 칸: 핵심 인물 화면에서 지금까지 본 편만 순서대로 (shared/key-story.ts).
 * 안 본 편은 잠긴 칸으로도 보이지 않고, 편 번호·편 수도 쓰지 않는다. 본 편이 없으면 칸 자체가 없다
 */
const props = defineProps<{ personId: string }>()
const game = useGame()
const stories = computed(() => seenEpisodes(props.personId, game.state.keyMeets?.[props.personId] ?? 0))
</script>

<template>
  <details v-if="stories.length" class="stories">
    <summary>
      이야기
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </summary>
    <p v-for="(text, i) in stories" :key="i" class="text">{{ text }}</p>
  </details>
</template>

<style scoped>
.stories { border-top: 1px dashed #c9c4b5; padding-top: 4px; }
summary {
  min-height: 44px; display: flex; align-items: center; gap: 4px; cursor: pointer; list-style: none;
  font-size: 14px; font-weight: 700; color: inherit;
}
summary::-webkit-details-marker { display: none; }
summary svg { transition: transform var(--motion-enter) var(--motion-ease); }
.stories[open] summary svg { transform: rotate(180deg); }
.text { margin: 0 0 10px; font-size: 14px; line-height: 1.7; color: #2a2a35; word-break: keep-all; }
</style>
