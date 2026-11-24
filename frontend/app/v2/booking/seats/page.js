'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomCTA, Button, Chip, IconButton, ListRow, Loader, SegmentedControl, Toast } from '@/components/ui';
import { CheckIcon, CopyIcon, RefreshIcon, XIcon } from '@/components/ui/icons';
import { SeatGrid, SeatLegend } from '@/components/shared/SeatGrid';
import { AccountBox, BookingForm } from '@/components/shared/BookingForm';
import { BookingTabs, TopBar } from '@/features/v2/Chrome';
import { seatNotice, useSeatBooking } from '@/hooks/useSeatBooking';
import { HOLD_MINUTES } from '@/lib/content';
import { compactWhen, copyText, shortDate, won } from '@/lib/format';
import { MAX_SELECTED_SEATS } from '@/lib/seats';
import s from '@/features/v2/v2.module.css';

// One page, three steps: pick seats → enter details → done. Each step has a single bottom action.
export default function SeatsFlow() {
  const b = useSeatBooking();
  const router = useRouter();
  const [step, setStep] = useState('seats');
  const [done, setDone] = useState(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  if (step === 'form')
    return (
      <div className={s.withCta}>
        <TopBar title="예매자 정보" back={() => setStep('seats')} />
        <section className={`${s.section} ${s.stack}`}>
          <div className={s.summaryCard}>
            <span className={s.caption}>
              {b.session?.sortOrder}공 · {b.session?.dateLabel} {b.session?.timeLabel}
            </span>
            <strong>{b.selected.join(', ')}</strong>
            <span className={s.amount}>{won(b.selected.length * b.price)}</span>
          </div>
          <div className={s.stack} style={{ gap: 8 }}>
            <h2 className={s.h2} style={{ margin: 0 }}>
              입금 계좌
            </h2>
            <AccountBox onCopied={(message, error) => b.notify(message, { error })} />
            <p className={s.caption}>예약 후 {HOLD_MINUTES}분 안에 입금해 주세요. 시간이 지나면 좌석이 다시 열려요.</p>
          </div>
        </section>
        <div className={s.divider} />
        <section className={s.section}>
          <BookingForm
            onSubmit={async form => {
              setDone(await b.submit(form));
              setStep('done');
            }}
            renderSubmit={({ busy, disabled }) => (
              <BottomCTA>
                <Button type="submit" size="xl" full loading={busy} disabled={disabled}>
                  입금 대기 예약하기
                </Button>
              </BottomCTA>
            )}
          />
        </section>
        <Toast toast={b.toast} />
      </div>
    );

  if (step === 'done' && done)
    return (
      <div className={s.withCta}>
        <TopBar title="예약 완료" />
        <section className={s.result}>
          <span className={s.resultIcon}>
            <CheckIcon size={34} strokeWidth="2.4" />
          </span>
          <h1 className={s.h1} style={{ fontSize: 24 }}>
            입금 대기 예약을 등록했어요
          </h1>
          <p className={s.body}>입금 메모에 아래 예약 코드와 이름을 적어주세요.</p>
          <div className={s.code}>
            {done.booking.code}
            <IconButton
              label="예약 코드 복사"
              onClick={async () => {
                const ok = await copyText(done.booking.code);
                b.notify(ok ? '예약 코드를 복사했어요' : '복사하지 못했어요. 코드를 길게 눌러 복사해 주세요.', { error: !ok });
              }}
            >
              <CopyIcon size={20} />
            </IconButton>
          </div>
        </section>
        <section className={s.section}>
          <div className={s.rows}>
            <ListRow title="회차" right={`${done.session?.sortOrder}공 · ${shortDate(done.session)} ${done.session?.timeLabel}`} />
            <ListRow title="좌석" right={done.booking.seats.join(', ')} />
            <ListRow title="입금할 금액" right={<span className="num">{won(done.booking.amount)}</span>} />
            <ListRow title="입금 기한" right={`지금부터 ${HOLD_MINUTES}분 안`} />
          </div>
          <div style={{ marginTop: 16 }}>
            <AccountBox onCopied={(message, error) => b.notify(message, { error })} />
          </div>
          <p className={s.caption} style={{ marginTop: 16 }}>
            입금이 확인되면 입력한 연락처로 입장 티켓 링크를 문자로 한 번 보내드려요.
          </p>
        </section>
        <BottomCTA>
          <Button size="xl" full onClick={() => router.push(`/v2/booking/lookup?code=${encodeURIComponent(done.booking.code)}`)}>
            예약 정보 보기
          </Button>
        </BottomCTA>
        <Toast toast={b.toast} />
      </div>
    );

  const notice = seatNotice(b);
  const sessions = b.event?.sessions || [];
  const canBook = b.selected.length > 0 && b.bookingOpen;
  return (
    <div className={s.withCta}>
      <TopBar
        title="좌석 예매"
        back="/v2"
        right={
          <IconButton label="좌석 현황 새로고침" spinning={b.refreshing} disabled={!b.showId || b.refreshing} onClick={b.reloadSeats}>
            <RefreshIcon size={22} />
          </IconButton>
        }
      >
        <BookingTabs />
      </TopBar>

      {b.event === undefined ? (
        <Loader label="공연 정보를 불러오는 중" />
      ) : (
        <section className={`${s.section} ${s.stack}`}>
          {sessions.length > 0 && (
            <SegmentedControl
              label="공연 회차"
              value={b.showId}
              onChange={b.chooseSession}
              options={sessions.map(x => ({ value: x.id, label: `${x.sortOrder}공`, sub: compactWhen(x) }))}
            />
          )}
          {notice && (
            <div className={s.notice} role="status">
              <strong>{notice.title}</strong>
              <span>{notice.body}</span>
              {notice.retry && (
                <Button variant="secondary" size="s" onClick={b.retry}>
                  다시 시도하기
                </Button>
              )}
            </div>
          )}
          <div style={{ paddingTop: 8 }}>
            <SeatGrid
              stateOf={b.stateOf}
              isEnabled={(seat, state) => b.bookingOpen && (state === 'available' || state === 'selected')}
              onSeat={b.toggleSeat}
              dim={!b.seatData}
            />
            <SeatLegend />
          </div>
          {b.selected.length > 0 && (
            <div className={s.picked} aria-label="고른 좌석">
              {b.selected.map(seat => (
                <Chip key={seat} brand aria-label={`${seat} 선택 취소`} onClick={() => b.toggleSeat(seat)}>
                  {seat}&nbsp;
                  <XIcon size={14} />
                </Chip>
              ))}
            </div>
          )}
        </section>
      )}

      <BottomCTA info={b.selected.length ? undefined : `회차당 최대 ${MAX_SELECTED_SEATS}석까지 고를 수 있어요`}>
        {b.selected.length > 0 && (
          <p className={s.ctaRow}>
            <span>{b.selected.length}석</span>
            <span className="num">{won(b.selected.length * b.price)}</span>
          </p>
        )}
        <Button size="xl" full disabled={!canBook} onClick={() => setStep('form')}>
          {!b.bookingOpen && b.seatData ? '지금은 예매를 받지 않아요' : b.selected.length ? '다음' : '좌석을 골라주세요'}
        </Button>
      </BottomCTA>
      <Toast toast={b.toast} />
    </div>
  );
}
