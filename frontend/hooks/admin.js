'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '@/lib/api';
import { useToast } from '@/components/ui';

const AdminContext = createContext(null);
export const AdminProvider = AdminContext.Provider;

export function useAdmin() {
  return useContext(AdminContext);
}

/** Login state, event list, and a run() helper shared by every admin screen. */
export function useAdminShell() {
  const [auth, setAuth] = useState('loading'); // loading | out | in
  const [nickname, setNickname] = useState('');
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, notify] = useToast(3000);

  const loadEvents = useCallback(async () => {
    const list = await api.listEvents();
    setEvents(list);
    return list;
  }, []);

  useEffect(() => {
    api
      .getAdminSession()
      .then(async session => {
        setNickname(session.nickname);
        if (!session.authenticated) return setAuth('out');
        await loadEvents();
        setAuth('in');
      })
      .catch(problem => {
        setError(problem.message);
        setAuth('out');
      });
  }, [loadEvents]);

  /** Runs an action, shows a toast on success, reloads events. Returns true on success. */
  const run = useCallback(
    async (action, success) => {
      setBusy(true);
      setError('');
      try {
        await action();
        if (success) notify(success);
        await loadEvents();
        return true;
      } catch (problem) {
        notify(problem.message, { error: true });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [loadEvents, notify]
  );

  const login = async () => {
    setBusy(true);
    await api.adminLogin();
    const session = await api.getAdminSession();
    setNickname(session.nickname);
    await loadEvents();
    setAuth('in');
    setBusy(false);
  };

  const logout = async (allDevices = false) => {
    await api.adminLogout();
    setAuth('out');
    notify(allDevices ? '모든 기기에서 로그아웃했어요' : '로그아웃했어요');
  };

  return { auth, nickname, events, error, setError, busy, toast, notify, loadEvents, run, login, logout };
}

const pickShow = (event, id) => (event?.sessions.some(s => s.id === id) ? id : event?.sessions[0]?.id || '');

/** Everything on an event's detail screen: bookings page, seat states, entry stats, actions. */
export function useEventDetail(eventId) {
  const admin = useAdmin();
  const { events, loadEvents, run, notify } = admin;
  const event = events.find(e => e.id === eventId) || null;
  const [pickedShow, setPickedShow] = useState('');
  const [pickedCheckinShow, setPickedCheckinShow] = useState('');
  const [bookings, setBookings] = useState(null);
  const [checkin, setCheckin] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const showId = pickShow(event, pickedShow);
  const checkinShowId = pickShow(event, pickedCheckinShow) || showId;
  const pageCursor = cursor?.showId === showId ? cursor : null;

  // Fetch bookings + entry stats whenever the session, page or tick changes.
  useEffect(() => {
    if (!showId) return undefined;
    let cancelled = false;
    Promise.all([api.listBookings({ showId, cursor: pageCursor }), api.checkinSummary(checkinShowId), loadEvents()])
      .then(([data, entry]) => {
        if (cancelled) return;
        setBookings(data);
        setCheckin(entry);
      })
      .catch(problem => !cancelled && notify(problem.message, { error: true }))
      .finally(() => !cancelled && setRefreshing(false));
    return () => {
      cancelled = true;
    };
  }, [showId, checkinShowId, pageCursor, tick, loadEvents, notify]);

  // Poll every 12 seconds so staff see new bookings and check-ins.
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 12000);
    return () => clearInterval(timer);
  }, []);
  const refresh = () => setTick(t => t + 1);

  const runAndRefresh = async (action, success) => {
    const ok = await run(action, success);
    if (ok) refresh();
    return ok;
  };

  const bookingOpen = bookings?.bookingOpen ?? event?.bookingOpen ?? false;

  return {
    event,
    showId,
    checkinShowId,
    bookings,
    checkin,
    bookingOpen,
    hasCursor: Boolean(cursor),
    refreshing,
    selectShow: id => {
      setPickedShow(id);
      setCursor(null);
      setBookings(null);
    },
    selectCheckinShow: id => {
      setPickedCheckinShow(id);
      setCheckin(null);
    },
    reload: () => {
      setRefreshing(true);
      refresh();
    },
    page: older => setCursor(older && bookings?.nextCursor ? { showId, ...bookings.nextCursor } : null),
    toggleBooking: () =>
      runAndRefresh(
        () => api.setBookingOpen(eventId, !bookingOpen),
        bookingOpen ? '예매 접수를 닫았어요' : '예매 접수를 열었어요'
      ),
    bookingAction: (id, action) =>
      runAndRefresh(() => api.bookingAction(id, action), {
        confirm: '입금을 확인하고 티켓을 발급했어요',
        cancel: '예약을 취소했어요',
        'refund-complete': '환불 완료로 바꿨어요',
        'retry-sms': '문자를 다시 보냈어요',
      }[action]),
    checkIn: async input => {
      const result = await api.checkIn(input, checkinShowId);
      refresh();
      return result.ticket;
    },
  };
}

/** Seat state for the admin seat map, from the active bookings of a session. */
export function adminSeatStates(activeBookings = []) {
  const states = new Map();
  const owners = new Map();
  for (const order of activeBookings)
    for (const seat of order.seats) {
      const ticket = order.tickets?.find(t => t.seat === seat);
      states.set(seat, order.status === 'pending' ? 'held' : ticket?.status === 'checked_in' ? 'checked_in' : 'sold');
      owners.set(seat, order);
    }
  return { states, owners };
}
