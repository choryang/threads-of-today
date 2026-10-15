<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { WORKPLACES } from '../../shared/data/village'
import { UNLOCK } from '../../shared/friendship'
import { dayStats, seoulDateKey, withJosa } from '../../shared/logic'
import { arrivalShort, cargoName, incomingChipText, isArrived, isWaiting, transportOf } from '../../shared/incoming'
import { forwardTimeline } from '../../shared/journey'
import { villageShareTitle } from '../../shared/share'
import { UNLOCK_STEPS, listCondition, lockedNotice, pillText, shortCondition, stepOf, type UnlockStep, type UnlockStepId } from '../../shared/unlocks'
import { countriesOf, nextResident, villageLayout, type Placed } from '../../shared/village'
import { flowerLabel, newFlowerNotice, type Flower } from '../../shared/visit'
import { MOTION } from '../utils/motion'
import { TRANSPORT_ICON } from '../utils/vehicle-icon'

/**
 * 내 하루 마을 (홈). 지도가 화면 전체에 깔리고, 그 위에 제목 카드·알림·오고 있는 물건·'오늘 쓴 물건 넣기'를 올린다.
 * 지도·자리·꽃 그리기는 VillageMap(친구 마을과 같이 쓴다). 자리는 shared/village.ts가 사람 id로 정한다.
 */
const game = useGame()
const route = useRoute()
const router = useRouter()
const villageLink = useVillageLink()
const map = ref<{
  focus: (p: Placed) => void
  celebrate: (p: Placed) => Promise<void>
  walkIn: (ids: string[]) => Promise<void>
  goHome: () => Promise<void>
  inputs: () => number
} | null>(null)

// ── 오고 있는 물건: 1분마다 진행 막대를 새로 그린다 ──
const now = ref(Date.now())
let tick: ReturnType<typeof setInterval> | undefined
onMounted(() => { tick = setInterval(() => { now.value = Date.now() }, 60_000) })
onBeforeUnmount(() => clearInterval(tick))
const waiting = computed(() => (game.state.incoming ?? []).filter(isWaiting))
const arrivingLabel = (personId: string) => {
  const inc = waiting.value.find((x) => x.personId === personId)
  return !inc ? '' : isArrived(inc, now.value) ? '도착했어요' : arrivalShort(inc.arriveAt, now.value)
}

/**
 * 노란 버튼 위의 칩 한 줄: 축소해도 숨기지 않는다. 누르면 지금까지의 큰 카드(진행 막대·지나는 곳)를 아래에서 올라오는 시트로
 */
const incomingItems = computed(() =>
  waiting.value.map((inc) => {
    const j = game.findJourney(inc.journeyId)
    return {
      cargo: j ? cargoName(j) : '물건',
      arriveAt: inc.arriveAt,
      kind: (j ? transportOf(forwardTimeline(j.materialIds, j.id, j.name))?.kind : undefined) ?? 'ship',
    }
  }),
)
const incomingChip = computed(() => incomingChipText(incomingItems.value, now.value))
const incomingOpen = ref(false)

const layout = computed(() => villageLayout(game.state.cards, game.state.people ?? {}, waiting.value.map((x) => x.personId)))
const countries = computed(() => countriesOf(layout.value.residents.map((r) => r.id)))
const percentOf = (id: string) => game.friendship(id).percent
/** 친해진 정도 100%(단짝)인 주민. 지도에서 발밑 빛·하트·일터 자리로 보인다. 제목 카드에는 내 숫자만 */
const bestFriends = computed(() => layout.value.residents.filter((r) => percentOf(r.id) >= UNLOCK.workplace).map((r) => r.id))

const open = ref<string | null>(null)

