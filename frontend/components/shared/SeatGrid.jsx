'use client';

import { SEAT_ROWS, seatCount, seatId } from '@/lib/seats';
import s from './SeatGrid.module.css';

const AUDIENCE_LABEL = {
  available: '선택 가능',
  selected: '선택됨',
  sold: '예매 완료',
  held: '입금 대기',
  refund_pending: '환불 처리 중',
  reserved: '운영진 보유석, 예매 불가',
};

const ADMIN_LABEL = {
  available: '빈 좌석',
  held: '입금 대기',
  sold: '입금 확인',
  checked_in: '입장 완료',
  reserved: '운영진 보유석',
};

// Column on a 12-seat grid; the 8-seat L row sits on columns 2–5 and 8–11 so the aisle lines up.
const columnOf = (row, n) => {
  const index = seatCount(row) === 8 ? (n <= 4 ? n + 1 : n + 3) : n;
  return 1 + index + (index > 6 ? 1 : 0);
};

/**
 * stateOf(seat) → available | selected | sold | held | refund_pending | reserved | checked_in
 * isEnabled(seat, state) decides whether the button can be pressed.
 * mode: 'audience' colors only selection in brand blue; 'admin' colors booking status.
 */
export function SeatGrid({ stateOf, onSeat, isEnabled, mode = 'audience', stage = true, dim = false }) {
  const labels = mode === 'admin' ? ADMIN_LABEL : AUDIENCE_LABEL;
  return (
    <div className={s.wrap}>
      {stage && (
        <div className={s.stage} aria-hidden="true">
          무대
        </div>
      )}
      <div className={`${s.grid} ${dim ? s.dim : ''}`} data-mode={mode}>
        {SEAT_ROWS.map(row => (
          <div className={s.row} key={row} role="group" aria-label={`${row}열`}>
            <span className={s.rowLabel} aria-hidden="true">
              {row}
            </span>
            {Array.from({ length: seatCount(row) }, (_, i) => {
              const seat = seatId(row, i + 1);
              const state = stateOf(seat);
              const enabled = isEnabled(seat, state);
              return (
                <button
                  key={seat}
                  type="button"
                  className={s.seat}
                  data-state={state}
                  style={{ gridColumn: columnOf(row, i + 1) }}
                  disabled={!enabled}
                  aria-pressed={mode === 'audience' && state === 'selected' ? true : undefined}
                  aria-label={`${row}열 ${i + 1}번 ${labels[state] || ''}`}
                  title={`${row}열 ${i + 1}번 · ${labels[state] || ''}`}
                  onClick={() => onSeat(seat, state)}
                >
                  {String(i + 1).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const LEGENDS = {
  audience: ['available', 'selected', 'held', 'sold', 'reserved'],
  admin: ['held', 'sold', 'checked_in', 'reserved'],
};

export function SeatLegend({ mode = 'audience' }) {
  const labels = mode === 'admin' ? ADMIN_LABEL : AUDIENCE_LABEL;
  return (
    <ul className={s.legend} data-mode={mode}>
      {LEGENDS[mode].map(state => (
        <li key={state}>
          <i className={s.swatch} data-state={state} />
          {state === 'reserved' ? '운영진 보유석' : labels[state]}
        </li>
      ))}
    </ul>
  );
}
