<script setup lang="ts">
import { JOBS, type JobId } from '../../../shared/data/jobs'

/**
 * 하는 일 묻기 (docs/redesign/README.md): 아래에서 올라오는 시트. 고르면 그 일, "말하지 않을래요"나 닫기는 declined.
 * 결말의 반전은 미리 말하지 않는다. current: 이미 고른 일(바꾸기로 열었을 때)
 */
defineProps<{ current?: JobId }>()
const emit = defineEmits<{ choose: [value: JobId | 'declined']; close: [] }>()
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="job-title">
      <button class="close" aria-label="닫기" @click="emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <h2 id="job-title" class="title">당신의 하루도 누군가에게 닿아 있을지 몰라요. 어떤 일을 하는지 알려 줄래요?</h2>
      <ul class="jobs" role="list">
        <li v-for="j in JOBS" :key="j.id">
          <button :class="{ on: current === j.id }" :aria-pressed="current === j.id" @click="emit('choose', j.id)">{{ j.label }}</button>
        </li>
      </ul>
      <button class="decline" @click="emit('choose', 'declined')">말하지 않을래요</button>
    </section>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; justify-content: center; background: rgba(20, 22, 26, 0.45); }
.sheet {
  position: relative; width: 100%; max-width: 480px; max-height: 92dvh; overflow-y: auto;
  padding: 28px 24px calc(24px + env(safe-area-inset-bottom)); border-radius: 24px 24px 0 0; background: #ffffff; color: #14161a;
  display: flex; flex-direction: column; gap: 20px; font-family: 'Noto Sans KR', system-ui, sans-serif;
}
.close { position: absolute; top: 10px; right: 10px; width: 44px; height: 44px; border: 0; background: none; color: #6b7079; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.title { margin: 0; padding-right: 32px; font-size: 20px; font-weight: 700; line-height: 1.45; letter-spacing: -0.01em; word-break: keep-all; }
.jobs { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.jobs button {
  width: 100%; min-height: 48px; padding: 0 6px; border: 0; border-radius: 14px; background: #f1f2f5; color: #14161a;
  font: inherit; font-size: 15px; cursor: pointer; word-break: keep-all;
}
.jobs button.on { background: #14161a; color: #ffffff; font-weight: 700; }
.decline { align-self: center; min-height: 44px; padding: 0 12px; border: 0; background: none; color: #6b7079; font: inherit; font-size: 14px; text-decoration: underline; cursor: pointer; }
</style>
