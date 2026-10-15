<script setup lang="ts">
/**
 * 오늘의 실 공유 링크 (/t/{token}). 링크 미리보기는 서버(server/routes/t)가 만들고, 연 사람은 1번 화면으로 바로 시작한다
 * (docs/redesign/README.md "공유"). 링크의 내용(남의 하루)은 보여 주지 않는다
 */
await navigateTo({ path: '/', query: { from: 'share' } }, { replace: true })
</script>

<template>
  <main />
</template>
