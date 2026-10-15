<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { placeAll } from '../../../shared/village'
import type { Flower } from '../../../shared/visit'

/**
 * 친구 마을 (/v/{token}). 서버 라우트(server/routes/v/[token].get.ts)가 OG meta를 넣은 HTML로 이 화면을 띄운다.
 * 공개용 마을 API에서 닉네임·주민 id·최근 꽃만 받는다. 주민 자리는 주인 마을과 같은 규칙(같은 순서로 placeAll)이라 같은 곳에 선다.
 * 링크를 열면 '다녀온 마을'에 적는다(상대에게 알리지 않는다).
 */
const route = useRoute()
const router = useRouter()
const game = useGame()
const token = computed(() => String(route.params.token))

const state = ref<'loading' | 'open' | 'closed' | 'gone'>('loading')
const nickname = ref('')
const residents = ref<string[]>([])
const flowers = ref<Flower[]>([])
const bloomAt = ref(0)
const open = ref<string | null>(null)

const placed = computed(() => placeAll(residents.value))

onMounted(async () => {
  if (game.state.village?.token === token.value) {
    router.replace('/')
    return
  }
  try {
    const res = await $fetch<{ ok: boolean; reason?: string; nickname?: string; residents?: string[]; flowers?: Flower[] }>(`/api/village/${encodeURIComponent(token.value)}`)
    nickname.value = res.nickname ?? ''
    if (res.ok) {
      residents.value = res.residents ?? []
      flowers.value = res.flowers ?? []
      state.value = 'open'
      game.visitVillage(token.value, nickname.value)
    } else {
      state.value = res.reason === 'closed' ? 'closed' : 'gone'
    }
  } catch {
    state.value = 'gone'
  }
})

function bloom(f: Flower) {
  flowers.value = [...flowers.value, f]
  bloomAt.value = f.at
}
</script>

<template>
  <main class="village">
    <VillageMap v-if="state === 'open'" :residents="placed" :flowers="flowers" :bloom-at="bloomAt" @resident="open = $event" />

    <div class="overlay">
      <header class="title-card">
        <template v-if="state === 'open'">
          <h1 class="display title">{{ nickname }}님의 마을</h1>
          <p class="sub">주민 {{ residents.length }}명 · 주민을 누르면 고마워요를 남길 수 있어요</p>
        </template>
        <template v-else-if="state === 'closed'">
          <h1 class="display title">{{ nickname }}님의 마을</h1>
          <p class="sub">지금은 방문을 받지 않는 마을이에요</p>
        </template>
        <template v-else-if="state === 'gone'">
          <h1 class="display title">마을을 찾지 못했어요</h1>
          <p class="sub">초대 링크가 새로 바뀌었거나 기간이 지났어요</p>
        </template>
        <NuxtLink to="/" class="back">내 마을로 돌아가기</NuxtLink>
      </header>
    </div>

    <Teleport to="body">
      <FriendResidentSheet v-if="open" :person-id="open" :token="token" @close="open = null" @bloom="bloom" />
    </Teleport>
  </main>
</template>

<style scoped>
.village { position: fixed; inset: 0; overflow: hidden; background: #7fc3de; }
.overlay { position: absolute; inset: 0; pointer-events: none; display: flex; justify-content: center; }
.title-card {
  position: absolute; top: max(16px, env(safe-area-inset-top)); left: 12px; right: 12px; max-width: 456px; margin: 0 auto; pointer-events: auto;
  display: flex; flex-direction: column; gap: 4px; padding: 14px 18px; border-radius: 20px; background: rgba(15, 27, 45, 0.9);
}
.title { margin: 0; font-size: 24px; line-height: 1.15; }
.sub { margin: 0; font-size: 13px; color: #c9cfd9; word-break: keep-all; }
.back {
  align-self: flex-start; min-height: 44px; margin-top: 6px; padding: 0 16px; border-radius: 14px; border: 2px solid var(--accent);
  display: flex; align-items: center; color: var(--accent); font-size: 14px; font-weight: 700; text-decoration: none;
}
</style>
