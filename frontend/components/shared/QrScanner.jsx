'use client';

import { useEffect, useId } from 'react';

/** Camera QR reader. Calls onScan(text) once, then stops. Camera needs HTTPS (or localhost). */
export function QrScanner({ onScan, onError }) {
  const id = `qr-${useId().replace(/:/g, '')}`;
  useEffect(() => {
    let scanner;
    let stopped = false;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (stopped) return;
      scanner = new Html5Qrcode(id);
      scanner
        .start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, async text => {
          await scanner.stop().catch(() => {});
          onScan(text);
        })
        .catch(problem => onError?.(problem?.message || '카메라를 켜지 못했어요. 카메라 권한을 확인해 주세요.'));
    });
    return () => {
      stopped = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, [id, onScan, onError]);
  return <div id={id} style={{ width: '100%', overflow: 'hidden', borderRadius: 16, background: 'var(--grey-900)' }} />;
}
