<script setup lang="ts">
import { computed, ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'
import { PLACES } from '../../shared/data/places'
import { WORKPLACES } from '../../shared/data/village'
import { seoulDateKey } from '../../shared/logic'
import { hintProductOf, setRewardOf, type Flower } from '../../shared/visit'

/**
 * 친구 마을의 주민 카드. 고마워요를 누르면 그 주민 옆에 꽃이 핀다(같은 마을에 하루 한 송이).
 * 내가 만난 적 있는 사람이면 내 고마워요(하루 한 번)로도 센다. 못 만난 사람이면 꽃만 피고, 그 사람이 있는 물건을 알려 준다.
 */
const props = defineProps<{ personId: string; token: string }>()
const emit = defineEmits<{ close: []; bloom: [flower: Flower] }>()
const game = useGame()
const router = useRouter()
const { status } = useSync()

const person = computed(() => PEOPLE[props.personId]!)
const met = computed(() => game.owns(props.personId))
const where = computed(() => `${PLACES[person.value.placeId]?.country || '바다'} · ${WORKPLACES[person.value.workplace]}`)
const hint = computed(() => (met.value ? null : hintProductOf(props.personId)))
/** 힌트 물건이 없는 세트 보상 사람 */
const rewardSet = computed(() => (met.value || hint.value ? null : setRewardOf(props.personId)))
const message = ref('')
const busy = ref(false)
const left = ref(false)

async function thank() {
  if (busy.value || left.value) return
  busy.value = true
  try {
    const res = await $fetch<{ ok: boolean; reason?: string }>(`/api/village/${encodeURIComponent(props.token)}/flower`, {
      method: 'POST',
      body: { personId: props.personId, nickname: game.nickname.value, id: status.profile?.id },
    })
    if (res.ok) {
      left.value = true
      const now = Date.now()
      emit('bloom', { nickname: game.nickname.value, personId: props.personId, date: seoulDateKey(now), at: now })
      // 만난 적 있는 사람이면 내 고마워요(하루 한 번)에도 적는다. 전체 감사 수는 꽃을 남길 때 서버가 이미 셌다
      const mine = met.value && game.thank(props.personId) !== null
      message.value = mine ? '꽃을 남겼어요. 내 고마워요에도 하루가 더해졌어요' : '꽃을 남겼어요'
    } else if (res.reason === 'already') {
      message.value = '오늘은 이 마을에 꽃을 남겼어요. 내일 또 남길 수 있어요'
    } else if (res.reason === 'closed') {
      message.value = '지금은 방문을 받지 않는 마을이에요'
    } else {
      message.value = '지금은 꽃을 남길 수 없어요. 잠시 후 다시 해 주세요'
    }
  } catch {
    message.value = '지금은 꽃을 남길 수 없어요. 잠시 후 다시 해 주세요'
  } finally {
    busy.value = false
  }
}

function startHint() {
  const p = hint.value
  if (!p) return
  const journey = game.startJourney({ name: p.name, materialIds: [...p.materialIds] }, 'pick')
  if (journey) router.push(`/journey/${journey.id}`)
  else message.value = '오늘의 여정을 모두 떠났어요. 내일 만나러 가요'
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="`${person.name ?? person.job} 주민 카드`">
      <span class="grip" aria-hidden="true" />
      <button class="close" aria-label="닫기" @click="emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <div class="who">
        <div class="art"><Character :person-id="personId" :size="132" standing :wave="left" /></div>
        <div class="names">
          <span class="where">{{ where }}</span>
          <h2 class="name display">{{ person.name ?? person.job }}</h2>
          <span v-if="person.name" class="job">{{ person.job }}</span>
        </div>
      </div>

      <div v-if="hint" class="hint">
        <p>이 분은 {{ hint.name }} 속에 있어요</p>
        <button class="start" @click="startHint">{{ hint.name }} 여정 시작하기</button>
      </div>
      <div v-else-if="rewardSet" class="hint">
        <p>세트를 모으면 만날 수 있어요</p>
        <span class="set-name">{{ rewardSet.name }}</span>
      </div>
      <p v-else-if="met" class="met">나도 만난 적 있는 분이에요</p>

      <p v-if="message" class="message" role="status">{{ message }}</p>
      <button class="thank" :disabled="busy || left" @click="thank">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
        {{ left ? '고마워요를 남겼어요' : '고마워요' }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; justify-content: center; background: rgba(5, 10, 20, 0.55); }
.sheet {
  position: relative; width: 100%; max-width: 480px; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 14px; padding: 14px 22px calc(24px + env(safe-area-inset-bottom));
  border-radius: 28px 28px 0 0; background: var(--paper); color: var(--ink); animation: sheet-up var(--motion-enter) var(--motion-ease);
}
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.grip { width: 44px; height: 5px; border-radius: 3px; background: #c9c4b5; align-self: center; }
.close { position: absolute; right: 12px; top: 12px; width: 44px; height: 44px; border-radius: 22px; display: flex; align-items: center; justify-content: center; border: 0; background: none; color: #5a5a66; cursor: pointer; }
.who { display: flex; gap: 14px; align-items: flex-end; }
.art { width: 116px; height: 140px; flex-shrink: 0; border-radius: 20px; background: #ddefd0; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; }
.names { display: flex; flex-direction: column; gap: 4px; padding-bottom: 6px; min-width: 0; }
.where { font-size: 12px; font-weight: 700; color: #4e7a3e; }
.name { margin: 0; font-size: 26px; line-height: 1.2; word-break: keep-all; }
.job { font-size: 14px; color: #4a4a55; }
.hint { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 16px; background: #fff; }
.hint p { margin: 0; font-size: 15px; font-weight: 700; }
.set-name { font-size: 13px; color: #4a4a55; }
.start { min-height: 48px; border-radius: 14px; border: 2px solid #1a1a22; background: none; color: #1a1a22; font-size: 15px; font-weight: 700; cursor: pointer; }
.met { margin: 0; font-size: 13px; color: #4a4a55; }
.message { margin: 0; font-size: 13px; color: #4a4a55; word-break: keep-all; }
.thank {
  min-height: 52px; border: 0; border-radius: 18px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
  background: #e0705f; color: #fff; font-size: 16px; font-weight: 700;
}
.thank:disabled { background: #c9c4b5; color: #4a4a55; cursor: default; }
</style>
