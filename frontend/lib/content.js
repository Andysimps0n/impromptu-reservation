// Fixed site content shared by both versions.

export const SITE_NAME = '즉흥적 새벽 두 시';
export const SITE_NAME_EN = 'IMPROMPTU__2AM';
export const ACCOUNT_BANK = '카카오뱅크';
export const ACCOUNT_NUMBER = '3333376900284';
export const OPEN_CHAT_URL = 'https://open.kakao.com/o/sMDbKDUi';
export const INSTAGRAM_URL = 'https://instagram.com/impromptu__2am';
export const INSTAGRAM_HANDLE = '@impromptu__2am';
export const HOLD_MINUTES = 30;

export const FAQ_ITEMS = [
  {
    q: '한 번에 몇 석까지 예매할 수 있나요?',
    a: '한 번에 최대 4석까지 신청할 수 있어요. 같은 연락처로는 회차마다 최대 4석까지 예매할 수 있어요.',
  },
  {
    q: '입금은 언제까지 해야 하나요?',
    a: '예약 후 30분 안에 입금해 주셔야 해요. 시간이 지나면 예약이 만료되고 좌석이 다시 열려요. 입금이 확인되면 문자로 알려드려요.',
  },
  {
    q: '입금할 때 무엇을 적어야 하나요?',
    a: '카카오뱅크 3333376900284로 입금해 주세요. 입금 메모에 예약 코드와 예매자 이름을 적어 주세요. 다른 분이 대신 입금해도 괜찮아요. 예매할 때 입금자명을 따로 입력할 수 있어요.',
  },
  {
    q: '입장권(QR)은 어떻게 받나요?',
    a: '입금이 확인되면 예약 조회에서 좌석별 QR 티켓을 볼 수 있어요. 문자로도 티켓 링크를 보내드려요. 공연 당일 입장할 때 좌석별 QR을 운영진에게 보여주세요.',
  },
  {
    q: '예매를 취소하거나 환불받고 싶어요.',
    a: '예약 페이지에서 직접 취소할 수는 없어요. 문의하기 버튼으로 연락해 주시면 취소와 환불을 도와드릴게요. 입금 후 취소하면 환불 절차를 거쳐 송금해 드려요.',
  },
];

export const PRIVACY_CONSENT_REASON =
  '이름과 연락처는 예약을 찾고 티켓 안내 문자를 보내는 데 써요. 입금자명은 입금한 분과 예약을 맞추기 위해 받아요.';

export const AUTH_ERROR_TEXT = {
  kakao_not_configured: '카카오 로그인 설정이 아직 끝나지 않았어요. 운영진에게 알려주세요.',
  state_mismatch: '로그인 요청을 확인하지 못했어요. 다시 시도해 주세요.',
  kakao_denied: '카카오 로그인을 취소했어요.',
  kakao_failed: '카카오 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
  not_admin: '이 카카오 계정은 운영진으로 등록되어 있지 않아요.',
  rate_limited: '로그인 시도가 많아요. 10분 뒤 다시 시도해 주세요.',
};
