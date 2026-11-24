'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, ListRow, Toast, useToast } from '@/components/ui';
import { getServerHealth, resetMockData } from '@/lib/api';

// Development landing page: jump to the screens and reset the mock test data. Remove before launch.
const VERSIONS = [
  {
    key: 'v2',
    title: '예매 사이트',
    body: '모바일 우선 한 줄 구성이에요. 좌석 선택부터 예매 완료까지 단계별 화면으로 이어져요.',
  },
];

// Shows whether the Express server answers GET /health (M5). State changes only inside promise callbacks.
function ServerStatus() {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    getServerHealth().then(
      data => !cancelled && setState({ status: 'ok', data }),
      error => !cancelled && setState({ status: 'error', message: error.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: 'loading' });
    setAttempt(n => n + 1);
  };
  const tone = state.status === 'ok' ? 'green' : state.status === 'error' ? 'red' : 'grey';
  const label = state.status === 'ok' ? '연결됨' : state.status === 'error' ? '연결 안 됨' : '확인 중';
  const sub =
    state.status === 'ok'
      ? JSON.stringify(state.data)
      : state.status === 'error'
        ? `${state.message} · 서버가 켜져 있고 허용된 주소인지 확인해 주세요`
        : '서버에 물어보는 중이에요';
  return (
    <section style={{ display: 'grid', gap: 4 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700 }}>서버 연결</h2>
      <ListRow title="Express /health" sub={sub} right={<Badge tone={tone}>{label}</Badge>} />
      {state.status === 'error' && (
        <Button variant="secondary" size="m" style={{ marginTop: 12, justifySelf: 'start' }} onClick={retry}>
          다시 확인하기
        </Button>
      )}
    </section>
  );
}

export default function VersionPicker() {
  const [toast, notify] = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 64px', display: 'grid', gap: 32 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>예매 사이트 시안</h1>
        <p style={{ color: 'var(--fg-secondary)' }}>
          데이터는 브라우저에 저장되는 테스트용이에요.
        </p>
      </header>

      <ServerStatus />

      {VERSIONS.map(v => (
        <section key={v.key} style={{ display: 'grid', gap: 4, padding: 24, borderRadius: 24, background: 'var(--grey-100)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{v.title}</h2>
          <p style={{ color: 'var(--fg-secondary)', marginBottom: 8 }}>{v.body}</p>
          <ListRow title="첫 화면" href={`/${v.key}`} arrow />
          <ListRow title="좌석 선택" href={`/${v.key}/booking/seats`} arrow />
          <ListRow title="예약 조회" href={`/${v.key}/booking/lookup`} arrow />
          <ListRow title="입장 티켓 링크" sub="홍길동 · E05, E06" href={`/${v.key}/ticket#t=demoTicket000001`} arrow />
          <ListRow title="운영자 화면" href={`/${v.key}/admin`} arrow />
        </section>
      ))}

      <section style={{ display: 'grid', gap: 4 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>테스트용 예약</h2>
        <ListRow title="든든919" sub="010-1234-5678 · 입금 확인, QR 티켓 있음" />
        <ListRow title="장기려402호" sub="010-9876-5432 · 입금 대기 (만들고 30분 뒤 만료)" />
        <Button
          variant="secondary"
          size="m"
          loading={busy}
          style={{ marginTop: 12, justifySelf: 'start' }}
          onClick={async () => {
            setBusy(true);
            await resetMockData();
            setBusy(false);
            notify('테스트 데이터를 처음 상태로 되돌렸어요');
          }}
        >
          테스트 데이터 초기화하기
        </Button>
      </section>
      <Toast toast={toast} />
    </main>
  );
}
