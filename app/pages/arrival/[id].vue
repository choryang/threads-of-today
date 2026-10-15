<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PEOPLE } from '../../../shared/data/people'
import { VEHICLE } from '../../../shared/data/transport'
import { arrivalShort, cargoName, daysFrom, isArrived, isWaiting, landingPlace, transportOf } from '../../../shared/incoming'
import { forwardTimeline } from '../../../shared/journey'
import { withJosa } from '../../../shared/logic'
import { TRANSPORT_ICON } from '../../utils/vehicle-icon'

/**
 * 밤사이 도착했어요. 도착한 뒤 처음 열면 데려온 사람이 새 주민이 되고(카드 + 만난 기록),
 * '마을로 모시기'를 누르면 마을의 그 사람 자리로 화면이 옮겨 간다.
 */
const route = useRoute()
const router = useRouter()
const game = useGame()
const now = ref(Date.now())

const id = computed(() => String(route.params.id))
const inc = computed(() => game.state.incoming?.find((x) => x.journeyId === id.value))
const journey = computed(() => game.findJourney(id.value))
const timeline = computed(() => (journey.value ? forwardTimeline(journey.value.materialIds, journey.value.id, journey.value.name) : []))
const kind = computed(() => transportOf(timeline.value)?.kind ?? 'ship')
const cargo = computed(() => (journey.value ? cargoName(journey.value) : '물건'))
const landing = computed(() => landingPlace(timeline.value))
const person = computed(() => (inc.value ? PEOPLE[inc.value.personId] : undefined))
const arrived = computed(() => !!inc.value && isArrived(inc.value, now.value))

onMounted(() => {
  if (inc.value && !inc.value.openedAt && arrived.value) game.openArrival(id.value, now.value)
})

/** '오늘 아침', '어제 아침' */
const whenArrived = computed(() => {
  if (!inc.value) return ''
  const d = -daysFrom(now.value, inc.value.arriveAt)
  return d <= 0 ? '오늘 아침' : d === 1 ? '어제 아침' : `${d}일 전 아침`
})
/** '어제 출발한' */
const whenLeft = computed(() => {
  if (!inc.value) return ''
  const d = -daysFrom(now.value, inc.value.departAt)
  return d <= 0 ? '오늘' : d === 1 ? '어제' : d === 2 ? '그저께' : `${d}일 전에`
})
const story = computed(() => {
  const job = person.value?.job ?? ''
  const where = landing.value ? `${landing.value}에 내렸어요` : '도착했어요'
  return `${whenLeft.value} 출발한 ${withJosa(cargo.value, '이', '가')} ${where}. 이 물건을 거쳐 온 ${withJosa(job, '이', '가')} 마을에 놀러 왔어요.`
})

/** 아직 오고 있는 다른 물건: '초콜릿을 실은 배도 출발했어요 · 모레 도착' */
const others = computed(() =>
  (game.state.incoming ?? [])
    .filter((x) => isWaiting(x) && x.journeyId !== id.value && !isArrived(x, now.value))
    .map((x) => {
      const j = game.findJourney(x.journeyId)
      const k = j ? transportOf(forwardTimeline(j.materialIds, j.id, j.name))?.kind ?? 'ship' : 'ship'
      return { id: x.journeyId, text: `${withJosa(j?.name ?? '물건', '을', '를')} 실은 ${VEHICLE[k]}도 출발했어요 · ${arrivalShort(x.arriveAt, now.value)}` }
    }),
)

function welcome() {
  if (!inc.value) return router.push('/')
  router.push({ path: '/', query: { focus: inc.value.personId } })
}
</script>

<template>
  <main class="arrival">
    <template v-if="inc && person && arrived">
      <div class="head">
        <span class="kicker">{{ whenArrived }}{{ landing ? ` · ${landing}` : '' }}</span>
        <h1 class="display title">밤사이 도착했어요</h1>
        <p class="story">{{ story }}</p>
      </div>

      <div class="scene" aria-hidden="true">
        <span class="sun" />
        <span class="sea" />
        <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
        <svg class="vehicle" viewBox="0 0 40 40" width="150" height="150" v-html="TRANSPORT_ICON[kind]" />
        <div class="who"><Character :person-id="person.id" :size="210" standing wave /></div>
      </div>

      <div class="new panel">
        <span class="new-kicker">새 주민</span>
        <span class="new-name">{{ person.name ? `${person.name} · ${person.job}` : person.job }}</span>
        <span class="new-sub">{{ journey?.name ? `${journey.name} 여정에서 만났어요` : '오늘 쓴 물건의 여정에서 만났어요' }}</span>
      </div>

      <div class="actions">
        <button class="btn btn-primary btn-block go" @click="welcome">마을로 모시기</button>
        <p v-for="o in others" :key="o.id" class="other">{{ o.text }}</p>
      </div>
    </template>

    <section v-else class="panel waiting">
      <p>{{ inc ? '아직 오고 있어요. 내일 아침에 도착해요.' : '이 물건을 찾지 못했어요.' }}</p>
      <NuxtLink to="/" class="btn btn-primary btn-block">마을로</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.arrival {
  min-height: 100dvh; max-width: 480px; margin: 0 auto; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 16px; padding: 44px 16px calc(100px + env(safe-area-inset-bottom));
}
.head { display: flex; flex-direction: column; gap: 8px; padding: 0 8px; }
.kicker { font-size: 13px; font-weight: 700; color: var(--accent); }
.title { margin: 0; font-size: 32px; line-height: 1.2; }
.story { margin: 0; font-size: 15px; line-height: 1.6; color: #c9cfd9; word-break: keep-all; }
.scene { position: relative; height: 320px; border-radius: 24px; overflow: hidden; background: #f6d9a8; }
.sun { position: absolute; left: 36px; top: 28px; width: 60px; height: 60px; border-radius: 30px; background: #f9b07a; }
.sea { position: absolute; left: 0; right: 0; bottom: 0; height: 100px; background: #6fb3d2; }
.vehicle { position: absolute; left: 12px; bottom: 54px; background: #3b4a63; border-radius: 28px; padding: 8px; }
.who { position: absolute; right: 24px; bottom: 16px; animation: rise var(--motion-enter) var(--motion-ease); }
.new { display: flex; flex-direction: column; gap: 6px; }
.new-kicker { font-size: 12px; font-weight: 700; color: var(--accent); }
.new-name { font-size: 18px; font-weight: 700; }
.new-sub { font-size: 13px; color: #c9cfd9; }
.actions { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
.go { min-height: 56px; font-size: 17px; }
.other { margin: 0; text-align: center; font-size: 13px; color: #c9cfd9; word-break: keep-all; }
.waiting { display: flex; flex-direction: column; gap: 12px; }
.waiting p { margin: 0; }
</style>
