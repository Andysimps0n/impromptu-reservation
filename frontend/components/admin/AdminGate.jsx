'use client';

import { Button, Loader, Toast } from '@/components/ui';
import { AdminProvider, useAdminShell } from '@/hooks/admin';
import s from './admin.module.css';

/** Wraps an admin area: loading → Kakao login → children (with admin context). */
export function AdminGate({ backHref, children }) {
  const shell = useAdminShell();
  let content;
  if (shell.auth === 'loading') content = <Loader label="운영자 화면을 불러오는 중" />;
  else if (shell.auth === 'out')
    content = (
      <section className={s.login}>
        <h1>운영진 로그인</h1>
        <p>공연 예매와 입금 확인은 등록된 카카오 계정만 볼 수 있어요.</p>
        <Button variant="kakao" size="xl" full loading={shell.busy} onClick={shell.login}>
          카카오로 로그인하기
        </Button>
        {shell.error && <p style={{ color: 'var(--red-500)' }}>{shell.error}</p>}
        <Button variant="ghost" size="m" href={backHref}>
          공연 예매로 돌아가기
        </Button>
      </section>
    );
  else content = <AdminProvider value={shell}>{children}</AdminProvider>;
  return (
    <>
      {content}
      <Toast toast={shell.toast} />
    </>
  );
}
