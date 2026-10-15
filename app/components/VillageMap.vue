<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { HOME_POINT, MAP_H, MAP_W, RESIDENT_H, RESIDENT_W, WORKPLACES, ZONES } from '../../shared/data/village'
import type { Placed } from '../../shared/village'
import { flowerColor, flowerLabel, type Flower } from '../../shared/visit'
import { MOTION, reducedMotion } from '../utils/motion'
import { FAR_SCALE, FAR_TAP_SCALE, centerOn, hitBox, zoneLabelScale } from '../utils/pan-zoom'

/**
 * 마을 지도 (내 마을과 친구 마을이 같이 쓴다): 지도·구역 이름표·주민·빈 집터·도착 예정·단짝 표시·일터 자리·꽃, 확대·축소·우리 집 버튼.
 * 자리는 부르는 쪽이 shared/village.ts로 계산해 넘긴다(같은 결정적 배정 규칙). 끌다가 놓은 자리는 열지 않는다(usePanZoom).
 *
 * 주민 누르는 영역: 보이지 않는 버튼이 캐릭터보다 넓다(지도 좌표 140×210, 발끝 아래 20까지). 화면에서 44px보다 작아지면
 * 화면 기준 44×44px로 키운다(utils/pan-zoom.ts hitBox). 겹치면 발끝이 더 아래(화면 앞쪽)인 주민이 위에 있어 먼저 눌린다(z-index = 발끝 y).
 * 배율 0.25 미만(멀리 보기)에서는 주민 이름표·꽃을 숨기고 구역 이름표만 키워 보여 주며, 주민을 누르면 카드 대신 0.6배로 다가간다.
 */
const props = withDefaults(defineProps<{
  residents: Placed[]
  lots?: Placed[]
  arriving?: Placed[]
  arrivingLabel?: (personId: string) => string
  /** 주민 위 친해진 정도 (내 마을에서만) */
  percentOf?: (personId: string) => number
  /** 친해진 정도 100%(단짝)인 주민: 발밑 금색 빛, 머리 위 하트, 옆에 일터 자리 */
  bestFriends?: string[]
  flowers?: Flower[]
  /** 방금 핀 꽃 (피는 연출) */
  bloomAt?: number
}>(), { lots: () => [], arriving: () => [], bestFriends: () => [], flowers: () => [], bloomAt: 0 })

const emit = defineEmits<{ resident: [id: string]; flower: [flower: Flower] }>()

const viewport = ref<HTMLElement | null>(null)
const pz = usePanZoom(viewport, { w: MAP_W, h: MAP_H }, (s) => centerOn(HOME_POINT.x, HOME_POINT.y, HOME_POINT.scale, s))
const transform = computed(() => `translate(${pz.view.value.x}px, ${pz.view.value.y}px) scale(${pz.view.value.scale})`)
const far = computed(() => pz.view.value.scale < FAR_SCALE)
/** 누르는 영역·구역 이름표 크기는 배율에 따라 CSS 변수 몇 개로만 바꾼다(주민마다 다시 그리지 않게) */
const worldVars = computed(() => {
  const b = hitBox(pz.view.value.scale)
  return {
    '--hit-w': `${b.w}px`,
    '--hit-h': `${b.h}px`,
    '--hit-l': `${b.left}px`,
    '--hit-t': `${b.top}px`,
    '--label-k': String(far.value ? zoneLabelScale(pz.view.value.scale) : 1),
  }
})

/** 멀리 보기에서 이름표를 키우는 방향: 구역 가운데보다 아래에 붙은 이름표는 위로, 위에 붙은 이름표는 아래로 (옆 구역 이름표와 겹치지 않게) */
const labelOrigin = (z: (typeof ZONES)[number]) => (z.label[1] > (z.bounds[1] + z.bounds[3]) / 2 ? '0 100%' : '0 0')

const nameOf = (id: string) => PEOPLE[id]?.name ?? PEOPLE[id]?.job ?? ''
const jobOf = (id: string) => PEOPLE[id]?.job ?? ''
/** 누르는 상자: 발끝 + hitBox 위치. 캐릭터는 그 안에서 발끝 기준 (x - 70, y - 190)에 그린다 */
const hitStyle = (p: Placed) => ({ left: `calc(${p.x}px + var(--hit-l))`, top: `calc(${p.y}px + var(--hit-t))`, zIndex: p.y })