// ── 단짝이 된 순간 (한 번만): 그 주민 쪽으로 옮기고 하트가 커졌다 작아지며 한 줄을 띄운다. 본 연출은 Save.bestSeen에 적는다 ──
const cheerLine = ref('')
let cheering = false
let cheerTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(cheerTimer))
const bestLine = (id: string) => `단짝이 됐어요 · 이제 마을에 ${withJosa(WORKPLACES[PEOPLE[id]!.workplace], '이', '가')} 생겼어요`
async function celebrateNext() {
  if (cheering || open.value || !map.value) return
  const seen = new Set(game.state.bestSeen ?? [])
  const id = bestFriends.value.find((x) => !seen.has(x))
  const spot = id ? layout.value.residents.find((r) => r.id === id) : undefined
  if (!id || !spot) return
  cheering = true
  game.state.bestSeen = [...(game.state.bestSeen ?? []), id]
  cheerLine.value = bestLine(id)
  await map.value.celebrate(spot)
  clearTimeout(cheerTimer)
  cheerTimer = setTimeout(() => {
    cheerLine.value = ''
    cheering = false
    void celebrateNext()
  }, Math.max(0, MOTION.bestFriendMs - MOTION.panMs - MOTION.heartMs))
}
// 주민 카드에서 고마워요로 100%가 되면 카드를 닫았을 때 연출한다
watch([bestFriends, open], () => { void celebrateNext() })

// ── 새 기능 열림 알림 (shared/unlocks.ts): 한 번에 하나씩. 저절로 사라지지 않고, 누르거나 지도를 만질 때 닫힌다.
// "본 것"(동기화 합집합)은 사용자가 실제로 닫을 때 적는다. 마을로 모시기 연출·처음 열 때 잠깐은 띄우지 않고 기다린다(holdNotices) ──
const unlockShown = ref<UnlockStep | null>(null)
const holdNotices = ref(true)
let closing = false
let unlockTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(unlockTimer))
function showNextUnlock() {
  const next = game.unlockNotice.value
  if (holdNotices.value || closing || unlockShown.value || !next) return
  unlockShown.value = next
}
function closeUnlockNotice() {
  const shown = unlockShown.value
  if (!shown) return
  game.markUnlockSeen(shown.id)
  unlockShown.value = null
  // 한 번에 여러 개가 열렸으면 다음 것을 이어서 (닫히는 걸 본 뒤)
  closing = true
  clearTimeout(unlockTimer)
  unlockTimer = setTimeout(() => {
    closing = false
    showNextUnlock()
  }, MOTION.enterMs)
}
function releaseNotices() {
  holdNotices.value = false
  showNextUnlock()
}
watch(() => game.unlockNotice.value?.id, () => showNextUnlock())

// ── 꽃: 친구들이 내 마을 주민에게 남긴 고마워요 ──
const flowers = ref<Flower[]>([])
const notice = ref<{ text: string; flowers: Flower[] } | null>(null)
const noticeOpen = ref(false)
const picked = ref('')
let pickedTimer: ReturnType<typeof setTimeout> | undefined
function showFlower(f: Flower) {
  picked.value = flowerLabel(f)
  clearTimeout(pickedTimer)
  pickedTimer = setTimeout(() => { picked.value = '' }, MOTION.noticeMs * 2)
}
onBeforeUnmount(() => clearTimeout(pickedTimer))

// 내 소개로 누군가 고마워했으면 한 번 알린다 ("누군가 옥희님의 소개로 커피 체리 수확자에게 고마워했어요")
const share = useShare()
const introLine = ref('')

async function loadVillageSocial() {
  introLine.value = await share.introNotice(game.nickname.value)
  // 꽃은 여정 5번(초대·꽃 남기기) 열림 뒤에만
  if (!villageLink.link.value || !game.opens('flowers')) return
  await villageLink.refresh()
  flowers.value = await villageLink.flowers()
  // 마지막으로 본 뒤 새로 생긴 꽃은 한 번만 알린다
  notice.value = newFlowerNotice(flowers.value, villageLink.link.value?.seenAt ?? 0)
  if (notice.value) villageLink.markSeen(Math.max(...notice.value.flowers.map((f) => f.at)))
}

// ── 마을 목표 두 줄 (docs/screen-cleanup.md): 마을 주민 n / 살 수 있는 사람 수, 다음 주민 힌트 ──
const { status } = useSync()
/** 오늘(서울)과 사용자 id로 하루 동안 같은 사람. id가 아직 없으면(첫 동기화 전) 닉네임으로 */
const next = computed(() => nextResident(Object.keys(game.state.cards), seoulDateKey(), status.profile?.id ?? game.nickname.value))
function goNext() {
  const n = next.value
  if (!n) return
  const p = n.product
  // 그 사람이 반드시 나오는 출발지로 떠난다 (여정 id 꼬리를 고른다)
  const journey = game.startJourney({ name: p.name, materialIds: [...p.materialIds] }, 'pick', { meet: n.personId })
  router.push(`/journey/${journey.id}`)
}

