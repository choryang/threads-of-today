<script setup lang="ts">
import type { ShownForm } from '../../shared/rewind'
import { productIconSvg } from '../utils/product-icon'

/**
 * 지금 물건의 형태: 아이콘(public/forms/<slug>.svg)과 이름. 형태가 바뀌면 이전 아이콘이 다음 아이콘으로 0.3초(MOTION.handMs) 동안 바뀐다.
 * 두 아이콘을 같은 자리에 겹쳐 놓고 동시에 바꿔서, 빨리 넘겨도 표시가 뒤처지지 않는다.
 * 완성된 물건(product)은 물건 아이콘. quick: 되감기 엔딩처럼 0.2초마다 바뀌는 곳은 전환도 0.2초(MOTION.replayStepMs)
 */
defineProps<{ form: ShownForm; productId: string; label?: string; quick?: boolean }>()
</script>

<template>
  <div class="form-badge" aria-live="polite">
    <span v-if="label" class="mono muted small">{{ label }}</span>
    <div class="stack">
      <Transition :name="quick ? 'swap-quick' : 'swap'">
        <div :key="form.name" class="form">
          <img v-if="form.icon" class="icon" :src="`/forms/${form.icon}.svg`" :alt="form.name" width="88" height="88">
          <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
          <svg v-else-if="form.product" class="icon" viewBox="0 0 32 32" width="88" height="88" aria-hidden="true" v-html="productIconSvg(productId)" />
          <span class="name">{{ form.name }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.form-badge { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.small { font-size: 11px; letter-spacing: 1px; }
/* 바뀌는 동안 이전·다음 형태를 같은 칸에 겹친다 */
.stack { display: grid; }
.form {
  grid-area: 1 / 1;
  display: flex; align-items: center; gap: 12px; min-width: 0;
  padding: 6px 16px 6px 6px; border-radius: 20px;
  background: var(--paper); color: var(--ink); font-weight: 700; font-size: 16px;
}
.icon { flex-shrink: 0; width: 88px; height: 88px; border-radius: 16px; background: #fff; }
.name { min-width: 0; word-break: keep-all; }
.swap-enter-active, .swap-leave-active { transition: opacity var(--motion-hand) var(--motion-ease), transform var(--motion-hand) var(--motion-ease); }
.swap-quick-enter-active, .swap-quick-leave-active { transition: opacity var(--motion-replay) linear, transform var(--motion-replay) linear; }
.swap-enter-from, .swap-quick-enter-from { opacity: 0; transform: scale(0.85); }
.swap-leave-to, .swap-quick-leave-to { opacity: 0; transform: scale(1.08); }
</style>
