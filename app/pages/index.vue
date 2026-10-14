<script setup lang="ts">
import { computed, ref } from 'vue'
import { MATERIALS, PRODUCTS } from '../../shared/data/materials'
import { PEOPLE_LIST } from '../../shared/data/people'
import { DAILY_LIMIT, type Decomposed } from '../../shared/logic'
import { buildTimeline, type JourneySource } from '../composables/useGame'
import { shrinkImage } from '../utils/image'
import { renderVoice } from '../../shared/voice'

type Tab = 'text' | 'photo' | 'pick'
type ApiResult = ({ ok: true; source: 'ai' | 'local' } & Decomposed) | { ok: false; message: string }

const game = useGame()
const router = useRouter()

const tab = ref<Tab>('text')
const text = ref('')
const loading = ref(false)
const error = ref('')
const preview = ref<(Decomposed & { source: JourneySource }) | null>(null)
const photoUrl = ref('')

const now = new Date()
const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 ${'일월화수목금토'[now.getDay()]}요일`
const total = PEOPLE_LIST.length

const quickPicks = PRODUCTS
const previewVoice = computed(() => renderVoice(preview.value?.voice, game.nickname.value))

/** "망고·딸기의 여정은 아직 준비 중이에요" */
const missingNotice = computed(() => {
  const names = preview.value?.missing
  return names?.length ? `${names.join('·')}의 여정은 아직 준비 중이에요` : ''
})

function materialNames(ids: string[]) {
  return ids.map((id) => MATERIALS[id]?.name).join(' · ')
}

async function ask(body: Record<string, unknown>, source: JourneySource) {
  loading.value = true
  error.value = ''
  preview.value = null
  try {
    const res = await $fetch<ApiResult>('/api/decompose', { method: 'POST', body })
    if (res.ok) preview.value = { name: res.name, materialIds: res.materialIds, twist: res.twist, voice: res.voice, missing: res.missing, source }
    else error.value = res.message
  } catch {
    error.value = '연결이 불안정해요. 잠시 후 다시 시도해 주세요.'
  } finally {
    loading.value = false
  }
}

function submitText() {
  const value = text.value.trim()
  if (!value || loading.value) return
  ask({ text: value }, 'text')
}

async function onPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  photoUrl.value = URL.createObjectURL(file)
  try {
    const image = await shrinkImage(file)
    await ask({ image }, 'photo')
  } catch {
    error.value = '사진을 읽을 수 없어요. 다른 사진으로 시도해 주세요.'
  }
}

function pick(productId: string) {
  const p = PRODUCTS.find((x) => x.id === productId)
  if (!p) return
  error.value = ''
  preview.value = { name: p.name, materialIds: [...p.materialIds], source: 'pick' }
}

function start() {
  if (!preview.value?.materialIds.length) return
  const journey = game.startJourney(preview.value, preview.value.source)
  if (!journey) {
    error.value = '오늘의 여정을 모두 떠났어요. 내일 다시 만나요!'
    return
  }
  preview.value = null
  text.value = ''
  router.push(`/journey/${journey.id}`)
}

function journeyProgress(materialIds: string[], step: number, id: string, name: string) {
  const len = buildTimeline(materialIds, id, name).length
  return Math.round(((step + 1) / len) * 100)
}
</script>

<template>
  <main class="page">
    <header class="head">
      <div class="head-top">
        <p class="mono muted date">{{ dateLabel }}</p>
        <NicknameEditor />
      </div>
      <h1 class="display title">오늘 내 손에<br>닿은 물건은?</h1>
      <p class="muted lead">물건 하나를 고르면 그 물건이 여기까지 오며 거쳐 온 사람들을 만나요.</p>
    </header>

    <section class="stats panel" aria-label="내 기록">
      <div><strong class="mono">{{ game.ownedCount.value }}<small>/{{ total }}</small></strong><span>모은 카드</span></div>
      <div><strong class="mono">{{ game.streak.value }}일</strong><span>연속 기록</span></div>
      <div><strong class="mono">{{ game.remaining.value }}/{{ DAILY_LIMIT }}</strong><span>남은 여정</span></div>
    </section>
    <p v-if="game.itemCount.value" class="muted small items-line">지금까지 분해해 본 물건 <span class="mono">{{ game.itemCount.value }}</span>개</p>

    <NuxtLink to="/mystery" class="mystery">
      <div>
        <p class="mono kicker">TODAY'S MYSTERY</p>
        <p class="m-title">오늘의 미스터리 물건</p>
        <p class="m-sub">
          <template v-if="game.mystery.value.solved">맞혔어요! 보너스 여정을 떠나 보세요</template>
          <template v-else-if="game.mystery.value.finished">내일 새 문제가 열려요</template>
          <template v-else>힌트를 보고 무슨 물건인지 맞혀 보세요</template>
        </p>
      </div>
      <span class="q" aria-hidden="true">?</span>
    </NuxtLink>

    <section v-if="game.today.value.journeys.length" class="today">
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

    <section v-if="game.remaining.value > 0" class="input panel" aria-label="물건 고르기">
      <div class="tabs" role="tablist">
        <button role="tab" :aria-selected="tab === 'text'" :class="{ on: tab === 'text' }" @click="tab = 'text'">말로 쓰기</button>
        <button role="tab" :aria-selected="tab === 'photo'" :class="{ on: tab === 'photo' }" @click="tab = 'photo'">사진 올리기</button>
        <button role="tab" :aria-selected="tab === 'pick'" :class="{ on: tab === 'pick' }" @click="tab = 'pick'">골라 보기</button>
      </div>

      <form v-if="tab === 'text'" class="text-form" @submit.prevent="submitText">
        <label for="item" class="sr-only">오늘 나에게 닿은 것</label>
        <input id="item" v-model="text" maxlength="40" placeholder="물건, 음식, 고양이, 월요일… 뭐든지" autocomplete="off">
        <button class="btn btn-primary" :disabled="!text.trim() || loading">{{ loading ? '분해 중…' : '분해하기' }}</button>
      </form>

      <div v-else-if="tab === 'photo'" class="photo">
        <label class="photo-drop">
          <input type="file" accept="image/*" class="sr-only" @change="onPhoto">
          <img v-if="photoUrl" :src="photoUrl" alt="고른 사진">
          <template v-else>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="9.5" r="1.8" /><path d="M3.5 17l5-5 4 4 3-3 5 5" /></svg>
            <span>물건이 보이는 사진을 올려 주세요</span>
          </template>
        </label>
        <p v-if="loading" class="muted small">사진 속 물건을 알아보는 중…</p>
      </div>

      <div v-else class="picks">
        <button v-for="p in quickPicks" :key="p.id" class="pick" @click="pick(p.id)">{{ p.name }}</button>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <div v-if="preview" class="preview">
        <p v-if="preview.twist" class="twist">{{ preview.twist }}</p>
        <div class="p-top">
          <p class="p-name">{{ preview.name }}</p>
          <span v-if="!game.knowsItem(preview.name)" class="first mono">FIRST</span>
        </div>
        <p v-if="previewVoice" class="voice">“{{ previewVoice }}”</p>
        <template v-if="preview.materialIds.length">
          <p class="muted small">이렇게 나뉘어요</p>
          <div class="mats">
            <template v-for="(id, i) in preview.materialIds" :key="id">
              <span v-if="i" class="plus" aria-hidden="true">+</span>
              <span class="mat">{{ MATERIALS[id]?.name }}</span>
            </template>
          </div>
        </template>
        <div v-if="missingNotice" class="missing">
          <p class="missing-title">{{ missingNotice }}</p>
          <p class="muted small">{{ preview.materialIds.length ? '지금은 나머지 재료의 여정만 떠날 수 있어요.' : '다른 물건을 적거나 "골라 보기"에서 골라 볼까요?' }}</p>
        </div>
        <button v-if="preview.materialIds.length" class="btn btn-primary btn-block" @click="start">여정 떠나기 →</button>
      </div>
    </section>

    <section v-else class="panel done-panel">
      <p class="p-name">오늘의 여정을 모두 마쳤어요</p>
      <p class="muted small">내일 새 물건으로 다시 만나요. 오늘의 결과 카드는 공유할 수 있어요.</p>
      <NuxtLink to="/result" class="btn btn-primary btn-block">오늘의 결과 카드 보기</NuxtLink>
    </section>

  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 8px; }
.date { margin: 0; font-size: 13px; }
.head-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; }
.head-top > .nick { min-width: 0; }
.title { font-size: 32px; line-height: 1.22; }
.lead { margin: 0; font-size: 14px; line-height: 1.55; }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); padding: 14px 8px; }
.stats div { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stats strong { font-size: 20px; color: var(--accent); font-weight: 500; }
.stats small { font-size: 12px; color: var(--muted); }
.stats span { font-size: 12px; color: var(--muted); }

.mystery {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--paper);
  color: var(--ink);
  text-decoration: none;
}
.kicker { margin: 0; font-size: 11px; letter-spacing: 1.5px; color: #8a5a1a; }
.m-title { margin: 4px 0 2px; font-family: var(--font-display); font-size: 20px; }
.m-sub { margin: 0; font-size: 13px; color: #4a4a4a; }
.q {
  width: 52px; height: 52px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; background: var(--ink); color: var(--accent);
  font-family: var(--font-display); font-size: 28px;
}

.h2 { margin: 0 0 4px; font-size: 15px; }
.today { display: flex; flex-direction: column; gap: 8px; }
.j-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; text-decoration: none; color: var(--text); padding: 12px 14px; }
.j-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.j-name { font-weight: 700; }
.j-mats { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.done { color: var(--ok); border-color: var(--ok); }

.input { display: flex; flex-direction: column; gap: 14px; }
.tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 14px; background: var(--ground); }
.tabs button { min-height: 44px; border: 0; border-radius: 10px; background: transparent; color: var(--muted); font-size: 14px; }
.tabs button.on { background: var(--surface-2); color: var(--text); font-weight: 700; }

.text-form { display: flex; gap: 8px; }
.text-form input {
  flex: 1; min-width: 0; min-height: 52px; padding: 0 14px;
  border-radius: 14px; border: 1px solid var(--line); background: var(--ground); font-size: 16px;
}
.text-form input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }

.photo { display: flex; flex-direction: column; gap: 8px; }
.photo-drop {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  min-height: 160px; border-radius: 16px; border: 2px dashed var(--line); color: var(--muted);
  cursor: pointer; overflow: hidden; font-size: 14px;
}
.photo-drop img { width: 100%; max-height: 240px; object-fit: cover; }

.picks { display: flex; flex-wrap: wrap; gap: 8px; }
.pick { min-height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--line); background: var(--ground); font-size: 14px; }
.pick:active { background: var(--surface-2); }

.error { margin: 0; color: #ffb4a6; font-size: 14px; }
.small { margin: 0; font-size: 13px; }

.preview {
  display: flex; flex-direction: column; gap: 10px;
  padding: 16px; border-radius: 16px; background: var(--ground); border: 1px solid var(--accent);
  animation: rise 0.25s ease-out;
}
.p-name { margin: 0; font-size: 20px; font-weight: 700; }
.mats { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.mat { padding: 6px 12px; border-radius: 999px; background: var(--surface-2); font-size: 14px; }
.plus { color: var(--accent); font-family: var(--font-mono); }

.items-line { margin: -8px 0 0; text-align: center; }
.twist { margin: 0; font-size: 13px; color: var(--accent); }
.missing { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px dashed var(--line); border-radius: 10px; }
.missing p { margin: 0; }
.missing-title { font-size: 14px; font-weight: 600; }
.p-top { display: flex; align-items: center; gap: 8px; }
.first { font-size: 11px; padding: 3px 7px; border-radius: 6px; background: var(--r-epic); color: var(--ink); }
.voice {
  margin: 0; padding: 10px 14px; border-radius: 14px 14px 14px 4px;
  background: var(--paper); color: var(--ink); font-size: 14px; line-height: 1.5;
  align-self: flex-start; max-width: 100%;
}

.done-panel { display: flex; flex-direction: column; gap: 10px; }
</style>