// ── 지도를 가리는 위·아래 카드 높이: 지도(VillageMap)가 이 사이 영역을 기준으로 최소 배율·위치 제한·가운데를 정한다 ──
// 위: 제목 카드·알림(안전 영역 포함, .top이 그만큼 내려와 있다), 아래: 오고 있는 물건·버튼, 그 아래의 탭·안전 영역.
// 카드를 펴고 접거나 오고 있는 물건이 생기고 사라지면 ResizeObserver가 다시 잰다
const mainEl = ref<HTMLElement | null>(null)
const topEl = ref<HTMLElement | null>(null)
const bottomEl = ref<HTMLElement | null>(null)
/** 카드와 섬 끝 사이 여유 */
const INSET_GAP = 8
const insets = ref({ top: 0, bottom: 0 })
function measureInsets() {
  const m = mainEl.value?.getBoundingClientRect()
  const t = topEl.value?.getBoundingClientRect()
  const b = bottomEl.value?.getBoundingClientRect()
  if (!m || !t || !b) return
  const top = Math.round(Math.max(0, t.bottom - m.top + INSET_GAP))
  const bottom = Math.round(Math.max(0, m.bottom - b.top + INSET_GAP))
  if (top !== insets.value.top || bottom !== insets.value.bottom) insets.value = { top, bottom }
}
let insetObserver: ResizeObserver | undefined
onMounted(() => {
  measureInsets()
  insetObserver = new ResizeObserver(measureInsets)
  for (const el of [mainEl.value, topEl.value, bottomEl.value]) if (el) insetObserver.observe(el)
})
onBeforeUnmount(() => insetObserver?.disconnect())

/** 많이 축소했을 때(배율 0.25 미만): 제목 카드는 한 줄, 오고 있는 물건은 숨기고, 버튼은 작은 알약으로 접는다 (0.3초 전환) */
const compact = ref(false)

// ── 제목 카드 펼치기: 기본은 접힌 한 줄('마을 주민 n명'). 펼치면 다음 주민·다음에 열리는 것·나라·단짝 수.
// 사용자가 펼치거나 접은 상태는 이 기기에서만 기억한다(편의 설정이라 진행 상황에 넣지 않는다). 기억이 없으면 접힘 ──
const CARD_KEY = 'my-day-people:village-card-open'
const expanded = ref(false)
onMounted(() => {
  try {
    expanded.value = window.localStorage.getItem(CARD_KEY) === '1'
  } catch {
    // 저장소를 못 쓰면 접은 채로
  }
})
/**
 * 많이 축소하면(compact) 펼쳐 둔 카드도 한 줄로 접어 지도를 덜 가린다. 그때 펼치기를 누르면 그 자리에서 다시 보인다(peek).
 * 다시 확대하면 peek은 풀리고 기억해 둔 상태를 따른다
 */
const peek = ref(false)
watch(compact, (c) => { if (c) peek.value = false })
const showMore = computed(() => expanded.value && (!compact.value || peek.value))
function toggleCard() {
  if (compact.value) {
    // 축소 중: 접혀 보이면 펼쳐 보이고, 펼쳐 보이면 접는다
    if (showMore.value) {
      peek.value = false
      setExpanded(false)
    } else {
      peek.value = true
      setExpanded(true)
    }
    return
  }
  setExpanded(!expanded.value)
}
function setExpanded(open: boolean) {
  expanded.value = open
  try {
    window.localStorage.setItem(CARD_KEY, open ? '1' : '0')
  } catch {
    // 이번 방문 동안만
  }
}

