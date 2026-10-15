import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PLACES } from '../shared/data/places'
import { repliesFor } from '../shared/data/replies'
import { dateLabel, gapText, memoryLine, moodTitle, pathHeader, personTitle, placeShort, plainTitle, shortDate, threadSentence, togetherLine } from '../shared/today-text'

test('날짜', () => {
  assert.equal(dateLabel('2026-10-15'), '10월 15일 목요일')
  assert.equal(shortDate('2026-10-05'), '10월 5일')
})

test('4번 머리말·제목: 받침에 따라 이/가, 이야기가 없으면 마음을 붙이지 않는다', () => {
  assert.equal(pathHeader('아이스 아메리카노'), '오늘 당신의 아이스 아메리카노가 지나온 길 위의 사람')
  assert.equal(pathHeader('참치마요 삼각김밥'), '오늘 당신의 참치마요 삼각김밥이 지나온 길 위의 사람')
  assert.deepEqual(moodTitle('알마즈', 'wronged'), ['알마즈도 오늘,', '억울한 하루였어요.'])
  assert.deepEqual(plainTitle('라면'), ['오늘 당신의 라면이 지나온', '길 위의 사람이에요.'])
})

test('3번 문장: 시간 차이와 손의 수, 같은 시간대면 같은 시각', () => {
  const now = new Date(Date.UTC(2026, 9, 15, 9, 5))
  assert.equal(placeShort(PLACES['et-sidama']!), '시다마')
  assert.equal(placeShort(PLACES['kr-busan']!), '부산항')
  assert.equal(placeShort(PLACES.sea!), '바다 위')
  assert.equal(gapText('Africa/Addis_Ababa', now), '6시간')
  assert.equal(gapText('Asia/Kolkata', now), '3시간 30분')
  assert.equal(gapText('Asia/Seoul', now), '')
  assert.equal(
    threadSentence({ seoul: { h: 18, m: 5 }, there: { h: 12, m: 5 }, placeName: '시다마', gap: '6시간', hands: 14, itemName: '커피' }),
    '지금 서울은 오후 6:05, 시다마는 오후 12:05. 6시간 떨어진 그곳까지, 14명의 손이 당신의 커피를 이어 주었어요.',
  )
  assert.equal(
    threadSentence({ seoul: { h: 18, m: 5 }, there: { h: 18, m: 5 }, placeName: '부산항', gap: '', hands: 9, itemName: '라면' }),
    '지금 서울은 오후 6:05. 같은 시각, 9명의 손이 당신의 라면을 이어 주었어요.',
  )
})

test('기억 한 줄·모두의 오늘·한마디 보기', () => {
  assert.equal(memoryLine('tired'), '지난번엔 당신도 지쳤다고 했죠.')
  assert.equal(togetherLine('wronged', 1203), '오늘 억울했던 사람 1,203명이 지구 곳곳의 누군가와 실을 묶었어요.')
  assert.deepEqual([...repliesFor('glad')], ['저도 오늘 좋았어요', '축하해요', '오늘 같은 날이 또 오길'])
  assert.deepEqual([...repliesFor('tired')], ['저도 오늘 그랬어요', '고생 많았어요', '내일은 나을 거예요'])
})

test('4번 제목은 고른 방식(how)에 따라 넷', () => {
  // 다음 편에 오늘 마음 태그
  assert.deepEqual(personTitle('알마즈', 'wronged', 'mood', '아이스 아메리카노'), ['알마즈도 오늘,', '억울한 하루였어요.'])
  // 같은 칸: 칸 문장
  assert.deepEqual(personTitle('알마즈', 'wronged', 'cell', '아이스 아메리카노'), ['알마즈도 오늘,', '마음이 시끄러운 하루였어요.'])
  assert.deepEqual(personTitle('마인', 'tired', 'cell', '커피'), ['마인도 오늘,', '마음이 무거운 하루였어요.'])
  assert.deepEqual(personTitle('예은', 'excited', 'cell', '커피'), ['예은도 오늘,', '마음이 들뜬 하루였어요.'])
  assert.deepEqual(personTitle('로버트', 'plain', 'cell', '라면'), ['로버트도 오늘,', '마음이 잔잔한 하루였어요.'])
  // 마음과 상관없이 다음 편
  assert.deepEqual(personTitle('로널드', 'lonely', 'next', '운동화'), ['당신이 외로웠던 오늘,', '로널드의 하루는 이랬어요.'])
  assert.deepEqual(personTitle('로널드', 'plain', 'next', '운동화'), ['당신이 그냥 그랬던 오늘,', '로널드의 하루는 이랬어요.'])
  // 이야기 없는 사람: 마음을 붙이지 않는다
  assert.deepEqual(personTitle('영수', 'tired', 'none', '라면'), ['오늘 당신의 라면이 지나온', '길 위의 사람이에요.'])
})
