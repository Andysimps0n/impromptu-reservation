'use client';

import { useCallback, useState } from 'react';
import { Badge, Button, ConfirmDialog, Dialog, IconButton, TextField } from '@/components/ui';
import { CameraIcon, CheckIcon, ChevronDownIcon } from '@/components/ui/icons';
import { QrScanner } from '@/components/shared/QrScanner';
import { won, objectParticle } from '@/lib/format';
import { BOOKING_STATUS_LABEL, STATUS_TONE, orderMeta } from '@/lib/status';
import s from './admin.module.css';

// ---------------------------------------------------------------------------------------------
// Order card with its actions (confirm payment, refund complete, retry SMS, cancel)
// ---------------------------------------------------------------------------------------------

const CONFIRM_COPY = {
  confirm: order => ({
    title: '입금을 확인했나요?',
    body: `${order.name}님 ${order.seats.join(', ')} · ${won(order.amount)}. 확인하면 티켓을 발급하고 문자를 보내요.`,
    label: '입금 확인하기',
  }),
  'refund-complete': () => ({ title: '환불 송금을 마쳤나요?', body: '실제로 송금한 뒤에 눌러주세요.', label: '환불 완료하기' }),
  'retry-sms': order => ({
    title: '문자를 다시 보낼까요?',
    body:
      order.notificationStatus === 'untracked'
        ? '이전 발송 기록이 없어요. 발송 내역에서 중복 문자가 없는지 먼저 확인해 주세요.'
        : '티켓 링크 문자를 한 번 더 보내요.',
    label: '문자 다시 보내기',
  }),
  cancel: order => ({
    title: '예약을 취소할까요?',
    body:
      order.status === 'paid'
        ? '환불 대기로 바꾸고 좌석은 바로 다시 열어요. 송금한 뒤에는 환불 완료를 눌러주세요.'
        : '예약을 취소하고 좌석을 바로 다시 열어요.',
    label: '예약 취소하기',
    danger: true,
  }),
};

