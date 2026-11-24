import { redirect } from 'next/navigation';

export default function BookingIndex() {
  redirect('/v2/booking/seats');
}
