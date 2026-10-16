/**
 * 예전 기획의 공유 링크(/d 하루 유형 · /p 사람 카드 소개 · /v 마을 초대)는 첫 화면으로 보낸다 (docs/redesign/README.md "빼는 것").
 * 예전 화면·OG 코드는 지웠다(docs/redesign/unused.md)
 */
export default defineEventHandler((event) => sendRedirect(event, '/', 302))
