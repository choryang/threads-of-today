<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { WORKPLACES } from '../../shared/data/village'
import { UNLOCK } from '../../shared/friendship'
import { arrivalShort, isArrived, isWaiting } from '../../shared/incoming'
import { villageShareTitle } from '../../shared/share'
import { countriesOf, villageLayout } from '../../shared/village'
import { flowerLabel, newFlowerNotice, type Flower } from '../../shared/visit'
import { MOTION } from '../utils/motion'

/**
 * 내 하루 마을 (홈). 지도가 화면 전체에 깔리고, 그 위에 제목 카드·알림·오고 있는 물건·'오늘 쓴 물건 넣기'를 올린다.
 * 지도·자리·꽃 그리기는 VillageMap(친구 마을과 같이 쓴다). 자리는 shared/village.ts가 사람 id로 정한다.
 */
const game = useGame()
const route = useRoute()
const router = useRouter()
const villageLink = useVillageLink()
const map = ref<{ focus: (p: { x: number; y: number }) => void } | null>(null)

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

const layout = computed(() => villageLayout(game.state.cards, game.state.people ?? {}, waiting.value.map((x) => x.personId)))
const countries = computed(() => countriesOf(layout.value.residents.map((r) => r.id)))
const percentOf = (id: string) => game.friendship(id).percent
/** 친해진 정도 100%인 주민의 일터 자리 (그림이 아직 없어 이름만 적은 점선 자리) */
const workplaces = computed(() =>
  layout.value.residents.filter((r) => percentOf(r.id) >= UNLOCK.workplace).map((r) => ({ ...r, name: WORKPLACES[PEOPLE[r.id]!.workplace] })),
)

const open = ref<string | null>(null)

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
  if (!villageLink.link.value) return
  await villageLink.refresh()
  flowers.value = await villageLink.flowers()
  // 마지막으로 본 뒤 새로 생긴 꽃은 한 번만 알린다
  notice.value = newFlowerNotice(flowers.value, villageLink.link.value?.seenAt ?? 0)
  if (notice.value) villageLink.markSeen(Math.max(...notice.value.flowers.map((f) => f.at)))
}

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

/** ?focus=사람 id: 그 사람 자리로 화면을 옮긴다 (밤사이 도착한 주민을 마을로 모실 때) */
onMounted(async () => {
  const focus = typeof route.query.focus === 'string' ? route.query.focus : ''
  // 처음 온 사람(만난 사람도 떠난 여정도 없음)은 10초 테스트부터
  if (game.firstVisit.value && !Object.values(game.state.days).some((d) => d.journeys.length)) {
    router.replace('/test')
    return
  }
  // 도착했는데 아직 열지 않은 물건이 있으면 도착 화면부터 (도착 후 처음 열 때)
  const due = waiting.value.find((x) => isArrived(x, Date.now()))
  if (!focus && due) {
    router.replace(`/arrival/${due.journeyId}`)
    return
  }
  void loadVillageSocial()
  if (!focus) return
  await nextTick()
  const spot = layout.value.residents.find((r) => r.id === focus)
  if (spot) requestAnimationFrame(() => map.value?.focus(spot))
  router.replace({ query: {} })
})
</script>

