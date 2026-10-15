<script setup lang="ts">
import { computed } from 'vue'
import { PRODUCTS } from '../../shared/data/materials'
import { PEOPLE } from '../../shared/data/people'
import { dayResult } from '../../shared/day-type'
import { dayNumbersText, iconUrl } from '../utils/day-test'

/** 나의 하루 유형 한 장: 유형 이름·설명·대표 주민·숫자 3개·고른 물건 (결과 화면과 친구가 보낸 링크에서 같이 쓴다) */
const props = defineProps<{ items: string[]; kicker?: string }>()

const result = computed(() => dayResult(props.items))
const resident = computed(() => PEOPLE[result.value.type.resident]!)
const numbers = computed(() => dayNumbersText(props.items))
const nameOf = (id: string) => PRODUCTS.find((p) => p.id === id)?.name ?? ''
</script>

<template>
  <div class="view">
    <div class="head">
      <span class="kicker">{{ kicker ?? '나의 하루 유형' }}<template v-if="result.type.rare"> · 드문 하루</template></span>
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
  </div>
</template>

<style scoped>
.view { display: flex; flex-direction: column; color: #f3f1ea; }
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
</style>
