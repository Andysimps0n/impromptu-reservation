'use client';

import { Suspense } from 'react';
import { Badge, BottomCTA, Button, ListRow, StepIndicator, TextField, Loader } from '@/components/ui';
import { TicketQr, TicketState } from '@/components/shared/TicketQr';
import { BookingTabs, Footer, TopBar } from '@/features/v2/Chrome';
import { useLookup } from '@/hooks/useLookup';
import { formatPhoneInput, won } from '@/lib/format';
import { ROADMAP_STEPS, STATUS_TEXT, STATUS_TONE } from '@/lib/status';
import s from '@/features/v2/v2.module.css';

function Lookup() {
  const l = useLookup();
  const b = l.booking;
  return (
    <div className={s.withCta}>
      <TopBar title="예약 조회" back="/v2">
        <BookingTabs />
      </TopBar>

      <form id="lookup" onSubmit={l.submit} className={`${s.section} ${s.stack}`}>
        <div>
          <h2 className={s.h2} style={{ marginBottom: 4 }}>
            예약 코드와 연락처를 넣어주세요
          </h2>
          <p className={s.caption}>예매할 때 받은 코드와 입력한 연락처예요.</p>
        </div>
        <TextField label="예약 코드" required placeholder="예: 든든919" value={l.code} onChange={e => l.setCode(e.target.value)} />
        <TextField
          label="연락처"
          type="tel"
          inputMode="numeric"
          required
          maxLength={13}
          placeholder="010-1234-5678"
          value={l.phone}
          onChange={e => l.setPhone(formatPhoneInput(e.target.value))}
        />
        {l.error && (
          <p className={s.formError} role="alert">
            {l.error}
          </p>
        )}
      </form>

      {b && (
        <>
          <div className={s.divider} />
          <section className={`${s.section} ${s.stack}`} aria-live="polite">
            <div className={s.statusCard}>
              <Badge tone={STATUS_TONE[b.status]}>{STATUS_TEXT[b.status]}</Badge>
              <p>{l.progress.hint}</p>
            </div>
            <div className={s.rows}>
              <ListRow title="회차" right={`${b.showNumber}공 · ${b.dateLabel} ${b.timeLabel}`} />
              <ListRow title="좌석" right={b.seats.join(', ')} />
              <ListRow title="금액" right={<span className="num">{won(b.amount)}</span>} />
              <ListRow title="예매자 · 입금자" right={`${b.name} · ${b.payer}`} />
              <ListRow title="예약 코드" right={b.code} />
            </div>
          </section>
          {b.status === 'paid' && (
            <>
              <div className={s.divider} />
              <section className={s.section}>
                <h2 className={s.h2} style={{ marginBottom: 4 }}>
                  입장 QR 티켓
                </h2>
                <p className={s.caption} style={{ marginBottom: 16 }}>
                  입장할 때 좌석별 QR을 운영진에게 보여주세요.
                </p>
                {b.tickets.length ? (
                  <div className={s.ticketStrip}>
                    {b.tickets.map(ticket => (
                      <article className={s.ticketCard} key={ticket.id}>
                        <TicketQr ticket={ticket} size={168} />
                        <strong>{ticket.seat} 좌석</strong>
                        <TicketState ticket={ticket} />
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={s.body}>티켓을 준비하고 있어요. 잠시 후 다시 조회해 주세요.</p>
                )}
              </section>
            </>
          )}
        </>
      )}

      <div className={s.divider} />
      <section className={`${s.section} ${s.stack}`}>
        <h2 className={s.h2} style={{ margin: 0 }}>
          입장까지 과정
        </h2>
        <StepIndicator steps={ROADMAP_STEPS} progress={l.progress} label="입장까지 과정" />
        {!b && <p className={s.caption}>{l.progress.hint}</p>}
      </section>
      <Footer />

      <BottomCTA>
        <Button type="submit" form="lookup" size="xl" full loading={l.busy} disabled={!l.code.trim() || !l.phone.trim()}>
          {b ? '다시 조회하기' : '조회하기'}
        </Button>
      </BottomCTA>
    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Lookup />
    </Suspense>
  );
}
