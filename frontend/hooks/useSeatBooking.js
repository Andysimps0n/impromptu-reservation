'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBooking, getEvent, getSeats } from '@/lib/api';
import { MAX_SELECTED_SEATS, sortSeats } from '@/lib/seats';
import { useToast } from '@/components/ui';

/**
 * Audience booking state: the published event, chosen session, seat availability, and the
 * seats the user picked. Both versions' seat pages are built on this.
 */
export function useSeatBooking() {
  const [toast, notify] = useToast();
  const [event, setEvent] = useState(undefined); // undefined = loading, null = none published
  const [eventError, setEventError] = useState('');
  const [eventKey, setEventKey] = useState(0);
  const [showId, setShowId] = useState('');
  const [seatData, setSeatData] = useState(null);
  const [seatError, setSeatError] = useState('');
  const [seatKey, setSeatKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState([]);

  // Load the published event (again when eventKey changes).
  useEffect(() => {
    let cancelled = false;
    getEvent()
      .then(next => {
        if (cancelled) return;
        setEventError('');
        setEvent(next);
        setShowId(current => (next?.sessions.some(s => s.id === current) ? current : next?.sessions[0]?.id || ''));
      })
      .catch(problem => {
        if (cancelled) return;
        setEventError(problem.message);
        setEvent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [eventKey]);

  // Load seat states for the chosen session (again when seatKey changes).
  useEffect(() => {
    if (!showId) return undefined;
    let cancelled = false;
    getSeats(showId)
      .then(data => {
        if (cancelled) return;
        setSeatError('');
        setSeatData(data);
        // Drop picks that someone else took in the meantime.
        setSelected(current => current.filter(seat => !data.seats[seat]));
      })
      .catch(problem => !cancelled && setSeatError(problem.message || '좌석 정보를 불러오지 못했어요.'))
      .finally(() => !cancelled && setRefreshing(false));
    return () => {
      cancelled = true;
    };
  }, [showId, seatKey]);

  const reloadSeats = useCallback(() => {
    setRefreshing(true);
    setSeatKey(k => k + 1);
  }, []);

  const session = useMemo(() => event?.sessions.find(s => s.id === showId) || null, [event, showId]);
  const bookingOpen = Boolean(event && seatData?.bookingOpen);
  const price = event?.ticketPrice || 0;

  const stateOf = useCallback(
    seat => (selected.includes(seat) ? 'selected' : seatData?.seats?.[seat] || 'available'),
    [selected, seatData]
  );

  const toggleSeat = useCallback(
    seat => {
      if (selected.includes(seat)) {
        setSelected(selected.filter(s => s !== seat));
      } else if (selected.length >= MAX_SELECTED_SEATS) {
        notify(`한 번에 ${MAX_SELECTED_SEATS}석까지 고를 수 있어요`, { error: true });
      } else {
        setSelected(sortSeats([...selected, seat]));
      }
    },
    [selected, notify]
  );

  const chooseSession = useCallback(id => {
    setShowId(id);
    setSeatData(null);
    setSelected([]);
  }, []);

  const submit = useCallback(
    async form => {
      const booking = await createBooking({ showId, seats: selected, ...form });
      setSelected([]);
      reloadSeats();
      return { booking, session };
    },
    [showId, selected, reloadSeats, session]
  );

  return {
    toast,
    notify,
    event,
    eventError,
    session,
    showId,
    chooseSession,
    seatData,
    seatError,
    refreshing,
    reloadSeats,
    retry: () => {
      setEventKey(k => k + 1);
      reloadSeats();
    },
    bookingOpen,
    price,
    selected,
    stateOf,
    toggleSeat,
    submit,
  };
}

/** Why the seat map is locked, if it is. Returns null when booking is possible. */
export function seatNotice({ event, eventError, seatError, bookingOpen, seatData }) {
  if (eventError || seatError)
    return {
      title: '좌석 정보를 불러오지 못했어요',
      body: '인터넷 연결을 확인하고 다시 시도해 주세요.',
      retry: true,
    };
  if (event === null) return { title: '지금 공개된 공연이 없어요', body: '새 공연 일정이 올라오면 예매할 수 있어요.' };
  if (seatData && !bookingOpen)
    return {
      title: '지금은 예매 접수 기간이 아니에요',
      body: '운영진이 접수를 열면 좌석을 고를 수 있어요. 예매 기간에 다시 들러 주세요.',
    };
  return null;
}
