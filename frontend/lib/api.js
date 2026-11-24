/*
 * Frontend API layer.
 *
 * Every function here is what a page calls. Right now they run against an in-browser mock
 * (lib/mock-db.js). When the Express server is ready, replace each body with a fetch to the
 * endpoint noted above it and keep the same return shape, so no page has to change.
 */
import { getDb, randomCode, randomId, randomToken, resetDb, saveDb } from './mock-db';
import { MAX_SELECTED_SEATS, STAFF_ROW, seatCount, seatNumber, seatRow, sortSeats } from './seats';
import { phoneDigits } from './format';
import { HOLD_MINUTES } from './content';

const LATENCY = 250;
const wait = () => new Promise(resolve => setTimeout(resolve, LATENCY));
const fail = message => {
  throw new Error(message); 
};
const clone = value => JSON.parse(JSON.stringify(value));
const ACTIVE = ['pending', 'paid'];

// Pending holds expire lazily on read, like the original server.
function expireHolds(db) {
  const limit = Date.now() - HOLD_MINUTES * 60000;
  let changed = false;
  for (const b of db.bookings)
    if (b.status === 'pending' && b.createdAt < limit) {
      b.status = 'expired';
      changed = true;
    }
  if (changed) saveDb();
}

const sessionsOf = (db, eventId) =>
  db.sessions.filter(s => s.eventId === eventId).sort((a, b) => a.sortOrder - b.sortOrder);

const publishedEvent = db => db.events.find(e => e.status === 'published') || null;

function eventView(db, event) {
  const sessions = sessionsOf(db, event.id).map(s => {
    const active = db.bookings.filter(b => b.showId === s.id && ACTIVE.includes(b.status));
    return {
      ...s,
      occupiedSeats: active.filter(b => b.status === 'paid').reduce((n, b) => n + b.seats.length, 0),
      pendingSeats: active.filter(b => b.status === 'pending').reduce((n, b) => n + b.seats.length, 0),
    };
  });
  const showIds = sessions.map(s => s.id);
  return {
    ...event,
    sessions,
    bookingCount: db.bookings.filter(b => showIds.includes(b.showId)).length,
  };
}

function takenSeats(db, showId) {
  const seats = {};
  for (const b of db.bookings)
    if (b.showId === showId && ACTIVE.includes(b.status))
      for (const seat of b.seats) seats[seat] = b.status === 'paid' ? 'sold' : 'held';
  for (let i = 1; i <= seatCount(STAFF_ROW); i += 1) seats[`${STAFF_ROW}${String(i).padStart(2, '0')}`] = 'reserved';
  return seats;
}

const ticketsOf = (db, bookingId) => db.tickets.filter(t => t.bookingId === bookingId && t.status !== 'void');

// ---------------------------------------------------------------------------------------------
// Audience
// ---------------------------------------------------------------------------------------------

/** GET /api/event → published event with sessions, or null */
export async function getEvent() {
  await wait();
  const db = getDb();
  const event = publishedEvent(db);
  return event ? clone(eventView(db, event)) : null;
}

/** GET /api/seats?show=:id → { seats: { B01: 'sold' | 'held' | 'reserved' }, bookingOpen } */
export async function getSeats(showId) {
  await wait();
  const db = getDb();
  expireHolds(db);
  const session = db.sessions.find(s => s.id === showId);
  const event = session && db.events.find(e => e.id === session.eventId);
  return { seats: takenSeats(db, showId), bookingOpen: Boolean(event?.bookingOpen && event.status === 'published') };
}

