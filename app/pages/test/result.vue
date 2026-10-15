<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PRODUCTS } from '../../../shared/data/materials'
import { PEOPLE } from '../../../shared/data/people'
import { CLASS_OF, DAY_TYPES, dayResult, isValidPick, meetingOf, type DayTypeId } from '../../../shared/day-type'
import { dayShareTitle, type DayPayload } from '../../../shared/share'
import { dayNumbersText, iconUrl } from '../../utils/day-test'
import { drawDayCard, drawMatchCard, savePng } from '../../utils/share-image'

/**
 * 10초 테스트 결과. 같은 물건이면 늘 같은 결과라 주소(?items=)만으로 다시 그린다.
 * ?from=토큰: 친구가 보낸 링크에서 "당신의 하루는요?"로 들어왔으면 두 사람의 물건에서 겹치는 사람을 보여 주고,
 * '보여주기'를 누를 때만 보낸 사람에게 내 하루를 남긴다.
 */
const route = useRoute()
const router = useRouter()
const game = useGame()
const share = useShare()

const items = computed(() => {
  const raw = typeof route.query.items === 'string' ? route.query.items.split(',') : []
  return isValidPick(raw) ? raw : null
})
if (!items.value) router.replace('/test')
const result = computed(() => (items.value ? dayResult(items.value) : null))
const from = typeof route.query.from === 'string' ? route.query.from : ''

/** 여정을 떠날 물건: 유형과 같은 분류의 재료로 시작하는 물건, 없으면(지구 한 바퀴·하늘길) 재료가 가장 많은 물건 */
function leadProduct(ids: string[], type: DayTypeId): string {
  const same = ids.find((id) => {
    const cls = CLASS_OF[PRODUCTS.find((p) => p.id === id)?.materialIds[0] ?? '']
    return cls === type || (type === 'under' && cls === 'tech')
  })
  if (same) return same
  const size = (id: string) => PRODUCTS.find((p) => p.id === id)?.materialIds.length ?? 0
  return [...ids].sort((a, b) => size(b) - size(a))[0]!
}

const message = ref('')
function meet() {
  if (!items.value || !result.value) return
  const product = PRODUCTS.find((p) => p.id === leadProduct(items.value!, result.value!.type.id))!
  const journey = game.startJourney({ name: product.name, materialIds: [...product.materialIds] }, 'pick')
  router.push(`/journey/${journey.id}`)
}

// ── 이미지로 저장 ──
const busy = ref(false)
const today = () => {
  const d = new Date()
  return `${d.getMonth() + 1}월 ${d.getDate()}일의 나`
}
async function saveImage() {
  if (!result.value || !items.value || busy.value) return
  busy.value = true
  try {
    const c = document.createElement('canvas')
    await drawDayCard(c, { type: result.value.type, numbers: dayNumbersText(items.value), icons: items.value.map(iconUrl), caption: today() })
    await savePng(c, `my-day-type-${result.value.type.id}.png`)
  } finally {
    busy.value = false
  }
}

