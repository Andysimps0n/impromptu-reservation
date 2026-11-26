-- At most one event may be published at a time.
-- GET /api/event returns "the" published event, so the DB guarantees there is only one.
--
-- How it works: every published row is indexed under the same constant value (true),
-- so a second published row is a duplicate key. Rows that aren't published are left
-- out of the index by the WHERE clause, so any number of drafts and archived events are fine.
create unique index events_one_published
  on events ((true))
  where status = 'published';
