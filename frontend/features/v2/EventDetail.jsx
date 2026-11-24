'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Chip, IconButton, ListRow, Loader, ProgressBar, SegmentedControl, Switch, TextField } from '@/components/ui';
import { CameraIcon, RefreshIcon } from '@/components/ui/icons';
import { SeatGrid, SeatLegend } from '@/components/shared/SeatGrid';
import { CheckinPanel, OrderCard, SeatOrderDialog } from '@/components/admin/AdminPieces';
import { useEventDialogs } from '@/components/admin/useEventDialogs';
import { Tabs, TopBar } from '@/features/v2/Chrome';
import { adminSeatStates, useAdmin, useEventDetail } from '@/hooks/admin';
import { eventAction } from '@/lib/api';
import { clockTime, overviewWhen, won } from '@/lib/format';
import { BOOKABLE_SEATS, STAFF_ROW } from '@/lib/seats';
import { EVENT_STATUS_LABEL, ORDER_FILTERS } from '@/lib/status';
import s from '@/features/v2/v2.module.css';

const TABS = [
  { value: 'overview', label: '현황' },
  { value: 'seats', label: '좌석' },
  { value: 'orders', label: '예약' },
  { value: 'checkin', label: '입장' },
  { value: 'settings', label: '설정' },
];

export function EventDetail() {
  const { eventId } = useParams();
  const router = useRouter();
  const admin = useAdmin();
  const d = useEventDetail(decodeURIComponent(eventId));
  const { openEditor, openDelete, dialogs } = useEventDialogs({ onDeleted: () => router.push('/v2/admin') });
  const [tab, setTab] = useState('overview');
  const [filters, setFilters] = useState([]);
  const [query, setQuery] = useState('');
  const [seatOrder, setSeatOrder] = useState(null);
  const { states, owners } = useMemo(() => adminSeatStates(d.bookings?.activeBookings), [d.bookings]);
  const event = d.event;

  if (!event)
    return (
      <>
        <TopBar title="공연 관리" back="/v2/admin" />
        <p className={s.empty}>공연을 찾지 못했어요.</p>
      </>
    );

  // In this layout one session picker drives seats, orders and check-in together.
  const pickSession = id => {
    d.selectShow(id);
    d.selectCheckinShow(id);
  };
  const sessionPicker = event.sessions.length > 1 && (
    <SegmentedControl
      label="회차"
      value={d.showId}
      onChange={pickSession}
      options={event.sessions.map(x => ({ value: x.id, label: `${x.sortOrder}공`, sub: overviewWhen(x) }))}
    />
  );
  const q = query.trim().toLowerCase();
  const orders = [...(d.bookings?.bookings || [])]
    .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'))
    .filter(o => !filters.length || filters.includes(o.status))
    .filter(o => !q || o.name.toLowerCase().includes(q) || o.code.includes(query.trim()));
  const act = (action, message) => admin.run(() => eventAction(event.id, action), message);

  return (
    <>
      <TopBar
        title={event.title}
        back="/v2/admin"
        right={
          <IconButton label="입장 QR 스캔" onClick={() => setTab('checkin')}>
            <CameraIcon />
          </IconButton>
        }
      >
        <Tabs tabs={TABS} value={tab} onChange={setTab} label="공연 관리 메뉴" />
      </TopBar>

      {tab === 'overview' && (
        <>
          <section className={s.section}>
            <div className={s.rows}>
              <ListRow
                title="예매 접수"
                sub={event.status === 'published' ? '끄면 관객이 좌석을 고를 수 없어요' : '공연을 먼저 게시해 주세요'}
                right={
                  <Switch checked={d.bookingOpen} disabled={event.status !== 'published'} onChange={d.toggleBooking}>
                    <span className="sr-only">예매 접수</span>
                  </Switch>
                }
              />
              <ListRow title="장소" right={event.venue} />
              <ListRow title="상태" right={<Badge tone={event.status === 'published' ? 'blue' : 'grey'}>{EVENT_STATUS_LABEL[event.status]}</Badge>} />
              <ListRow title="가격" right={<span className="num">{won(event.ticketPrice)}</span>} />
              <ListRow title="전체 예약" right={`${event.bookingCount}건`} />
            </div>
          </section>
          <div className={s.divider} />
          <section className={`${s.section} ${s.stack}`}>
            <h2 className={s.h2} style={{ margin: 0 }}>
              회차별 예매 현황
            </h2>
            {event.sessions.map(x => (
              <article key={x.id} className={s.overviewCard}>
                <div className={s.overviewHead}>
                  <strong>{x.sortOrder}공</strong>
                  <span>{overviewWhen(x)}</span>
                </div>
                <div className={s.stats}>
                  <p>
                    <span>확정 좌석</span>
                    <b>
                      {x.occupiedSeats}/{BOOKABLE_SEATS}
                    </b>
                  </p>
                  <p>
                    <span>입금 대기</span>
                    <b>{x.pendingSeats}석</b>
                  </p>
                </div>
                <ProgressBar value={x.occupiedSeats} max={BOOKABLE_SEATS} label={`${x.sortOrder}공 좌석`} />
              </article>
            ))}
          </section>
        </>
      )}

      {tab === 'seats' && (
        <section className={`${s.section} ${s.stack}`}>
          {sessionPicker}
          <div className={s.mapHead}>
            <p className={s.caption}>예약된 좌석을 누르면 예약 정보를 볼 수 있어요.</p>
            <IconButton label="좌석 현황 새로고침" spinning={d.refreshing} onClick={d.reload}>
              <RefreshIcon size={20} />
            </IconButton>
          </div>
          <div>
            <SeatGrid
              mode="admin"
              stateOf={seat => (seat[0] === STAFF_ROW ? 'reserved' : states.get(seat) || 'available')}
              isEnabled={seat => owners.has(seat)}
              onSeat={seat => setSeatOrder({ seat, order: owners.get(seat) })}
              dim={!d.bookings}
            />
            <SeatLegend mode="admin" />
          </div>
        </section>
      )}

      {tab === 'orders' && (
        <section className={`${s.section} ${s.stack}`}>
          {sessionPicker}
          <TextField type="search" aria-label="예약 검색" placeholder="이름 또는 예약 코드로 찾기" value={query} onChange={e => setQuery(e.target.value)} />
          <div className={s.chips} role="group" aria-label="예약 상태 필터">
            {ORDER_FILTERS.map(f => (
              <Chip
                key={f.status}
                selected={filters.includes(f.status)}
                onClick={() => setFilters(xs => (xs.includes(f.status) ? xs.filter(x => x !== f.status) : [...xs, f.status]))}
              >
                {f.label}
              </Chip>
            ))}
          </div>
          <div>
            {!d.bookings ? (
              <Loader label="예매 내역을 불러오는 중" />
            ) : orders.length ? (
              orders.map(order => <OrderCard key={order.id} order={order} onAction={d.bookingAction} />)
            ) : (
              <p className={s.empty}>{d.bookings.bookings.length ? '조건에 맞는 예약이 없어요' : '이 회차에는 예매 내역이 없어요'}</p>
            )}
            <div className={s.pagination}>
              {d.hasCursor && (
                <Button variant="secondary" size="s" onClick={() => d.page(false)}>
                  최신 예약 보기
                </Button>
              )}
              {d.bookings?.nextCursor && (
                <Button variant="secondary" size="s" onClick={() => d.page(true)}>
                  이전 예약 50건 보기
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'checkin' && (
        <>
          <section className={`${s.section} ${s.stack}`}>
            {event.sessions.length > 1 && (
              <SegmentedControl
                label="회차"
                value={d.checkinShowId}
                onChange={pickSession}
                options={event.sessions.map(x => ({ value: x.id, label: `${x.sortOrder}공`, sub: overviewWhen(x) }))}
              />
            )}
            <CheckinPanel
              sessionLabel={`${event.sessions.find(x => x.id === d.checkinShowId)?.sortOrder}공`}
              onCheckIn={d.checkIn}
            />
          </section>
          <div className={s.divider} />
          <section className={`${s.section} ${s.stack}`}>
            {d.checkin ? (
              <>
                <p className={s.big}>
                  {d.checkin.checkedIn}
                  <small>/ {d.checkin.total}석 입장</small>
                </p>
                <ProgressBar value={d.checkin.checkedIn} max={d.checkin.total || 1} label="입장률" />
                <h3 className={s.h2} style={{ margin: '8px 0 0', fontSize: 17 }}>
                  열별 입장
                </h3>
                {d.checkin.rows.length ? (
                  <div className={s.rowGrid}>
                    {d.checkin.rows.map(row => (
                      <div key={row.row} className={s.rowCell}>
                        <span>{row.row}열</span>
                        <strong>
                          {row.checkedIn}/{row.total}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={s.caption}>발급된 티켓이 없어요</p>
                )}
                <h3 className={s.h2} style={{ margin: '8px 0 0', fontSize: 17 }}>
                  최근 입장
                </h3>
                {d.checkin.recent.length ? (
                  <div className={s.rows}>
                    {d.checkin.recent.map(t => (
                      <ListRow key={`${t.seat}-${t.checkedInAt}`} title={t.seat} right={<span className="num">{clockTime(t.checkedInAt)}</span>} />
                    ))}
                  </div>
                ) : (
                  <p className={s.caption}>아직 입장한 관객이 없어요</p>
                )}
              </>
            ) : (
              <Loader />
            )}
          </section>
        </>
      )}

      {tab === 'settings' && (
        <section className={s.section}>
          <div className={s.rows}>
            {event.status !== 'archived' && <ListRow title="공연 정보 수정" sub="제목, 장소, 가격, 회차 일정" onClick={() => openEditor(event)} arrow />}
            {event.status === 'draft' && <ListRow title="게시하기" sub="게시된 공연은 한 번에 하나만 둘 수 있어요" onClick={() => act('publish', '공연을 게시했어요')} arrow />}
            <ListRow title="복제하기" sub="설정과 일정만 새 초안으로 복사해요" onClick={() => act('duplicate', '공연 초안을 복제했어요')} arrow />
            {['published', 'cancelled'].includes(event.status) && (
              <ListRow title="보관하기" sub="기록은 남기고 예매 접수만 닫아요" onClick={() => act('archive', '공연을 보관했어요')} arrow />
            )}
          </div>
          <div style={{ marginTop: 24 }}>
            <Button variant="dangerGhost" size="m" onClick={() => openDelete(event)}>
              공연 영구 삭제
            </Button>
          </div>
        </section>
      )}

      {seatOrder && <SeatOrderDialog seat={seatOrder.seat} order={seatOrder.order} onClose={() => setSeatOrder(null)} />}
      {dialogs}
    </>
  );
}
