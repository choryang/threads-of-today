<script setup lang="ts">
import { ref } from 'vue'
import { PEOPLE } from '../../shared/data/people'

/**
 * 그리고 이 사람들도요 (docs/key-people.md 화면 3): 핵심 인물 사이에 있던 사람들을 한 칸에. 얼굴 줄과 일 이름, 누르면 카드.
 * 카드는 이 칸에 들어설 때 모두 받는다(useGame.revealNext)
 */
defineProps<{ personIds: string[]; newIds: string[] }>()
const open = ref<string | null>(null)
const jobOf = (id: string) => PEOPLE[id]?.job ?? ''
</script>

<template>
  <section class="group">
    <p class="kicker">그리고 이 사람들도요</p>
    <p class="sub">이 분들의 손도 거쳐 왔어요. 누르면 카드를 볼 수 있어요</p>
    <ul class="people">
      <li v-for="id in personIds" :key="id">
        <button class="person" :aria-label="`${jobOf(id)} 카드 보기`" @click="open = id">
          <span class="face"><Character :person-id="id" :size="60" /></span>
          <span class="job">{{ jobOf(id) }}</span>
          <span v-if="newIds.includes(id)" class="new">새로</span>
        </button>
      </li>
    </ul>
    <Teleport to="body"><ResidentSheet v-if="open" :person-id="open" @close="open = null" /></Teleport>
  </section>
</template>

<style scoped>
.group {
  display: flex; flex-direction: column; gap: 10px; padding: 18px 16px; border-radius: 22px;
  background: var(--surface); border: 1px solid var(--line); animation: pop-in var(--motion-enter) var(--motion-ease);
}
.kicker { margin: 0; font-family: var(--font-display); font-size: 22px; }
.sub { margin: 0; font-size: 13px; color: var(--muted); word-break: keep-all; }
.people { list-style: none; margin: 4px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 6px; }
.person {
  position: relative; width: 100%; min-height: 44px; padding: 6px 2px; border: 0; border-radius: 14px; background: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--text); font: inherit;
}
.face { width: 64px; height: 64px; border-radius: 32px; background: var(--paper); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.job { font-size: 12px; line-height: 1.35; text-align: center; word-break: keep-all; }
.new { position: absolute; top: 0; right: 6px; padding: 2px 6px; border-radius: 6px; background: var(--bad); color: #fff; font-size: 11px; font-weight: 700; }
</style>
