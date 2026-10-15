<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { MATERIALS, PRODUCTS } from '../../shared/data/materials'
import { seoulDateKey, type Decomposed } from '../../shared/logic'
import type { Journey, JourneySource } from '../composables/useGame'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { buildTimeline } from '../../shared/journey'
import { shrinkImage } from '../utils/image'
import { matchLocal } from '../utils/local-match'
import { productIconSvg } from '../utils/product-icon'
import { renderVoice } from '../../shared/voice'

type ApiResult = ({ ok: true; source: 'ai' | 'local' } & Decomposed) | { ok: false; message: string; limited?: boolean }

/** 처음에 보이는 타일 수 (390px 폭에서 3줄) */
const FIRST_TILES = 9

const game = useGame()
const router = useRouter()

const showAll = ref(false)
const writing = ref(false)
const text = ref('')
const textEl = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref('')
const preview = ref<(Decomposed & { source: JourneySource }) | null>(null)
const photoUrl = ref('')

/**
 * 직접 쓰기·사진(AI)의 오늘 한도를 다 썼는지. 서버가 limited로 알려 주면 이 기기에 서울 날짜로 적어 두고 그날만 안내한다.
 * 물건 고르기는 한도와 상관없이 계속된다.
 */
const AI_LIMIT_KEY = 'my-day-people:ai-limit'
const aiLimited = ref(false)
onMounted(() => {
  try {
    aiLimited.value = window.localStorage.getItem(AI_LIMIT_KEY) === seoulDateKey()
  } catch {
    // 저장소를 못 쓰면 서버가 다시 알려 줄 때 안내한다
  }
})
function markAiLimited() {
  aiLimited.value = true
  try {
    window.localStorage.setItem(AI_LIMIT_KEY, seoulDateKey())
  } catch {
    // 이번 방문 동안만
  }
}

const tiles = computed(() => (showAll.value ? PRODUCTS : PRODUCTS.slice(0, FIRST_TILES)))
const previewVoice = computed(() => renderVoice(preview.value?.voice, game.nickname.value))
/** 오늘 떠난 여정 + 어제 이전에 떠나 아직 가는 중인 여정 */
const trips = computed(() => {
  const earlier = Object.entries(game.state.days)
    .filter(([key]) => key !== game.todayKey)
    .flatMap(([, day]) => day.journeys.filter((j) => !j.done))
  return [...earlier, ...game.today.value.journeys]
})

/** 여정마다 지금 위치(나라 또는 '바다 위')와 몇 번째 장면인지 */
function tripStatus(j: Journey): { where: string; left: string; state: 'arrived' | 'quiz' | 'moving' } {
  if (j.done) return { where: '', left: '도착했어요', state: 'arrived' }
  const timeline = buildTimeline(j.materialIds, j.id, j.name)
  const item = timeline[j.step]
  if (item?.type === 'quiz' && j.quiz[item.materialId] === undefined) return { where: '', left: '퀴즈가 기다리고 있어요', state: 'quiz' }
  return { where: whereAt(timeline, j.step), left: `${j.step + 1}/${timeline.length} · 이어 보기`, state: 'moving' }
}

/** index 칸에서 물건이 있는 곳. 이야기·퀴즈 칸은 바로 앞 사람의 자리 */
function whereAt(timeline: ReturnType<typeof buildTimeline>, index: number): string {
  for (let i = Math.min(index, timeline.length - 1); i >= 0; i--) {
    const t = timeline[i]!
    const personId = t.type === 'stage' || t.type === 'hidden' ? t.personId : t.type === 'pass' ? t.personIds[t.personIds.length - 1] : undefined
    if (!personId) continue
    const place = PLACES[PEOPLE[personId]?.placeId ?? '']
    return place?.continent === 'sea' ? '바다 위' : place?.country ?? ''
  }
  return ''
}

/** "망고·딸기의 여정은 아직 준비 중이에요" */
const missingNotice = computed(() => {
  const names = preview.value?.missing
  return names?.length ? `${names.join('·')}의 여정은 아직 준비 중이에요` : ''
})

function materialName(id: string) {
  return MATERIALS[id]?.name ?? id
}

