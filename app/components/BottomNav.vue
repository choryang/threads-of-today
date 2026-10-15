<script setup lang="ts">
const route = useRoute()
const items = [
  // 마을 탭은 물건 넣기(/add)·미스터리(/mystery)에서도 켜져 있다 (그 흐름이 마을에서 시작한다)
  { to: '/', label: '마을', also: ['/add', '/mystery', '/test', '/arrival'], icon: 'M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z' },
  { to: '/dex', label: '도감', icon: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6' },
  { to: '/result', label: '기록', also: ['/threads'], icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
]
/** 기록 탭은 그 안의 '나의 실타래'에서도 켜져 있다 */
const active = (item: { to: string; also?: string[] }) =>
  (item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)) || !!item.also?.some((p) => route.path.startsWith(p))
</script>

<template>
  <nav class="nav" aria-label="주요 메뉴">
    <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="item" :class="{ on: active(item) }">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path :d="item.icon" />
      </svg>
      <span>{{ item.label }}</span>
    </NuxtLink>
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
  grid-template-columns: repeat(3, 1fr);
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
}
.item.on { color: var(--accent); }
</style>
