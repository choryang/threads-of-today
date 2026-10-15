<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { HOME_POINT, MAP_H, MAP_W, RESIDENT_H, RESIDENT_W, WORKPLACES, ZONES } from '../../shared/data/village'
import { UNLOCK } from '../../shared/friendship'
import { arrivalShort, isArrived, isWaiting } from '../../shared/incoming'
import { countriesOf, villageLayout, type Placed } from '../../shared/village'
import { centerOn } from '../utils/pan-zoom'

/**
 * 내 하루 마을 (홈). 지도가 화면 전체에 깔리고, 그 위에 제목 카드·확대 버튼·오고 있는 물건·'오늘 쓴 물건 넣기'를 올린다.
 * 지도 좌표 1400×2000. 주민은 만난 사람(연결 카드 제외), 자리는 shared/village.ts가 사람 id로 정한다.
 */
const game = useGame()
const route = useRoute()
const router = useRouter()

const viewport = ref<HTMLElement | null>(null)
const pz = usePanZoom(viewport, { w: MAP_W, h: MAP_H }, (s) => centerOn(HOME_POINT.x, HOME_POINT.y, HOME_POINT.scale, s))
const transform = computed(() => `translate(${pz.view.value.x}px, ${pz.view.value.y}px) scale(${pz.view.value.scale})`)

// ── 오고 있는 물건: 1분마다 진행 막대를 새로 그린다 ──
const now = ref(Date.now())
let tick: ReturnType<typeof setInterval> | undefined
onMounted(() => { tick = setInterval(() => { now.value = Date.now() }, 60_000) })
onBeforeUnmount(() => clearInterval(tick))
const waiting = computed(() => (game.state.incoming ?? []).filter(isWaiting))
const arrivingLabel = (personId: string) => {
  const inc = waiting.value.find((x) => x.personId === personId)
  return !inc ? '' : isArrived(inc, now.value) ? '도착했어요' : arrivalShort(inc.arriveAt, now.value)
}

const layout = computed(() => villageLayout(game.state.cards, game.state.people ?? {}, waiting.value.map((x) => x.personId)))
const countries = computed(() => countriesOf(layout.value.residents.map((r) => r.id)))
const percentOf = (id: string) => game.friendship(id).percent

/** 친해진 정도 100%인 주민의 일터 자리 (그림이 아직 없어 이름만 적은 점선 자리) */
const workplaces = computed(() => layout.value.residents.filter((r) => percentOf(r.id) >= UNLOCK.workplace))
const workplaceName = (id: string) => WORKPLACES[PEOPLE[id]!.workplace]
const nameOf = (id: string) => PEOPLE[id]?.name ?? PEOPLE[id]?.job ?? ''
const jobOf = (id: string) => PEOPLE[id]?.job ?? ''

const boxStyle = (p: Placed) => ({ left: `${p.x - RESIDENT_W / 2}px`, top: `${p.y - RESIDENT_H}px` })

const open = ref<string | null>(null)
function openResident(id: string) {
  // 지도를 끌다가 놓은 자리의 주민은 열지 않는다
  if (pz.dragged()) return
  open.value = id
}

/** ?focus=사람 id: 그 사람 자리로 화면을 옮긴다 (밤사이 도착한 주민을 마을로 모실 때) */
onMounted(async () => {
  const focus = typeof route.query.focus === 'string' ? route.query.focus : ''
  // 처음 온 사람(만난 사람도 떠난 여정도 없음)은 10초 테스트부터
  if (game.firstVisit.value && !Object.values(game.state.days).some((d) => d.journeys.length)) {
    router.replace('/test')
    return
  }
  // 도착했는데 아직 열지 않은 물건이 있으면 도착 화면부터 (도착 후 처음 열 때)
  const due = waiting.value.find((x) => isArrived(x, Date.now()))
  if (!focus && due) {
    router.replace(`/arrival/${due.journeyId}`)
    return
  }
  if (!focus) return
  await nextTick()
  const spot = layout.value.residents.find((r) => r.id === focus)
  if (spot) {
    requestAnimationFrame(() => pz.goTo(spot.x, spot.y - RESIDENT_H / 2, Math.max(pz.view.value.scale, 0.8), true))
  }
  router.replace({ query: {} })
})
const goHome = () => pz.goTo(HOME_POINT.x, HOME_POINT.y, HOME_POINT.scale, true)
</script>