/** POST /api/bookings → { id, code, showId, seats, amount, status } */
export async function createBooking({ showId, seats, name, phone, payer }) {
  await wait();
  const db = getDb();
  expireHolds(db);
  const session = db.sessions.find(s => s.id === showId) || fail('회차 정보를 찾지 못했어요. 회차를 다시 골라주세요.');
  const event = db.events.find(e => e.id === session.eventId);
  if (!event?.bookingOpen || event.status !== 'published') fail('지금은 예매 접수 기간이 아니에요.');
  if (!seats?.length) fail('좌석을 골라주세요.');
  if (seats.length > MAX_SELECTED_SEATS) fail(`한 번에 ${MAX_SELECTED_SEATS}석까지 예매할 수 있어요.`);
  if (seats.some(s => seatRow(s) === STAFF_ROW || seatNumber(s) > seatCount(seatRow(s))))
    fail('예매할 수 없는 좌석이 있어요. 좌석을 다시 골라주세요.');
  if (!name?.trim() || !payer?.trim()) fail('이름을 입력해 주세요.');
  const digits = phoneDigits(phone);
  if (digits.length < 10 || digits.length > 11) fail('연락처 숫자를 10~11자리로 입력해 주세요.');
  const taken = takenSeats(db, showId);
  const clash = seats.filter(s => taken[s]);
  if (clash.length) fail(`${clash.join(', ')} 좌석은 방금 다른 분이 예매했어요. 다른 좌석을 골라주세요.`);
  const held = db.bookings
    .filter(b => b.showId === showId && ACTIVE.includes(b.status) && phoneDigits(b.phone) === digits)
    .reduce((n, b) => n + b.seats.length, 0);
  if (held + seats.length > MAX_SELECTED_SEATS)
    fail(`같은 연락처로는 회차마다 ${MAX_SELECTED_SEATS}석까지 예매할 수 있어요. 지금 ${held}석이 예약되어 있어요.`);

  const booking = {
    id: randomId(),
    code: randomCode(),
    showId,
    name: name.trim(),
    phone,
    payer: payer.trim(),
    seats: sortSeats(seats),
    amount: seats.length * event.ticketPrice,
    status: 'pending',
    createdAt: Date.now(),
    notificationStatus: 'untracked',
    ticketToken: null,
  };
  db.bookings.push(booking);
  saveDb();
  return clone(booking);
}

function bookingDetail(db, booking) {
  const session = db.sessions.find(s => s.id === booking.showId);
  return {
    id: booking.id,
    code: booking.code,
    showNumber: session?.sortOrder,
    dateLabel: session?.dateLabel,
    timeLabel: session?.timeLabel,
    name: booking.name,
    payer: booking.payer,
    seats: booking.seats,
    amount: booking.amount,
    status: booking.status,
    tickets: booking.status === 'paid' ? ticketsOf(db, booking.id).map(t => ({ id: t.id, seat: t.seat, status: t.status })) : [],
  };
}

/** POST /api/booking-lookup { code, phone } → booking detail with tickets */
export async function lookupBooking({ code, phone }) {
  await wait();
  const db = getDb();
  expireHolds(db);
  const key = String(code || '').replace(/\s/g, '');
  const booking = db.bookings.find(
    b => (b.code.replace(/\s/g, '') === key || b.id === key) && phoneDigits(b.phone) === phoneDigits(phone)
  );
  if (!booking) fail('예약을 찾지 못했어요. 예약 코드와 연락처를 다시 확인해 주세요.');
  return clone(bookingDetail(db, booking));
}

/** POST /api/ticket-link { token } → event info + tickets */
export async function getTicketByToken(token) {
  await wait();
  if (!token) fail('티켓 링크 형식이 올바르지 않아요.');
  const db = getDb();
  const booking = db.bookings.find(b => b.ticketToken === token);
  if (!booking) fail('티켓을 찾지 못했어요. 링크를 다시 확인해 주세요.');
  if (booking.status !== 'paid') fail('취소되거나 환불된 예약이라 티켓을 쓸 수 없어요.');
  const session = db.sessions.find(s => s.id === booking.showId);
  const event = db.events.find(e => e.id === session?.eventId);
  return clone({
    eventTitle: event?.title,
    subtitle: event?.subtitle,
    venue: event?.venue,
    showNumber: session?.sortOrder,
    dateLabel: session?.dateLabel,
    timeLabel: session?.timeLabel,
    tickets: ticketsOf(db, booking.id).map(t => ({ id: t.id, seat: t.seat, status: t.status })),
  });
}

// ---------------------------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------------------------

const requireAdmin = db => db.admin.loggedIn || fail('로그인이 필요해요. 다시 로그인해 주세요.');

/** GET /api/admin/session */
export async function getAdminSession() {
  await wait();
  const db = getDb();
  return { authenticated: db.admin.loggedIn, nickname: db.admin.loggedIn ? db.admin.nickname : '', kakaoConfigured: true };
}

/** Real flow: GET /auth/kakao/login → Kakao → /auth/kakao/callback sets a session cookie. */
export async function adminLogin() {
  await wait();
  getDb().admin.loggedIn = true;
  saveDb();
}

