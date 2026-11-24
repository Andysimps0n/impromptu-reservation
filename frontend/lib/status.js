// Booking lifecycle labels and the 5-step "입장까지 과정" roadmap.

/** Audience-facing status text */
export const STATUS_TEXT = {
  paid: '입금 확인 · 예매 확정',
  pending: '입금 대기',
  expired: '예약 만료',
  cancelled: '취소됨 · 입금 전 예약',
  refund_pending: '취소 접수 · 환불 처리 중',
  refunded: '환불 완료',
};

/** Admin-facing short labels */
export const BOOKING_STATUS_LABEL = {
  pending: '입금 대기',
  paid: '입금 확인',
  refund_pending: '환불 대기',
  refunded: '환불 완료',
  cancelled: '취소됨',
  expired: '만료',
};

/** Badge tone per status (see ui Badge) */
export const STATUS_TONE = {
  pending: 'orange',
  paid: 'blue',
  refund_pending: 'red',
  refunded: 'grey',
  cancelled: 'grey',
  expired: 'grey',
};

export const EVENT_STATUS_LABEL = {
  draft: '초안',
  published: '게시 중',
  archived: '보관',
  cancelled: '취소됨',
};

export const SMS_STATUS_LABEL = {
  sending: '처리 중',
  accepted: '발송 접수',
  failed: '실패',
  uncertain: '확인 필요',
  not_configured: '설정 필요',
  untracked: '기록 없음',
};

export const ORDER_FILTERS = [
  { status: 'pending', label: '입금 대기' },
  { status: 'paid', label: '입금 완료' },
  { status: 'refund_pending', label: '환불 대기' },
  { status: 'expired', label: '만료' },
];

export const ROADMAP_STEPS = ['좌석 선택', '입금', '입금 확인', '입장권 발급', 'QR 스캔 후 입장'];

const HALTED = {
  expired: { doneUntil: 1, hint: '입금 시간이 지나 예약이 만료됐어요. 이 예약으로는 입장할 수 없어요.' },
  cancelled: { doneUntil: 1, hint: '입금 전에 취소된 예약이에요. 이 예약으로는 입장할 수 없어요.' },
  refund_pending: { doneUntil: 3, hint: '환불을 처리하고 있어요. 이 예약으로는 입장할 수 없어요.' },
  refunded: { doneUntil: 3, hint: '환불이 완료됐어요. 이 예약으로는 입장할 수 없어요.' },
};

/** Where a booking is on the roadmap. Steps are 1-based; current 0 = none. */
export function roadmapProgress(status) {
  if (status === 'pending')
    return {
      current: 2,
      doneUntil: 1,
      halted: false,
      hint: '좌석은 잡아 두었어요. 입금 메모에 예약 코드와 이름을 적어주세요. 이미 입금했다면 운영진 확인을 기다려 주세요.',
    };
  if (status === 'paid')
    return {
      current: 5,
      doneUntil: 4,
      halted: false,
      hint: '입금이 확인되고 입장권이 준비됐어요. 공연 당일 QR을 보여주면 입장할 수 있어요.',
    };
  if (HALTED[status]) return { current: 0, halted: true, ...HALTED[status] };
  return {
    current: 0,
    doneUntil: 0,
    halted: false,
    hint: '예약을 조회하면 지금 어느 단계인지, 다음에 무엇을 하면 되는지 알려드려요.',
  };
}

export function orderMeta(order) {
  const sms = SMS_STATUS_LABEL[order.notificationStatus] || '없음';
  const code = order.code && order.code !== order.id ? `${order.code} (${order.id})` : order.id;
  return `${code} · ${new Date(order.createdAt).toLocaleString('ko-KR')} · 입금자 ${order.payer} · 문자 ${sms}`;
}
