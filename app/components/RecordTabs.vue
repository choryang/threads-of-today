<script setup lang="ts">
/** 지난 기록(마을 메뉴) 안의 전환: 오늘의 결과 카드 / 나의 실타래 */
const route = useRoute()
const tabs = [
  { to: '/result', label: '오늘' },
  { to: '/threads', label: '나의 실타래' },
]
</script>

<template>
  <nav class="tabs" aria-label="기록 보기">
    <NuxtLink v-for="t in tabs" :key="t.to" :to="t.to" class="tab" :class="{ on: route.path.startsWith(t.to) }" :aria-current="route.path.startsWith(t.to) ? 'page' : undefined">
      {{ t.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 14px; background: var(--surface); border: 1px solid var(--line); }
.tab {
  display: flex; align-items: center; justify-content: center; min-height: 44px;
  border-radius: 10px; color: var(--muted); font-size: 14px; text-decoration: none;
}
.tab.on { background: var(--surface-2); color: var(--text); font-weight: 700; }
</style>
