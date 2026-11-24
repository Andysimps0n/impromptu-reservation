// Seed data + persistence for the mock API. Delete this file once the Express API exists.

const STORAGE_KEY = 'impromptu-mock-db-v1';

// Deterministic PRNG so the seed looks the same on every machine.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
const GIVEN = ['민준', '서연', '도윤', '하은', '지호', '수아', '예준', '지유', '시우', '채원', '주원', '다은', '하준', '윤서', '건우', '은채'];
const WORD_CODES = ['든든', '따스', '맘스', '라운지', '에인트'];
const DORM_CODES = ['장기려', '카이퍼', '로뎀', '벧엘'];
const TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const randomToken = (rand = Math.random, length = 16) =>
  Array.from({ length }, () => TOKEN_CHARS[Math.floor(rand() * TOKEN_CHARS.length)]).join('');

export const randomCode = (rand = Math.random) =>
  rand() < 0.6
    ? `${WORD_CODES[Math.floor(rand() * WORD_CODES.length)]}${100 + Math.floor(rand() * 900)}`
    : `${DORM_CODES[Math.floor(rand() * DORM_CODES.length)]}${200 + Math.floor(rand() * 400)}호`;

export const randomId = (rand = Math.random) => `STG-${randomToken(rand, 6).toUpperCase()}`;

const ROWS = 'BCDEFGHIJKL'.split('');
const rowSeats = row => Array.from({ length: row === 'L' ? 8 : 12 }, (_, i) => `${row}${String(i + 1).padStart(2, '0')}`);

