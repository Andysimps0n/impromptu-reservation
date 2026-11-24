'use client';

import { useState } from 'react';
import { Button, SegmentedControl, TextField } from '@/components/ui';
import { PlusIcon } from '@/components/ui/icons';
import { dateLabel, timeLabel } from '@/lib/format';
import s from './admin.module.css';

const EMPTY = { title: '', subtitle: '', description: '', venue: '', ticketPrice: 6500, sessions: [{ startsAt: '' }] };
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// "2026-11-21T21:00:00+09:00" → { date, period, hour, minute }
const toFields = startsAt => {
  const date = startsAt?.slice(0, 10) || '';
  const time = startsAt?.slice(11, 16);
  if (!time) return { date, period: '오후', hour: '', minute: '00' };
  const [h, m] = time.split(':').map(Number);
  return { date, period: h < 12 ? '오전' : '오후', hour: String(h % 12 || 12), minute: String(m).padStart(2, '0') };
};
const toTime = ({ period, hour, minute }) =>
  hour ? `${String((Number(hour) % 12) + (period === '오후' ? 12 : 0)).padStart(2, '0')}:${minute}` : '';

/** Create / edit form. Price and session count lock once the event has bookings. */
export function EventEditorForm({ event, onSave }) {
  const initial = event?.id ? event : EMPTY;
  const locked = Number(initial.bookingCount) > 0;
  const [fields, setFields] = useState({
    title: initial.title,
    subtitle: initial.subtitle,
    description: initial.description,
    venue: initial.venue,
    ticketPrice: initial.ticketPrice,
  });
  const [sessions, setSessions] = useState(initial.sessions.map(x => toFields(x.startsAt)));
  const [busy, setBusy] = useState(false);
  const set = key => e => setFields(f => ({ ...f, [key]: e.target.value }));
  const setSession = (index, key, value) => setSessions(xs => xs.map((x, n) => (n === index ? { ...x, [key]: value } : x)));
  const complete = fields.title.trim() && fields.venue.trim() && sessions.every(x => x.date && x.hour);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      ...fields,
      ticketPrice: Number(fields.ticketPrice),
      sessions: sessions.map(x => {
        const time = toTime(x);
        return { startsAt: `${x.date}T${time}:00+09:00`, dateLabel: dateLabel(x.date), timeLabel: timeLabel(time) };
      }),
    });
    setBusy(false);
  };

  return (
    <form className={s.form} onSubmit={submit}>
      <TextField label="공연 제목" required value={fields.title} onChange={set('title')} />
      <TextField label="부제" value={fields.subtitle} onChange={set('subtitle')} />
      <TextField label="공연 소개" as="textarea" value={fields.description} onChange={set('description')} />
      <TextField label="장소" required value={fields.venue} onChange={set('venue')} />
      <TextField
        label="가격"
        type="number"
        min="1"
        inputMode="numeric"
        value={fields.ticketPrice}
        readOnly={locked}
        help={locked ? '예약이 있어 가격은 바꿀 수 없어요.' : '1석 가격이에요.'}
        onChange={set('ticketPrice')}
      />

      <h3 className={s.sectionTitle}>회차 일정</h3>
      {sessions.map((x, i) => (
        <div className={s.session} key={i}>
          <div className={s.sessionHead}>
            {i + 1}공
            <Button
              variant="dangerGhost"
              size="s"
              disabled={locked || sessions.length < 2}
              onClick={() => setSessions(xs => xs.filter((_, n) => n !== i))}
            >
              삭제
            </Button>
          </div>
          <TextField label="날짜" type="date" required value={x.date} onChange={e => setSession(i, 'date', e.target.value)} />
          <div className={s.timeRow}>
            <SegmentedControl
              label="오전 오후"
              value={x.period}
              onChange={v => setSession(i, 'period', v)}
              options={[
                { value: '오전', label: '오전' },
                { value: '오후', label: '오후' },
              ]}
            />
            <TextField as="select" aria-label="시" required value={x.hour} onChange={e => setSession(i, 'hour', e.target.value)}>
              <option value="" disabled>
                시
              </option>
              {HOURS.map(h => (
                <option key={h} value={h}>
                  {h}시
                </option>
              ))}
            </TextField>
            <TextField as="select" aria-label="분" value={x.minute} onChange={e => setSession(i, 'minute', e.target.value)}>
              {MINUTES.map(m => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </TextField>
          </div>
        </div>
      ))}
      {locked ? (
        <p className={s.note}>예약이 있어 회차 수와 가격은 바꿀 수 없어요. 날짜·시간과 공연 정보는 바꿀 수 있어요.</p>
      ) : (
        <Button
          variant="secondary"
          size="m"
          onClick={() => setSessions(xs => [...xs, { date: '', period: '오후', hour: '', minute: '00' }])}
        >
          <PlusIcon size={18} /> 회차 추가하기
        </Button>
      )}
      <Button type="submit" size="xl" full loading={busy} disabled={!complete}>
        저장하기
      </Button>
    </form>
  );
}