// ── 앞으로 열릴 것 (shared/unlocks.ts 표): 마을 제목 카드 한 줄과 메뉴의 '열리는 기능' 목록 ──
/** 메뉴 목록: 첫날 단계는 늘 열려 있어 빼고 표 순서대로 */
const unlockRows = computed(() => UNLOCK_STEPS.filter((step) => step.id !== 'day1').map((step) => ({ step, state: game.unlockState(step.id) })))
/** 잠긴 줄을 누르면 메뉴 안에 짧은 안내 */
const menuNote = ref('')
let menuNoteTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(menuNoteTimer))
function showLocked(id: UnlockStepId) {
  const state = game.unlockState(id)
  if (state.kind === 'open') return
  menuNote.value = lockedNotice(state)
  clearTimeout(menuNoteTimer)
  menuNoteTimer = setTimeout(() => { menuNote.value = '' }, MOTION.noticeMs * 2)
}
/** 열린 줄을 누르면 그 기능으로 (여정 속 퀴즈·주민 소개하기는 갈 곳이 없어 안내만) */
const OPEN_NOTE: Partial<Record<UnlockStepId, string>> = {
  'second-journey': '여정 중에 퀴즈와 이야기가 나와요',
  'first-best': '주민 카드에서 이 분 소개하기를 눌러요',
}
function openRow(id: UnlockStepId) {
  if (id === 'journeys-3') return router.push('/dex')
  if (id === 'journeys-5') {
    menuOpen.value = false
    return invite()
  }
  if (id === 'journeys-7') return router.push('/mystery')
  if (id === 'journeys-10') return router.push('/result')
  menuNote.value = OPEN_NOTE[id] ?? ''
  clearTimeout(menuNoteTimer)
  menuNoteTimer = setTimeout(() => { menuNote.value = '' }, MOTION.noticeMs * 2)
}
const visitStep = stepOf('invite')
/** 다녀온 마을이 아직 없고 초대가 잠겨 있을 때의 조건 */
const visitLock = computed(() => {
  const state = game.unlockState(visitStep.id)
  return state.kind === 'open' ? '' : listCondition(state)
})

// ── 초대·메뉴 ──
const menuOpen = ref(false)
const message = ref('')
let messageTimer: ReturnType<typeof setTimeout> | undefined
function say(text: string) {
  message.value = text
  clearTimeout(messageTimer)
  messageTimer = setTimeout(() => { message.value = '' }, MOTION.noticeMs * 2)
}
async function sendLink(url: string | null) {
  if (!url) return say('지금은 초대 링크를 만들 수 없어요. 잠시 후 다시 해 주세요.')
  const title = villageShareTitle({ nickname: game.nickname.value, residents: [], open: true })
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
    }
  }
  await navigator.clipboard?.writeText(url)
  say('초대 링크를 복사했어요. 친구에게 붙여 넣어 보내 주세요.')
}
const invite = async () => sendLink(await villageLink.ensure())
async function renewLink() {
  const url = await villageLink.reissue()
  if (url) say('초대 링크를 새로 만들었어요. 이전 링크는 이제 열리지 않아요.')
  else say('지금은 초대 링크를 만들 수 없어요. 잠시 후 다시 해 주세요.')
}
const acceptVisits = computed(() => villageLink.link.value?.open ?? true)
const visited = computed(() => game.state.visitedVillages ?? [])

/** 마을로 모시기(?arrive=여정 id): 그 여정에서 만난 사람 중 마을 주민 (연결 카드는 이미 사는 원래 사람이다) */
function arrivedPeople(journeyId: string): string[] {
  const j = game.findJourney(journeyId)
  if (!j) return []
  const met = new Set([...dayStats([j]).people, ...j.newCards])
  return layout.value.residents.map((r) => r.id).filter((id) => met.has(id))
}

/**
 * ?focus=사람 id: 그 사람 자리로 화면을 옮긴다 (밤사이 도착한 주민을 마을로 모실 때)
 * ?arrive=여정 id: 여정 끝의 '마을로 모시기'. 이번에 만난 사람들이 자리로 걸어온다
 */
