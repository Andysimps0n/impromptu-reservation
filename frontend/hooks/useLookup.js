'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { lookupBooking } from '@/lib/api';
import { roadmapProgress } from '@/lib/status';

/**
 * Lookup form state. Prefills the code from ?code= (set by the booking success screen).
 * Uses useSearchParams, so the page must render this inside <Suspense>.
 */
export function useLookup() {
  const params = useSearchParams();
  const [code, setCode] = useState(() => params.get('code') || '');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booking, setBooking] = useState(null);
  const progress = useMemo(() => roadmapProgress(booking?.status || ''), [booking]);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      setBooking(await lookupBooking({ code, phone }));
    } catch (problem) {
      setBooking(null);
      setError(problem.message);
    }
    setBusy(false);
  };

  return { code, setCode, phone, setPhone, error, busy, booking, progress, submit };
}
