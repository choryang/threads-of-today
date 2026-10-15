import type { TransportKind } from '../../shared/data/transport'

/** 오고 있는 물건의 운송 수단 아이콘 (viewBox 0 0 40 40, 캐릭터와 같은 외곽선) */
const LINE = 'stroke="#F3F1EA" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'

export const TRANSPORT_ICON: Record<TransportKind, string> = {
  ship: `<path d="M5 25h30l-4 8H9z" fill="none" ${LINE}/><rect x="11" y="15" width="7" height="10" fill="#F2C14E" ${LINE}/><rect x="18" y="15" width="7" height="10" fill="#7FC3DE" ${LINE}/><rect x="15" y="7" width="7" height="8" fill="#E0705F" ${LINE}/>`,
  air: `<path d="M20 5c2 0 3 2 3 4v8l12 6v3l-12-3v7l4 3v2l-7-2-7 2v-2l4-3v-7L5 26v-3l12-6V9c0-2 1-4 3-4z" fill="#7FC3DE" ${LINE}/>`,
  truck: `<rect x="4" y="12" width="20" height="14" rx="2" fill="#F2C14E" ${LINE}/><path d="M24 16h7l5 6v4H24z" fill="#7FC3DE" ${LINE}/><circle cx="11" cy="29" r="3.5" fill="#2A2A35" ${LINE}/><circle cx="29" cy="29" r="3.5" fill="#2A2A35" ${LINE}/>`,
}
