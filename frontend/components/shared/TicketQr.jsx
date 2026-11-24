'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Badge } from '@/components/ui';

/** QR payload is "TKT:<ticketId>", same as the original site, so the scanner can read old tickets. */
export function TicketQr({ ticket, size = 200 }) {
  const canvas = useRef(null);
  useEffect(() => {
    if (canvas.current)
      QRCode.toCanvas(canvas.current, `TKT:${ticket.id}`, {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#191F28', light: '#FFFFFF' },
      }).catch(() => {});
  }, [ticket.id, size]);
  return <canvas ref={canvas} width={size} height={size} style={{ display: 'block', maxWidth: '100%' }} aria-label={`${ticket.seat} 입장 QR`} />;
}

export function TicketState({ ticket }) {
  return ticket.status === 'checked_in' ? <Badge tone="green">입장 완료</Badge> : <Badge tone="blue">입장 전</Badge>;
}
