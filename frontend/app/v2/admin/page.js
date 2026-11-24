import { EventList } from '@/features/v2/EventList';

// Admin data loads in the browser (client component), so this route opts out of
// instant-navigation validation for its server-rendered shell.
export const instant = false;

export default function EventListPage() {
  return <EventList />;
}
