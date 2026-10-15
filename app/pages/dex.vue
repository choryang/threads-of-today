<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PEOPLE, PEOPLE_LIST } from '../../shared/data/people'
import { DAILY_LIMIT, withJosa } from '../../shared/logic'
import type { Person, Rarity } from '../../shared/types'
import { HIDDEN_LABEL, RARITY_GUIDE, RARITY_LABEL, RARITY_NOTE, badgeOf, howToMeet } from '../utils/labels'

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
const labelOf = (p: Person) => (p.name ? `${p.name} · ${p.job}` : p.job)
const itemNames = computed(() =>
  Object.entries(game.state.items).sort((a, b) => b[1].localeCompare(a[1])).map(([name]) => name),
)
/** '등급 기준'은 첫 방문에 펼쳐 두고, 접거나 펼친 상태를 기억한다 */
const GUIDE_KEY = 'my-day-people:rarity-guide'
const guideOpen = ref(true)
onMounted(() => {
  // 다른 기기와 합쳐져 완성된 세트의 감사 장면을 여기서 한 번 보여 준다
  game.showUnseenScenes()
  try {
    guideOpen.value = window.localStorage.getItem(GUIDE_KEY) !== 'closed'
  } catch {
    // 저장이 막힌 환경에서는 늘 펼쳐 둔다
  }
})
function toggleGuide() {
  guideOpen.value = !guideOpen.value
  try {
    window.localStorage.setItem(GUIDE_KEY, guideOpen.value ? 'open' : 'closed')
  } catch {
    // 이번 방문 동안만 유지
  }
}

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
      <div class="stats panel" aria-label="내 기록">
        <div><strong class="mono">{{ game.ownedCount.value }}<small>/{{ total }}</small></strong><span>모은 카드</span></div>
        <div><strong class="mono">{{ game.remaining.value }}/{{ DAILY_LIMIT }}</strong><span>남은 여정</span></div>
      </div>
      <NicknameEditor />
      <button v-if="game.allThanked.value" class="btn ending-btn" @click="game.replayEnding()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
        엔딩 다시 보기
      </button>
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
      <div class="guide panel">
        <div class="guide-top">
          <p class="guide-note">{{ RARITY_NOTE }}</p>
          <button class="guide-btn" :aria-expanded="guideOpen" aria-controls="rarity-guide" @click="toggleGuide">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>
            등급 기준
            <svg class="caret" :class="{ up: guideOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
        <dl v-if="guideOpen" id="rarity-guide" class="guide-list">
          <template v-for="g in RARITY_GUIDE" :key="g.label">
            <dt>{{ g.label }}</dt>
            <dd>{{ g.how }}</dd>
          </template>
        </dl>
      </div>
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
        <button v-for="p in list" :key="p.id" class="cell" :aria-label="game.owns(p.id) ? labelOf(p) : '아직 만나지 못한 사람'" @click="open = p.id">
          <MiniCard :person-id="p.id" :locked="!game.owns(p.id)" :is-new="game.state.cards[p.id] === game.todayKey" :thanked="game.thanked(p.id)" />
        </button>
      </div>
    </section>

    <p class="people-note">이 게임 속 사람들은 실제로 그 일을 하는 사람들을 바탕으로 만든 가상의 인물이에요.</p>

    <div v-if="openPerson" class="modal" role="dialog" aria-modal="true" @click.self="open = null">
      <div class="sheet">
        <template v-if="game.owns(openPerson.id)">
          <PersonCard :person-id="openPerson.id" :number="numberOf(openPerson.id)" />
          <div class="friend-wrap"><FriendshipPanel :person-id="openPerson.id" /></div>
        </template>
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
.friend-wrap { padding: 16px; border-radius: 22px; background: var(--paper); }
.title { font-size: 30px; }
.small { margin: 0; font-size: 13px; }
.people-note { margin: 0; font-size: 12px; line-height: 1.5; color: var(--muted); text-align: center; word-break: keep-all; }
.h2 { margin: 0 0 10px; font-size: 15px; }
.ending-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; color: var(--bad); }
.bar { height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); padding: 14px 8px; }
.stats div { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stats strong { font-size: 20px; color: var(--accent); font-weight: 500; }
.stats small { font-size: 12px; color: var(--muted); }
.stats span { font-size: 12px; color: var(--muted); }

.items { display: flex; flex-wrap: wrap; gap: 6px; }
.sets { display: flex; flex-direction: column; gap: 8px; }
.set { display: flex; flex-direction: column; gap: 6px; }
.set.complete { border-color: var(--r-legendary); }
.set-top { display: flex; justify-content: space-between; align-items: center; }
.set-name { font-weight: 700; }
.set-row { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.arrow { color: var(--accent); margin: 0 4px; }

.guide { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.guide-top { display: flex; align-items: flex-start; gap: 10px; }
.guide-note { margin: 0; flex: 1; font-size: 14px; line-height: 1.55; }
.guide-btn {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px;
  min-height: 44px; padding: 0 12px; border-radius: 999px;
  border: 1px solid var(--line); background: transparent; color: var(--accent);
  font: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
}
.caret { transition: transform 0.2s; }
.caret.up { transform: rotate(180deg); }
.guide-list { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 13px; line-height: 1.5; }
.guide-list dt { font-weight: 700; color: var(--accent); white-space: nowrap; }
.guide-list dd { margin: 0; }
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
