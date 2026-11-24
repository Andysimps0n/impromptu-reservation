'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Badge, BottomCTA, Button, ListRow, Loader } from '@/components/ui';
import { Footer, TopBar } from '@/features/v2/Chrome';
import { getEvent } from '@/lib/api';
import { OPEN_CHAT_URL } from '@/lib/content';
import { withoutYear, won } from '@/lib/format';
import s from '@/features/v2/v2.module.css';

export default function HomePage() {
  const [event, setEvent] = useState(undefined);
  useEffect(() => {
    getEvent()
      .then(setEvent)
      .catch(() => setEvent(null));
  }, []);

  return (
    <div className={s.withCta}>
      <TopBar />
      <section className={s.section} style={{ paddingTop: 8 }}>
        <Image className={s.poster} src="/poster.jpg" alt="How'd you feel? 26-2학기 정기공연 포스터" width={813} height={1631} priority />
        <div className={s.heroText}>
          <p className={s.eyebrow}>26-2학기 정기공연</p>
          <h1 className={s.h1}>{event?.subtitle || 'How’d you feel?'}</h1>
          <p className={s.body}>{event?.description || '그날 밤, 우리가 느낀 모든 감정을 무대 위로. 당신은 어떻게 느꼈나요?'}</p>
        </div>
      </section>

      <div className={s.divider} />
      <section className={s.section}>
        <h2 className={s.h2}>공연 정보</h2>
        {event === undefined ? (
          <Loader />
        ) : event ? (
          <div className={s.rows}>
            <ListRow title="장소" right={event.venue} />
            <ListRow title="가격" right={<span className="num">1석 {won(event.ticketPrice)}</span>} />
            {event.sessions.map(session => (
              <ListRow
                key={session.id}
                title={`${session.sortOrder}공`}
                sub={`${withoutYear(session.dateLabel)} ${session.timeLabel}`}
                right={<Badge tone={event.bookingOpen ? 'blue' : 'grey'}>{event.bookingOpen ? '예매 중' : '예매 전'}</Badge>}
              />
            ))}
          </div>
        ) : (
          <p className={s.body}>지금 공개된 공연이 없어요. 새 공연 일정이 올라오면 예매할 수 있어요.</p>
        )}
      </section>

      <div className={s.divider} />
      <section className={s.section}>
        <h2 className={s.h2}>예매 전에 확인해 주세요</h2>
        <div className={s.rows}>
          <ListRow title="예매 안내와 자주 묻는 질문" href="/v2/booking/guide" arrow />
          <ListRow title="내 예약 조회" sub="예약 상태와 입장 QR을 볼 수 있어요" href="/v2/booking/lookup" arrow />
          <ListRow title="카카오톡으로 문의하기" href={OPEN_CHAT_URL} arrow />
        </div>
      </section>
      <Footer />

      <BottomCTA>
        <Button size="xl" full href="/v2/booking/seats">
          좌석 예매하기
        </Button>
      </BottomCTA>
    </div>
  );
}
