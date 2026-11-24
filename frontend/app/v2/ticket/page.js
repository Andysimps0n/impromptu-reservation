'use client';

import { useState } from 'react';
import { BottomCTA, Button, Loader, SegmentedControl } from '@/components/ui';
import { TicketQr, TicketState } from '@/components/shared/TicketQr';
import { TopBar } from '@/features/v2/Chrome';
import { useTicketLink } from '@/hooks/useTicketLink';
import s from '@/features/v2/v2.module.css';

export default function TicketPage() {
  const result = useTicketLink();
  const [seat, setSeat] = useState('');
  const data = result.data;
  const ticket = data?.tickets.find(t => t.seat === seat) || data?.tickets[0];

  if (result.loading)
    return (
      <>
        <TopBar title="입장 티켓" />
        <Loader label="티켓을 불러오는 중" />
      </>
    );

  if (!ticket)
    return (
      <div className={s.withCta}>
        <TopBar title="입장 티켓" />
        <section className={s.result}>
          <h1 className={s.h1} style={{ fontSize: 24 }}>
            QR 링크를 열 수 없어요
          </h1>
          <p className={s.body}>{result.error || '이 예약의 QR 티켓을 찾지 못했어요.'}</p>
          <p className={s.caption}>예약이 취소됐거나 링크에 문제가 있다면 공연 계정으로 문의해 주세요.</p>
        </section>
        <BottomCTA>
          <Button size="xl" full href="/v2/booking/lookup">
            예약 조회하기
          </Button>
        </BottomCTA>
      </div>
    );

  return (
    <>
      <TopBar title="입장 티켓" />
      {data.tickets.length > 1 && (
        <section className={s.section} style={{ paddingBottom: 0 }}>
          <SegmentedControl label="좌석" value={ticket.seat} onChange={setSeat} options={data.tickets.map(t => ({ value: t.seat, label: t.seat }))} />
        </section>
      )}
      <article className={s.ticket}>
        <div className={s.ticketTop}>
          <p className={s.eyebrow}>{data.subtitle}</p>
          <h1 className={s.h2} style={{ margin: 0 }}>
            {data.eventTitle}
          </h1>
          <span>
            {data.showNumber}공 · {data.dateLabel} {data.timeLabel}
          </span>
          <span>{data.venue}</span>
        </div>
        <div className={s.perforation} />
        <div className={s.ticketBottom}>
          <div className={s.qrBox}>
            <TicketQr ticket={ticket} size={200} />
          </div>
          <span className={s.seatName}>{ticket.seat}</span>
          <TicketState ticket={ticket} />
        </div>
      </article>
      <section className={s.section} style={{ paddingTop: 0 }}>
        <p className={s.caption}>입장할 때 이 화면의 좌석별 QR을 운영진에게 보여주세요. 티켓 링크는 예매한 분만 갖고 있어 주세요.</p>
      </section>
    </>
  );
}
