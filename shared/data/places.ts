import type { Place } from '../types'

/**
 * 장소. lat·lng는 거리 계산기(shared/distance.ts)에 쓰는 대표 지점의 대략 좌표다.
 * 도·주·나라처럼 넓은 곳은 그 지역의 중심 도시나 산지, 항구는 항구 도시를 골랐다. 지도에서 직접 읽은 값이라 도시 수준 정확도이고,
 * 화면에는 100km 단위로 반올림해서 보여 주므로 그 정도면 충분하다.
 * 지나가는 바다(sea)에는 좌표가 없다. 그 단계는 앞뒤 항구 사이 거리로 잰다. 태평양·남서대서양은 고기를 잡는 어장이라 어장 대표 지점을 넣었다.
 *
 * tz는 여정 화면의 '지금 그곳의 시각'에 쓰는 IANA 시간대. 나라의 대표 시간대를 쓰되, 시간대가 여럿인 나라는 그 장소가 있는 시간대로 골랐다
 * (콩고민주공화국 카탕가 Lubumbashi, 스발바르 Longyearbyen, 호주 멜버른·퀸즐랜드·서호주, 미국 북서부 Los_Angeles, 브라질 마투그로수·마투그로수두술).
 * 바다는 대략적인 값: 바다 위(sea)는 커피·옷이 지나는 인도양이라 Indian/Maldives, 태평양 어장(적도·동경 170도)은 Pacific/Tarawa,
 * 남서대서양 어장(포클랜드 앞바다)은 Atlantic/Stanley.
 */

