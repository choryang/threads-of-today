import type { Place } from '../types'

const list: Place[] = [
  // 대한민국
  { id: 'kr', name: '대한민국', country: '대한민국', continent: 'korea' },
  { id: 'kr-seoul', name: '서울', country: '대한민국', continent: 'korea' },
  { id: 'kr-busan', name: '부산항', country: '대한민국', continent: 'korea' },
  { id: 'kr-incheon', name: '인천공항', country: '대한민국', continent: 'korea' },
  { id: 'kr-ulsan', name: '울산', country: '대한민국', continent: 'korea' },
  { id: 'kr-yeosu', name: '여수', country: '대한민국', continent: 'korea' },
  { id: 'kr-pohang', name: '포항', country: '대한민국', continent: 'korea' },
  { id: 'kr-gyeonggi', name: '경기도', country: '대한민국', continent: 'korea' },
  { id: 'kr-chungbuk', name: '충청북도', country: '대한민국', continent: 'korea' },
  { id: 'kr-jeonbuk', name: '전북특별자치도', country: '대한민국', continent: 'korea' },
  { id: 'kr-jeonnam', name: '전라남도 바닷가', country: '대한민국', continent: 'korea' },
  { id: 'kr-gyeongnam', name: '경상남도', country: '대한민국', continent: 'korea' },
  { id: 'kr-gangwon', name: '강원도 고랭지', country: '대한민국', continent: 'korea' },
  { id: 'kr-incheon-port', name: '인천항', country: '대한민국', continent: 'korea' },
  { id: 'kr-boseong', name: '전남 보성', country: '대한민국', continent: 'korea' },
  { id: 'kr-gwangju', name: '광주', country: '대한민국', continent: 'korea' },

  // 아시아
  { id: 'cn', name: '중국', country: '중국', continent: 'asia' },
  { id: 'cn-zhejiang', name: '저장성', country: '중국', continent: 'asia' },
  { id: 'cn-shandong', name: '중국 산둥성', country: '중국', continent: 'asia' },
  { id: 'cn-qingdao', name: '칭다오 항구', country: '중국', continent: 'asia' },
  { id: 'vn-mekong', name: '메콩강 삼각주', country: '베트남', continent: 'asia' },
  { id: 'vn', name: '베트남 공장 지대', country: '베트남', continent: 'asia' },
  { id: 'vn-hcm', name: '호찌민 항구', country: '베트남', continent: 'asia' },
  { id: 'vn-hanoi', name: '하노이 노이바이 공항', country: '베트남', continent: 'asia' },
  { id: 'id', name: '인도네시아 수마트라', country: '인도네시아', continent: 'asia' },
  { id: 'ph-mindanao', name: '필리핀 민다나오', country: '필리핀', continent: 'asia' },
  { id: 'ph-davao', name: '다바오 항구', country: '필리핀', continent: 'asia' },
  { id: 'in-gujarat', name: '인도 구자라트', country: '인도', continent: 'asia' },
  { id: 'in', name: '인도', country: '인도', continent: 'asia' },
  { id: 'bd-dhaka', name: '방글라데시 다카', country: '방글라데시', continent: 'asia' },
  { id: 'bd-chittagong', name: '치타공 항구', country: '방글라데시', continent: 'asia' },
  { id: 'th-south', name: '태국 남부', country: '태국', continent: 'asia' },
  { id: 'th-laemchabang', name: '렘차방 항구', country: '태국', continent: 'asia' },
  { id: 'my-penang', name: '말레이시아 페낭', country: '말레이시아', continent: 'asia' },
  { id: 'sa', name: '사우디아라비아 유전', country: '사우디아라비아', continent: 'asia' },

  // 아프리카
  { id: 'et-sidama', name: '에티오피아 시다마', country: '에티오피아', continent: 'africa' },
  { id: 'et-addis', name: '아디스아바바', country: '에티오피아', continent: 'africa' },
  { id: 'dj', name: '지부티 항구', country: '지부티', continent: 'africa' },
  { id: 'ci', name: '코트디부아르 카카오 농장', country: '코트디부아르', continent: 'africa' },
  { id: 'ci-abidjan', name: '아비장 항구', country: '코트디부아르', continent: 'africa' },
  { id: 'cd-katanga', name: '콩고민주공화국 카탕가', country: '콩고민주공화국', continent: 'africa' },

  // 유럽
  { id: 'nl-amsterdam', name: '암스테르담', country: '네덜란드', continent: 'europe' },
  { id: 'nl-veldhoven', name: '펠트호번', country: '네덜란드', continent: 'europe' },
  { id: 'no', name: '노르웨이 피오르', country: '노르웨이', continent: 'europe' },
  { id: 'no-oslo', name: '오슬로 공항', country: '노르웨이', continent: 'europe' },
  { id: 'es', name: '스페인 양돈 농장', country: '스페인', continent: 'europe' },
  { id: 'es-valencia', name: '발렌시아 항구', country: '스페인', continent: 'europe' },
  { id: 'no-svalbard', name: '스발바르 제도', country: '노르웨이', continent: 'europe' },

  // 오세아니아
  { id: 'au-qld', name: '호주 퀸즐랜드', country: '호주', continent: 'oceania' },
  { id: 'au-wa', name: '서호주', country: '호주', continent: 'oceania' },
  { id: 'nz', name: '뉴질랜드 조림지', country: '뉴질랜드', continent: 'oceania' },
  { id: 'nz-tauranga', name: '타우랑가 항구', country: '뉴질랜드', continent: 'oceania' },
  { id: 'au-hedland', name: '포트헤들랜드 항구', country: '호주', continent: 'oceania' },

  // 아메리카
  { id: 'us-plains', name: '미국 대평원', country: '미국', continent: 'americas' },
  { id: 'us-pnw', name: '미국 북서부 곡물항', country: '미국', continent: 'americas' },
  { id: 'us-midwest', name: '미국 중서부 옥수수 지대', country: '미국', continent: 'americas' },
  { id: 'us-mississippi', name: '미시시피강', country: '미국', continent: 'americas' },
  { id: 'us-nola', name: '뉴올리언스 곡물항', country: '미국', continent: 'americas' },
  { id: 'br', name: '브라질 조림지', country: '브라질', continent: 'americas' },
  { id: 'br-sp', name: '브라질 상파울루주', country: '브라질', continent: 'americas' },
  { id: 'br-mt', name: '브라질 마투그로수', country: '브라질', continent: 'americas' },
  { id: 'br-santos', name: '산투스 항구', country: '브라질', continent: 'americas' },
  { id: 'cl-atacama', name: '칠레 아타카마 사막', country: '칠레', continent: 'americas' },

  // 바다
  { id: 'sea', name: '바다 위', country: '', continent: 'sea' },
  { id: 'pacific', name: '태평양', country: '', continent: 'sea' },
]

export const PLACES: Record<string, Place> = Object.fromEntries(list.map((p) => [p.id, p]))
