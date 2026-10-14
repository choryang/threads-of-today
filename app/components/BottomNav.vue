<script setup lang="ts">
const route = useRoute()
const items = [
  { to: '/', label: '오늘', icon: 'M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z' },
  { to: '/mystery', label: '미스터리', icon: 'M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 19h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { to: '/threads', label: '실타래', icon: 'M12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M12 3v6.5M12 14.5V21M3.5 8l6.3 2.8M14.2 13.2l6.3 2.8M20.5 8l-6.3 2.8M9.8 13.2 3.5 16' },
  { to: '/dex', label: '도감', icon: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6' },
  { to: '/result', label: '기록', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
]
const active = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <nav class="nav" aria-label="주요 메뉴">
    <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="item" :class="{ on: active(item.to) }">
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
  grid-template-columns: repeat(5, 1fr);
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
