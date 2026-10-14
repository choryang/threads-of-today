<script setup lang="ts">
import type { ShownForm } from '../../shared/rewind'
import { PROP_VIEWBOX, propSvg } from '../utils/character'
import { productIconSvg } from '../utils/product-icon'

/**
 * 지금 물건의 형태. 형태가 바뀌면 key가 바뀌어 바로 새 형태로 바꾸고 0.3초 동안 변신 효과를 낸다(나가는 효과는 기다리지 않는다).
 * 소품이 없으면 완성된 물건 아이콘. quick: 되감기 엔딩처럼 0.2초마다 바뀌는 곳은 효과도 0.2초
 */
defineProps<{ form: ShownForm; productId: string; label?: string; quick?: boolean }>()
</script>

<template>
  <div class="form-badge" aria-live="polite">
    <span v-if="label" class="mono muted small">{{ label }}</span>
    <span :key="form.name" class="form" :class="{ quick }">
      <!-- eslint-disable vue/no-v-html -- 직접 그린 SVG -->
      <svg v-if="form.prop" class="icon" :viewBox="PROP_VIEWBOX" width="28" height="28" aria-hidden="true" v-html="propSvg(form.prop)" />
      <svg v-else class="icon" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" v-html="productIconSvg(productId)" />
      <!-- eslint-enable vue/no-v-html -->
      <span class="name">{{ form.name }}</span>
    </span>
  </div>
</template>

<style scoped>
.form-badge { display: flex; align-items: center; gap: 8px; min-height: 44px; }
.small { font-size: 11px; letter-spacing: 1px; flex-shrink: 0; }
.form {
  display: inline-flex; align-items: center; gap: 8px; min-width: 0;
  padding: 6px 12px 6px 6px; border-radius: 999px;
  background: var(--paper); color: var(--ink); font-weight: 700; font-size: 14px;
}
.icon { flex-shrink: 0; border-radius: 999px; background: #fff; }
.name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.form { animation: morph var(--motion-hand) var(--motion-ease); }
.form.quick { animation-duration: var(--motion-replay); }
@keyframes morph {
  0% { opacity: 0.2; transform: scale(0.6) rotate(-12deg); }
  60% { opacity: 1; transform: scale(1.08) rotate(2deg); }
  100% { transform: scale(1) rotate(0); }
}
</style>
