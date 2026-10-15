<script setup lang="ts">
import { computed } from 'vue'

/**
 * 아래 메뉴: '오늘' · '이어진 사람들' · '걷기' (docs/redesign/README.md).
 * 오늘 흐름의 2~5번 화면(물건·실·그 사람·한마디)은 화면마다 큰 버튼이 있어 메뉴를 감춘다
 */
const route = useRoute()
const today = useToday()

interface Tab {
  to: string
  label: string
  icon: string
  also?: string[]
}
const items: Tab[] = [
  { to: '/', label: '오늘', icon: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { to: '/people', label: '이어진 사람들', also: ['/day/'], icon: 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 6m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0M19 7m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0M17 19m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0M10.4 10.6 6.2 7.2M13.7 11 17.6 8M13.3 13.6l2.7 3.8' },
  // 걷기: 실을 따라 걷는 발자국
  { to: '/walk', label: '걷기', icon: 'M8 4c1.4 0 2 1.6 2 3.4S9.3 11 8 11 6 9.2 6 7.4 6.6 4 8 4zM6.5 13.5h3M16 9c1.4 0 2 1.6 2 3.4S17.3 16 16 16s-2-1.8-2-3.6S14.6 9 16 9zM14.5 18.5h3' },
]
const active = (item: Tab) => (item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)) || !!item.also?.some((p) => route.path.startsWith(p))
const hidden = computed(() => route.path === '/' && !['mood', 'done'].includes(today.draft.step))
</script>

<template>
  <nav v-if="!hidden" class="nav" aria-label="주요 메뉴">
    <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="item" :class="{ on: active(item) }" :aria-current="active(item) ? 'page' : undefined">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path :d="item.icon" />
      </svg>
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); z-index: 20;
  width: 100%; max-width: 480px; display: grid; grid-template-columns: repeat(3, 1fr);
  padding: 6px 24px calc(8px + env(safe-area-inset-bottom));
  background: #ffffff; border-top: 1px solid #e8eaee;
  font-family: 'Noto Sans KR', system-ui, sans-serif;
}
.item {
  min-height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  color: #8a8f98; text-decoration: none; font-size: 12px;
}
.item.on { color: #14161a; font-weight: 700; }
</style>
