<script setup lang="ts">
import { ref } from 'vue'
import { MOODS, type MoodId } from '../../../shared/data/moods'

/**
 * 2번 화면 (시안 V2Item): 오늘 손에 닿은 물건은요? 입력 + 자주 고르는 것.
 * 고른 이름을 그대로 넘기고, 재료 찾기는 부모가 한다(resolveItem). 찾는 동안 busy
 */
const props = defineProps<{ mood: MoodId; choices: string[]; busy?: boolean; error?: string; initial?: string }>()
const emit = defineEmits<{ back: []; next: [name: string] }>()

const query = ref(props.initial ?? '')
const picked = ref<string | null>(props.initial && props.choices.includes(props.initial) ? props.initial : null)

function choose(name: string) {
  picked.value = name
  query.value = name
}
function onInput(v: string) {
  query.value = v
  picked.value = props.choices.includes(v) ? v : null
}
function submit() {
  const v = query.value.trim()
  if (v && !props.busy) emit('next', v)
}
</script>

<template>
  <div class="item-screen" :style="{ '--mood': MOODS[mood].color }">
    <div class="top">
      <button class="t-back" aria-label="뒤로" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <span class="mood-chip"><span class="t-dot" aria-hidden="true" />{{ MOODS[mood].label }}</span>
    </div>
    <h1 class="t-title">오늘 손에 닿은{{ '\n' }}물건은요?</h1>

    <form class="ask" @submit.prevent="submit">
      <label for="today-item" class="sr-only">물건 이름</label>
      <input
        id="today-item"
        :value="query"
        placeholder="아무 물건이나"
        maxlength="60"
        autocomplete="off"
        enterkeyhint="go"
        @input="onInput(($event.target as HTMLInputElement).value)"
      >
    </form>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <span class="list-title">자주 고르는 것</span>
    <ul class="choices">
      <li v-for="name in choices" :key="name">
        <button :aria-pressed="picked === name" :class="{ on: picked === name }" @click="choose(name)">
          <span>{{ name }}</span>
          <span class="mark" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <div class="t-bottom">
      <button class="t-btn" :disabled="!query.trim() || busy" @click="submit">{{ busy ? '실을 찾는 중…' : '실 따라가기' }}</button>
    </div>
  </div>
</template>

<style scoped>
.item-screen { display: flex; flex-direction: column; flex: 1; }
.top { display: flex; align-items: center; justify-content: space-between; }
.mood-chip { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--t-sub); }
.t-title { margin-top: 20px; }
.ask input {
  margin-top: 28px; width: 100%; height: 56px; padding: 0; border: 0; border-bottom: 2px solid var(--t-text);
  background: transparent; outline: none; font-size: 22px; font-weight: 500; color: var(--t-text);
}
.ask input::placeholder { color: #a3a8b0; }
.error { margin: 10px 0 0; font-size: 14px; color: #b23a3a; word-break: keep-all; }
.list-title { margin-top: 28px; font-size: 13px; color: var(--t-sub); }
.choices { list-style: none; margin: 4px 0 0; padding: 0; }
.choices li { border-bottom: 1px solid var(--t-line); }
.choices button {
  width: 100%; height: 56px; padding: 0; border: 0; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between; font-size: 17px; text-align: left; color: var(--t-quiet);
}
.choices button.on { color: var(--t-text); font-weight: 700; }
.mark { width: 8px; height: 8px; border-radius: 4px; }
.choices button.on .mark { background: var(--mood); }
</style>
