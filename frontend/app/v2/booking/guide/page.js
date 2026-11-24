'use client';

import { ListRow, Toast, useToast } from '@/components/ui';
import { ChevronDownIcon } from '@/components/ui/icons';
import { AccountBox } from '@/components/shared/BookingForm';
import { BookingTabs, Footer, TopBar } from '@/features/v2/Chrome';
import { FAQ_ITEMS, HOLD_MINUTES, INSTAGRAM_HANDLE, INSTAGRAM_URL, OPEN_CHAT_URL } from '@/lib/content';
import s from '@/features/v2/v2.module.css';

export default function GuidePage() {
  const [toast, notify] = useToast();
  return (
    <>
      <TopBar title="예매 안내" back="/v2">
        <BookingTabs />
      </TopBar>
      <section className={`${s.section} ${s.stack}`} style={{ gap: 8 }}>
        <h2 className={s.h2} style={{ margin: 0 }}>
          입금 계좌
        </h2>
        <AccountBox onCopied={(message, error) => notify(message, { error })} />
        <p className={s.caption}>
          예약 후 {HOLD_MINUTES}분 안에 입금하고, 입금 메모에 예약 코드와 예매자 이름을 적어주세요.
        </p>
      </section>
      <div className={s.divider} />
      <section className={s.section}>
        <h2 className={s.h2}>자주 묻는 질문</h2>
        <div className={s.rows}>
          {FAQ_ITEMS.map(item => (
            <details key={item.q} className={s.faq}>
              <summary>
                {item.q}
                <ChevronDownIcon size={20} />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      <div className={s.divider} />
      <section className={s.section}>
        <h2 className={s.h2}>문의</h2>
        <div className={s.rows}>
          <ListRow title="카카오톡 오픈채팅" sub="취소·환불 문의도 여기로 보내주세요" href={OPEN_CHAT_URL} arrow />
          <ListRow title="인스타그램 DM" sub={INSTAGRAM_HANDLE} href={INSTAGRAM_URL} arrow />
        </div>
      </section>
      <Footer />
      <Toast toast={toast} />
    </>
  );
}
