/**
 * 새 기획에서 뺀 화면 (docs/redesign/README.md "빼는 것"): 마을·도감·물건 넣기·여정·미스터리·하루 유형 테스트·기록·실타래·도착,
 * 예전 공유 링크(/d /p /v). 주소로 들어와도 첫 화면으로 보낸다. 코드는 아직 지우지 않았다(docs/redesign/unused.md)
 */
const RETIRED = ['/village', '/dex', '/add', '/mystery', '/test', '/journey', '/result', '/threads', '/arrival', '/d/', '/p/', '/v/']

export default defineNuxtRouteMiddleware((to) => {
  if (RETIRED.some((p) => to.path === p || to.path.startsWith(p.endsWith('/') ? p : `${p}/`))) return navigateTo('/', { replace: true })
})
