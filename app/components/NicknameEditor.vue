<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { NICKNAME_MAX } from '../../shared/nickname'

const game = useGame()
const editing = ref(false)
const draft = ref('')
const error = ref('')
const input = ref<HTMLInputElement | null>(null)
const uid = useId()

async function startEdit() {
  draft.value = game.nickname.value
  error.value = ''
  editing.value = true
  await nextTick()
  input.value?.select()
}

function save() {
  if (!game.setNickname(draft.value)) {
    error.value = `1~${NICKNAME_MAX}자로 적어 주세요.`
    return
  }
  editing.value = false
}
</script>

<template>
  <div class="nick">
    <form v-if="editing" class="nick-form" @submit.prevent="save">
      <label :for="uid" class="field-label">닉네임</label>
      <div class="nick-row">
        <input
          :id="uid"
          ref="input"
          v-model="draft"
          class="field"
          placeholder="닉네임"
          :maxlength="NICKNAME_MAX + 8"
          autocomplete="nickname"
          enterkeyhint="done"
          @keydown.esc="editing = false"
        >
        <button class="btn btn-primary nick-btn">저장</button>
        <button type="button" class="btn nick-btn" @click="editing = false">취소</button>
      </div>
      <p v-if="error" class="nick-error" role="alert">{{ error }}</p>
    </form>
    <button v-else type="button" class="nick-show" :aria-label="`닉네임 ${game.nickname.value}, 바꾸기`" @click="startEdit">
      <span class="nick-name">{{ game.nickname.value }}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.nick-show {
  display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px;
  border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--text);
  font-size: 14px; font-weight: 700; max-width: 100%;
}
.nick-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nick-show svg { color: var(--muted); flex-shrink: 0; }
.nick-form { display: flex; flex-direction: column; gap: 6px; }
.nick-row { display: flex; gap: 6px; }
.nick-btn { min-height: 48px; padding: 0 14px; flex-shrink: 0; }
.nick-error { margin: 0; font-size: 13px; color: var(--bad); }
</style>