const list: Place[] = [
  // 대한민국
  { id: 'kr', name: '대한민국', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 36.35, lng: 127.38 },
  { id: 'kr-seoul', name: '서울', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.57, lng: 126.98 },
  { id: 'kr-busan', name: '부산항', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 35.1, lng: 129.04 },
  { id: 'kr-incheon', name: '인천공항', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.46, lng: 126.44 },
  { id: 'kr-ulsan', name: '울산', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 35.54, lng: 129.31 },
  { id: 'kr-yeosu', name: '여수', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 34.76, lng: 127.66 },
  { id: 'kr-pohang', name: '포항', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 36.02, lng: 129.34 },
  { id: 'kr-gyeonggi', name: '경기도', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.27, lng: 127.01 },
  { id: 'kr-chungbuk', name: '충청북도', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 36.64, lng: 127.49 },
  { id: 'kr-jeonbuk', name: '전북특별자치도', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 35.82, lng: 127.11 },
  { id: 'kr-jeonnam', name: '전라남도 바닷가', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 34.31, lng: 126.75 },
  { id: 'kr-gyeongnam', name: '경상남도', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 35.24, lng: 128.69 },
  { id: 'kr-gangwon', name: '강원도 고랭지', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.67, lng: 128.72 },
  { id: 'kr-incheon-port', name: '인천항', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.45, lng: 126.6 },
  { id: 'kr-boseong', name: '전남 보성', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 34.77, lng: 127.08 },
  { id: 'kr-gwangju', name: '광주', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 35.16, lng: 126.85 },
  { id: 'kr-jeju', name: '제주', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 33.5, lng: 126.53 },
  { id: 'kr-yeongnam', name: '경상도', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 36.57, lng: 128.73 },
  { id: 'kr-honam', name: '전라도', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 35.02, lng: 126.71 },
  { id: 'kr-gangwon-land', name: '강원도', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.88, lng: 127.73 },
  { id: 'kr-changsin', name: '서울 창신동', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.576, lng: 127.012 },
  { id: 'kr-garak', name: '서울 가락시장', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.49, lng: 127.11 },
  { id: 'kr-daejeo', name: '부산 대저', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 35.21, lng: 128.97 },
  { id: 'kr-ulleung', name: '울릉도', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.48, lng: 130.9 },
  { id: 'kr-town', name: '우리 동네', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.57, lng: 126.98 },
  // 파주출판도시: 출판·인쇄·제본·물류가 한곳에 모여 있다(경기일보 2025 https://kyeonggi.com/article/20250810580202, 프레시안 https://pressian.com/pages/articles/43307)
  { id: 'kr-paju', name: '파주', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.71, lng: 126.69 },
  // 컴퓨터·주변기기 길 (docs/redesign/computer-people-review.md, 장소 근거는 docs/redesign/new-paths-draft.md 7번)
  { id: 'kr-jeungpyeong', name: '충북 증평', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 36.79, lng: 127.58 },
  { id: 'kr-onyang', name: '아산 온양', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 36.78, lng: 127.0 },
  { id: 'kr-yongsan', name: '서울 용산', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.53, lng: 126.96 },
  { id: 'cn-dongguan', name: '중국 둥관', country: '중국', continent: 'asia', tz: 'Asia/Shanghai' , lat: 22.97, lng: 113.75 },
  { id: 'cn-zhuhai', name: '중국 주하이', country: '중국', continent: 'asia', tz: 'Asia/Shanghai' , lat: 22.27, lng: 113.58 },
  { id: 'cn-hefei', name: '중국 허페이', country: '중국', continent: 'asia', tz: 'Asia/Shanghai' , lat: 31.82, lng: 117.23 },
  { id: 'cn-suzhou', name: '중국 쑤저우', country: '중국', continent: 'asia', tz: 'Asia/Shanghai' , lat: 31.3, lng: 120.62 },
  { id: 'tw-taoyuan', name: '대만 타오위안', country: '대만', continent: 'asia', tz: 'Asia/Taipei' , lat: 24.99, lng: 121.3 },
  { id: 'tw-tainan', name: '대만 타이난', country: '대만', continent: 'asia', tz: 'Asia/Taipei' , lat: 23.0, lng: 120.23 },
  { id: 'tw-hsinchu', name: '대만 신주', country: '대만', continent: 'asia', tz: 'Asia/Taipei' , lat: 24.8, lng: 120.97 },
  { id: 'vn-haiphong', name: '베트남 하이퐁', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 20.86, lng: 106.68 },
  { id: 'vn-shtp', name: '호찌민 하이테크파크', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 10.84, lng: 106.8 },
  // 애니메이션 길 (docs/redesign/anime-people-review.md)
  { id: 'jp-tokyo', name: '일본 도쿄', country: '일본', continent: 'asia', tz: 'Asia/Tokyo' , lat: 35.68, lng: 139.69 },
  { id: 'ph-manila', name: '필리핀 마닐라', country: '필리핀', continent: 'asia', tz: 'Asia/Manila' , lat: 14.6, lng: 120.98 },
  // 영화·드라마 길 (docs/redesign/film-drama-people-review.md)
  { id: 'kr-jeonju', name: '전주', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 35.82, lng: 127.15 },
  { id: 'kr-daejeon', name: '대전', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 36.35, lng: 127.38 },
  // 앱·노래·인터넷 길 (docs/redesign/app-song-people-review.md)
  { id: 'kr-pangyo', name: '성남 판교', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.4, lng: 127.11 },
  { id: 'kr-chuncheon', name: '강원 춘천', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.88, lng: 127.73 },
  { id: 'kr-ansan', name: '경기 안산', country: '대한민국', continent: 'korea', tz: 'Asia/Seoul' , lat: 37.32, lng: 126.83 },
  { id: 'vn-hcm-city', name: '베트남 호찌민', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 10.78, lng: 106.7 },
  { id: 'vn-hanoi-city', name: '베트남 하노이', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 21.03, lng: 105.85 },
  { id: 'no-trondheim', name: '노르웨이 트론헤임', country: '노르웨이', continent: 'europe', tz: 'Europe/Oslo' , lat: 63.43, lng: 10.4 },
  { id: 'us-sunnyvale', name: '미국 서니베일', country: '미국', continent: 'americas', tz: 'America/Los_Angeles' , lat: 37.37, lng: -122.04 },
  { id: 'us-virginia-beach', name: '미국 버지니아비치', country: '미국', continent: 'americas', tz: 'America/New_York' , lat: 36.85, lng: -75.98 },
  { id: 'us-edgewater', name: '미국 뉴저지', country: '미국', continent: 'americas', tz: 'America/New_York' , lat: 40.83, lng: -73.97 },
  { id: 'cl-escondida', name: '칠레 에스콘디다 광산', country: '칠레', continent: 'americas', tz: 'America/Santiago' , lat: -24.27, lng: -69.07 },

  // 아시아
  { id: 'cn', name: '중국', country: '중국', continent: 'asia', tz: 'Asia/Shanghai' , lat: 34.75, lng: 113.63 },
  { id: 'cn-zhejiang', name: '저장성', country: '중국', continent: 'asia', tz: 'Asia/Shanghai' , lat: 30.27, lng: 120.15 },
  { id: 'cn-shandong', name: '중국 산둥성', country: '중국', continent: 'asia', tz: 'Asia/Shanghai' , lat: 36.67, lng: 117.0 },
  { id: 'cn-qingdao', name: '칭다오 항구', country: '중국', continent: 'asia', tz: 'Asia/Shanghai' , lat: 36.07, lng: 120.38 },
  { id: 'vn-mekong', name: '메콩강 삼각주', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 10.03, lng: 105.78 },
  { id: 'vn', name: '베트남 공장 지대', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 21.18, lng: 106.07 },
  { id: 'vn-hcm', name: '호찌민 항구', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 10.77, lng: 106.7 },
  { id: 'vn-hanoi', name: '하노이 노이바이 공항', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 21.22, lng: 105.81 },
  { id: 'id', name: '인도네시아 수마트라', country: '인도네시아', continent: 'asia', tz: 'Asia/Jakarta' , lat: 0.51, lng: 101.45 },
  { id: 'ph-mindanao', name: '필리핀 민다나오', country: '필리핀', continent: 'asia', tz: 'Asia/Manila' , lat: 7.45, lng: 125.8 },
  { id: 'ph-davao', name: '다바오 항구', country: '필리핀', continent: 'asia', tz: 'Asia/Manila' , lat: 7.07, lng: 125.61 },
  { id: 'in-gujarat', name: '인도 구자라트', country: '인도', continent: 'asia', tz: 'Asia/Kolkata' , lat: 23.02, lng: 72.57 },
  { id: 'in', name: '인도', country: '인도', continent: 'asia', tz: 'Asia/Kolkata' , lat: 21.15, lng: 79.09 },
  { id: 'bd-dhaka', name: '방글라데시 다카', country: '방글라데시', continent: 'asia', tz: 'Asia/Dhaka' , lat: 23.81, lng: 90.41 },
  { id: 'bd-chittagong', name: '치타공 항구', country: '방글라데시', continent: 'asia', tz: 'Asia/Dhaka' , lat: 22.33, lng: 91.83 },
  { id: 'th-south', name: '태국 남부', country: '태국', continent: 'asia', tz: 'Asia/Bangkok' , lat: 7.01, lng: 100.47 },
  { id: 'th-laemchabang', name: '렘차방 항구', country: '태국', continent: 'asia', tz: 'Asia/Bangkok' , lat: 13.08, lng: 100.88 },
  { id: 'vn-daklak', name: '베트남 닥락', country: '베트남', continent: 'asia', tz: 'Asia/Ho_Chi_Minh' , lat: 12.67, lng: 108.04 },
  { id: 'my-penang', name: '말레이시아 페낭', country: '말레이시아', continent: 'asia', tz: 'Asia/Kuala_Lumpur' , lat: 5.41, lng: 100.33 },
  { id: 'sa', name: '사우디아라비아 유전', country: '사우디아라비아', continent: 'asia', tz: 'Asia/Riyadh' , lat: 25.43, lng: 49.62 },

  // 아프리카
  { id: 'et-sidama', name: '에티오피아 시다마', country: '에티오피아', continent: 'africa', tz: 'Africa/Addis_Ababa' , lat: 6.75, lng: 38.45 },
  { id: 'et-addis', name: '아디스아바바', country: '에티오피아', continent: 'africa', tz: 'Africa/Addis_Ababa' , lat: 9.03, lng: 38.74 },
  { id: 'dj', name: '지부티 항구', country: '지부티', continent: 'africa', tz: 'Africa/Djibouti' , lat: 11.59, lng: 43.15 },
  { id: 'ci', name: '코트디부아르 카카오 농장', country: '코트디부아르', continent: 'africa', tz: 'Africa/Abidjan' , lat: 6.88, lng: -6.45 },
  { id: 'ci-abidjan', name: '아비장 항구', country: '코트디부아르', continent: 'africa', tz: 'Africa/Abidjan' , lat: 5.32, lng: -4.02 },
  { id: 'gh-western', name: '가나 서부 주', country: '가나', continent: 'africa', tz: 'Africa/Accra' , lat: 6.2, lng: -2.5 },
  { id: 'gh-takoradi', name: '타코라디 항구', country: '가나', continent: 'africa', tz: 'Africa/Accra' , lat: 4.89, lng: -1.75 },
  { id: 'cd-katanga', name: '콩고민주공화국 카탕가', country: '콩고민주공화국', continent: 'africa', tz: 'Africa/Lubumbashi' , lat: -10.71, lng: 25.47 },

  // 유럽
  { id: 'nl-amsterdam', name: '암스테르담', country: '네덜란드', continent: 'europe', tz: 'Europe/Amsterdam' , lat: 52.37, lng: 4.9 },
  { id: 'nl-veldhoven', name: '펠트호번', country: '네덜란드', continent: 'europe', tz: 'Europe/Amsterdam' , lat: 51.42, lng: 5.4 },
  { id: 'no', name: '노르웨이 피오르', country: '노르웨이', continent: 'europe', tz: 'Europe/Oslo' , lat: 62.47, lng: 6.15 },
  { id: 'no-oslo', name: '오슬로 공항', country: '노르웨이', continent: 'europe', tz: 'Europe/Oslo' , lat: 60.19, lng: 11.1 },
  { id: 'es', name: '스페인 양돈 농장', country: '스페인', continent: 'europe', tz: 'Europe/Madrid' , lat: 41.62, lng: 0.62 },
  { id: 'es-valencia', name: '발렌시아 항구', country: '스페인', continent: 'europe', tz: 'Europe/Madrid' , lat: 39.45, lng: -0.32 },
  { id: 'no-svalbard', name: '스발바르 제도', country: '노르웨이', continent: 'europe', tz: 'Arctic/Longyearbyen' , lat: 78.24, lng: 15.45 },

  // 오세아니아
  { id: 'au', name: '호주', country: '호주', continent: 'oceania', tz: 'Australia/Melbourne' , lat: -37.81, lng: 144.96 },
  { id: 'au-qld', name: '호주 퀸즐랜드', country: '호주', continent: 'oceania', tz: 'Australia/Brisbane' , lat: -19.26, lng: 146.82 },
  { id: 'au-wa', name: '서호주', country: '호주', continent: 'oceania', tz: 'Australia/Perth' , lat: -23.36, lng: 119.73 },
  { id: 'nz', name: '뉴질랜드 조림지', country: '뉴질랜드', continent: 'oceania', tz: 'Pacific/Auckland' , lat: -38.14, lng: 176.25 },
  { id: 'nz-tauranga', name: '타우랑가 항구', country: '뉴질랜드', continent: 'oceania', tz: 'Pacific/Auckland' , lat: -37.64, lng: 176.18 },
  { id: 'au-hedland', name: '포트헤들랜드 항구', country: '호주', continent: 'oceania', tz: 'Australia/Perth' , lat: -20.31, lng: 118.58 },

  // 아메리카
  { id: 'us', name: '미국', country: '미국', continent: 'americas', tz: 'America/Chicago' , lat: 39.1, lng: -94.58 },
  { id: 'us-plains', name: '미국 대평원', country: '미국', continent: 'americas', tz: 'America/Chicago' , lat: 38.5, lng: -98.0 },
  { id: 'us-pnw', name: '미국 북서부 곡물항', country: '미국', continent: 'americas', tz: 'America/Los_Angeles' , lat: 45.52, lng: -122.68 },
  { id: 'us-midwest', name: '미국 중서부 옥수수 지대', country: '미국', continent: 'americas', tz: 'America/Chicago' , lat: 41.6, lng: -93.6 },
  { id: 'us-mississippi', name: '미시시피강', country: '미국', continent: 'americas', tz: 'America/Chicago' , lat: 38.63, lng: -90.2 },
  { id: 'us-nola', name: '뉴올리언스 곡물항', country: '미국', continent: 'americas', tz: 'America/Chicago' , lat: 29.95, lng: -90.07 },
  { id: 'br', name: '브라질 조림지', country: '브라질', continent: 'americas', tz: 'America/Campo_Grande' , lat: -20.75, lng: -51.68 },
  { id: 'br-sp', name: '브라질 상파울루주', country: '브라질', continent: 'americas', tz: 'America/Sao_Paulo' , lat: -21.79, lng: -48.18 },
  { id: 'br-mt', name: '브라질 마투그로수', country: '브라질', continent: 'americas', tz: 'America/Cuiaba' , lat: -12.55, lng: -55.71 },
  { id: 'br-santos', name: '산투스 항구', country: '브라질', continent: 'americas', tz: 'America/Sao_Paulo' , lat: -23.96, lng: -46.33 },
  { id: 'br-mg', name: '브라질 미나스제라이스', country: '브라질', continent: 'americas', tz: 'America/Sao_Paulo' , lat: -21.55, lng: -45.43 },
  { id: 'co-huila', name: '콜롬비아 우일라', country: '콜롬비아', continent: 'americas', tz: 'America/Bogota' , lat: 2.93, lng: -75.28 },
  { id: 'co-bogota', name: '콜롬비아 보고타', country: '콜롬비아', continent: 'americas', tz: 'America/Bogota' , lat: 4.71, lng: -74.07 },
  { id: 'co-buenaventura', name: '부에나벤투라 항구', country: '콜롬비아', continent: 'americas', tz: 'America/Bogota' , lat: 3.88, lng: -77.03 },
  { id: 'cl', name: '칠레', country: '칠레', continent: 'americas', tz: 'America/Santiago' , lat: -33.45, lng: -70.67 },
  { id: 'cl-atacama', name: '칠레 아타카마 사막', country: '칠레', continent: 'americas', tz: 'America/Santiago' , lat: -23.5, lng: -68.25 },

  // 바다
  { id: 'sea', name: '바다 위', country: '', continent: 'sea', tz: 'Indian/Maldives' },
  { id: 'pacific', name: '태평양', country: '', continent: 'sea', tz: 'Pacific/Tarawa' , lat: 0.0, lng: 170.0 },
  { id: 'sw-atlantic', name: '남서대서양', country: '', continent: 'sea', tz: 'Atlantic/Stanley' , lat: -48.0, lng: -60.0 },
]

export const PLACES: Record<string, Place> = Object.fromEntries(list.map((p) => [p.id, p]))
