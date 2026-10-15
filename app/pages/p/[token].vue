<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PEOPLE } from '../../../shared/data/people'
import { PLACES } from '../../../shared/data/places'
import { introFactOf } from '../../../shared/intro'
import { placeLabel } from '../../../shared/rewind'
import { personShareLine, type PersonPayload } from '../../../shared/share'

/**
 * 사람 카드 소개를 받은 화면 (/p/{token}). 가입 없이 15초 안에 끝난다:
 *  1) 보낸 사람의 한 줄 2) 손 흔드는 캐릭터·이름·하는 일·사는 곳 3) 사람 크기의 일하는 사실(없으면 건너뛴다)
 *  4) 고마워요(전체 감사 수에도) 5) "당신 하루에는 누가 있을까요?" → 입력 흐름
 * 서버 라우트(server/routes/p/[token].get.ts)가 OG meta를 넣은 HTML로 이 화면을 띄운다. 소개는 이 기기에 적어 둔다.
 */
const route = useRoute()
const share = useShare()
const { status } = useSync()
const token = computed(() => String(route.params.token))
const payload = ref<PersonPayload | null>(null)
const loaded = ref(false)

onMounted(async () => {
  payload.value = await share.openIntro(token.value)
  loaded.value = true
})

const person = computed(() => (payload.value ? PEOPLE[payload.value.personId] : undefined))
const where = computed(() => (person.value ? placeLabel(PLACES[person.value.placeId]!) : ''))
const fact = computed(() => (payload.value ? introFactOf(payload.value.personId) : null))
const thanked = ref(false)
const busy = ref(false)
const message = ref('')
const showSource = ref(false)

async function thank() {
  if (!payload.value || busy.value || thanked.value) return
  busy.value = true
  thanked.value = await share.thankIntro(token.value, status.profile?.id)
  if (!thanked.value) message.value = '지금은 고마워요를 전할 수 없어요. 잠시 후 다시 눌러 주세요'
  busy.value = false
}
</script>

<template>
  <main class="intro">
    <template v-if="payload && person">
      <p class="line">{{ personShareLine(payload) }}</p>

      <div class="card">
        <div class="art"><Character :person-id="person.id" :size="220" standing wave bob /></div>
        <h1 class="display name">{{ person.name ?? person.job }}</h1>
        <p class="job">{{ person.job }} · {{ where }}</p>
        <p class="story">{{ person.story }}</p>
      </div>

      <div v-if="fact" class="fact">
        <p>{{ fact.fact }}</p>
        <button class="src" :aria-expanded="showSource" @click="showSource = !showSource">출처 {{ showSource ? '접기' : '보기' }}</button>
        <p v-if="showSource" class="src-text">{{ fact.source.name }} ({{ fact.source.year }}) <a :href="fact.source.url" target="_blank" rel="noopener noreferrer">자료 보기</a></p>
      </div>

      <button class="thank" :disabled="busy || thanked" @click="thank">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
        {{ thanked ? '고마워요를 전했어요' : '고마워요' }}
      </button>
      <p v-if="thanked" class="both" role="status">{{ payload.nickname }}님과 당신, 두 사람이 이 분께 고마워했어요</p>
      <p v-else-if="message" class="both" role="status">{{ message }}</p>

      <div class="next">
        <p>당신 하루에는 누가 있을까요?</p>
        <NuxtLink to="/add" class="go">지금 손에 든 거, 뭐예요?</NuxtLink>
      </div>
    </template>
    <section v-else-if="loaded" class="gone">
      <h1 class="display">이 소개는 열 수 없어요</h1>
      <p>보낸 지 오래됐거나 링크가 바뀌었어요. 당신 하루에는 누가 있을까요?</p>
      <NuxtLink to="/add" class="go">지금 손에 든 거, 뭐예요?</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.intro {
  min-height: 100dvh; max-width: 480px; margin: 0 auto; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 14px; padding: 36px 18px calc(100px + env(safe-area-inset-bottom));
}
.line { margin: 0; font-size: 15px; font-weight: 700; color: var(--accent); line-height: 1.5; word-break: keep-all; }
.card {
  display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px 18px 20px; border-radius: 24px;
  background: var(--paper); color: var(--ink); text-align: center; animation: rise var(--motion-enter) var(--motion-ease);
}
.art { width: 162px; height: 220px; }
.name { margin: 6px 0 0; font-size: 30px; }
.job { margin: 0; font-size: 14px; color: #4a4a55; }
.story { margin: 6px 0 0; font-size: 14px; line-height: 1.6; text-align: left; word-break: keep-all; }
.fact { padding: 14px 16px; border-radius: 16px; background: #172840; display: flex; flex-direction: column; gap: 4px; }
.fact p { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.5; }
.src { align-self: flex-start; min-height: 44px; padding: 0; border: 0; background: none; color: var(--accent); font-size: 13px; font-weight: 700; cursor: pointer; }
.src-text { font-size: 12px !important; font-weight: 400 !important; color: #c9cfd9; }
.src-text a { color: var(--accent); }
.thank {
  min-height: 56px; border: 0; border-radius: 18px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
  background: #e0705f; color: #fff; font-size: 17px; font-weight: 700;
}
.thank:disabled { background: #3a4a63; color: #f3f1ea; cursor: default; }
.both { margin: 0; text-align: center; font-size: 14px; font-weight: 700; word-break: keep-all; }
.next { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; text-align: center; }
.next p { margin: 0; font-size: 15px; }
.go {
  min-height: 56px; border-radius: 18px; background: var(--accent); color: #1a1a22; font-size: 17px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; text-decoration: none;
}
.gone { padding: 48px 6px; display: flex; flex-direction: column; gap: 14px; }
.gone h1 { margin: 0; font-size: 26px; }
.gone p { margin: 0; line-height: 1.6; }
</style>
