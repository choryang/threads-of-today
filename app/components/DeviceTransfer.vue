<script setup lang="ts">
import { computed, ref } from 'vue'

const { status, sync, restore } = useSync()
const mode = ref<'closed' | 'show' | 'enter'>('closed')
const code = ref('')
const message = ref('')
const ok = ref(false)
const busy = ref(false)
const copied = ref(false)
const uid = useId()

const myCode = computed(() => status.profile?.code ?? '')

async function showCode() {
  mode.value = mode.value === 'show' ? 'closed' : 'show'
  message.value = ''
  if (mode.value === 'show' && !myCode.value) await sync()
}

async function copy() {
  try {
    await navigator.clipboard.writeText(myCode.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // 복사가 막힌 브라우저: 화면의 코드를 보고 적으면 된다
  }
}

async function submit() {
  if (!code.value.trim() || busy.value) return
  busy.value = true
  const res = await restore(code.value)
  busy.value = false
  ok.value = res.ok
  message.value = res.message
  if (res.ok) code.value = ''
}
</script>

<template>
  <section class="transfer panel" aria-labelledby="transfer-title">
    <h2 id="transfer-title" class="h2">다른 기기에서 이어 하기</h2>
    <p class="muted small">복구 코드를 다른 기기에 입력하면 두 기기의 기록이 합쳐져요. 코드는 나만 알고 있어 주세요.</p>

    <div class="t-actions">
      <button type="button" class="btn" :aria-expanded="mode === 'show'" @click="showCode">코드 보기</button>
      <button type="button" class="btn" :aria-expanded="mode === 'enter'" @click="mode = mode === 'enter' ? 'closed' : 'enter'; message = ''">코드 입력</button>
    </div>

    <div v-if="mode === 'show'" class="t-body">
      <template v-if="myCode">
        <p class="t-code mono" aria-label="내 복구 코드">{{ myCode }}</p>
        <button type="button" class="btn btn-block" @click="copy">{{ copied ? '복사했어요' : '코드 복사하기' }}</button>
      </template>
      <p v-else-if="status.unavailable" class="muted small">지금은 서버에 기록을 저장할 수 없어요. 이 기기에는 그대로 남아 있어요.</p>
      <p v-else class="muted small">{{ status.syncing ? '코드를 만들고 있어요…' : '인터넷에 연결되면 코드가 만들어져요.' }}</p>
    </div>

    <form v-if="mode === 'enter'" class="t-body" @submit.prevent="submit">
      <label :for="uid" class="field-label">복구 코드</label>
      <input :id="uid" v-model="code" class="field mono" placeholder="예) 바다-연필-4827" autocomplete="off" maxlength="30">
      <button class="btn btn-primary btn-block" :disabled="busy || !code.trim()">{{ busy ? '불러오는 중…' : '이어 하기' }}</button>
    </form>

    <p v-if="message" class="t-msg" :class="{ good: ok }" role="status">{{ message }}</p>
  </section>
</template>

<style scoped>
.transfer { display: flex; flex-direction: column; gap: 12px; }
.h2 { margin: 0; font-size: 15px; }
.small { font-size: 13px; margin: 0; }
.t-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.t-actions .btn { min-height: 48px; }
.t-body { display: flex; flex-direction: column; gap: 8px; }
.t-code {
  margin: 0; padding: 14px; border-radius: 14px; background: var(--ground); border: 1px dashed var(--line);
  text-align: center; font-size: 22px; letter-spacing: 1px;
}
.t-msg { margin: 0; font-size: 13px; color: var(--bad); }
.t-msg.good { color: var(--ok); }
</style>
