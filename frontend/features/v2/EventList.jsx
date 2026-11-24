'use client';

import { useState } from 'react';
import { Badge, BottomCTA, Button, IconButton, ListRow } from '@/components/ui';
import { MoreIcon } from '@/components/ui/icons';
import { useEventDialogs } from '@/components/admin/useEventDialogs';
import { TopBar } from '@/features/v2/Chrome';
import { useAdmin } from '@/hooks/admin';
import { overviewWhen, won } from '@/lib/format';
import { EVENT_STATUS_LABEL } from '@/lib/status';
import s from '@/features/v2/v2.module.css';

const GROUPS = [
  { title: '게시 중', match: e => e.status === 'published' },
  { title: '초안', match: e => e.status === 'draft' },
  { title: '보관함', match: e => e.status === 'archived' || e.status === 'cancelled' },
];

export function EventList() {
  const admin = useAdmin();
  const { openEditor, dialogs } = useEventDialogs();
  const [menu, setMenu] = useState(false);

  return (
    <div className={s.withCta}>
      <div style={{ position: 'relative' }}>
        <TopBar
          title="공연 관리"
          back="/v2"
          right={
            <IconButton label="계정 메뉴" aria-expanded={menu} onClick={() => setMenu(v => !v)}>
              <MoreIcon />
            </IconButton>
          }
        />
        {menu && (
          <div className={s.menu} role="menu">
            <span className={s.caption} style={{ padding: '8px 12px' }}>
              {admin.nickname}으로 로그인했어요
            </span>
            <button role="menuitem" type="button" onClick={() => admin.logout()}>
              로그아웃
            </button>
            <button role="menuitem" type="button" onClick={() => admin.logout(true)}>
              모든 기기에서 로그아웃
            </button>
          </div>
        )}
      </div>

      <section className={s.section} style={{ paddingBottom: 0 }}>
        <p className={s.body}>공연을 골라 회차별 예매와 현장 입장을 관리해요.</p>
      </section>

      {GROUPS.map(group => {
        const events = admin.events.filter(group.match);
        if (!events.length) return null;
        return (
          <section key={group.title} className={s.section}>
            <h2 className={s.h2} style={{ fontSize: 15, color: 'var(--grey-600)' }}>
              {group.title}
            </h2>
            <div className={s.rows}>
              {events.map(event => (
                <ListRow
                  key={event.id}
                  href={`/v2/admin/events/${encodeURIComponent(event.id)}`}
                  title={event.title}
                  sub={`${event.sessions.map(x => `${x.sortOrder}공 ${overviewWhen(x)}`).join(' · ') || '회차 없음'} · ${won(event.ticketPrice)} · 예약 ${event.bookingCount}건`}
                  right={<Badge tone={event.status === 'published' ? 'blue' : 'grey'}>{EVENT_STATUS_LABEL[event.status]}</Badge>}
                  arrow
                />
              ))}
            </div>
          </section>
        );
      })}
      {!admin.events.length && <p className={s.empty}>등록된 공연이 없어요. 새 공연을 만들면 여기서 관리할 수 있어요.</p>}

      <BottomCTA>
        <Button size="xl" full onClick={() => openEditor()}>
          새 공연 만들기
        </Button>
      </BottomCTA>
      {dialogs}
    </div>
  );
}
