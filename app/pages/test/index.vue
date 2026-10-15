<script setup lang="ts">
import { computed, ref } from 'vue'
import { PRODUCTS } from '../../../shared/data/materials'
import { PICK_MAX, PICK_MIN, TEST_ITEMS } from '../../../shared/day-type'
import { iconUrl } from '../../utils/day-test'

/**
 * 10초 테스트 첫 화면: 오늘 쓴 물건 18개(3열)에서 3~5개를 고른다. 시안: 캔버스 '내 하루 마을' 두 번째 줄의 첫 화면.
 * ?from=토큰이면 친구가 보낸 결과에서 "당신의 하루는요?"로 들어온 것: 결과 화면이 두 사람의 하루를 함께 보여 준다.
 */
const route = useRoute()
const router = useRouter()
const from = computed(() => (typeof route.query.from === 'string' ? route.query.from : ''))

const items = TEST_ITEMS.map((id) => ({ id, name: PRODUCTS.find((p) => p.id === id)!.name }))
const picked = ref<string[]>([])

function toggle(id: string) {
  const i = picked.value.indexOf(id)
  if (i >= 0) picked.value.splice(i, 1)
  else if (picked.value.length < PICK_MAX) picked.value.push(id)
}

const count = computed(() => picked.value.length)
const countText = computed(() =>
  count.value >= PICK_MAX ? `${PICK_MAX}개까지 골랐어요` : count.value >= PICK_MIN ? `${count.value}개 골랐어요` : `${PICK_MIN - count.value}개 더 골라 주세요`,
)

function seeResult() {
  if (count.value < PICK_MIN) return
  router.push({ path: '/test/result', query: { items: picked.value.join(','), ...(from.value ? { from: from.value } : {}) } })
}
</script>

<template>
  <main class="test">
    <span class="kicker">10초 테스트</span>
    <h1 class="display title">당신의 하루는<br>어떤 하루일까요?</h1>
    <p class="sub">오늘 쓴 물건을 3개 이상 골라 보세요</p>

    <div class="grid" role="group" aria-label="오늘 쓴 물건">
      <button
        v-for="it in items"
        :key="it.id"
        class="item"
        :class="{ on: picked.includes(it.id) }"
        :aria-pressed="picked.includes(it.id)"
        :disabled="!picked.includes(it.id) && count >= PICK_MAX"
        @click="toggle(it.id)"
      >
        <img :src="iconUrl(it.id)" alt="" width="56" height="56">
        <span>{{ it.name }}</span>
      </button>
    </div>

    <div class="foot">
      <p class="count" aria-live="polite">{{ countText }}</p>
      <button class="cta" :disabled="count < PICK_MIN" @click="seeResult">내 하루 보기</button>
    </div>
  </main>
</template>

<style scoped>
.test {
  max-width: 480px; margin: 0 auto; box-sizing: border-box; min-height: 100dvh;
  display: flex; flex-direction: column; padding: 48px 20px calc(100px + env(safe-area-inset-bottom));
}
.kicker { font-size: 13px; font-weight: 700; color: var(--accent); }
.title { margin: 8px 0 0; font-size: 32px; line-height: 1.25; }
.sub { margin: 10px 0 0; font-size: 15px; color: #c9cfd9; }
.grid { margin-top: 24px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.item {
  min-height: 104px; border-radius: 18px; border: 3px solid #172840; background: #172840; color: var(--text);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 6px 4px; cursor: pointer;
  font-size: 13px; font-weight: 500; word-break: keep-all; text-align: center; line-height: 1.3;
}
.item img { width: 56px; height: 56px; }
.item.on { background: var(--accent); color: #1a1a22; border-color: var(--text); }
.item:disabled { opacity: 0.45; cursor: default; }
.foot {
  margin: 8px -20px 0; padding: 24px 20px 8px; display: flex; flex-direction: column; gap: 10px;
  position: sticky; bottom: calc(76px + env(safe-area-inset-bottom));
  background: linear-gradient(to bottom, transparent, var(--ground) 32%);
}
.count { margin: 0; text-align: center; font-size: 13px; color: #c9cfd9; }
.cta {
  height: 56px; border-radius: 18px; border: 0; cursor: pointer;
  background: var(--accent); color: #1a1a22; font-size: 17px; font-weight: 700;
}
.cta:disabled { background: #1e3150; color: #8a93a3; cursor: default; }
</style>