async function ask(body: Record<string, unknown>, source: JourneySource) {
  loading.value = true
  error.value = ''
  preview.value = null
  try {
    const res = await $fetch<ApiResult>('/api/decompose', { method: 'POST', body })
    if (res.ok) preview.value = { name: res.name, materialIds: res.materialIds, twist: res.twist, voice: res.voice, missing: res.missing, source }
    else if (res.limited) markAiLimited()
    else error.value = res.message
  } catch {
    error.value = '연결이 불안정해요. 잠시 후 다시 시도해 주세요.'
  } finally {
    loading.value = false
  }
}

async function openWriting() {
  writing.value = true
  await nextTick()
  textEl.value?.focus()
}

function submitText() {
  const value = text.value.trim()
  if (!value || loading.value) return
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  photoUrl.value = ''
  // 대표 물건·앱용 사전에서 찾으면 서버를 거치지 않고 바로 보여 준다. 못 찾을 때만 서버(캐시 → AI)로
  const local = matchLocal(value)
  if (local) {
    error.value = ''
    preview.value = { name: local.name, materialIds: local.materialIds, twist: local.twist, voice: local.voice, missing: local.missing, source: 'text' }
    // 준비 중 재료 집계는 서버가 한다. 결과를 기다리지 않는다 (서버도 같은 사전에서 찾아 AI를 부르지 않는다)
    if (local.missing?.length) $fetch('/api/decompose', { method: 'POST', body: { text: value } }).catch(() => {})
    return
  }
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
  photoUrl.value = ''
  preview.value = { name: p.name, materialIds: [...p.materialIds], source: 'pick' }
}

/** 첫 방문(카드 0장, 떠난 여정 없음)에는 커피 한 잔으로 바로 떠나는 버튼 하나만 크게. '다른 물건 고르기'를 누르면 원래 메인 */
const FIRST_PRODUCT_ID = 'americano'
const skipWelcome = ref(false)
const welcome = computed(() => game.firstVisit.value && !trips.value.length && !skipWelcome.value)

function startFirst() {
  const p = PRODUCTS.find((x) => x.id === FIRST_PRODUCT_ID)
  if (!p) return
  const journey = game.startJourney({ name: p.name, materialIds: [...p.materialIds] }, 'pick')
  router.push(`/journey/${journey.id}`)
}

function closePreview() {
  preview.value = null
}

function start() {
  if (!preview.value?.materialIds.length) return
  const journey = game.startJourney(preview.value, preview.value.source)
  preview.value = null
  text.value = ''
  router.push(`/journey/${journey.id}`)
}
</script>