<template>
  <main class="village">
    <div ref="viewport" class="viewport">
      <div class="world" :class="{ gliding: pz.gliding.value }" :style="{ width: `${MAP_W}px`, height: `${MAP_H}px`, transform }">
        <img src="/village/map.svg" :width="MAP_W" :height="MAP_H" alt="" draggable="false" class="map">

        <span
          v-for="z in ZONES"
          :key="z.id"
          class="zone-label display"
          :class="{ home: z.id === 'town' }"
          :style="{ left: `${z.label[0]}px`, top: `${z.label[1]}px` }"
        >{{ z.name }}</span>

        <div v-for="lot in layout.lots" :key="`lot-${lot.id}`" class="lot" :style="{ left: `${lot.x - 65}px`, top: `${lot.y - 150}px` }" aria-hidden="true">
          <span class="display">?</span>
        </div>

        <div
          v-for="a in layout.arriving"
          :key="`arriving-${a.id}`"
          class="arriving"
          :style="{ left: `${a.x - 65}px`, top: `${a.y - 180}px` }"
        >
          <span><template v-for="(word, i) in arrivingLabel(a.id).split(' ')" :key="i"><br v-if="i">{{ word }}</template></span>
        </div>

        <div
          v-for="w in workplaces"
          :key="`work-${w.id}`"
          class="workplace"
          :style="{ left: `${w.x + 56}px`, top: `${w.y - 96}px` }"
          :title="`${nameOf(w.id)}의 일터`"
        >
          <span>{{ workplaceName(w.id) }}</span>
        </div>

        <button
          v-for="r in layout.residents"
          :key="r.id"
          class="resident"
          :style="boxStyle(r)"
          :aria-label="`${nameOf(r.id)} · ${jobOf(r.id)} 주민 카드 보기`"
          draggable="false"
          @click="openResident(r.id)"
        >
          <span class="pct mono" aria-hidden="true">{{ percentOf(r.id) }}%</span>
          <Character :person-id="r.id" :size="RESIDENT_H" standing />
        </button>
      </div>
    </div>

    <div class="overlay">
      <header class="title-card">
        <div class="title-row">
          <h1 class="display title">내 하루 마을</h1>
          <NuxtLink to="/test" class="menu-link">나의 하루 유형</NuxtLink>
        </div>
        <p v-if="layout.residents.length" class="sub">주민 {{ layout.residents.length }}명 · {{ countries.length }}개 나라에서 왔어요</p>
        <p v-else class="sub">오늘 쓴 물건을 넣으면 그 물건을 거쳐 온 사람들이 마을에 와요</p>
      </header>

      <div class="zoom" role="group" aria-label="지도 보기">
        <button class="zbtn" aria-label="확대" @click="pz.zoomIn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button class="zbtn" aria-label="축소" @click="pz.zoomOut">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <button class="zbtn home-btn" aria-label="우리 집으로" @click="goHome">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
        </button>
      </div>

      <div class="bottom">
        <IncomingCard v-for="inc in waiting" :key="inc.journeyId" :incoming="inc" :now="now" />
        <NuxtLink to="/add" class="add">오늘 쓴 물건 넣기</NuxtLink>
      </div>
    </div>

    <!-- 마을(position: fixed)은 쌓임 맥락이 따로라, 아래 탭 위로 올라오게 body로 옮긴다 -->
    <Teleport to="body">
      <ResidentSheet v-if="open" :person-id="open" @close="open = null" />
    </Teleport>
  </main>
