<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { lockedNotice, stepOf, type FeatureId } from '../../shared/unlocks'
import { MOTION } from '../utils/motion'

const route = useRoute()
const game = useGame()
interface Tab {
  to: string
  label: string
  icon: string
  also?: string[]
  /** 이 기능이 잠겨 있으면 흐리게 + 자물쇠, 누르면 안내 (shared/unlocks.ts) */
  feature?: FeatureId
}
const items: Tab[] = [
  // 마을 탭은 물건 넣기(/add)·미스터리·테스트·도착, 그리고 마을 메뉴에서 여는 지난 기록(/result·/threads)에서도 켜져 있다
  { to: '/', label: '마을', also: ['/add', '/mystery', '/test', '/arrival', '/result', '/threads'], icon: 'M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z' },
  // 도감 탭은 여정 3번 뒤에 열린다. 잠겨 있어도 숨기지 않는다
  { to: '/dex', label: '도감', feature: 'dex', icon: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6' },
]
const locked = (item: Tab) => !!item.feature && !game.opens(item.feature)
const active = (item: Tab) =>
  (item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)) || !!item.also?.some((p) => route.path.startsWith(p))

/** 잠긴 탭을 누르면 탭 위에 짧은 안내 */
const note = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(timer))
function tapLocked(item: Tab) {
  const state = game.unlockState(stepOf(item.feature!).id)
  if (state.kind === 'open') return
  note.value = lockedNotice(state)
  clearTimeout(timer)
  timer = setTimeout(() => { note.value = '' }, MOTION.noticeMs * 2)
}
const cols = computed(() => `repeat(${items.length}, 1fr)`)
</script>

<template>
  <nav class="nav" aria-label="주요 메뉴" :style="{ gridTemplateColumns: cols }">
    <p v-if="note" class="note" role="status">{{ note }}</p>
    <template v-for="item in items" :key="item.to">
      <button v-if="locked(item)" class="item locked" :aria-label="`${item.label}, 잠김`" @click="tapLocked(item)">
        <span class="icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="item.icon" />
          </svg>
          <svg class="lock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        </span>
        <span>{{ item.label }}</span>
      </button>
      <NuxtLink v-else :to="item.to" class="item" :class="{ on: active(item) }">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="item.icon" />
        </svg>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </template>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: grid;
  padding: 8px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(15, 27, 45, 0.94);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--line);
  z-index: 20;
}
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 52px;
  justify-content: center;
  color: var(--faint);
  text-decoration: none;
  font-size: 12px;
  font-family: inherit;
  border: 0;
  background: none;
  cursor: pointer;
}
.item.on { color: var(--accent); }
.item.locked { opacity: 0.5; }
.icon-wrap { position: relative; display: inline-flex; }
.lock { position: absolute; right: -8px; bottom: -3px; padding: 1px; border-radius: 4px; background: rgba(15, 27, 45, 0.94); }
.note {
  position: absolute; left: 12px; right: 12px; bottom: calc(100% + 8px); margin: 0;
  padding: 10px 14px; border-radius: 14px; background: #f3f1ea; color: #1a1a22;
  font-size: 13px; font-weight: 700; text-align: center; word-break: keep-all;
  animation: rise var(--motion-enter) var(--motion-ease);
}
</style>
