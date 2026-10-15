<script setup lang="ts">
import { computed } from 'vue'
import { MOODS, MOOD_LIST, type MoodId } from '../../../shared/data/moods'
import { dateLabel } from '../../../shared/today-text'

/**
 * 1번 화면 (시안 V2Mood): 오늘 하루, 어땠어요? 에너지 × 편안함 네 칸 위의 마음 8개. 한 줄은 선택(기기에만 남는다).
 */
/** invited: 공유 링크로 들어온 사람 (제목이 "당신의 오늘은 어땠어요?") */
const props = defineProps<{ date: string; mood?: MoodId; note: string; invited?: boolean }>()
const emit = defineEmits<{ pick: [mood: MoodId]; note: [text: string]; next: [] }>()

const current = computed(() => (props.mood ? MOODS[props.mood] : undefined))
/** 342×342 좌표를 판 크기에 맞춰 % 로 */
const pct = (v: number) => `${(v / 342) * 100}%`
const NOTE_MAX = 60
</script>

<template>
  <div class="mood-screen">
    <p class="t-kicker">{{ dateLabel(date) }}</p>
    <h1 class="t-title">{{ invited ? '당신의 오늘은 어땠어요?' : '오늘 하루, 어땠어요?' }}</h1>

    <div class="board" role="group" aria-label="오늘의 마음. 위로 갈수록 에너지가 높고, 오른쪽으로 갈수록 편안해요">
      <span class="cell" aria-hidden="true" style="left: 0; top: 0; background: #e0528a; opacity: 0.06" />
      <span class="cell" aria-hidden="true" style="left: 50%; top: 0; background: #f2b33d; opacity: 0.09" />
      <span class="cell" aria-hidden="true" style="left: 0; top: 50%; background: #4c7bd9; opacity: 0.06" />
      <span class="cell" aria-hidden="true" style="left: 50%; top: 50%; background: #3fae84; opacity: 0.08" />
      <span class="axis v" aria-hidden="true" />
      <span class="axis h" aria-hidden="true" />
      <span class="edge top" aria-hidden="true">에너지 높음</span>
      <span class="edge bottom" aria-hidden="true">에너지 낮음</span>
      <span class="edge left" aria-hidden="true">불편한</span>
      <span class="edge right" aria-hidden="true">편안한</span>
      <button
        v-for="m in MOOD_LIST"
        :key="m.id"
        class="mood"
        :class="{ on: m.id === mood }"
        :aria-pressed="m.id === mood"
        :style="{ left: pct(m.dot.x), top: pct(m.dot.y), '--c': m.color }"
        @click="emit('pick', m.id)"
      >
        <span class="dot" aria-hidden="true" />
        <span class="label">{{ m.label }}</span>
      </button>
    </div>

    <div class="current" aria-live="polite">
      <template v-if="current">
        <span class="current-label">{{ current.label }}</span>
        <span class="current-hint">{{ current.scene }}</span>
      </template>
      <span v-else class="current-hint">가장 가까운 마음을 하나 골라 주세요</span>
    </div>

    <label class="note">
      <span class="sr-only">오늘을 한 줄로 (선택, 이 기기에만 남아요)</span>
      <input
        :value="note"
        :maxlength="NOTE_MAX"
        placeholder="한 줄로 남겨도 좋아요 (이 기기에만 남아요)"
        @input="emit('note', ($event.target as HTMLInputElement).value)"
      >
    </label>

    <div class="t-bottom">
      <button class="t-btn" :disabled="!mood" @click="emit('next')">다음</button>
    </div>
  </div>
</template>

<style scoped>
.mood-screen { display: flex; flex-direction: column; flex: 1; }
.board {
  position: relative; margin-top: 28px; width: 100%; max-width: 342px; aspect-ratio: 1; align-self: center;
  border-radius: 24px; background: var(--t-face); overflow: hidden;
}
.cell { position: absolute; width: 50%; height: 50%; }
.axis { position: absolute; background: var(--t-line); }
.axis.v { left: 50%; top: 16px; bottom: 16px; width: 1px; }
.axis.h { top: 50%; left: 16px; right: 16px; height: 1px; }
.edge { position: absolute; font-size: 11px; color: var(--t-faint); }
.edge.top { left: 0; right: 0; top: 10px; text-align: center; }
.edge.bottom { left: 0; right: 0; bottom: 10px; text-align: center; }
.edge.left { left: 12px; top: calc(50% - 8px); }
.edge.right { right: 12px; top: calc(50% - 8px); }
.mood {
  position: absolute; width: 88px; height: 64px; margin: -24px 0 0 -44px; padding: 0; border: 0; background: transparent;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer;
}
.dot {
  width: 14px; height: 14px; border-radius: 50%; background: var(--c);
  transition: width var(--motion-enter) var(--motion-ease), height var(--motion-enter) var(--motion-ease), box-shadow var(--motion-enter) var(--motion-ease);
}
.label { font-size: 13px; font-weight: 500; color: var(--t-sub); white-space: nowrap; }
.mood.on .dot { width: 22px; height: 22px; box-shadow: 0 0 0 6px color-mix(in srgb, var(--c) 20%, transparent); }
.mood.on .label { color: var(--t-text); font-weight: 700; }
.current { margin-top: 24px; min-height: 56px; display: flex; flex-direction: column; gap: 6px; }
.current-label { font-size: 22px; font-weight: 700; }
.current-hint { font-size: 15px; color: var(--t-sub); }
.note { margin-top: 12px; display: block; }
.note input {
  width: 100%; height: 44px; padding: 0; border: 0; border-bottom: 1px solid var(--t-line); background: transparent;
  outline: none; font-size: 15px; color: var(--t-text);
}
.note input:focus { border-bottom-color: var(--t-text); }
.note input::placeholder { color: #a3a8b0; }
</style>
