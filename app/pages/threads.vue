<script setup lang="ts">
import { computed, ref } from 'vue'

const game = useGame()
const tapestry = useTapestry()
const openPerson = ref<string | null>(null)
const hasThreads = computed(() => tapestry.value.threads.length > 0)
</script>

<template>
  <main class="page">
    <header class="head">
      <h1 class="display title">나의 실타래</h1>
      <p v-if="hasThreads" class="muted small">
        실 <span class="mono">{{ tapestry.threads.length }}</span>가닥 · 나라 <span class="mono">{{ tapestry.countries.length }}</span>곳.
        나라를 누르면 그곳에서 만난 사람들이 보여요.
      </p>
    </header>

    <ThreadsTapestry v-if="hasThreads" :layout="tapestry" :nickname="game.nickname.value" @open="openPerson = $event" />
    <section v-else class="panel empty">
      <p>첫 여정을 떠나면 실이 생겨요.</p>
      <p class="muted small">물건 하나의 여정을 마치면, 그 재료가 지나온 나라에서 나에게로 실이 이어져요.</p>
      <NuxtLink to="/" class="btn btn-primary btn-block">물건 고르러 가기</NuxtLink>
    </section>

    <div v-if="openPerson" class="modal" role="dialog" aria-modal="true" @click.self="openPerson = null">
      <div class="sheet">
        <PersonCard :person-id="openPerson" />
        <button class="btn btn-block" @click="openPerson = null">닫기</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 6px; }
.title { font-size: 30px; }
.small { margin: 0; font-size: 13px; line-height: 1.5; }
.empty { display: flex; flex-direction: column; gap: 10px; }
.empty p { margin: 0; }
.modal {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(5, 10, 20, 0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px 20px;
  animation: rise 0.2s ease-out;
}
.sheet { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 12px; max-height: 100%; overflow-y: auto; }
</style>
