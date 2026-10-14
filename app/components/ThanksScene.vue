<script setup lang="ts">
import { computed } from 'vue'
import { SETS } from '../../shared/data/materials'
import { endingLines, setSceneLines } from '../../shared/thanks'

/** 세트 감사 장면과 엔딩. 고마움을 전해 새로 열리면 한 번 뜨고, 엔딩은 도감에서 다시 볼 수 있다 */
const { current, dismiss } = useThanksScenes()
const game = useGame()
const tapestry = useTapestry()

const set = computed(() => {
  const scene = current.value
  return scene?.type === 'set' ? SETS.find((s) => s.id === scene.setId) : undefined
})
const setPeople = computed(() => (set.value ? [...set.value.memberIds, set.value.rewardId] : []))
const lines = computed(() => {
  if (current.value?.type === 'ending') return endingLines(game.nickname.value)
  return set.value ? setSceneLines(set.value.id) : []
})
</script>

<template>
  <div v-if="current" class="scene" :class="current.type" role="dialog" aria-modal="true" :aria-label="current.type === 'ending' ? '엔딩' : '세트 감사 장면'">
    <!-- 엔딩: 완성된 실타래를 배경에 크게 깐다 -->
    <div v-if="current.type === 'ending'" class="ending-bg" aria-hidden="true">
      <ThreadsTapestry :layout="tapestry" :nickname="game.nickname.value" :interactive="false" :labels="false" />
    </div>
    <div class="inner">
      <template v-if="current.type === 'set' && set">
        <p class="mono kicker">THANK YOU</p>
        <h2 class="display title">{{ set.name }}</h2>
        <div class="crowd">
          <Character v-for="id in setPeople" :key="id" :person-id="id" :size="56" bob />
        </div>
      </template>

      <div class="lines">
        <p v-for="(line, i) in lines" :key="i" :style="{ animationDelay: `${0.3 + i * 0.9}s` }">{{ line }}</p>
      </div>
      <button class="btn btn-primary btn-block" @click="dismiss()">{{ current.type === 'ending' ? '닫기' : '계속하기' }}</button>
    </div>
  </div>
</template>

<style scoped>
.scene {
  position: fixed; inset: 0; z-index: 60;
  display: flex; align-items: center; justify-content: center; padding: 24px 20px;
  background: rgba(5, 10, 20, 0.88); backdrop-filter: blur(6px);
  animation: rise 0.3s ease-out;
}
.scene.ending { background: radial-gradient(circle at 50% 30%, #1c2e4a 0, #070c16 75%); }
.inner { width: 100%; max-width: 380px; max-height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; text-align: center; }
.kicker { margin: 0; color: var(--accent); font-size: 12px; }
.title { margin: 0; font-size: 26px; }
.crowd { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
.ending-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.4; pointer-events: none; overflow: hidden; }
.ending-bg > * { width: min(140vw, 140vh); flex-shrink: 0; }
.inner { position: relative; }
.lines { display: flex; flex-direction: column; gap: 10px; }
.lines p { margin: 0; font-size: 17px; line-height: 1.7; opacity: 0; animation: fade-in 0.8s ease-out forwards; }
.ending .lines p { font-size: 18px; }
@keyframes fade-in { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .lines p { animation: none; opacity: 1; } }
</style>