</template>

<style scoped>
.village { position: fixed; inset: 0; overflow: hidden; background: #7fc3de; }
.viewport { position: absolute; inset: 0; touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
.viewport:active { cursor: grabbing; }
.world { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
.world.gliding { transition: transform var(--motion-pan) var(--motion-ease); }
.map { position: absolute; left: 0; top: 0; display: block; pointer-events: none; -webkit-user-drag: none; }

.zone-label {
  position: absolute; padding: 6px 18px; border-radius: 22px; border: 4px solid #2a2a35;
  background: #fff; color: #2a2a35; font-size: 30px; white-space: nowrap; pointer-events: none;
}
.zone-label.home { background: #f2c14e; }

.resident {
  position: absolute; width: 140px; height: 190px; padding: 0; border: 0; background: none; cursor: pointer;
  display: block; -webkit-tap-highlight-color: transparent;
}
.resident:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; border-radius: 20px; }
.pct {
  position: absolute; left: 50%; top: -14px; transform: translateX(-50%);
  padding: 2px 10px; border-radius: 14px; border: 3px solid #2a2a35;
  background: #f2c14e; color: #1a1a22; font-size: 18px; font-weight: 700; white-space: nowrap;
}
.lot {
  position: absolute; width: 130px; height: 150px; border: 5px dashed #6e9b58; border-radius: 40px;
  display: flex; align-items: center; justify-content: center; pointer-events: none;
}
.lot span { font-size: 54px; color: #6e9b58; }
.arriving {
  position: absolute; width: 130px; height: 180px; border: 5px dashed #fff; border-radius: 60px 60px 24px 24px;
  background: #ffffff33; display: flex; align-items: center; justify-content: center; pointer-events: none;
}
.arriving span { text-align: center; font-size: 22px; font-weight: 700; line-height: 1.3; color: #fff; text-shadow: 0 2px 0 #2a2a35; }
.workplace {
  position: absolute; width: 112px; height: 80px; border: 4px dashed #8b5e3c; border-radius: 16px;
  background: #fff8e8cc; display: flex; align-items: center; justify-content: center; text-align: center;
  font-size: 18px; font-weight: 700; color: #6b4e00; padding: 4px; line-height: 1.2; pointer-events: none;
}

/* 지도 위에 올린 것들. 지도는 끌 수 있게 겹친 빈 곳은 누름을 통과시킨다 */
.overlay { position: absolute; inset: 0; pointer-events: none; display: flex; justify-content: center; }
.overlay > * { pointer-events: auto; }
.title-card {
  position: absolute; top: max(16px, env(safe-area-inset-top)); left: 12px; right: 12px; max-width: 456px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 3px; padding: 14px 18px; border-radius: 20px; background: rgba(15, 27, 45, 0.9);
}
.title { margin: 0; font-size: 24px; line-height: 1.15; }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.menu-link {
  display: inline-flex; align-items: center; min-height: 44px; padding: 0 12px; margin: -8px -6px -8px 0; border-radius: 14px;
  color: var(--accent); font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap;
}
.sub { margin: 0; font-size: 13px; color: #c9cfd9; word-break: keep-all; }
.zoom { position: absolute; right: max(12px, calc(50% - 228px)); top: calc(max(16px, env(safe-area-inset-top)) + 92px); display: flex; flex-direction: column; gap: 8px; }
.zbtn {
  width: 44px; height: 44px; border-radius: 14px; border: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center; background: rgba(15, 27, 45, 0.9); color: var(--text);
}
.home-btn { color: var(--accent); }
.bottom {
  position: absolute; left: 12px; right: 12px; bottom: calc(84px + env(safe-area-inset-bottom)); max-width: 456px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 10px;
}
.add {
  height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
  background: var(--accent); color: var(--accent-ink); font-size: 17px; font-weight: 700; text-decoration: none;
  box-shadow: 0 4px 0 #2a2a35;
}
</style>