function seed() {
  const rand = rng(2026);
  const now = Date.now();
  const event = {
    id: 'legacy-2026',
    title: '즉흥적 새벽 2시',
    subtitle: 'How’d you feel?',
    description: '그날 밤, 우리가 느낀 모든 감정을 무대 위로. 당신은 어떻게 느꼈나요?',
    venue: '학관 104호',
    ticketPrice: 6500,
    status: 'published',
    bookingOpen: true,
    createdAt: now - 30 * 86400000,
  };
  const sessions = [
    { id: '1', eventId: event.id, sortOrder: 1, dateLabel: '2026년 11월 21일 토요일', timeLabel: '오후 8시', startsAt: '2026-11-21T20:00:00+09:00' },
    { id: '2', eventId: event.id, sortOrder: 2, dateLabel: '2026년 11월 22일 일요일', timeLabel: '오후 3시', startsAt: '2026-11-22T15:00:00+09:00' },
    { id: '3', eventId: event.id, sortOrder: 3, dateLabel: '2026년 11월 22일 일요일', timeLabel: '오후 9시', startsAt: '2026-11-22T21:00:00+09:00' },
  ];
  const draft = {
    id: 'spring-2027',
    title: '즉흥적 새벽 2시 봄 공연',
    subtitle: '',
    description: '',
    venue: '학관 104호',
    ticketPrice: 7000,
    status: 'draft',
    bookingOpen: false,
    createdAt: now - 2 * 86400000,
  };
  const archived = {
    id: 'spring-2026',
    title: '즉흥적 새벽 2시 26-1학기 정기공연',
    subtitle: '',
    description: '',
    venue: '학관 104호',
    ticketPrice: 6000,
    status: 'archived',
    bookingOpen: false,
    createdAt: now - 200 * 86400000,
  };
  sessions.push(
    { id: 's27-1', eventId: draft.id, sortOrder: 1, dateLabel: '2027년 5월 22일 토요일', timeLabel: '오후 7시', startsAt: '2027-05-22T19:00:00+09:00' },
    { id: 's26-1', eventId: archived.id, sortOrder: 1, dateLabel: '2026년 5월 23일 토요일', timeLabel: '오후 7시', startsAt: '2026-05-23T19:00:00+09:00' }
  );

  const bookings = [];
  const tickets = [];
  const add = (showId, overrides) => {
    const booking = {
      id: randomId(rand),
      code: randomCode(rand),
      showId,
      name: '',
      phone: '',
      payer: '',
      seats: [],
      amount: 0,
      status: 'paid',
      createdAt: now,
      notificationStatus: 'untracked',
      ticketToken: null,
      ...overrides,
    };
    booking.amount = booking.seats.length * event.ticketPrice;
    if (!booking.payer) booking.payer = booking.name;
    if (booking.status === 'paid' || booking.status === 'refund_pending' || booking.status === 'refunded') {
      if (booking.status === 'paid') booking.ticketToken ||= randomToken(rand);
      booking.notificationStatus = booking.notificationStatus === 'untracked' ? 'accepted' : booking.notificationStatus;
      for (const seat of booking.seats)
        tickets.push({
          id: `TK-${randomToken(rand, 10)}`,
          bookingId: booking.id,
          showId,
          seat,
          status: booking.status === 'paid' ? 'valid' : 'void',
          checkedInAt: null,
        });
    }
    bookings.push(booking);
    return booking;
  };

  // Demo bookings with known codes, listed on the version picker page.
  add('1', { code: '든든919', name: '홍길동', phone: '010-1234-5678', seats: ['E05', 'E06'], status: 'paid', ticketToken: 'demoTicket000001', createdAt: now - 3 * 86400000 });
  add('1', { code: '장기려402호', name: '김예매', phone: '010-9876-5432', seats: ['F07'], status: 'pending', createdAt: now - 5 * 60000 });

  const statuses = ['paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'expired', 'cancelled', 'refund_pending', 'refunded'];
  const counts = { 1: 68, 2: 18, 3: 12 };
  for (const showId of ['1', '2', '3']) {
    const taken = new Set(bookings.filter(b => b.showId === showId).flatMap(b => b.seats));
    for (let n = 0; n < counts[showId]; n += 1) {
      const status = statuses[Math.floor(rand() * statuses.length)];
      const size = 1 + Math.floor(rand() * 3);
      const row = ROWS[Math.floor(rand() * ROWS.length)];
      const free = rowSeats(row).filter(s => !taken.has(s));
      if (free.length < size) continue;
      const start = Math.floor(rand() * (free.length - size + 1));
      const seats = free.slice(start, start + size);
      if (['paid', 'pending'].includes(status)) seats.forEach(s => taken.add(s));
      const name = SURNAMES[Math.floor(rand() * SURNAMES.length)] + GIVEN[Math.floor(rand() * GIVEN.length)];
      const minutesAgo = status === 'pending' ? 1 + Math.floor(rand() * 25) : 60 + Math.floor(rand() * 60 * 24 * 20);
      add(showId, {
        name,
        phone: `010-${1000 + Math.floor(rand() * 9000)}-${1000 + Math.floor(rand() * 9000)}`,
        payer: rand() < 0.2 ? SURNAMES[Math.floor(rand() * SURNAMES.length)] + GIVEN[Math.floor(rand() * GIVEN.length)] : '',
        seats,
        status,
        createdAt: now - minutesAgo * 60000,
        notificationStatus: status === 'paid' && rand() < 0.1 ? 'failed' : 'untracked',
      });
    }
  }
  // A few check-ins on show 1 so the entry dashboard has something to show.
  tickets
    .filter(t => t.showId === '1' && t.status === 'valid')
    .slice(2, 14)
    .forEach((t, i) => {
      t.status = 'checked_in';
      t.checkedInAt = now - (i + 1) * 47000;
    });

  return {
    admin: { loggedIn: false, nickname: '운영진' },
    events: [event, draft, archived],
    sessions,
    bookings,
    tickets,
  };
}

let db = null;

export function getDb() {
  if (db) return db;
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) db = JSON.parse(saved);
    } catch {
      db = null;
    }
  }
  db ||= seed();
  return db;
}

export function saveDb() {
  if (typeof window === 'undefined' || !db) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked: the mock keeps working in memory.
  }
}

export function resetDb() {
  db = seed();
  saveDb();
}
