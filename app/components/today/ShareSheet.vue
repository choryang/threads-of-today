<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { TodayRecord } from '../../../shared/progress'
import { savePng } from '../../utils/share-image'
import { threadHeader } from '../../../shared/share'
import { MOTION } from '../../utils/motion'
import { drawThreadCard, threadPayload } from '../../composables/useThreadShare'

/**
 * 카드로 남기기: 오늘의 실 카드(V2Quote)를 그려 보여 주고, 보내기·이미지 저장·링크 복사.
 * 링크를 연 사람은 "당신의 오늘은 어땠어요?"(1번 화면)로 시작한다. 한 줄·직접 쓴 말은 카드와 링크에 넣지 않는다
 */
const props = defineProps<{ date: string; record: TodayRecord }>()
const emit = defineEmits<{ close: [] }>()

const canvas = document.createElement('canvas')
const preview = ref('')
const link = ref<string | null>(null)
const making = ref(true)
const notice = ref('')
const { linkFor } = useThreadShare()

onMounted(async () => {
  await drawThreadCard(canvas, threadPayload(props.date, props.record))
  preview.value = canvas.toDataURL('image/jpeg', 0.9)
  link.value = await linkFor(props.date, props.record, canvas)
  making.value = false
})

function say(text: string) {
  notice.value = text
  setTimeout(() => { if (notice.value === text) notice.value = '' }, MOTION.noticeMs * 2)
}
const filename = () => `내-하루에-닿은-사람-${props.date}.png`

async function send() {
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
  const file = blob ? new File([blob], filename(), { type: 'image/png' }) : null
  const data: ShareData = { title: threadHeader(threadPayload(props.date, props.record)), ...(link.value ? { url: link.value } : {}) }
  try {
    if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ ...data, files: [file] })
    else if (navigator.share) await navigator.share(data)
    else await copy()
  } catch {
    // 보내기를 닫았으면 그대로
  }
}
async function saveImage() {
  await savePng(canvas, filename())
  say('이미지를 저장했어요')
}
async function copy() {
  if (!link.value) return
  try {
    await navigator.clipboard.writeText(link.value)
    say('링크를 복사했어요')
  } catch {
    say(link.value)
  }
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-label="카드로 남기기">
      <button class="close" aria-label="닫기" @click="emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <h2 class="title">카드로 남기기</h2>
      <div class="preview">
        <img v-if="preview" :src="preview" :alt="`${threadHeader(threadPayload(date, record))} 카드`">
      </div>
      <p class="hint">한 줄과 직접 쓴 말은 카드와 링크에 들어가지 않아요.</p>
      <div class="buttons">
        <button class="t-btn" :disabled="!preview" @click="send">보내기</button>
        <div class="row">
          <button class="t-btn secondary" :disabled="!preview" @click="saveImage">이미지 저장</button>
          <button class="t-btn secondary" :disabled="!link" @click="copy">{{ making ? '링크 만드는 중…' : link ? '링크 복사' : '링크를 만들 수 없어요' }}</button>
        </div>
      </div>
      <p class="notice" role="status">{{ notice }}</p>
    </section>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; justify-content: center; background: rgba(20, 22, 26, 0.45); }
.sheet {
  position: relative; width: 100%; max-width: 480px; max-height: 92dvh; overflow-y: auto;
  padding: 24px 24px calc(24px + env(safe-area-inset-bottom)); border-radius: 24px 24px 0 0; background: #ffffff;
  display: flex; flex-direction: column; gap: 14px; color: var(--t-text);
}
.close { position: absolute; top: 10px; right: 10px; width: 44px; height: 44px; border: 0; background: none; color: var(--t-sub); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.title { margin: 0; font-size: 17px; font-weight: 700; }
.preview { align-self: center; width: 62%; aspect-ratio: 1080 / 1350; border-radius: 12px; overflow: hidden; background: var(--t-face); }
.preview img { width: 100%; height: 100%; display: block; }
.hint { margin: 0; font-size: 13px; color: var(--t-sub); text-align: center; word-break: keep-all; }
.buttons { display: flex; flex-direction: column; gap: 10px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.row .t-btn { font-size: 15px; }
.notice { margin: 0; min-height: 20px; font-size: 13px; color: var(--t-sub); text-align: center; word-break: break-all; }
</style>