onMounted(async () => {
  const focus = typeof route.query.focus === 'string' ? route.query.focus : ''
  const arrive = typeof route.query.arrive === 'string' ? route.query.arrive : ''
  // 처음 온 사람(만난 사람도 떠난 여정도 없음)은 10초 테스트부터
  if (game.firstVisit.value && !Object.values(game.state.days).some((d) => d.journeys.length)) {
    router.replace('/test')
    return
  }
  // 도착했는데 아직 열지 않은 물건이 있으면 도착 화면부터 (도착 후 처음 열 때)
  const due = waiting.value.find((x) => isArrived(x, Date.now()))
  if (!focus && !arrive && due) {
    router.replace(`/arrival/${due.journeyId}`)
    return
  }
  void loadVillageSocial()
  if (arrive) {
    // 마을로 모시기: 걷기 연출 → (마지막 주민이 선 뒤 잠깐 쉬고) 기본 배율로 옮기기 → 그다음에 열림 알림.
    // 사용자가 그사이 지도를 만졌으면 옮기지 않는다. 제목 카드는 펼치지 않는다(접힘 또는 기억시킨 상태)
    router.replace({ query: {} })
    await nextTick()
    const m = map.value
    const before = m?.inputs() ?? 0
    await m?.walkIn(arrivedPeople(arrive))
    await new Promise((r) => setTimeout(r, MOTION.walkSettleMs))
    if (m && m.inputs() === before) await m.goHome()
    releaseNotices()
    void celebrateNext()
    return
  }
  if (!focus) {
    await nextTick()
    void celebrateNext()
    // 여정 없이 열 때: 기다리는 알림은 마을이 그려지고 1초 뒤에
    unlockTimer = setTimeout(releaseNotices, MOTION.unlockFirstDelayMs)
    return
  }
  releaseNotices()
  await nextTick()
  const spot = layout.value.residents.find((r) => r.id === focus)
  if (spot) requestAnimationFrame(() => map.value?.focus(spot))
  router.replace({ query: {} })
})
</script>

