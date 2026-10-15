<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withJosa } from '../../shared/logic'
import type { ShownForm } from '../../shared/rewind'
import { MOTION, reducedMotion } from '../utils/motion'

/**
 * 빨리 감기 엔딩: 거슬러 올라오며 만난 사람들이 원래 순서(원산지 → 나)로 한 명씩 지나가며 물건을 다시 완성한다.
 * 끝나거나 건너뛰면 done. 움직임 줄이기를 켠 사용자는 바로 done.
 */
const props = defineProps<{ frames: Array<{ personId: string; form: ShownForm }>; productId: string; itemName: string }>()
const emit = defineEmits<{ done: [] }>()

const index = ref(0)
const frame = computed(() => props.frames[Math.min(index.value, props.frames.length - 1)])
let timer: ReturnType<typeof setInterval> | undefined

function finish() {
  clearInterval(timer)
  emit('done')
}

onMounted(() => {
  if (reducedMotion() || props.frames.length === 0) return finish()
  timer = setInterval(() => {
    if (index.value >= props.frames.length - 1) return finish()
    index.value++
  }, MOTION.replayStepMs)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="replay" :aria-label="`${withJosa(itemName, '이', '가')} 다시 내 손까지 오는 길`">
    <p class="kicker">되감기</p>
    <p class="title display">이제 다시 내 손까지</p>
    <div v-if="frame" class="who">
      <!-- 사람마다 key를 바꿔 지나가는 효과 -->
      <div :key="index" class="pass">
        <Character :person-id="frame.personId" :size="120" />
      </div>
      <FormBadge :form="frame.form" :product-id="productId" quick />
    </div>
    <div class="track" aria-hidden="true">
      <span :style="{ width: `${((index + 1) / Math.max(1, frames.length)) * 100}%` }" />
    </div>
    <button class="btn btn-block" @click="finish">건너뛰기</button>
  </section>
</template>

<style scoped>
.replay {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 20px 16px; border-radius: 20px;
  background: linear-gradient(180deg, var(--surface), var(--ground)); border: 1px solid var(--line);
}
.kicker { margin: 0; font-size: 12px; font-weight: 700; color: var(--accent); }
.title { margin: 0; font-size: 24px; }
.who { display: flex; flex-direction: column; align-items: center; gap: 8px; min-height: 190px; }
.pass { animation: walk-by var(--motion-replay) linear; }
@keyframes walk-by {
  from { transform: translateX(-24px); opacity: 0.4; }
  to { transform: translateX(0); opacity: 1; }
}
.track { width: 100%; height: 4px; border-radius: 2px; background: var(--line); overflow: hidden; }
.track span { display: block; height: 100%; background: var(--accent); }
</style>
