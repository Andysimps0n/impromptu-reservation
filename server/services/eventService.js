import supabase from '../lib/supabase.js';

// DB row (snake_case) -> API shape (camelCase) that frontend/lib/api.js getEvent() promises.
// Fields are listed one by one on purpose: nothing reaches the browser unless it is named here.
function toEventDto(row) {
  if (row === null) return null;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    venue: row.venue,
    status: row.status,
    ticketPrice: row.price,
    bookingOpen: row.booking_open,
    sessions: row.event_sessions.map(s => ({
      id: s.id,
      sortOrder: s.sort_order,
      startsAt: s.starts_at,
    })),
  };
}

// The one published event with all its sessions, or null when nothing is published.
// Throws on a DB error so the central error handler answers 500.
export async function getPublishedEvent() {
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  if (!event) return null;

  const { data: sessions, error: sessionsError } = await supabase
    .from('event_sessions')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order');
  if (sessionsError) throw sessionsError;

  return toEventDto({ ...event, event_sessions: sessions });
}
