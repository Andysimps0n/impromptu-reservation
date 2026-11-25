-- M8: bookings and booking_seats

create table bookings (
  id          bigint generated always as identity primary key,
  session_id  bigint not null references event_sessions (id) on delete restrict,
  code        text not null unique check (length(btrim(code)) > 0),   -- lookup code, e.g. 든든919
  name        text not null check (length(btrim(name)) > 0),
  phone       text not null check (phone ~ '^[0-9]{10,11}$'),         -- digits only, normalized by Express
  status      text not null default 'pending'
                check (status in ('pending', 'paid', 'expired', 'cancelled',
                                  'refund_pending', 'refunded')),
  amount      integer not null check (amount >= 0),                   -- KRW, price at booking time
  created_at  timestamptz not null default now(),
  -- lets booking_seats prove its session_id matches its booking's session_id
  unique (id, session_id)
);

create index bookings_phone_idx on bookings (phone);                  -- M15: seats per phone
create index bookings_session_status_idx on bookings (session_id, status);

create table booking_seats (
  id          bigint generated always as identity primary key,
  booking_id  bigint not null,
  session_id  bigint not null,
  seat        text not null check (seat ~ '^[A-L][0-9]{2}$'),         -- A-L rows, e.g. E05
  active      boolean not null default true,                          -- false once the booking is cancelled/expired/refunded
  foreign key (booking_id, session_id)
    references bookings (id, session_id) on delete cascade
);

-- The business rule: a seat can be held by only one live booking per session.
-- Released seats (active = false) stay as history and don't block rebooking.
create unique index booking_seats_one_active_seat_per_session
  on booking_seats (session_id, seat)
  where active;

-- A booking can't list the same seat twice.
create unique index booking_seats_unique_in_booking
  on booking_seats (booking_id, seat);

-- Only the Express server (secret key) may touch these tables.
alter table bookings enable row level security;
alter table booking_seats enable row level security;