const best = computed(() => new Set(props.bestFriends))
/** 단짝의 일터 자리 (그림이 아직 없어 점선 자리 + 일터 이름표) */
const workplaces = computed(() =>
  props.residents.filter((r) => best.value.has(r.id)).map((r) => ({ ...r, name: WORKPLACES[PEOPLE[r.id]!.workplace] })),
)

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
    // 꽃은 그 주민 바로 위 층 (더 앞쪽 주민보다는 아래)
    return list.map((f, i) => ({ f, key: `${id}-${f.at}`, left: r.x - 66 + i * 40 - FLOWER_HIT / 2 + 18, top: r.y - 40, z: r.y + 1, color: flowerColor(id) }))
  })
})

function tapResident(r: Placed) {
  if (pz.dragged()) return
  // 멀리 보기: 카드를 열지 않고 그 자리로 다가간다
  if (far.value) pz.goTo(r.x, r.y - RESIDENT_H / 2, FAR_TAP_SCALE, true)
  else emit('resident', r.id)
}
function tapFlower(f: Flower) {
  if (!pz.dragged()) emit('flower', f)
}

// ── 단짝이 된 순간: 그 주민 쪽으로 옮긴 뒤 하트가 커졌다 작아진다 ──
const cheering = ref('')
let cheerTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(cheerTimer))
function celebrate(p: Placed): Promise<void> {
  pz.goTo(p.x, p.y - RESIDENT_H / 2, Math.max(pz.view.value.scale, 0.8), true)
  if (reducedMotion()) return Promise.resolve()
  return new Promise((resolve) => {
    clearTimeout(cheerTimer)
    cheerTimer = setTimeout(() => {
      cheering.value = p.id
      cheerTimer = setTimeout(() => { cheering.value = ''; resolve() }, MOTION.heartMs)
    }, MOTION.panMs)
  })
}

defineExpose({
  /** 한 주민 자리로 화면을 옮긴다 */
  focus: (p: Placed) => pz.goTo(p.x, p.y - RESIDENT_H / 2, Math.max(pz.view.value.scale, 0.8), true),
  /** 단짝이 된 순간 연출 (옮기기 → 하트). 끝나면 resolve */
  celebrate,
})
</script>

