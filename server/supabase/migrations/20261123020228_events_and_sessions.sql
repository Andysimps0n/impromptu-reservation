-- M7: events and event_sessions

create table events (
  id          bigint generated always as identity primary key,
  title       text not null check (length(btrim(title)) > 0),
  subtitle    text not null default '',
  description text not null default '',
  venue       text not null check (length(btrim(venue)) > 0),
  price       integer not null check (price >= 0),          -- KRW, whole won
  status      text not null default 'draft'
                check (status in ('draft', 'published', 'archived')),
  created_at  timestamptz not null default now()
);

create table event_sessions (
  id          bigint generated always as identity primary key,
  event_id    bigint not null references events (id) on delete cascade,
  sort_order  integer not null check (sort_order > 0),
  starts_at   timestamptz not null,
  created_at  timestamptz not null default now(),
  unique (event_id, sort_order)
);

-- Only the Express server (secret key, bypasses RLS) may touch these tables.
-- With RLS on and no policies, the public anon key can't read or write anything.
alter table events enable row level security;
alter table event_sessions enable row level security;

-- Seed: the real show with its 3 sessions (times are KST, +09:00).
with show as (
  insert into events (title, subtitle, description, venue, price, status)
  values (
    '즉흥적 새벽 2시',
    'How’d you feel?',
    '그날 밤, 우리가 느낀 모든 감정을 무대 위로. 당신은 어떻게 느꼈나요?',
    '학관 104호',
    6500,
    'published'
  )
  returning id
)
insert into event_sessions (event_id, sort_order, starts_at)
select show.id, s.sort_order, s.starts_at::timestamptz
from show,  
     (values
       (1, '2026-11-21 20:00+09'),
       (2, '2026-11-22 15:00+09'),
       (3, '2026-11-22 21:00+09')
     ) as s (sort_order, starts_at);   
