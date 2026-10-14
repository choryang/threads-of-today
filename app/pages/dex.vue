<script setup lang="ts">
import { computed, ref } from 'vue'
import { PEOPLE, PEOPLE_LIST } from '../../shared/data/people'
import { withJosa } from '../../shared/logic'
import type { Rarity } from '../../shared/types'
import { HIDDEN_LABEL, RARITY_LABEL, badgeOf, howToMeet } from '../utils/labels'

const game = useGame()
const filter = ref<Filter>('all')
const open = ref<string | null>(null)

type Filter = 'all' | Rarity | 'hidden'
const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'common', label: RARITY_LABEL.common },
  { id: 'rare', label: RARITY_LABEL.rare },
  { id: 'epic', label: RARITY_LABEL.epic },
  { id: 'legendary', label: RARITY_LABEL.legendary },
  { id: 'hidden', label: HIDDEN_LABEL },
]

const list = computed(() =>
  PEOPLE_LIST.filter((p) => filter.value === 'all' || (filter.value === 'hidden' ? p.kind === 'hidden' : p.rarity === filter.value)),
)
const total = PEOPLE_LIST.length
const percent = computed(() => Math.round((game.ownedCount.value / total) * 100))
const sets = computed(() => game.setProgress())
const numberOf = (id: string) => PEOPLE_LIST.findIndex((p) => p.id === id) + 1
const itemNames = computed(() =>
  Object.entries(game.state.items).sort((a, b) => b[1].localeCompare(a[1])).map(([name]) => name),
)
const openPerson = computed(() => (open.value ? PEOPLE[open.value] : undefined))
/** '커피 체리가 만난 사람', '노을의 찻잎이 만난 사람' */
const metLabel = computed(() => `${withJosa(game.nickname.value, '이', '가')} 만난 사람`)
</script>

<template>
  <main class="page">
    <header class="head">
      <h1 class="display title">{{ game.nickname.value }}의 사람 도감</h1>
      <p class="muted small">{{ metLabel }} <span class="mono">{{ game.ownedCount.value }}/{{ total }}</span>명</p>
      <div class="bar" aria-hidden="true"><span :style="{ width: `${percent}%` }" /></div>
      <NicknameEditor />
    </header>

    <DeviceTransfer />

    <section v-if="game.itemCount.value" aria-label="분해한 물건">
      <h2 class="h2">분해해 본 물건 <span class="mono muted">{{ game.itemCount.value }}</span></h2>
      <div class="items">
        <span v-for="name in itemNames" :key="name" class="chip">{{ name }}</span>
      </div>
    </section>

    <section aria-label="세트">
      <h2 class="h2">세트 모으기</h2>
      <div class="sets">
        <div v-for="{ set, owned, complete } in sets" :key="set.id" class="set panel" :class="{ complete }">
          <div class="set-top">
            <span class="set-name">{{ set.name }}</span>
            <span class="mono small">{{ owned }}/{{ set.memberIds.length }}</span>
          </div>
          <p class="muted small">{{ set.desc }}</p>
          <div class="set-row">
            <Character v-for="id in set.memberIds" :key="id" :person-id="id" :locked="!game.owns(id)" :size="36" />
            <span class="arrow mono" aria-hidden="true">→</span>
            <Character :person-id="set.rewardId" :locked="!complete" :size="44" />
          </div>
        </div>
      </div>
    </section>

    <section aria-label="카드 목록">
      <div class="filters" role="tablist">
        <button
          v-for="f in filters"
          :key="f.id"
          role="tab"
          :aria-selected="filter === f.id"
          class="chip"
          :class="{ on: filter === f.id }"
          @click="filter = f.id"
        >
          {{ f.label }}
        </button>
      </div>
      <div class="grid">
        <button v-for="p in list" :key="p.id" class="cell" :aria-label="game.owns(p.id) ? p.job : '아직 만나지 못한 사람'" @click="open = p.id">
          <MiniCard :person-id="p.id" :locked="!game.owns(p.id)" :is-new="game.state.cards[p.id] === game.todayKey" />
        </button>
      </div>
    </section>

    <div v-if="openPerson" class="modal" role="dialog" aria-modal="true" @click.self="open = null">
      <div class="sheet">
        <PersonCard v-if="game.owns(openPerson.id)" :person-id="openPerson.id" :number="numberOf(openPerson.id)" />
        <div v-else class="locked-card panel">
          <Character :person-id="openPerson.id" locked :size="120" />
          <p class="mono small muted">No.{{ String(numberOf(openPerson.id)).padStart(3, '0') }} · {{ badgeOf(openPerson) }}</p>
          <p class="lock-how">{{ howToMeet(openPerson) }}</p>
        </div>
        <button class="btn btn-block" @click="open = null">닫기</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 8px; }
.title { font-size: 30px; }
.small { margin: 0; font-size: 13px; }
.h2 { margin: 0 0 10px; font-size: 15px; }
.bar { height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); }

.items { display: flex; flex-wrap: wrap; gap: 6px; }
.sets { display: flex; flex-direction: column; gap: 8px; }
.set { display: flex; flex-direction: column; gap: 6px; }
.set.complete { border-color: var(--r-legendary); }
.set-top { display: flex; justify-content: space-between; align-items: center; }
.set-name { font-weight: 700; }
.set-row { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.arrow { color: var(--accent); margin: 0 4px; }

.filters { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
.filters .chip { min-height: 40px; flex-shrink: 0; color: var(--muted); }
.filters .chip.on { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); font-weight: 700; }

.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.cell { padding: 0; border: 0; background: none; text-align: inherit; }

.modal {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(5, 10, 20, 0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px 20px;
  animation: rise 0.2s ease-out;
}
.sheet { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 12px; max-height: 100%; overflow-y: auto; }
.locked-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 28px 16px; text-align: center; }
.lock-how { margin: 0; font-size: 16px; font-weight: 700; }
</style>