// ── 친구에게 보내기 ──
async function send() {
  if (!items.value || !result.value || busy.value) return
  busy.value = true
  message.value = ''
  try {
    const made = await share.shareDay(items.value, game.nickname.value)
    if (!made) {
      message.value = '지금은 링크를 만들 수 없어요. 이미지로 저장해서 보내 주세요.'
      return
    }
    const title = dayShareTitle({ items: items.value, type: result.value.type.id, nickname: game.nickname.value })
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title}. 당신의 하루는요?`, url: made.url })
        return
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
      }
    }
    await navigator.clipboard?.writeText(made.url)
    message.value = '링크를 복사했어요. 친구에게 붙여 넣어 보내 주세요.'
  } finally {
    busy.value = false
  }
}

// ── 두 사람의 하루 (친구 링크에서 들어왔을 때) ──
const friend = ref<DayPayload | null>(null)
onMounted(async () => {
  if (from) friend.value = (await share.open(from))?.payload ?? null
})
const meeting = computed(() => (friend.value && items.value ? meetingOf(friend.value.items, items.value) : null))
const friendTypeName = computed(() => (friend.value ? DAY_TYPES[friend.value.type].name : ''))
const hubJob = computed(() => (meeting.value?.hub ? PEOPLE[meeting.value.hub]?.job ?? '' : ''))
const shown = ref(false)
async function showBack() {
  if (!items.value || shown.value) return
  shown.value = await share.showBack(from, items.value, game.nickname.value)
  if (!shown.value) message.value = '지금은 보여 줄 수 없어요. 잠시 후 다시 눌러 주세요.'
}
async function saveTogether() {
  if (!friend.value || !items.value || !meeting.value?.shared.length || busy.value) return
  busy.value = true
  try {
    const c = document.createElement('canvas')
    await drawMatchCard(c, {
      left: { label: `${friend.value.nickname}의 하루`, type: DAY_TYPES[friend.value.type] },
      right: { label: `${game.nickname.value}의 하루`, type: result.value!.type },
      place: meeting.value.place,
      // 만나는 곳이 없으면(같은 손) 첫 번째로 겹친 사람을 그린다
      hub: meeting.value.hub ?? meeting.value.shared[0]!,
      shared: meeting.value.shared.map((id) => PEOPLE[id]?.job ?? ''),
    })
    await savePng(c, 'our-days.png')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main v-if="result && items" class="result" :style="{ background: result.type.bg }">
    <DayResultView :items="items" />

    <section v-if="friend && meeting" class="together" aria-labelledby="together-title">
      <p class="t-kicker">{{ friend.nickname }}님의 하루 · {{ friendTypeName }}</p>
      <template v-if="meeting.shared.length">
        <h2 v-if="meeting.hub" id="together-title" class="display t-title">두 사람의 하루는<br>{{ meeting.place }}에서 만나요</h2>
        <h2 v-else id="together-title" class="display t-title">두 사람의 하루는<br>같은 손을 거쳐 왔어요</h2>
        <p class="t-sub">{{ hubJob }}{{ hubJob ? ' · ' : '' }}같이 닿은 사람 {{ meeting.shared.length }}명</p>
        <div class="faces">
          <Character v-for="id in meeting.shared.slice(0, 10)" :key="id" :person-id="id" :size="44" />
        </div>
        <button class="ghost wide" :disabled="busy" @click="saveTogether">두 사람의 하루 이미지 저장</button>
      </template>
      <h2 v-else id="together-title" class="display t-title">두 사람의 하루는<br>아직 만나지 않았어요</h2>
      <button class="show" :disabled="shown" @click="showBack">{{ shown ? `${friend.nickname}님에게 보여 줬어요` : `${friend.nickname}님에게 내 하루 보여주기` }}</button>
    </section>

    <div class="actions">
      <div class="two">
        <button class="ghost" :disabled="busy" @click="saveImage">이미지로 저장</button>
        <button class="ghost" :disabled="busy" @click="send">친구에게 보내기</button>
      </div>
      <button class="go" @click="meet">이 사람들 만나러 가기</button>
      <p v-if="message" class="message" role="status">{{ message }}</p>
    </div>
  </main>
</template>

<style scoped>
.result {
  min-height: 100dvh; max-width: 480px; margin: 0 auto; box-sizing: border-box; color: #f3f1ea;
  display: flex; flex-direction: column; padding-bottom: calc(96px + env(safe-area-inset-bottom));
}
.together {
  margin: 20px 16px 0; padding: 18px; border-radius: 20px; background: #f3f1ea; color: #1a1a22;
  display: flex; flex-direction: column; gap: 10px;
}
.t-kicker { margin: 0; font-size: 13px; font-weight: 700; color: #4a4a55; }
.t-title { margin: 0; font-size: 26px; line-height: 1.25; word-break: keep-all; }
.t-sub { margin: 0; font-size: 13px; color: #4a4a55; }
.faces { display: flex; flex-wrap: wrap; gap: 2px; }
.show { min-height: 52px; border-radius: 16px; border: 0; background: #1f5a73; color: #f3f1ea; font-size: 15px; font-weight: 700; cursor: pointer; }
.show:disabled { background: #c9c4b5; color: #4a4a55; cursor: default; }
.together .ghost { border-color: #1a1a22; color: #1a1a22; }
.wide { width: 100%; }
.actions { margin-top: auto; padding: 20px 16px 0; display: flex; flex-direction: column; gap: 10px; }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.ghost {
  min-height: 52px; border-radius: 16px; border: 2px solid #f3f1ea; background: transparent; color: #f3f1ea;
  font-size: 15px; font-weight: 700; cursor: pointer;
}
.ghost:disabled { opacity: 0.6; }
.go { min-height: 56px; border-radius: 18px; border: 0; background: #f2c14e; color: #1a1a22; font-size: 17px; font-weight: 700; cursor: pointer; }
.message { margin: 0; text-align: center; font-size: 13px; }
</style>