export function OrderCard({ order, onAction }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const canCancel = ['pending', 'paid'].includes(order.status);
  const canRetrySms = order.status === 'paid' && ['failed', 'not_configured', 'untracked'].includes(order.notificationStatus);
  const copy = confirming && CONFIRM_COPY[confirming](order);
  return (
    <article className={`${s.order} ${open ? s.open : ''}`}>
      <div className={s.orderHead}>
        <div className={s.orderMain}>
          <span className={s.orderTitle}>
            <Badge tone={STATUS_TONE[order.status]}>{BOOKING_STATUS_LABEL[order.status]}</Badge>
            {order.name}
          </span>
          <span className={s.orderSub}>
            {order.seats.join(', ')} · <span className="num">{won(order.amount)}</span> · {order.code}
          </span>
        </div>
        <div className={s.orderSide}>
          {order.status === 'pending' && (
            <Button size="s" variant="secondary" onClick={() => setConfirming('confirm')}>
              입금 확인
            </Button>
          )}
          {order.status === 'refund_pending' && (
            <Button size="s" variant="secondary" onClick={() => setConfirming('refund-complete')}>
              환불 완료
            </Button>
          )}
          {canRetrySms && (
            <Button size="s" variant="ghost" onClick={() => setConfirming('retry-sms')}>
              문자 재전송
            </Button>
          )}
          <IconButton label={open ? '예약 상세 닫기' : '예약 상세 열기'} aria-expanded={open} onClick={() => setOpen(v => !v)}>
            <ChevronDownIcon size={20} className={s.chevron} />
          </IconButton>
        </div>
      </div>
      {open && (
        <div className={s.orderMeta}>
          <span>{orderMeta(order)}</span>
          <span>연락처 {order.phone}</span>
          {canCancel && (
            <Button size="s" variant="dangerGhost" onClick={() => setConfirming('cancel')}>
              예약 취소
            </Button>
          )}
        </div>
      )}
      {copy && (
        <ConfirmDialog
          title={copy.title}
          body={copy.body}
          confirmLabel={copy.label}
          danger={copy.danger}
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            await onAction(order.id, confirming);
            setConfirming(null);
          }}
        />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------------------------
// Name search over the loaded bookings
// ---------------------------------------------------------------------------------------------

export function OrderSearchDialog({ orders, onClose }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = q ? orders.filter(o => o.name.toLowerCase().includes(q) || o.code.includes(query.trim())) : [];
  return (
    <Dialog title="예약 검색" onClose={onClose}>
      <TextField
        autoFocus
        placeholder="예매자 이름 또는 예약 코드"
        value={query}
        help="이 회차에서 불러온 예약 안에서 찾아요."
        onChange={e => setQuery(e.target.value)}
      />
      {q ? (
        results.length ? (
          <ul className={s.results}>
            {results.map(o => (
              <li key={o.id}>
                <span>
                  <Badge tone={STATUS_TONE[o.status]}>{BOOKING_STATUS_LABEL[o.status]}</Badge> <strong>{o.name}</strong>
                </span>
                <span>
                  {o.seats.join(', ')} · {won(o.amount)}
                </span>
                <small>{orderMeta(o)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.empty}>일치하는 예약이 없어요</p>
        )
      ) : (
        <p className={s.empty}>이름을 입력하면 예약이 여기에 보여요</p>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
// Seat → booking details
// ---------------------------------------------------------------------------------------------

export function SeatOrderDialog({ seat, order, onClose }) {
  return (
    <Dialog title={`${seat} 좌석 예약`} onClose={onClose}>
      <dl className={s.infoList}>
        <div>
          <dt>예매자</dt>
          <dd>{order.name}</dd>
        </div>
        <div>
          <dt>예약 코드</dt>
          <dd>{order.code}</dd>
        </div>
        <div>
          <dt>관리번호</dt>
          <dd>{order.id}</dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>{order.phone}</dd>
        </div>
        <div>
          <dt>입금자명</dt>
          <dd>{order.payer}</dd>
        </div>
        <div>
          <dt>좌석</dt>
          <dd>{order.seats.join(', ')}</dd>
        </div>
        <div>
          <dt>금액</dt>
          <dd className="num">{won(order.amount)}</dd>
        </div>
        <div>
          <dt>상태</dt>
          <dd>
            <Badge tone={STATUS_TONE[order.status]}>{BOOKING_STATUS_LABEL[order.status]}</Badge>
          </dd>
        </div>
      </dl>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
// Delete event (type the title to confirm)
// ---------------------------------------------------------------------------------------------

export function DeleteEventDialog({ event, onClose, onDelete }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const title = event?.title || '';
  return (
    <Dialog title="공연과 기록을 영구 삭제할까요?" onClose={onClose} dismissible={false}>
      <div className={s.stack}>
        <p className={s.note}>{title}와 연결된 회차·예약·티켓·입장 기록을 모두 지워요. 지우면 되돌릴 수 없어요.</p>
        <TextField
          label={`삭제하려면 "${title}"${objectParticle(title)} 입력해 주세요`}
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <Button
          variant="danger"
          size="l"
          full
          loading={busy}
          disabled={value !== title}
          onClick={async () => {
            setBusy(true);
            await onDelete(event.id, value);
            setBusy(false);
          }}
        >
          영구 삭제하기
        </Button>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
// Check-in: camera scan or manual code
// ---------------------------------------------------------------------------------------------

export function CheckinPanel({ onCheckIn, sessionLabel }) {
  const [value, setValue] = useState('');
  const [camera, setCamera] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async code => {
      if (!code.trim()) return;
      setBusy(true);
      setError('');
      setResult(null);
      try {
        setResult(await onCheckIn(code));
        setValue('');
      } catch (problem) {
        setError(problem.message);
      }
      setBusy(false);
    },
    [onCheckIn]
  );
  const onScan = useCallback(
    text => {
      setCamera(false);
      submit(text);
    },
    [submit]
  );
  const onCameraError = useCallback(message => {
    setCamera(false);
    setError(message);
  }, []);

  return (
    <div className={s.stack}>
      <p className={s.note}>
        {sessionLabel} 티켓 QR을 스캔해 주세요. 카메라를 쓸 수 없으면 티켓 코드나 &quot;예약코드:좌석&quot;을 입력할 수 있어요.
      </p>
      {camera ? (
        <>
          <QrScanner onScan={onScan} onError={onCameraError} />
          <Button variant="secondary" full onClick={() => setCamera(false)}>
            카메라 끄기
          </Button>
        </>
      ) : (
        <Button variant="secondary" full onClick={() => setCamera(true)}>
          <CameraIcon size={20} /> 카메라로 QR 스캔하기
        </Button>
      )}
      <form
        className={s.inline}
        onSubmit={e => {
          e.preventDefault();
          submit(value);
        }}
      >
        <TextField aria-label="티켓 코드" placeholder="티켓 코드 또는 든든919:B01" value={value} onChange={e => setValue(e.target.value)} />
        <Button type="submit" variant="primary" size="l" loading={busy} disabled={!value.trim()}>
          입장 처리
        </Button>
      </form>
      {error && (
        <p className={s.checkinError} role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className={s.checkinResult} role="status">
          <CheckIcon size={18} /> 입장 확인했어요 · {result.name} · {result.seat}
        </p>
      )}
    </div>
  );
}