<template>
  <div ref="viewport" class="viewport">
    <div class="world" :class="{ gliding: pz.gliding.value, far }" :style="{ width: `${MAP_W}px`, height: `${MAP_H}px`, transform, ...worldVars }">
      <img src="/village/map.svg" :width="MAP_W" :height="MAP_H" alt="" draggable="false" class="map">

      <div v-for="lot in lots" :key="`lot-${lot.id}`" class="lot" :style="{ left: `${lot.x - 65}px`, top: `${lot.y - 150}px` }" aria-hidden="true">
        <span class="display">?</span>
      </div>

      <div v-for="a in arriving" :key="`arriving-${a.id}`" class="arriving" :style="{ left: `${a.x - 65}px`, top: `${a.y - 180}px`, zIndex: a.y }">
        <span><template v-for="(word, i) in (arrivingLabel?.(a.id) ?? '').split(' ')" :key="i"><br v-if="i">{{ word }}</template></span>
      </div>

      <div v-for="w in workplaces" :key="`work-${w.id}`" class="workplace" :style="{ left: `${w.x + 56}px`, top: `${w.y - 96}px`, zIndex: w.y - 1 }" :title="`${nameOf(w.id)}의 일터`">
        <span class="work-tag">{{ w.name }}</span>
      </div>

      <button
        v-for="r in residents"
        :key="r.id"
        class="resident"
        :class="{ best: best.has(r.id), cheer: cheering === r.id }"
        :style="hitStyle(r)"
        :aria-label="`${nameOf(r.id)} · ${jobOf(r.id)}${best.has(r.id) ? ' · 단짝' : ''} 주민 카드 보기`"
        draggable="false"
        @click="tapResident(r)"
      >
        <span class="body" :style="{ width: `${RESIDENT_W}px`, height: `${RESIDENT_H}px` }">
          <svg v-if="best.has(r.id)" class="glow" width="150" height="56" viewBox="0 0 150 56" aria-hidden="true">
            <ellipse cx="75" cy="28" rx="70" ry="24" fill="#F2C14E" opacity=".35" />
            <ellipse cx="75" cy="28" rx="62" ry="19" fill="none" stroke="#F2C14E" stroke-width="7" />
            <ellipse cx="75" cy="28" rx="62" ry="19" fill="none" stroke="#2A2A35" stroke-width="2" opacity=".5" />
          </svg>
          <Character :person-id="r.id" :size="RESIDENT_H" standing />
          <span v-if="percentOf" class="pct mono" aria-hidden="true">{{ percentOf(r.id) }}%</span>
          <svg v-if="best.has(r.id)" class="heart" width="44" height="40" viewBox="0 0 24 22" aria-hidden="true">
            <path d="M12 20.5s-8.3-5-9.9-10.4C.9 6.2 3.3 2.5 7 2.5c2.1 0 3.8 1.1 5 2.9 1.2-1.8 2.9-2.9 5-2.9 3.7 0 6.1 3.7 4.9 7.6C20.3 15.5 12 20.5 12 20.5z" fill="#E0705F" stroke="#2A2A35" stroke-width="2" stroke-linejoin="round" />
          </svg>
        </span>
      </button>

      <button
        v-for="s in flowerSpots"
        :key="s.key"
        class="flower"
        :class="{ bloom: s.f.at === bloomAt }"
        :style="{ left: `${s.left}px`, top: `${s.top}px`, width: `${FLOWER_HIT}px`, height: `${FLOWER_HIT}px`, zIndex: s.z }"
        :aria-label="flowerLabel(s.f)"
        draggable="false"
        @click="tapFlower(s.f)"
      >
        <FlowerMark :color="s.color" :size="36" />
      </button>

      <!-- 구역 이름표는 맨 위 층 (멀리 보기에서는 읽히게 키운다) -->
      <span
        v-for="z in ZONES"
        :key="z.id"
        class="zone-label display"
        :class="{ home: z.id === 'town' }"
        :style="{ left: `${z.label[0]}px`, top: `${z.label[1]}px`, transformOrigin: labelOrigin(z) }"
      >{{ z.name }}</span>
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
.viewport { position: absolute; inset: 0; background: #7fc3de; touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
.viewport:active { cursor: grabbing; }
.world { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
.world.gliding { transition: transform var(--motion-pan) var(--motion-ease); }
.map { position: absolute; left: 0; top: 0; display: block; pointer-events: none; -webkit-user-drag: none; }
.zone-label {
  position: absolute; z-index: 10000; padding: 6px 18px; border-radius: 22px; border: 4px solid #2a2a35;
  background: #fff; color: #2a2a35; font-size: 30px; white-space: nowrap; pointer-events: none;
  transform: scale(var(--label-k, 1));
}
.zone-label.home { background: #f2c14e; }
.resident {
  position: absolute; width: var(--hit-w); height: var(--hit-h); padding: 0; border: 0; background: none; cursor: pointer;
  display: block; -webkit-tap-highlight-color: transparent;
}
/* 캐릭터는 누르는 상자 안에서 발끝 기준 (x - 70, y - 190) */
.body { position: absolute; display: block; left: calc(-70px - var(--hit-l)); top: calc(-190px - var(--hit-t)); pointer-events: none; }
.glow { position: absolute; left: -5px; top: 162px; }
.heart { position: absolute; left: 48px; top: -58px; transform-origin: 50% 90%; }
.resident.cheer .heart { animation: heart-pop var(--motion-heart) var(--motion-ease); }
@keyframes heart-pop {
  0% { transform: scale(1); }
  35% { transform: scale(2.2); }
  60% { transform: scale(1.6); }
  100% { transform: scale(1); }
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
  background: #fff8e899; pointer-events: none;
}
.work-tag {
  position: absolute; left: 50%; bottom: -16px; transform: translateX(-50%); padding: 2px 10px; border-radius: 12px;
  border: 3px solid #2a2a35; background: #fff8e8; color: #6b4e00; font-size: 16px; font-weight: 700; white-space: nowrap;
}
/* 멀리 보기: 주민 이름표·꽃은 숨기고 구역 이름표만 */
.far .pct, .far .flower, .far .work-tag, .far .arriving span, .far .lot span { display: none; }
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