<template>
  <main ref="mainEl" class="village" :class="{ compact }">
    <VillageMap
      ref="map"
      :residents="layout.residents"
      :lots="layout.lots"
      :arriving="layout.arriving"
      :arriving-label="arrivingLabel"
      :percent-of="game.opens('friendship') ? percentOf : undefined"
      :best-friends="bestFriends"
      :show-workplaces="game.opens('workplace')"
      :flowers="game.opens('flowers') ? flowers : []"
      :insets="insets"
      @resident="open = $event"
      @flower="showFlower"
      @far="compact = $event"
      @touch="closeUnlockNotice"
    />

    <div class="overlay">
      <div ref="topEl" class="top">
        <header class="title-card" :class="{ expanded: showMore }">
          <h1 class="sr-only">내 하루 마을</h1>
          <!-- 접힌 한 줄: 마을 주민 n명(전체 수·진행 막대는 보이지 않는다), 새 기능 알약, 펼치기, 메뉴 -->
          <div class="card-row">
            <div class="goal">
              <p class="goal-count">마을 주민 <strong class="mono">{{ layout.residents.length }}</strong>명</p>
            </div>
            <!-- 다음에 열릴 것이 있으면, 무엇인지 알 수 있는 알약 버튼 (누르면 펼쳐진다) -->
            <button
              v-if="game.nextLockedStep.value && !showMore"
              class="unlock-pill"
              :aria-label="`다음에 열리는 것: ${game.nextLockedStep.value.step.notice}, ${shortCondition(game.nextLockedStep.value.state)}. 펼쳐 보기`"
              @click="toggleCard"
            >
              <span class="pill-face">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                <span class="pill-text">{{ pillText(game.nextLockedStep.value.state) }}</span>
              </span>
            </button>
            <button
              class="icon-btn"
              :aria-label="showMore ? '마을 카드 접기' : '마을 카드 펼치기'"
              :aria-expanded="showMore"
              aria-controls="village-card-more"
              @click="toggleCard"
            >
              <svg class="chevron" :class="{ up: showMore }" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <button class="icon-btn" aria-label="마을 메뉴" :aria-expanded="menuOpen" @click="menuOpen = true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
          <!-- 펼쳤을 때만 -->
          <div v-if="showMore" id="village-card-more" class="card-more">
            <button v-if="next" class="next-resident" @click="goNext">
              다음 주민은 <strong>{{ next.product.name }}</strong> 속에 있어요
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <p v-else class="sub">마을에 살 수 있는 사람을 모두 만났어요</p>
            <!-- 다음에 열리는 것: 아직 안 열린 단계 중 가장 앞 단계 하나 (모두 열리면 없음) -->
            <p v-if="game.nextLockedStep.value" class="next-unlock">
              <svg class="lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              <span>{{ game.nextLockedStep.value.step.notice }}</span>
              <span class="cond">· {{ shortCondition(game.nextLockedStep.value.state) }}</span>
            </p>
            <p v-if="layout.residents.length" class="sub">
              {{ countries.length }}개 나라에서 왔어요<template v-if="bestFriends.length"> · 단짝 {{ bestFriends.length }}명</template>
            </p>
          </div>
        </header>
        <button v-if="unlockShown" class="notice unlock-notice" role="status" @click="closeUnlockNotice">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#F2C14E" stroke="#2A2A35" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5l2.6 6.2 6.7.6-5.1 4.4 1.6 6.6L12 16.8l-5.8 3.5 1.6-6.6-5.1-4.4 6.7-.6z" /></svg>
          <span>{{ unlockShown.notice }}</span>
        </button>
        <button v-if="notice" class="notice" :aria-expanded="noticeOpen" @click="noticeOpen = !noticeOpen">
          <FlowerMark color="#F9B9C9" :size="28" />
          <span>{{ notice.text }}</span>
        </button>
        <p v-if="introLine" class="notice intro-notice" role="status">{{ introLine }}</p>
        <ul v-if="notice && noticeOpen" class="notice-list">
          <li v-for="f in notice.flowers" :key="f.at">{{ flowerLabel(f) }}</li>
        </ul>
      </div>

      <div ref="bottomEl" class="bottom">
        <p v-if="cheerLine" class="toast cheer" role="status">{{ cheerLine }}</p>
        <p v-else-if="picked || message" class="toast" role="status">{{ picked || message }}</p>
        <button v-if="incomingItems.length" class="incoming-chip" :aria-expanded="incomingOpen" @click="incomingOpen = true">
          <span class="chip-icon" aria-hidden="true">
            <!-- eslint-disable-next-line vue/no-v-html -- 직접 그린 SVG -->
            <svg viewBox="0 0 40 40" width="26" height="26" v-html="TRANSPORT_ICON[incomingItems[0]!.kind]" />
          </span>
          <span class="chip-text">{{ incomingChip }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
        </button>
        <NuxtLink to="/add" class="add">오늘 쓴 물건 넣기</NuxtLink>
      </div>
    </div>

    <!-- 마을(position: fixed)은 쌓임 맥락이 따로라, 아래 탭 위로 올라오게 body로 옮긴다 -->
    <Teleport to="body">
      <ResidentSheet v-if="open" :person-id="open" @close="open = null" />
      <div v-if="incomingOpen" class="menu-backdrop" @click.self="incomingOpen = false">
        <section class="menu incoming-sheet" role="dialog" aria-modal="true" aria-label="오고 있는 물건">
          <button class="close" aria-label="닫기" @click="incomingOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <h2 class="menu-title">오고 있는 물건</h2>
          <IncomingCard v-for="inc in waiting" :key="inc.journeyId" :incoming="inc" :now="now" />
        </section>
      </div>
      <div v-if="menuOpen" class="menu-backdrop" @click.self="menuOpen = false">
        <section class="menu" role="dialog" aria-modal="true" aria-label="마을 메뉴">
          <button class="close" aria-label="닫기" @click="menuOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <h2 class="menu-title">마을 메뉴</h2>
          <NuxtLink to="/test" class="item">나의 하루 유형 테스트</NuxtLink>
          <button v-if="game.allThanked.value" class="item" @click="menuOpen = false; game.replayEnding()">엔딩 다시 보기</button>

          <!-- 열리는 기능: 표의 단계를 순서대로. 열린 것은 누르면 그 기능으로(내 마을 초대하기·도감·미스터리·지난 기록),
               잠긴 것은 흐린 글씨 + 자물쇠 + 조건, 누르면 짧은 안내 -->
          <h3 class="menu-sub">열리는 기능</h3>
          <p v-if="menuNote" class="menu-note" role="status">{{ menuNote }}</p>
          <template v-for="row in unlockRows" :key="row.step.id">
            <button v-if="row.state.kind === 'open'" class="item" @click="openRow(row.step.id)">{{ row.step.label }}</button>
            <button v-else class="item locked" :aria-label="`${row.step.label}, 잠김. ${listCondition(row.state)}`" @click="showLocked(row.step.id)">
              <span class="locked-text">
                <span>{{ row.step.label }}</span>
                <span class="locked-cond">{{ listCondition(row.state) }}</span>
              </span>
              <svg class="lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            </button>
          </template>

          <!-- 다녀온 마을: 친구 링크로 간 적이 있으면 잠김과 상관없이 보인다. 아직 없으면 초대 단계를 따른다 -->
          <h3 class="menu-sub">다녀온 마을</h3>
          <NuxtLink v-for="v in visited" :key="v.token" :to="`/v/${v.token}`" class="item">{{ v.nickname }}님의 마을</NuxtLink>
          <template v-if="!visited.length">
            <p v-if="game.opens('invite')" class="hint">친구가 보낸 초대 링크를 열면 여기에 남아요</p>
            <button v-else class="item locked" @click="showLocked(visitStep.id)">
              <span class="locked-text">
                <span>다녀온 마을</span>
                <span class="locked-cond">{{ visitLock }}</span>
              </span>
              <svg class="lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            </button>
          </template>

          <h3 class="menu-sub">설정</h3>
          <!-- 닉네임·다른 기기에서 이어 하기 (도감에서 옮겨 왔다) -->
          <NicknameEditor />
          <DeviceTransfer />
          <template v-if="game.opens('invite')">
            <label class="item toggle">
              <span>마을 방문 받기</span>
              <input type="checkbox" :checked="acceptVisits" :disabled="!villageLink.link.value" @change="villageLink.setOpen(($event.target as HTMLInputElement).checked)">
            </label>
            <button class="item" :disabled="!villageLink.link.value" @click="renewLink">초대 링크 새로 만들기</button>
            <p class="hint">새로 만들면 이전에 보낸 링크는 열리지 않아요</p>
          </template>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.village { position: fixed; inset: 0; overflow: hidden; background: #7fc3de; }

/* 지도 위에 올린 것들. 지도는 끌 수 있게 겹친 빈 곳은 누름을 통과시킨다 */
.overlay { position: absolute; inset: 0; pointer-events: none; display: flex; justify-content: center; }
.overlay > * > * { pointer-events: auto; }
.top {
  position: absolute; top: max(16px, env(safe-area-inset-top)); left: 12px; right: 12px; max-width: 456px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.title-card { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px 12px 18px; border-radius: 20px; background: rgba(15, 27, 45, 0.9); }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 14px; background: none; color: var(--text); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.chevron { transition: transform var(--motion-enter) var(--motion-ease); }
.chevron.up { transform: rotate(180deg); }
.card-row { display: flex; align-items: center; gap: 2px; margin: -6px -6px -6px 0; }
.card-row .goal { flex: 1; min-width: 0; }
.card-more { display: flex; flex-direction: column; gap: 3px; margin-top: 4px; }
/* 새 기능 알약: 누르는 영역 44px, 보이는 알약 32px (노란 바탕이라 누를 수 있는 버튼으로 보인다) */
.unlock-pill { flex-shrink: 1; min-width: 0; min-height: 44px; padding: 0 2px; border: 0; background: none; cursor: pointer; display: flex; align-items: center; }
.pill-face {
  min-width: 0; height: 32px; padding: 0 10px; border-radius: 16px; display: inline-flex; align-items: center; gap: 4px;
  background: var(--accent); color: #1a1a22; font-size: 12px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 0 #2a2a35;
}
.pill-face svg { flex-shrink: 0; }
.pill-text { overflow: hidden; text-overflow: ellipsis; }
.goal { display: flex; flex-direction: column; gap: 5px; }
.goal-count { margin: 0; font-size: 14px; color: #f3f1ea; }
.goal-count strong { color: var(--accent); font-size: 17px; font-weight: 500; }
.next-resident {
  align-self: flex-start; min-height: 44px; margin-top: 2px; padding: 0; border: 0; background: none; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px; color: #f3f1ea; font-size: 14px; text-align: left; word-break: keep-all;
}
.next-resident strong { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.card-more { animation: rise var(--motion-enter) var(--motion-ease); }
.sub { margin: 0; font-size: 13px; color: #c9cfd9; word-break: keep-all; }
.notice {
  display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 14px; border-radius: 16px; border: 0;
  background: #f3f1ea; color: #1a1a22; font-size: 14px; font-weight: 700; text-align: left; cursor: pointer; word-break: keep-all;
  animation: rise var(--motion-enter) var(--motion-ease);
}
.notice svg { flex-shrink: 0; }
.intro-notice { margin: 0; cursor: default; }
.unlock-notice { border: 3px solid #2a2a35; background: #fff3cf; }
.notice-list { margin: 0; padding: 10px 14px; list-style: none; border-radius: 16px; background: #f3f1ea; color: #1a1a22; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.bottom {
  position: absolute; left: 12px; right: 12px; bottom: calc(84px + env(safe-area-inset-bottom)); max-width: 456px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 10px; pointer-events: none;
}
.toast { margin: 0; padding: 10px 14px; border-radius: 14px; background: #f3f1ea; color: #1a1a22; font-size: 13px; font-weight: 700; word-break: keep-all; }
.toast.cheer { padding: 12px 16px; border: 3px solid #2a2a35; background: #f2c14e; font-size: 15px; text-align: center; animation: rise var(--motion-enter) var(--motion-ease); }
.add {
  align-self: center; width: 100%; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
  background: var(--accent); color: var(--accent-ink); font-size: 17px; font-weight: 700; text-decoration: none;
  box-shadow: 0 4px 0 #2a2a35;
  transition: width var(--motion-enter) var(--motion-ease), height var(--motion-enter) var(--motion-ease),
    border-radius var(--motion-enter) var(--motion-ease), font-size var(--motion-enter) var(--motion-ease);
}
.incoming-chip {
  align-self: center; max-width: 100%; min-height: 44px; padding: 4px 14px 4px 6px; border: 0; border-radius: 22px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px; background: rgba(15, 27, 45, 0.94); color: var(--text); font-size: 13px; font-weight: 700;
}
.chip-icon { width: 34px; height: 34px; border-radius: 17px; background: #1e3150; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.chip-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.incoming-sheet { gap: 10px; }

/* 많이 축소했을 때: 펼쳐 둔 제목 카드도 한 줄(펼치기를 누르면 그 자리에서 다시 보인다), 버튼은 높이 44px 알약 */
.title-card { transition: padding var(--motion-enter) var(--motion-ease); }
.compact .title-card { padding: 8px 16px; }

.compact .add { width: 200px; height: 44px; border-radius: 22px; font-size: 15px; }
.menu-backdrop { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; justify-content: center; background: rgba(5, 10, 20, 0.55); }
.menu {
  position: relative; width: 100%; max-width: 480px; max-height: 80vh; overflow-y: auto; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 6px; padding: 18px 18px calc(24px + env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0; background: var(--surface); animation: sheet-up var(--motion-enter) var(--motion-ease);
}
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.close { position: absolute; right: 10px; top: 10px; width: 44px; height: 44px; border: 0; border-radius: 22px; background: none; color: var(--text); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.menu-title { margin: 0 0 6px; font-size: 18px; }
.menu-sub { margin: 12px 0 2px; font-size: 13px; color: var(--accent); }
.item {
  min-height: 48px; padding: 0 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--ground); color: var(--text);
  display: flex; align-items: center; justify-content: space-between; font-size: 15px; text-decoration: none; cursor: pointer; text-align: left;
}
.item:disabled { opacity: 0.5; cursor: default; }
.toggle input { width: 24px; height: 24px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); }
.item.locked { color: var(--muted); border-style: dashed; }
.locked-text { display: flex; flex-direction: column; gap: 2px; padding: 6px 0; }
.locked-cond { font-size: 12px; }
.lock { flex-shrink: 0; }
.menu-note { margin: 0; padding: 8px 12px; border-radius: 12px; background: #f3f1ea; color: #1a1a22; font-size: 13px; font-weight: 700; }
.next-unlock { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #c9cfd9; word-break: keep-all; }
.next-unlock .cond { color: var(--accent); white-space: nowrap; }
</style>