<template>
  <main v-if="welcome" class="page home welcome">
    <header class="head">
      <h1 class="display title">오늘 손에 닿은 물건은?</h1>
      <p class="muted welcome-sub">물건 하나가 손에 오기까지 거쳐 온 사람들을 만나러 가요.</p>
    </header>
    <button class="first-go" @click="startFirst">
      <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
      <svg class="first-icon" viewBox="0 0 32 32" width="72" height="72" aria-hidden="true" v-html="productIconSvg(FIRST_PRODUCT_ID)" />
      <span class="first-label">커피 한 잔부터 시작해 볼까요?</span>
    </button>
    <button class="link welcome-other" @click="skipWelcome = true">다른 물건 고르기</button>
  </main>

  <main v-else class="page home">
    <section v-if="trips.length" class="trips" aria-labelledby="trips-title">
      <div class="trips-head">
        <h2 id="trips-title" class="trips-title">오늘 떠난 여정</h2>
      </div>
      <NuxtLink v-for="j in trips" :key="j.id" :to="`/journey/${j.id}`" class="trip" :class="`trip-${tripStatus(j).state}`">
        <span class="trip-name">{{ j.name }}</span>
        <span class="trip-status">
          <span v-if="tripStatus(j).where" class="trip-where">{{ tripStatus(j).where }}</span>
          <span class="trip-left">{{ tripStatus(j).left }}</span>
        </span>
      </NuxtLink>
    </section>

    <header class="head">
      <h1 class="display title">오늘 손에 닿은 물건은?</h1>
      <NuxtLink to="/mystery" class="mystery-link">오늘의 미스터리 물건 맞히기</NuxtLink>
    </header>

    <section class="grid" aria-label="물건 고르기">
      <button v-for="p in tiles" :key="p.id" class="tile" @click="pick(p.id)">
        <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
        <svg class="tile-icon" viewBox="0 0 32 32" width="44" height="44" aria-hidden="true" v-html="productIconSvg(p.id)" />
        <span class="tile-name">{{ p.name }}</span>
      </button>
    </section>
    <button v-if="!showAll" class="more" @click="showAll = true">
      더 보기 <span class="mono muted">+{{ PRODUCTS.length - FIRST_TILES }}</span>
    </button>

    <div class="other">
      <p class="other-line">
        <span class="muted">찾는 물건이 없나요?</span>
        <button class="link" :aria-expanded="writing" @click="openWriting">직접 쓰기</button>
        <span class="muted" aria-hidden="true">·</span>
        <label class="link">
          <input type="file" accept="image/*" class="sr-only" @change="onPhoto">
          사진 찍기
        </label>
      </p>
      <form v-if="writing" class="text-form" @submit.prevent="submitText">
        <label for="item" class="sr-only">오늘 나에게 닿은 것</label>
        <input id="item" ref="textEl" v-model="text" maxlength="40" placeholder="물건, 음식, 고양이, 월요일… 뭐든지" autocomplete="off">
        <button class="btn btn-primary" :disabled="!text.trim() || loading">분해하기</button>
      </form>
      <p v-if="loading" class="muted small thinking" role="status">
        <span class="dots" aria-hidden="true"><span /><span /><span /></span>
        {{ photoUrl ? '사진 속 물건을 알아보는 중…' : '재료를 살펴보는 중…' }}
      </p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="aiLimited" class="panel limit-note" role="status">오늘은 직접 쓰기를 다 썼어요. 위 물건은 계속 고를 수 있어요</p>
    </div>

    <div v-if="preview" class="sheet-wrap" role="dialog" aria-modal="true" :aria-label="`${preview.name} 미리보기`" @click.self="closePreview">
      <div class="sheet">
        <button class="close" aria-label="닫기" @click="closePreview">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <img v-if="photoUrl && preview.source === 'photo'" :src="photoUrl" alt="고른 사진" class="photo">
        <p v-if="preview.twist" class="twist">{{ preview.twist }}</p>
        <div class="p-top">
          <p class="p-name">{{ preview.name }}</p>
          <span v-if="!game.knowsItem(preview.name)" class="first">처음</span>
        </div>
        <p v-if="previewVoice" class="voice">“{{ previewVoice }}”</p>
        <template v-if="preview.materialIds.length">
          <p class="muted small">이렇게 나뉘어요</p>
          <div class="mats">
            <template v-for="(id, i) in preview.materialIds" :key="id">
              <span v-if="i" class="plus" aria-hidden="true">+</span>
              <span class="mat">{{ materialName(id) }}</span>
            </template>
          </div>
        </template>
        <div v-if="missingNotice" class="missing">
          <p class="missing-title">{{ missingNotice }}</p>
          <p class="muted small">{{ preview.materialIds.length ? '지금은 나머지 재료의 여정만 떠날 수 있어요.' : '다른 물건을 적거나 위에서 골라 볼까요?' }}</p>
        </div>
        <button v-if="preview.materialIds.length" class="btn btn-primary btn-block" @click="start">여정 떠나기 →</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home { gap: 16px; }
.welcome { justify-content: center; min-height: 70dvh; gap: 24px; }
.welcome-sub { margin: 0; font-size: 15px; line-height: 1.5; word-break: keep-all; }
.first-go {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  min-height: 200px; padding: 28px 20px;
  border-radius: 24px; border: 0; background: var(--accent); color: var(--accent-ink);
  box-shadow: 0 10px 30px rgba(242, 193, 78, 0.25);
  animation: pop-in var(--motion-enter) var(--motion-ease);
}
.first-go:active { transform: scale(0.97); }
.first-icon { padding: 10px; border-radius: 999px; background: var(--paper); }
.first-label { font-family: var(--font-display); font-size: 24px; line-height: 1.3; word-break: keep-all; }
.welcome-other { align-self: center; }
.trips { display: flex; flex-direction: column; gap: 6px; }
.trips-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.trips-title { margin: 0; font-size: 15px; }
.trip {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  min-height: 52px; padding: 8px 14px;
  border-radius: 12px; background: var(--surface); border: 1px solid var(--line);
  color: var(--text); text-decoration: none; font-size: 14px;
}
.trip-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; }
.trip-status { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: 12px; }
.trip-where { color: var(--muted); }
.trip-left { color: var(--muted); }
.trip-quiz .trip-left, .trip-arrived .trip-left { color: var(--accent); font-weight: 700; font-size: 13px; }