<template>
  <main class="village">
    <VillageMap
      ref="map"
      :residents="layout.residents"
      :lots="layout.lots"
      :arriving="layout.arriving"
      :arriving-label="arrivingLabel"
      :percent-of="percentOf"
      :workplaces="workplaces"
      :flowers="flowers"
      @resident="open = $event"
      @flower="showFlower"
    />

    <div class="overlay">
      <div class="top">
        <header class="title-card">
          <div class="title-row">
            <h1 class="display title">내 하루 마을</h1>
            <button class="menu-btn" aria-label="마을 메뉴" :aria-expanded="menuOpen" @click="menuOpen = true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
          <p v-if="layout.residents.length" class="sub">주민 {{ layout.residents.length }}명 · {{ countries.length }}개 나라에서 왔어요</p>
          <p v-else class="sub">오늘 쓴 물건을 넣으면 그 물건을 거쳐 온 사람들이 마을에 와요</p>
          <button v-if="layout.residents.length" class="invite" @click="invite">내 마을 초대하기</button>
        </header>
        <button v-if="notice" class="notice" :aria-expanded="noticeOpen" @click="noticeOpen = !noticeOpen">
          <FlowerMark color="#F9B9C9" :size="28" />
          <span>{{ notice.text }}</span>
        </button>
        <p v-if="introLine" class="notice intro-notice" role="status">{{ introLine }}</p>
        <ul v-if="notice && noticeOpen" class="notice-list">
          <li v-for="f in notice.flowers" :key="f.at">{{ flowerLabel(f) }}</li>
        </ul>
      </div>

      <div class="bottom">
        <p v-if="picked || message" class="toast" role="status">{{ picked || message }}</p>
        <IncomingCard v-for="inc in waiting" :key="inc.journeyId" :incoming="inc" :now="now" />
        <NuxtLink to="/add" class="add">오늘 쓴 물건 넣기</NuxtLink>
      </div>
    </div>

    <!-- 마을(position: fixed)은 쌓임 맥락이 따로라, 아래 탭 위로 올라오게 body로 옮긴다 -->
    <Teleport to="body">
      <ResidentSheet v-if="open" :person-id="open" @close="open = null" />
      <div v-if="menuOpen" class="menu-backdrop" @click.self="menuOpen = false">
        <section class="menu" role="dialog" aria-modal="true" aria-label="마을 메뉴">
          <button class="close" aria-label="닫기" @click="menuOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <h2 class="menu-title">마을 메뉴</h2>
          <button class="item" @click="invite(); menuOpen = false">내 마을 초대하기</button>
          <NuxtLink to="/test" class="item">나의 하루 유형 테스트</NuxtLink>

          <h3 class="menu-sub">다녀온 마을</h3>
          <NuxtLink v-for="v in visited" :key="v.token" :to="`/v/${v.token}`" class="item">{{ v.nickname }}님의 마을</NuxtLink>
          <p v-if="!visited.length" class="hint">친구가 보낸 초대 링크를 열면 여기에 남아요</p>

          <h3 class="menu-sub">설정</h3>
          <label class="item toggle">
            <span>마을 방문 받기</span>
            <input type="checkbox" :checked="acceptVisits" :disabled="!villageLink.link.value" @change="villageLink.setOpen(($event.target as HTMLInputElement).checked)">
          </label>
          <button class="item" :disabled="!villageLink.link.value" @click="renewLink">초대 링크 새로 만들기</button>
          <p class="hint">새로 만들면 이전에 보낸 링크는 열리지 않아요</p>
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
.title { margin: 0; font-size: 24px; line-height: 1.15; }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.menu-btn { width: 44px; height: 44px; margin: -6px -4px -6px 0; border: 0; border-radius: 14px; background: none; color: var(--text); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.sub { margin: 0; font-size: 13px; color: #c9cfd9; word-break: keep-all; }
.invite {
  align-self: flex-start; min-height: 44px; margin-top: 6px; padding: 0 16px; border-radius: 14px; border: 2px solid var(--accent);
  background: none; color: var(--accent); font-size: 14px; font-weight: 700; cursor: pointer;
}
.notice {
  display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 14px; border-radius: 16px; border: 0;
  background: #f3f1ea; color: #1a1a22; font-size: 14px; font-weight: 700; text-align: left; cursor: pointer; word-break: keep-all;
  animation: rise var(--motion-enter) var(--motion-ease);
}
.notice svg { flex-shrink: 0; }
.intro-notice { margin: 0; cursor: default; }
.notice-list { margin: 0; padding: 10px 14px; list-style: none; border-radius: 16px; background: #f3f1ea; color: #1a1a22; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.bottom {
  position: absolute; left: 12px; right: 12px; bottom: calc(84px + env(safe-area-inset-bottom)); max-width: 456px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 10px; pointer-events: none;
}
.toast { margin: 0; padding: 10px 14px; border-radius: 14px; background: #f3f1ea; color: #1a1a22; font-size: 13px; font-weight: 700; word-break: keep-all; }
.add {
  height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
  background: var(--accent); color: var(--accent-ink); font-size: 17px; font-weight: 700; text-decoration: none;
  box-shadow: 0 4px 0 #2a2a35;
}
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
</style>