/** POST /api/admin/logout  (allDevices → POST /api/auth/logout-all) */
export async function adminLogout() {
  await wait();
  getDb().admin.loggedIn = false;
  saveDb();
}

/** GET /api/admin/events */
export async function listEvents() {
  await wait();
  const db = getDb();
  requireAdmin(db);
  expireHolds(db);
  const order = { published: 0, draft: 1, cancelled: 2, archived: 3 };
  return clone(
    [...db.events]
      .sort((a, b) => order[a.status] - order[b.status] || b.createdAt - a.createdAt)
      .map(e => eventView(db, e))
  );
}

function writeSessions(db, eventId, sessions) {
  db.sessions = db.sessions.filter(s => s.eventId !== eventId);
  sessions.forEach((s, i) =>
    db.sessions.push({
      id: s.id || `${eventId}-${randomToken(Math.random, 6)}`,
      eventId,
      sortOrder: i + 1,
      dateLabel: s.dateLabel,
      timeLabel: s.timeLabel,
      startsAt: s.startsAt,
    })
  );
}

/** POST /api/admin/events */
export async function createEvent(payload) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  const id = `event-${randomToken(Math.random, 8).toLowerCase()}`;
  const { sessions, ...fields } = payload;
  db.events.push({ ...fields, id, status: 'draft', bookingOpen: false, createdAt: Date.now() });
  writeSessions(db, id, sessions);
  saveDb();
}

/** PUT /api/admin/events/:id */
export async function updateEvent(id, payload) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  const event = db.events.find(e => e.id === id) || fail('공연을 찾지 못했어요.');
  const view = eventView(db, event);
  const { sessions, ...fields } = payload;
  if (view.bookingCount > 0) {
    if (fields.ticketPrice !== event.ticketPrice) fail('예약이 있어 가격은 바꿀 수 없어요.');
    if (sessions.length !== view.sessions.length) fail('예약이 있어 회차 수는 바꿀 수 없어요.');
    // Keep session ids so existing bookings stay attached.
    sessions.forEach((s, i) => (s.id = view.sessions[i].id));
  }
  Object.assign(event, fields);
  writeSessions(db, id, sessions);
  saveDb();
}

/** POST /api/admin/events/:id/(publish|duplicate|archive) */
export async function eventAction(id, action) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  const event = db.events.find(e => e.id === id) || fail('공연을 찾지 못했어요.');
  if (action === 'publish') {
    if (publishedEvent(db)) fail('이미 게시된 공연이 있어요. 기존 공연을 먼저 보관해 주세요.');
    event.status = 'published';
  } else if (action === 'archive') {
    event.status = 'archived';
    event.bookingOpen = false;
  } else if (action === 'duplicate') {
    const copyId = `event-${randomToken(Math.random, 8).toLowerCase()}`;
    db.events.push({ ...event, id: copyId, title: `${event.title} 복사본`, status: 'draft', bookingOpen: false, createdAt: Date.now() });
    writeSessions(db, copyId, sessionsOf(db, id).map(({ id: _id, ...s }) => s));
  }
  saveDb();
}

/** DELETE /api/admin/events/:id { confirmation } */
export async function deleteEvent(id, confirmation) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  const event = db.events.find(e => e.id === id) || fail('공연을 찾지 못했어요.');
  if (confirmation !== event.title) fail('공연 제목이 일치하지 않아요.');
  const showIds = sessionsOf(db, id).map(s => s.id);
  const bookingIds = db.bookings.filter(b => showIds.includes(b.showId)).map(b => b.id);
  db.tickets = db.tickets.filter(t => !bookingIds.includes(t.bookingId));
  db.bookings = db.bookings.filter(b => !showIds.includes(b.showId));
  db.sessions = db.sessions.filter(s => s.eventId !== id);
  db.events = db.events.filter(e => e.id !== id);
  saveDb();
}

/** POST /api/admin/settings { bookingOpen } */
export async function setBookingOpen(eventId, open) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  const event = db.events.find(e => e.id === eventId) || fail('공연을 찾지 못했어요.');
  if (event.status !== 'published') fail('공연을 먼저 게시해 주세요.');
  event.bookingOpen = open;
  saveDb();
}

