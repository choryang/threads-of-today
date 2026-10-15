<script setup lang="ts">
import { computed, ref } from 'vue'
import { PRODUCTS } from '../../../shared/data/materials'
import { PEOPLE } from '../../../shared/data/people'
import { CLASS_OF, dayResult, distanceLabel, isValidPick, type DayTypeId } from '../../../shared/day-type'
import { iconUrl } from '../../utils/day-test'
import { drawDayCard, savePng } from '../../utils/share-image'

/**
 * 10초 테스트 결과: 유형 이름·설명·대표 주민·숫자 3개, 이미지로 저장, 이 사람들 만나러 가기.
 * 같은 물건이면 늘 같은 결과라 주소(?items=)만으로 다시 그린다.
 */
const route = useRoute()
const router = useRouter()
const game = useGame()

const items = computed(() => {
  const raw = typeof route.query.items === 'string' ? route.query.items.split(',') : []
  return isValidPick(raw) ? raw : null
})
if (!items.value) router.replace('/test')

const result = computed(() => (items.value ? dayResult(items.value) : null))
const resident = computed(() => (result.value ? PEOPLE[result.value.type.resident] : undefined))
const numbers = computed<Array<[string, string]>>(() => {
  const n = result.value?.numbers
  if (!n) return []
  const dist = distanceLabel(n.km)
  return [
    [`${n.people.length}명`, '나에게 닿은 사람'],
    [`${n.countries.length}개`, '나라'],
    dist.startsWith('지구 ') ? [dist.slice(3), '지구를 돌아온 거리'] : [dist, '물건이 지나온 거리'],
  ]
})

const nameOf = (id: string) => PRODUCTS.find((p) => p.id === id)?.name ?? ''

/** 여정을 떠날 물건: 유형과 같은 분류의 재료로 시작하는 물건, 없으면(지구 한 바퀴·하늘길) 사람을 가장 많이 만나는 물건 */
function leadProduct(ids: string[], type: DayTypeId): string {
  const same = ids.find((id) => {
    const first = PRODUCTS.find((p) => p.id === id)?.materialIds[0] ?? ''
    const cls = CLASS_OF[first]
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
  if (!journey) {
    message.value = '오늘의 여정을 모두 떠났어요. 내일 이 사람들을 만나러 가요.'
    return
  }
  router.push(`/journey/${journey.id}`)
}

const saving = ref(false)
const canvas = ref<HTMLCanvasElement | null>(null)
async function saveImage() {
  if (!result.value || !items.value || saving.value) return
  saving.value = true
  try {
    const c = canvas.value ?? document.createElement('canvas')
    const now = new Date()
    await drawDayCard(c, {
      type: result.value.type,
      numbers: numbers.value,
      icons: items.value.map(iconUrl),
      caption: `${now.getMonth() + 1}월 ${now.getDate()}일의 나`,
    })
    await savePng(c, `my-day-type-${result.value.type.id}.png`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main v-if="result && resident" class="result" :style="{ background: result.type.bg }">
    <div class="head">
      <span class="kicker">나의 하루 유형<template v-if="result.type.rare"> · 드문 하루</template></span>
      <h1 class="display title">{{ result.type.name }}</h1>
      <p class="desc">{{ result.type.desc }}</p>
    </div>

    <div class="scene">
      <span class="ground" />
      <span class="tag">대표 주민 · {{ resident.job }}</span>
      <div class="who"><Character :person-id="resident.id" :size="190" standing bob /></div>
    </div>

    <dl class="numbers">
      <div v-for="[value, label] in numbers" :key="label" class="num">
        <dt class="display">{{ value }}</dt>
        <dd>{{ label }}</dd>
      </div>
    </dl>

    <div class="picked" aria-label="고른 물건">
      <img v-for="id in items" :key="id" :src="iconUrl(id)" :alt="nameOf(id)" width="44" height="44">
    </div>

    <div class="actions">
      <div class="two">
        <button class="ghost" :disabled="saving" @click="saveImage">{{ saving ? '그리는 중…' : '이미지로 저장' }}</button>
      </div>
      <button class="go" @click="meet">이 사람들 만나러 가기</button>
      <p v-if="message" class="message" role="status">{{ message }}</p>
    </div>
    <canvas ref="canvas" class="hidden-canvas" aria-hidden="true" />
  </main>
</template>

<style scoped>
.result {
  min-height: 100dvh; max-width: 480px; margin: 0 auto; box-sizing: border-box; color: #f3f1ea;
  display: flex; flex-direction: column; padding-bottom: calc(96px + env(safe-area-inset-bottom));
}
.head { padding: 48px 24px 0; display: flex; flex-direction: column; }
.kicker { font-size: 14px; font-weight: 700; color: #f2c14e; }
.title { margin: 8px 0 0; font-size: 44px; line-height: 1.12; word-break: keep-all; }
.desc { margin: 12px 0 0; font-size: 15px; line-height: 1.6; word-break: keep-all; }
.scene { position: relative; height: 220px; margin-top: 12px; }
.ground { position: absolute; left: 0; right: 0; bottom: 0; height: 84px; background: rgba(255, 255, 255, 0.18); }
.tag {
  position: absolute; left: 24px; top: 24px; padding: 4px 12px; border-radius: 16px; border: 3px solid #2a2a35;
  background: #f3f1ea; color: #2a2a35; font-size: 13px; font-weight: 700;
}
.who { position: absolute; right: 30px; bottom: 10px; }
.numbers { margin: 0; padding: 18px 24px 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.num { display: flex; flex-direction: column; gap: 2px; margin: 0; }
.num dt { font-size: 28px; line-height: 1.1; word-break: keep-all; }
.num dd { margin: 0; font-size: 12px; opacity: 0.9; }
.picked { display: flex; gap: 8px; padding: 18px 24px 0; }
.picked img { background: #f3f1ea; border-radius: 12px; padding: 4px; }
.actions { margin-top: auto; padding: 20px 16px 0; display: flex; flex-direction: column; gap: 10px; }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.ghost {
  min-height: 52px; border-radius: 16px; border: 2px solid #f3f1ea; background: transparent; color: #f3f1ea;
  font-size: 15px; font-weight: 700; cursor: pointer;
}
.ghost:disabled { opacity: 0.6; }
.go { min-height: 56px; border-radius: 18px; border: 0; background: #f2c14e; color: #1a1a22; font-size: 17px; font-weight: 700; cursor: pointer; }
.message { margin: 0; text-align: center; font-size: 13px; }
.hidden-canvas { display: none; }
</style>
