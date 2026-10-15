<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { sceneOf, sceneSrc } from '../../../shared/data/scenes'
import { SKY, skyPhase } from '../../../shared/local-time'

/**
 * 장면 그림을 그곳 시각의 색으로 물들인다 (shared/local-time.ts의 SKY: 가이드 표의 덧씌우는 색·섞는 방식).
 * 그림이 아직 없거나 못 읽으면 그곳 시각 색의 단색 면. decorative면 대체 글 없이(옆에 같은 내용이 글로 있을 때)
 */
const props = defineProps<{ personId: string; hour: number; decorative?: boolean }>()

const scene = computed(() => sceneOf(props.personId))
const look = computed(() => SKY[skyPhase(props.hour)])
const ok = ref(false)
watch(scene, () => { ok.value = false })
const tint = computed(() => {
  const o = look.value.overlay
  return o ? { background: o.color, mixBlendMode: o.blend, opacity: o.opacity } : undefined
})
</script>

<template>
  <div class="scene-image" :style="{ background: look.sky }" :role="decorative || !scene ? undefined : 'img'" :aria-label="decorative ? undefined : scene?.alt">
    <img v-if="scene" v-show="ok" :src="sceneSrc(scene.id)" alt="" @load="ok = true" @error="ok = false">
    <span v-if="ok && tint" class="tint" :style="tint" aria-hidden="true" />
  </div>
</template>

<style scoped>
.scene-image { position: relative; overflow: hidden; isolation: isolate; transition: background var(--motion-enter) var(--motion-ease); }
img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 60%; display: block; }
.tint { position: absolute; inset: 0; pointer-events: none; }
</style>
