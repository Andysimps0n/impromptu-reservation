'use client';

import { useEffect, useState } from 'react';
import { getTicketByToken } from '@/lib/api';

// The token lives after # (/ticket#t=TOKEN) so it is never sent to a server or logged.
const tokenFromHash = hash => /^#t=([A-Za-z0-9_-]{16}|[A-Za-z0-9_-]{22})$/.exec(hash)?.[1] || '';

/** { loading } | { data } | { error } */
export function useTicketLink() {
  const [result, setResult] = useState({ loading: true });
  useEffect(() => {
    let cancelled = false;
    getTicketByToken(tokenFromHash(window.location.hash))
      .then(data => !cancelled && setResult({ data }))
      .catch(problem => !cancelled && setResult({ error: problem.message }));
    return () => {
      cancelled = true;
    };
  }, []);
  return result;
}