.head { display: flex; flex-direction: column; gap: 6px; }
.title { font-size: 28px; line-height: 1.25; }

.mystery-link { align-self: flex-start; display: inline-flex; align-items: center; min-height: 44px; color: var(--accent); font-size: 14px; font-weight: 700; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.tile {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  min-height: 96px; padding: 10px 6px;
  border-radius: 18px; border: 1px solid var(--line); background: var(--surface);
  transition: transform var(--motion-press) ease, background var(--motion-press) ease;
}
.tile:active { transform: scale(0.96); background: var(--surface-2); }
.tile-icon {
  width: 52px; height: 52px; padding: 6px;
  border-radius: 999px; background: var(--paper);
}
.tile-name { font-size: 13px; line-height: 1.3; text-align: center; word-break: keep-all; }

.more {
  min-height: 44px; margin-top: -6px;
  border-radius: 14px; border: 1px dashed var(--line); background: transparent;
  color: var(--text); font-size: 14px;
}

.other { display: flex; flex-direction: column; gap: 10px; }
.other-line { margin: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0 6px; font-size: 14px; }
.link {
  display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px;
  border: 0; background: none; color: var(--accent); font-size: 14px; font-weight: 700;
  text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
}

.text-form { display: flex; gap: 8px; animation: rise var(--motion-enter) var(--motion-ease); }
.text-form input {
  flex: 1; min-width: 0; min-height: 52px; padding: 0 14px;
  border-radius: 14px; border: 1px solid var(--line); background: var(--surface); font-size: 16px;
}
.text-form input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }

.thinking { display: flex; align-items: center; justify-content: center; gap: 8px; }
.dots { display: inline-flex; gap: 4px; }
.dots span { width: 6px; height: 6px; border-radius: 999px; background: var(--accent); animation: bob var(--motion-bob) ease-in-out infinite; }
.dots span:nth-child(2) { animation-delay: calc(var(--motion-bob) / -3); }
.dots span:nth-child(3) { animation-delay: calc(var(--motion-bob) / -1.5); }

.error { margin: 0; color: #ffb4a6; font-size: 14px; text-align: center; }
.small { margin: 0; font-size: 13px; text-align: center; }

.limit-note { margin: 4px 0 0; padding: 12px 14px; font-size: 14px; line-height: 1.5; word-break: keep-all; }

.sheet-wrap {
  position: fixed; inset: 0; z-index: 30;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(5, 10, 20, 0.6);
}
.sheet {
  position: relative; width: 100%; max-width: 480px; max-height: 90dvh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0; background: var(--surface); border-top: 1px solid var(--accent);
  animation: rise var(--motion-enter) var(--motion-ease);
}
.sheet .small { text-align: left; }
.close {
  position: absolute; top: 8px; right: 8px; width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 999px; background: transparent; color: var(--muted);
}
.photo { width: 100%; max-height: 180px; object-fit: cover; border-radius: 14px; }
.p-top { display: flex; align-items: center; gap: 8px; padding-right: 44px; }
.p-name { margin: 0; font-size: 20px; font-weight: 700; }
.first { font-size: 12px; font-weight: 700; padding: 3px 7px; border-radius: 6px; background: var(--r-epic); color: var(--ink); }
.twist { margin: 0; padding-right: 44px; font-size: 13px; color: var(--accent); }
.voice {
  margin: 0; padding: 10px 14px; border-radius: 14px 14px 14px 4px;
  background: var(--paper); color: var(--ink); font-size: 14px; line-height: 1.5;
  align-self: flex-start; max-width: 100%;
}
.mats { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.mat { padding: 6px 12px; border-radius: 999px; background: var(--surface-2); font-size: 14px; }
.plus { color: var(--accent); font-family: var(--font-mono); }
.missing { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px dashed var(--line); border-radius: 10px; }
.missing p { margin: 0; }
.missing-title { font-size: 14px; font-weight: 600; }
.sheet .btn-primary { margin-top: 6px; }
</style>
