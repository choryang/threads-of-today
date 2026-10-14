<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { MATERIALS, PRODUCTS } from '../../shared/data/materials'
import type { Decomposed } from '../../shared/logic'
import type { JourneySource } from '../composables/useGame'
import { shrinkImage } from '../utils/image'
import { productIconSvg } from '../utils/product-icon'
import { renderVoice } from '../../shared/voice'

type ApiResult = ({ ok: true; source: 'ai' | 'local' } & Decomposed) | { ok: false; message: string }

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

const tiles = computed(() => (showAll.value ? PRODUCTS : PRODUCTS.slice(0, FIRST_TILES)))
const previewVoice = computed(() => renderVoice(preview.value?.voice, game.nickname.value))
/** 진행 중인 여정 하나 (가장 최근) */
const ongoing = computed(() => [...game.today.value.journeys].reverse().find((j) => !j.done))

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

function closePreview() {
  preview.value = null
}

function start() {
  if (!preview.value?.materialIds.length) return
  const journey = game.startJourney(preview.value, preview.value.source)
  if (!journey) {
    preview.value = null
    error.value = '오늘의 여정을 모두 떠났어요. 내일 다시 만나요!'
    return
  }
  preview.value = null
  text.value = ''
  router.push(`/journey/${journey.id}`)
}
</script>

<template>
  <main class="page home">
    <NuxtLink v-if="ongoing" :to="`/journey/${ongoing.id}`" class="resume">
      <span class="resume-name">{{ ongoing.name }} 여정</span>
      <span class="resume-go">이어 하기 →</span>
    </NuxtLink>

    <header class="head">
      <h1 class="display title">오늘 손에 닿은 물건은?</h1>
      <p v-if="game.remaining.value > 0" class="muted left">오늘 <span class="mono">{{ game.remaining.value }}</span>번 더 떠날 수 있어요</p>
    </header>

    <template v-if="game.remaining.value > 0">
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
        <p v-if="loading" class="muted small" role="status">{{ photoUrl ? '사진 속 물건을 알아보는 중…' : '재료로 나누는 중…' }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>
    </template>

    <section v-else class="panel done-panel">
      <p class="p-name">오늘의 여정을 모두 마쳤어요</p>
      <NuxtLink to="/result" class="btn btn-primary btn-block">결과 카드 보기</NuxtLink>
    </section>

    <div v-if="preview" class="sheet-wrap" role="dialog" aria-modal="true" :aria-label="`${preview.name} 미리보기`" @click.self="closePreview">
      <div class="sheet">
        <button class="close" aria-label="닫기" @click="closePreview">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <img v-if="photoUrl && preview.source === 'photo'" :src="photoUrl" alt="고른 사진" class="photo">
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
.resume {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  min-height: 44px; padding: 0 14px; margin-bottom: -4px;
  border-radius: 12px; background: var(--surface); border: 1px solid var(--line);
  color: var(--text); text-decoration: none; font-size: 14px;
}
.resume-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
.resume-go { flex-shrink: 0; color: var(--accent); font-weight: 700; }

.head { display: flex; flex-direction: column; gap: 6px; }
.title { font-size: 28px; line-height: 1.25; }
.left { margin: 0; font-size: 13px; }

.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.tile {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  min-height: 96px; padding: 10px 6px;
  border-radius: 18px; border: 1px solid var(--line); background: var(--surface);
  transition: transform 0.12s ease, background 0.12s ease;
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

.text-form { display: flex; gap: 8px; animation: rise 0.2s ease-out; }
.text-form input {
  flex: 1; min-width: 0; min-height: 52px; padding: 0 14px;
  border-radius: 14px; border: 1px solid var(--line); background: var(--surface); font-size: 16px;
}
.text-form input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }

.error { margin: 0; color: #ffb4a6; font-size: 14px; text-align: center; }
.small { margin: 0; font-size: 13px; text-align: center; }

.done-panel { display: flex; flex-direction: column; gap: 14px; }

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
  animation: rise 0.22s ease-out;
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
.first { font-size: 11px; padding: 3px 7px; border-radius: 6px; background: var(--r-epic); color: var(--ink); }
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
