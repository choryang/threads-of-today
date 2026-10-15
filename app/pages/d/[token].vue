<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DAY_TYPES } from '../../../shared/day-type'
import type { DayPayload } from '../../../shared/share'

/**
 * 친구가 보낸 나의 하루 유형 링크 (/d/{token}). 서버 라우트(server/routes/d/[token].get.ts)가 OG meta를 넣은 HTML로 이 화면을 띄운다.
 * 보낸 사람의 결과를 보여 주고 "당신의 하루는요?"로 테스트를 시작한다(끝나면 두 사람의 하루를 함께 본다).
 */
const route = useRoute()
const share = useShare()
const token = computed(() => String(route.params.token))
const payload = ref<DayPayload | null>(null)
const loaded = ref(false)

onMounted(async () => {
  payload.value = (await share.open(token.value))?.payload ?? null
  loaded.value = true
})
const bg = computed(() => (payload.value ? DAY_TYPES[payload.value.type].bg : 'var(--ground)'))
</script>

<template>
  <main class="shared" :style="{ background: bg }">
    <template v-if="payload">
      <DayResultView :items="payload.items" :kicker="`${payload.nickname}님의 하루`" />
      <div class="actions">
        <NuxtLink :to="{ path: '/test', query: { from: token } }" class="go">당신의 하루는요?</NuxtLink>
        <p class="note">오늘 쓴 물건 3개만 고르면 10초면 끝나요</p>
      </div>
    </template>
    <section v-else-if="loaded" class="gone">
      <h1 class="display">이 링크는 열 수 없어요</h1>
      <p>보낸 지 오래됐거나 새 링크로 바뀌었어요. 당신의 하루는 어떤 하루일까요?</p>
      <NuxtLink to="/test" class="go">내 하루 알아보기</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.shared {
  min-height: 100dvh; max-width: 480px; margin: 0 auto; box-sizing: border-box; color: #f3f1ea;
  display: flex; flex-direction: column; padding-bottom: calc(96px + env(safe-area-inset-bottom));
}
.actions { margin-top: auto; padding: 24px 16px 0; display: flex; flex-direction: column; gap: 8px; }
.go {
  min-height: 56px; border-radius: 18px; background: #f2c14e; color: #1a1a22; font-size: 17px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; text-decoration: none;
}
.note { margin: 0; text-align: center; font-size: 13px; }
.gone { padding: 64px 24px; display: flex; flex-direction: column; gap: 14px; }
.gone h1 { margin: 0; font-size: 28px; }
.gone p { margin: 0; line-height: 1.6; }
</style>
