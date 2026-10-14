<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { productIconSvg } from '../utils/product-icon'

/** 여정 끝 장면: 만난 사람들이 한 줄로 서서, 오른쪽 끝의 물건을 향해 차례로 손을 흔든다 */
const props = defineProps<{ people: string[]; productId: string; itemName: string }>()

/** 사람마다 손을 흔들기 시작하는 간격 */
const WAVE_GAP_MS = 150

const waved = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 움직임을 줄이는 설정이면 모두 한꺼번에 흔든다
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    waved.value = props.people.length
    return
  }
  timer = setInterval(() => {
    waved.value++
    if (waved.value >= props.people.length && timer) clearInterval(timer)
  }, WAVE_GAP_MS)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="scene" role="img" :aria-label="`만난 사람 ${people.length}명이 ${itemName}에게 손을 흔들어요`">
    <ol class="row">
      <li v-for="(pid, i) in people" :key="pid + i" class="who">
        <Character :person-id="pid" :size="44" :wave="i < waved" />
      </li>
    </ol>
    <div class="item">
      <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
      <svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true" v-html="productIconSvg(productId)" />
    </div>
  </div>
</template>

<style scoped>
.scene {
  display: flex; align-items: flex-end; gap: 6px;
  padding: 20px 12px 12px; border-radius: 20px;
  background: linear-gradient(180deg, var(--surface), var(--ground));
  border: 1px solid var(--line);
}
.row {
  flex: 1; min-width: 0; list-style: none; margin: 0; padding: 0;
  display: flex; justify-content: flex-end; align-items: flex-end;
}
/* 사람이 많으면 조금씩 겹쳐 선다 */
.who { flex: 0 1 44px; min-width: 26px; display: flex; justify-content: center; }
.item {
  flex-shrink: 0; width: 60px; height: 60px; margin-left: 4px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; background: var(--paper);
  box-shadow: 0 0 0 6px rgba(242, 193, 78, 0.18);
  animation: pop-in 0.4s ease-out;
}
</style>
