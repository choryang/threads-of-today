<script setup lang="ts">
import { computed, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { INTRO_PHRASES, introText, tastyItemFor, type IntroPhraseId } from '../../shared/intro'

/**
 * 이 분 소개하기: 정해진 문구 중 하나를 고르면 소개 링크(/p/{token})를 만들어 Web Share로 보낸다(안 되면 링크 복사).
 * 자유 입력은 없다. "맛있어서" 문구는 이 분을 만난 여정의 물건이 먹는 대표 물건일 때만 고를 수 있다.
 */
const props = defineProps<{ personId: string }>()
const emit = defineEmits<{ close: [] }>()
const game = useGame()
const share = useShare()

const person = computed(() => PEOPLE[props.personId]!)
const item = computed(() => tastyItemFor(game.state.people?.[props.personId]?.metNames))
const options = computed(() =>
  INTRO_PHRASES.filter((p) => !p.needsItem || item.value).map((p) => ({ id: p.id, text: introText(p.id, item.value?.id) })),
)
const chosen = ref<IntroPhraseId | null>(null)
const busy = ref(false)
const message = ref('')

async function send() {
  if (!chosen.value || busy.value) return
  busy.value = true
  message.value = ''
  try {
    const made = await share.introduce(props.personId, game.nickname.value, chosen.value, chosen.value === 'tasty' ? item.value?.id : undefined)
    if (!made) {
      message.value = '지금은 소개 링크를 만들 수 없어요. 잠시 후 다시 해 주세요'
      return
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: made.title, url: made.url })
        emit('close')
        return
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
      }
    }
    await navigator.clipboard?.writeText(made.url)
    message.value = '소개 링크를 복사했어요. 친구에게 붙여 넣어 보내 주세요'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <button class="close" aria-label="닫기" @click="emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <h2 id="intro-title" class="title">{{ person.name ?? person.job }} 소개하기</h2>
      <p class="sub">보낼 한마디를 골라 주세요</p>
      <div class="options" role="radiogroup" aria-label="소개 문구">
        <button
          v-for="o in options"
          :key="o.id"
          class="option"
          role="radio"
          :aria-checked="chosen === o.id"
          :class="{ on: chosen === o.id }"
          @click="chosen = o.id"
        >
          {{ o.text }}
        </button>
      </div>
      <p v-if="message" class="message" role="status">{{ message }}</p>
      <button class="send" :disabled="!chosen || busy" @click="send">{{ busy ? '만드는 중…' : '소개 보내기' }}</button>
    </section>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(5, 10, 20, 0.55); }
.sheet {
  position: relative; width: 100%; max-width: 480px; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 10px; padding: 20px 20px calc(24px + env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0; background: var(--paper); color: var(--ink); animation: sheet-up var(--motion-enter) var(--motion-ease);
}
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.close { position: absolute; right: 10px; top: 10px; width: 44px; height: 44px; border: 0; border-radius: 22px; background: none; color: #5a5a66; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.title { margin: 0; font-size: 20px; }
.sub { margin: 0; font-size: 13px; color: #4a4a55; }
.options { display: flex; flex-direction: column; gap: 8px; }
.option {
  min-height: 52px; padding: 10px 14px; border-radius: 14px; border: 2px solid #ddd8ca; background: #fff; color: var(--ink);
  font-size: 15px; text-align: left; line-height: 1.45; word-break: keep-all; cursor: pointer;
}
.option.on { border-color: #1a1a22; background: #fff3cf; font-weight: 700; }
.message { margin: 0; font-size: 13px; color: #4a4a55; }
.send { min-height: 54px; border: 0; border-radius: 18px; background: #1f5a73; color: #f3f1ea; font-size: 16px; font-weight: 700; cursor: pointer; }
.send:disabled { background: #c9c4b5; color: #4a4a55; cursor: default; }
</style>
