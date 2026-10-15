<script setup lang="ts">
import { computed, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { HOME_POINT, MAP_H, MAP_W, RESIDENT_H, RESIDENT_W, ZONES } from '../../shared/data/village'
import type { Placed } from '../../shared/village'
import { flowerColor, flowerLabel, type Flower } from '../../shared/visit'
import { centerOn } from '../utils/pan-zoom'

/**
 * 마을 지도 (내 마을과 친구 마을이 같이 쓴다): 지도·구역 이름표·주민·빈 집터·도착 예정·일터 자리·꽃, 확대·축소·우리 집 버튼.
 * 자리는 부르는 쪽이 shared/village.ts로 계산해 넘긴다(같은 결정적 배정 규칙). 끌다가 놓은 자리는 열지 않는다(usePanZoom).
 */
const props = withDefaults(defineProps<{
  residents: Placed[]
  lots?: Placed[]
  arriving?: Placed[]
  arrivingLabel?: (personId: string) => string
  /** 주민 위 친해진 정도 (내 마을에서만) */
  percentOf?: (personId: string) => number
  /** 일터 자리 (친해진 정도 100%) */
  workplaces?: Array<Placed & { name: string }>
  flowers?: Flower[]
  /** 방금 핀 꽃 (피는 연출) */
  bloomAt?: number
}>(), { lots: () => [], arriving: () => [], workplaces: () => [], flowers: () => [], bloomAt: 0 })

const emit = defineEmits<{ resident: [id: string]; flower: [flower: Flower] }>()

const viewport = ref<HTMLElement | null>(null)
const pz = usePanZoom(viewport, { w: MAP_W, h: MAP_H }, (s) => centerOn(HOME_POINT.x, HOME_POINT.y, HOME_POINT.scale, s))
const transform = computed(() => `translate(${pz.view.value.x}px, ${pz.view.value.y}px) scale(${pz.view.value.scale})`)

const nameOf = (id: string) => PEOPLE[id]?.name ?? PEOPLE[id]?.job ?? ''
const jobOf = (id: string) => PEOPLE[id]?.job ?? ''
const boxStyle = (p: Placed) => ({ left: `${p.x - RESIDENT_W / 2}px`, top: `${p.y - RESIDENT_H}px` })

/** 주민 발치에 최근 꽃 세 송이까지 */
const FLOWERS_PER_RESIDENT = 3
const FLOWER_HIT = 74
const flowerSpots = computed(() => {
  const at = new Map(props.residents.map((r) => [r.id, r]))
  const byPerson = new Map<string, Flower[]>()
  for (const f of [...props.flowers].sort((a, b) => b.at - a.at)) {
    if (!at.has(f.personId)) continue
    const list = byPerson.get(f.personId) ?? []
    if (list.length < FLOWERS_PER_RESIDENT) byPerson.set(f.personId, [...list, f])
  }
  return [...byPerson.entries()].flatMap(([id, list]) => {
    const r = at.get(id)!
    return list.map((f, i) => ({ f, key: `${id}-${f.at}`, left: r.x - 66 + i * 40 - FLOWER_HIT / 2 + 18, top: r.y - 40, color: flowerColor(id) }))
  })
})

function tapResident(id: string) {
  if (!pz.dragged()) emit('resident', id)
}
function tapFlower(f: Flower) {
  if (!pz.dragged()) emit('flower', f)
}

defineExpose({
  /** 한 주민 자리로 화면을 옮긴다 */
  focus: (p: Placed) => pz.goTo(p.x, p.y - RESIDENT_H / 2, Math.max(pz.view.value.scale, 0.8), true),
})
</script>

<template>
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

      <div v-for="lot in lots" :key="`lot-${lot.id}`" class="lot" :style="{ left: `${lot.x - 65}px`, top: `${lot.y - 150}px` }" aria-hidden="true">
        <span class="display">?</span>
      </div>

      <div v-for="a in arriving" :key="`arriving-${a.id}`" class="arriving" :style="{ left: `${a.x - 65}px`, top: `${a.y - 180}px` }">
        <span><template v-for="(word, i) in (arrivingLabel?.(a.id) ?? '').split(' ')" :key="i"><br v-if="i">{{ word }}</template></span>
      </div>

      <div v-for="w in workplaces" :key="`work-${w.id}`" class="workplace" :style="{ left: `${w.x + 56}px`, top: `${w.y - 96}px` }" :title="`${nameOf(w.id)}의 일터`">
        <span>{{ w.name }}</span>
      </div>

      <button
        v-for="r in residents"
        :key="r.id"
        class="resident"
        :style="boxStyle(r)"
        :aria-label="`${nameOf(r.id)} · ${jobOf(r.id)} 주민 카드 보기`"
        draggable="false"
        @click="tapResident(r.id)"
      >
        <span v-if="percentOf" class="pct mono" aria-hidden="true">{{ percentOf(r.id) }}%</span>
        <Character :person-id="r.id" :size="RESIDENT_H" standing />
      </button>

      <button
        v-for="s in flowerSpots"
        :key="s.key"
        class="flower"
        :class="{ bloom: s.f.at === bloomAt }"
        :style="{ left: `${s.left}px`, top: `${s.top}px`, width: `${FLOWER_HIT}px`, height: `${FLOWER_HIT}px` }"
        :aria-label="flowerLabel(s.f)"
        draggable="false"
        @click="tapFlower(s.f)"
      >
        <FlowerMark :color="s.color" :size="36" />
      </button>
    </div>
  </div>

  <div class="zoom" role="group" aria-label="지도 보기">
    <button class="zbtn" aria-label="확대" @click="pz.zoomIn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
    </button>
    <button class="zbtn" aria-label="축소" @click="pz.zoomOut">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
    </button>
    <button class="zbtn home-btn" aria-label="우리 집으로" @click="pz.goTo(HOME_POINT.x, HOME_POINT.y, HOME_POINT.scale, true)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
    </button>
  </div>
</template>

<style scoped>
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
.resident:focus-visible, .flower:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; border-radius: 20px; }
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
.flower {
  position: absolute; padding: 0; border: 0; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent;
}
.flower.bloom :deep(svg) { animation: bloom var(--motion-bloom) var(--motion-ease) both; }
@keyframes bloom {
  0% { transform: scale(0) rotate(-40deg); }
  70% { transform: scale(1.25) rotate(6deg); }
  100% { transform: scale(1) rotate(0); }
}
/* 위(제목·알림)와 아래(오고 있는 물건·버튼) 사이, 화면 가운데 높이의 오른쪽 */
.zoom { position: absolute; right: max(12px, calc(50% - 228px)); top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 8px; }
.zbtn {
  width: 44px; height: 44px; border-radius: 14px; border: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center; background: rgba(15, 27, 45, 0.9); color: var(--text);
}
.home-btn { color: var(--accent); }
</style>
