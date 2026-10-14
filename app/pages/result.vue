<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { dayStats } from '../../shared/logic'

const game = useGame()
const cardEl = ref<HTMLElement | null>(null)
const busy = ref(false)
const message = ref('')

const done = computed(() => game.today.value.journeys.filter((j) => j.done))
const stats = computed(() => dayStats(done.value))
const perItem = computed(() =>
  done.value.map((j) => ({ id: j.id, name: j.name, ...dayStats([j]) })),
)
/** 카드에 그릴 캐릭터: 오늘 처음 만난 사람 우선, 최대 6명 */
const faces = computed(() => {
  const fresh = done.value.flatMap((j) => j.newCards).filter((id) => PEOPLE[id])
  const rest = stats.value.people.filter((id) => !fresh.includes(id))
  return [...new Set([...fresh, ...rest])].slice(0, 6)
})
const newToday = computed(() => Object.values(game.state.cards).filter((d) => d === game.todayKey).length)

const [y, m, d] = game.todayKey.split('-')
const dateLabel = `${y}.${m}.${d}`
const stampTilt = (i: number) => `rotate(${[-8, 5, -3, 9, -6, 3][i % 6]}deg)`

async function capture(): Promise<Blob | null> {
  if (!cardEl.value) return null
  const { toBlob } = await import('html-to-image')
  const opts = { pixelRatio: 2, backgroundColor: '#0F1B2D', cacheBust: true }
  try {
    return await toBlob(cardEl.value, opts)
  } catch {
    // 웹폰트를 못 읽는 환경이면 폰트 없이 다시 시도
    return await toBlob(cardEl.value, { ...opts, skipFonts: true })
  }
}

/** 공유 버튼을 누르는 순간 바로 공유할 수 있게 이미지를 미리 만들어 둔다 (iOS는 클릭 직후에만 공유 허용) */
let prepared: Promise<Blob | null> | null = null
onMounted(async () => {
  if (!done.value.length) return
  await nextTick()
  await document.fonts?.ready
  prepared = capture().catch(() => null)
})

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function save(share: boolean) {
  if (busy.value) return
  busy.value = true
  message.value = ''
  let blob: Blob | null = null
  try {
    blob = (await prepared) ?? (await capture())
    if (!blob) throw new Error('capture failed')
    const file = new File([blob], `my-day-people-${game.todayKey}.png`, { type: 'image/png' })
    if (share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: `오늘 ${game.nickname.value}의 하루에는 ${stats.value.countries.length}개 나라, ${stats.value.people.length}명의 사람이 닿아 있었어요.` })
    } else {
      download(blob, file.name)
      if (share) message.value = '이 기기에서는 바로 공유가 안 돼서 이미지로 저장했어요.'
    }
  } catch (err) {
    const name = (err as Error)?.name
    if (name === 'NotAllowedError' && blob) {
      download(blob, `my-day-people-${game.todayKey}.png`)
      message.value = '공유 창을 열지 못해서 이미지로 저장했어요.'
    } else if (name !== 'AbortError') {
      message.value = '이미지를 만들지 못했어요. 다시 시도해 주세요.'
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page">
    <header class="head">
      <h1 class="display title">오늘의 기록</h1>
      <p class="muted small">오늘 마친 여정 {{ done.length }}개 · 새로 만난 사람 {{ newToday }}명</p>
    </header>

    <section v-if="!done.length" class="panel empty">
      <p>아직 마친 여정이 없어요.</p>
      <p class="muted small">물건 하나를 골라 여정을 마치면 오늘의 결과 카드가 만들어져요.</p>
      <NuxtLink to="/" class="btn btn-primary btn-block">물건 고르러 가기</NuxtLink>
    </section>

    <template v-else>
      <div ref="cardEl" class="share-wrap">
        <article class="share">
          <p class="mono s-date">{{ dateLabel }} · 내 하루에 닿은 사람들</p>
          <h2 class="s-title">
            오늘 {{ game.nickname.value }}의 하루에는<br>
            <em>{{ stats.countries.length }}개 나라 {{ stats.people.length }}명</em>이<br>
            닿아 있었다
          </h2>

          <div class="faces" aria-hidden="true">
            <Character v-for="id in faces" :key="id" :person-id="id" :size="54" />
          </div>

          <div class="stamps">
            <span v-for="(c, i) in stats.countries" :key="c" class="stamp" :style="{ transform: stampTilt(i) }">{{ c }}</span>
          </div>

          <ul class="items">
            <li v-for="it in perItem" :key="it.id">
              <span>{{ it.name }}</span>
              <span class="mono">{{ it.countries.length }}개국 · {{ it.people.length }}명</span>
            </li>
          </ul>

        </article>
      </div>

      <div class="actions">
        <button class="btn" :disabled="busy" @click="save(false)">이미지 저장</button>
        <button class="btn btn-primary" :disabled="busy" @click="save(true)">{{ busy ? '만드는 중…' : '공유하기' }}</button>
      </div>
      <p v-if="message" class="muted small" role="status">{{ message }}</p>
    </template>
  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 6px; }
.title { font-size: 30px; }
.small { margin: 0; font-size: 13px; line-height: 1.5; }
.empty { display: flex; flex-direction: column; gap: 10px; }
.empty p { margin: 0; }

.share-wrap { padding: 4px; border-radius: 28px; background: var(--ground); }
.share {
  display: flex; flex-direction: column; gap: 18px;
  padding: 28px 22px 24px; border-radius: 24px;
  background: var(--paper); color: var(--ink);
}
.s-date { margin: 0; font-size: 12px; color: #4a4a4a; }
.s-title { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 30px; line-height: 1.3; }
.s-title em { font-style: normal; color: #b8462f; }
.faces { display: flex; flex-wrap: wrap; gap: 2px; }
.stamps { display: flex; flex-wrap: wrap; gap: 10px 8px; padding: 4px 2px; }
.stamp {
  display: inline-block; padding: 6px 12px; border-radius: 999px;
  border: 2.5px solid #b8462f; color: #b8462f;
  font-family: var(--font-display); font-size: 14px;
}
.stamp:nth-child(3n + 2) { border-color: #3b6ea8; color: #3b6ea8; border-radius: 10px; }
.stamp:nth-child(3n) { border-color: #4f8a7a; color: #4f8a7a; border-style: dashed; }
.items { list-style: none; margin: 0; padding: 14px 0 0; border-top: 1px dashed #b5ad99; display: flex; flex-direction: column; gap: 8px; }
.items li { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; }

.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
</style>
