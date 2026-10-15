<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { MATERIALS } from '../../shared/data/materials'
import { PEOPLE } from '../../shared/data/people'
import { buildTimeline, reverseTimeline } from '../../shared/journey'
import { dayStats } from '../../shared/logic'
import { formatKm, reverseDistances, roundKm } from '../../shared/distance'

const game = useGame()
/** 공유 이미지에는 오늘 지나온 실만 */
const todayThreads = useTapestry({ todayOnly: true })
const cardEl = ref<HTMLElement | null>(null)
const busy = ref(false)
const message = ref('')

const done = computed(() => game.today.value.journeys.filter((j) => j.done))
/** 분해해 본 물건 (최근에 처음 분해한 것부터). 도감에서 옮겨 왔다 */
const itemNames = computed(() => Object.entries(game.state.items).sort((a, b) => b[1].localeCompare(a[1])).map(([name]) => name))
const stats = computed(() => dayStats(done.value))
/** 여정마다 내 손에서 원산지까지 거슬러 올라간 거리 (예전 순서로 간 여정도 같은 길을 뒤집어 잰다) */
const kmOf = (j: { id: string; name: string; materialIds: string[] }) => reverseDistances(reverseTimeline(j.materialIds, j.id, j.name)).total
const perItem = computed(() =>
  done.value.map((j) => ({ id: j.id, name: j.name, km: kmOf(j), ...dayStats([j]) })),
)
const totalKm = computed(() => perItem.value.reduce((sum, it) => sum + it.km, 0))
/** 카드에 그릴 캐릭터: 오늘 처음 만난 사람 우선, 최대 6명 */
const faces = computed(() => {
  const fresh = done.value.flatMap((j) => j.newCards).filter((id) => PEOPLE[id])
  const rest = stats.value.people.filter((id) => !fresh.includes(id))
  return [...new Set([...fresh, ...rest])].slice(0, 6)
})
function materialNames(ids: string[]) {
  return ids.map((id) => MATERIALS[id]?.name).join(' · ')
}
function journeyProgress(materialIds: string[], step: number, id: string, name: string) {
  const len = buildTimeline(materialIds, id, name).length
  return Math.round(((step + 1) / len) * 100)
}
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
      <RecordTabs />
      <p class="muted small">오늘 마친 여정 {{ done.length }}개 · 새로 만난 사람 {{ newToday }}명</p>
    </header>

    <section v-if="game.today.value.journeys.length" class="today" aria-label="오늘 떠난 여정">
      <h2 class="h2">오늘 떠난 여정</h2>
      <NuxtLink v-for="j in game.today.value.journeys" :key="j.id" :to="`/journey/${j.id}`" class="j-row panel">
        <div class="j-main">
          <span class="j-name">{{ j.name }}</span>
          <span class="j-mats">{{ materialNames(j.materialIds) }}</span>
        </div>
        <span v-if="j.done" class="chip done">완료</span>
        <span v-else class="chip mono">{{ journeyProgress(j.materialIds, j.step, j.id, j.name) }}%</span>
      </NuxtLink>
    </section>

    <section v-if="!done.length" class="panel empty">
      <p>아직 마친 여정이 없어요.</p>
      <p class="muted small">물건 하나를 골라 여정을 마치면 오늘의 결과 카드가 만들어져요.</p>
      <NuxtLink to="/add" class="btn btn-primary btn-block">물건 고르러 가기</NuxtLink>
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

          <p v-if="roundKm(totalKm)" class="s-km">모두 합쳐 약 <strong>{{ formatKm(totalKm) }}</strong>km를 거쳐 왔다</p>

          <div class="faces" aria-hidden="true">
            <Character v-for="id in faces" :key="id" :person-id="id" :size="54" />
          </div>

          <div v-if="todayThreads.threads.length" class="s-threads">
            <ThreadsTapestry :layout="todayThreads" :nickname="game.nickname.value" :interactive="false" :animate="false" variant="paper" />
          </div>

          <div class="stamps">
            <span v-for="(c, i) in stats.countries" :key="c" class="stamp" :style="{ transform: stampTilt(i) }">{{ c }}</span>
          </div>

          <ul class="items">
            <li v-for="it in perItem" :key="it.id">
              <span>{{ it.name }}</span>
              <span class="mono">{{ it.countries.length }}개국 · {{ it.people.length }}명<template v-if="roundKm(it.km)"> · 약 {{ formatKm(it.km) }}km</template></span>
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

    <section v-if="itemNames.length" aria-label="분해해 본 물건">
      <h2 class="h2">분해해 본 물건 <span class="mono muted">{{ itemNames.length }}</span></h2>
      <div class="item-chips">
        <span v-for="name in itemNames" :key="name" class="chip">{{ name }}</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 6px; }
.item-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.title { font-size: 30px; }
.small { margin: 0; font-size: 13px; line-height: 1.5; }
.h2 { margin: 0 0 4px; font-size: 15px; }
.today { display: flex; flex-direction: column; gap: 8px; }
.j-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 56px; text-decoration: none; color: var(--text); padding: 12px 14px; }
.j-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.j-name { font-weight: 700; }
.j-mats { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.done { color: var(--ok); border-color: var(--ok); }
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
.s-km { margin: -6px 0 0; font-size: 15px; color: #2a2a2a; }
.s-km strong { font-family: var(--font-mono); font-weight: 500; color: #3b6ea8; }
.s-threads { width: 100%; max-width: 280px; align-self: center; }
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