/** GET /api/admin/bookings?show=:id&limit=50&before=… */
export async function listBookings({ showId, cursor = null, limit = 50 }) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  expireHolds(db);
  const all = db.bookings
    .filter(b => b.showId === showId)
    .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
  const start = cursor ? all.findIndex(b => b.id === cursor.id) + 1 : 0;
  const page = all.slice(start, start + limit);
  const withTickets = b => ({ ...b, tickets: ticketsOf(db, b.id) });
  const session = db.sessions.find(s => s.id === showId);
  const event = db.events.find(e => e.id === session?.eventId);
  return clone({
    bookings: page.map(withTickets),
    activeBookings: all.filter(b => ACTIVE.includes(b.status)).map(withTickets),
    nextCursor: start + limit < all.length ? { id: page.at(-1).id } : null,
    bookingOpen: Boolean(event?.bookingOpen),
  });
}

/** POST /api/admin/bookings/:id/(confirm|cancel|refund-complete|retry-sms) */
export async function bookingAction(id, action) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  const booking = db.bookings.find(b => b.id === id) || fail('예약을 찾지 못했어요.');
  if (action === 'confirm') {
    if (booking.status !== 'pending') fail('입금 대기 예약만 확인할 수 있어요.');
    booking.status = 'paid';
    booking.ticketToken = randomToken();
    booking.notificationStatus = 'accepted';
    for (const seat of booking.seats)
      db.tickets.push({ id: `TK-${randomToken(Math.random, 10)}`, bookingId: id, showId: booking.showId, seat, status: 'valid', checkedInAt: null });
  } else if (action === 'cancel') {
    if (!ACTIVE.includes(booking.status)) fail('이미 정리된 예약이에요.');
    booking.status = booking.status === 'paid' ? 'refund_pending' : 'cancelled';
    db.tickets.filter(t => t.bookingId === id).forEach(t => (t.status = 'void'));
  } else if (action === 'refund-complete') {
    if (booking.status !== 'refund_pending') fail('환불 대기 예약만 완료할 수 있어요.');
    booking.status = 'refunded';
  } else if (action === 'retry-sms') {
    booking.notificationStatus = 'accepted';
  }
  saveDb();
}

/** GET /api/admin/checkin-summary?show=:id */
export async function checkinSummary(showId) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  const tickets = db.tickets.filter(t => t.showId === showId && t.status !== 'void');
  const rows = [...new Set(tickets.map(t => t.seat[0]))].sort().map(row => {
    const inRow = tickets.filter(t => t.seat[0] === row);
    return { row, total: inRow.length, checkedIn: inRow.filter(t => t.status === 'checked_in').length };
  });
  const recent = tickets
    .filter(t => t.status === 'checked_in')
    .sort((a, b) => b.checkedInAt - a.checkedInAt)
    .slice(0, 8)
    .map(t => ({ seat: t.seat, checkedInAt: t.checkedInAt }));
  return { checkedIn: tickets.filter(t => t.status === 'checked_in').length, total: tickets.length, rows, recent };
}

/** POST /api/admin/tickets/check-in { ticketId } or { code, seat } */
export async function checkIn(input, showId) {
  await wait();
  const db = getDb();
  requireAdmin(db);
  const raw = String(input || '').trim().replace(/^TKT:/i, '');
  let ticket;
  if (raw.includes(':')) {
    const [code, seat] = raw.split(':');
    const booking = db.bookings.find(b => b.code === code || b.id === code);
    ticket = booking && db.tickets.find(t => t.bookingId === booking.id && t.seat === seat.toUpperCase());
  } else {
    ticket = db.tickets.find(t => t.id === raw);
  }
  if (!ticket) fail('티켓을 찾지 못했어요. 코드를 다시 확인해 주세요.');
  if (ticket.showId !== showId) fail('다른 회차의 티켓이에요. 회차를 확인해 주세요.');
  if (ticket.status === 'void') fail('취소되거나 환불된 예약의 티켓이에요.');
  if (ticket.status === 'checked_in') fail(`${ticket.seat} 좌석은 이미 입장했어요.`);
  ticket.status = 'checked_in';
  ticket.checkedInAt = Date.now();
  saveDb();
  const booking = db.bookings.find(b => b.id === ticket.bookingId);
  return { ticket: { seat: ticket.seat, name: booking?.name } };
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export async function getServerHealth() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`서버가 ${res.status} 응답을 보냈어요`);
  return res.json();
}

/** Mock-only: restore the seed data. */
export async function resetMockData() {
  resetDb();
}
