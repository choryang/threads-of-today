<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { friendshipOf } from '../../shared/friendship'
import { MOTION, reducedMotion } from '../utils/motion'

/**
 * 여정 중 아는 사람을 다시 만났을 때: "또 만났어요 · 커피에서도 만났던 분이에요"와 함께
 * 친해진 정도가 이 만남 전 값에서 지금 값으로 MOTION.friendUpMs 동안 오른다. 처음 만난 사람이면 그리지 않는다.
 */
const props = defineProps<{ personId: string; journeyId: string; journeyName: string }>()
const game = useGame()

const info = computed(() => {
  const log = game.state.people?.[props.personId]
  if (!log?.metItems.includes(props.journeyId)) return null
  const others = log.metItems.filter((id) => id !== props.journeyId)
  if (!others.length) return null
  const before = friendshipOf({ ...log, metItems: others }).percent
  const after = friendshipOf(log).percent
  // 다른 물건 이름이 있으면 그것, 같은 물건을 또 떠났으면 그 물건, 예전 기록(legacy)뿐이면 이름 없이
  const known = others.some((id) => !id.startsWith('legacy:'))
  const prev = (log.metNames ?? []).find((n) => n !== props.journeyName) ?? (known ? props.journeyName : '')
  return { before, after, prev }
})

const shown = ref(0)
let raf = 0
onMounted(() => {
  const i = info.value
  if (!i) return
  if (reducedMotion() || i.before === i.after) {
    shown.value = i.after
    return
  }
  shown.value = i.before
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / MOTION.friendUpMs)
    shown.value = Math.round(i.before + (i.after - i.before) * t)
    if (t < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div v-if="info" class="again" role="status">
    <p class="text">
      <strong>또 만났어요</strong>
      <span> · {{ info.prev ? `${info.prev}에서도 만났던 분이에요` : '전에 만났던 분이에요' }}</span>
    </p>
    <div class="row">
      <span class="bar" aria-hidden="true"><span class="fill" :style="{ width: `${shown}%` }" /></span>
      <span class="pct mono">{{ shown }}%</span>
    </div>
  </div>
</template>

<style scoped>
.again {
  display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;
  padding: 10px 14px; border-radius: 14px; background: var(--surface); border: 1px solid var(--accent);
  animation: rise var(--motion-enter) var(--motion-ease);
}
.text { margin: 0; font-size: 14px; line-height: 1.45; word-break: keep-all; }
.text strong { color: var(--accent); }
.row { display: flex; align-items: center; gap: 10px; }
.bar { flex: 1; height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; }
.fill { display: block; height: 100%; background: var(--accent); }
.pct { font-size: 15px; color: var(--accent); min-width: 44px; text-align: right; }
</style>
