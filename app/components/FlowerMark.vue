<script setup lang="ts">
/** 꽃 한 송이: 둥근 꽃잎 5장과 가운데, 외곽선 #2A2A35 (색은 주민 구역별, shared/visit.ts) */
withDefaults(defineProps<{ color: string; size?: number }>(), { size: 36 })
const PETALS = [0, 72, 144, 216, 288].map((deg) => {
  const r = (deg - 90) * (Math.PI / 180)
  return { cx: 20 + Math.cos(r) * 9, cy: 20 + Math.sin(r) * 9 }
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 40 40" aria-hidden="true">
    <circle v-for="(p, i) in PETALS" :key="i" :cx="p.cx" :cy="p.cy" r="7.5" :fill="color" stroke="#2A2A35" stroke-width="2.5" />
    <circle cx="20" cy="20" r="5.5" fill="#F2C14E" stroke="#2A2A35" stroke-width="2.5" />
  </svg>
</template>
